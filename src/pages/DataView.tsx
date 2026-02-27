import { useState, useCallback, useMemo } from "react";
import { SectionLabel, FilterButton, Card, LoadingState } from "../components";
import { useSchemas, useEmbeddings, useRowEmbeddingsQuery, useRowsQuery } from "@trustgraph/react-state";
import { COLLECTION } from "../config";

// Schema field type
interface SchemaField {
  name: string;
  type: string;
  description?: string;
}

// Schema type based on what useSchemas returns
interface SchemaData {
  name: string;
  description?: string;
  fields?: SchemaField[];
  indexes?: { name: string; fields: string[] }[];
}

interface SchemaInfo {
  key: string;
  name: string;
  description?: string;
  fields: SchemaField[];
  indexes: { name: string; fields: string[] }[];
}

// Type for accumulated results with schema info and row data
interface AccumulatedMatch {
  schemaKey: string;
  index_name: string;
  index_value: string[];
  text: string;
  score: number;
  rowData?: Record<string, unknown>;
}

export function DataView() {
  // Input state
  const [searchTerm, setSearchTerm] = useState("");

  // Filter state (display only - doesn't trigger re-fetch)
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);

  // Results state
  const [allMatches, setAllMatches] = useState<AccumulatedMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch schemas
  const { schemas: rawSchemas, schemasLoading, schemasError } = useSchemas();

  // Embeddings hook - we'll use refetch for manual triggering
  const [embeddingsTerm, setEmbeddingsTerm] = useState("");
  const { embeddings, isLoading: embeddingsLoading, refetch: refetchEmbeddings } = useEmbeddings({
    flow: "default",
    term: embeddingsTerm,
  });

  // Row embeddings query
  const { executeQueryAsync } = useRowEmbeddingsQuery({ flow: "default" });

  // Rows query for fetching full row data
  const { executeQueryAsync: executeRowsQueryAsync } = useRowsQuery({ flow: "default" });

  // Parse schemas into usable format
  const schemas: SchemaInfo[] = useMemo(() => {
    return (rawSchemas || []).map((s: unknown, idx: number) => {
      if (Array.isArray(s)) {
        const schemaData = s[1] as SchemaData | undefined;
        return {
          key: String(s[0]),
          name: schemaData?.name || String(s[0]),
          description: schemaData?.description,
          fields: schemaData?.fields || [],
          indexes: schemaData?.indexes || [],
        };
      }
      const schemaObj = s as SchemaData & { key?: string };
      return {
        key: schemaObj.key || schemaObj.name || `schema-${idx}`,
        name: schemaObj.name || `Schema ${idx}`,
        description: schemaObj.description,
        fields: schemaObj.fields || [],
        indexes: schemaObj.indexes || [],
      };
    });
  }, [rawSchemas]);

  // Build GraphQL query for a schema
  const buildGraphQLQuery = useCallback((schema: SchemaInfo) => {
    const gqlName = schema.key.replace(/-/g, '_');
    const fieldNames = schema.fields.map(f => f.name).join('\n    ');
    return `query { ${gqlName} { ${fieldNames} } }`;
  }, []);

  // Core search function - searches ALL schemas, stores ALL results
  const performSearch = useCallback(async (vectors: number[][]) => {
    try {
      // Always search ALL schemas
      const embeddingsResults = await Promise.all(
        schemas.map(async (schema) => {
          try {
            const matches = await executeQueryAsync({
              vectors,
              schemaName: schema.key,
              collection: COLLECTION,
              limit: 10,
            });
            return matches.map(m => ({ ...m, schemaKey: schema.key }));
          } catch {
            return [];
          }
        })
      );

      const flatMatches = embeddingsResults.flat();

      // Deduplicate
      const seen = new Set<string>();
      const uniqueMatches = flatMatches.filter(match => {
        const key = `${match.schemaKey}:${match.index_value.join(',')}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Fetch full row data for schemas with matches
      const schemaKeysWithMatches = [...new Set(uniqueMatches.map(m => m.schemaKey))];
      const rowDataBySchema: Record<string, Record<string, unknown>[]> = {};

      await Promise.all(
        schemaKeysWithMatches.map(async (schemaKey) => {
          const schema = schemas.find(s => s.key === schemaKey);
          if (!schema || schema.fields.length === 0) return;

          try {
            const query = buildGraphQLQuery(schema);
            const result = await executeRowsQueryAsync({ query, collection: COLLECTION });
            const gqlName = schemaKey.replace(/-/g, '_');
            const rows = (result?.data as Record<string, unknown[]>)?.[gqlName] || [];
            rowDataBySchema[schemaKey] = rows as Record<string, unknown>[];
          } catch (err) {
            console.error(`Failed to fetch rows for ${schemaKey}:`, err);
          }
        })
      );

      // Match row data to embeddings results
      const matchesWithRowData = uniqueMatches.map(match => {
        const rows = rowDataBySchema[match.schemaKey] || [];
        const indexFields = match.index_name.split('.');
        const indexFieldName = indexFields[indexFields.length - 1];

        const matchedRow = rows.find(row => {
          const rowValue = row[indexFieldName];
          return match.index_value.some(iv =>
            String(rowValue).toLowerCase() === iv.toLowerCase()
          );
        });

        return { ...match, rowData: matchedRow };
      });

      setAllMatches(matchesWithRowData);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, [schemas, executeQueryAsync, executeRowsQueryAsync, buildGraphQLQuery]);

  // Handle search button click
  const handleSearch = useCallback(async () => {
    const term = searchTerm.trim();
    if (!term) return;

    setIsSearching(true);
    setAllMatches([]);

    // If same term, use refetch; otherwise set new term
    if (term === embeddingsTerm && embeddings && embeddings.length > 0) {
      // Same term - we already have embeddings, just re-run the search
      await performSearch(embeddings);
    } else {
      // New term - update embeddings term and wait for it
      setEmbeddingsTerm(term);
    }
  }, [searchTerm, embeddingsTerm, embeddings, performSearch]);

  // When embeddings become available for a new term, run the search
  // This only triggers when embeddingsTerm changes and embeddings load
  const prevEmbeddingsTermRef = useMemo(() => ({ current: "" }), []);

  if (
    isSearching &&
    embeddingsTerm &&
    embeddings &&
    embeddings.length > 0 &&
    !embeddingsLoading &&
    prevEmbeddingsTermRef.current !== embeddingsTerm
  ) {
    prevEmbeddingsTermRef.current = embeddingsTerm;
    performSearch(embeddings);
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Filter results for display (doesn't affect stored data)
  const displayMatches = useMemo(() => {
    if (!selectedSchema) return allMatches;
    return allMatches.filter(m => m.schemaKey === selectedSchema);
  }, [allMatches, selectedSchema]);

  // Group filtered matches by schema for display
  const matchesBySchema = useMemo(() => {
    return displayMatches.reduce((acc, match) => {
      if (!acc[match.schemaKey]) {
        acc[match.schemaKey] = [];
      }
      acc[match.schemaKey].push(match);
      return acc;
    }, {} as Record<string, AccumulatedMatch[]>);
  }, [displayMatches]);

  if (schemasLoading) {
    return <LoadingState message="Loading schemas..." />;
  }

  if (schemasError) {
    return <LoadingState variant="error" message="Error loading schemas" />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 110px)" }}>
      {/* Schema Filter Bar */}
      <div style={{
        padding: "12px 28px", display: "flex", gap: 8, alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 11, color: "#555", fontFamily: "'IBM Plex Mono', monospace", marginRight: 8 }}>FILTER:</span>
        <FilterButton
          label="All"
          isActive={!selectedSchema}
          onClick={() => setSelectedSchema(null)}
        />
        {schemas.slice(0, 10).map((schema) => (
          <FilterButton
            key={schema.key}
            label={schema.name}
            isActive={selectedSchema === schema.key}
            onClick={() => setSelectedSchema(selectedSchema === schema.key ? null : schema.key)}
          />
        ))}
        <div style={{ marginLeft: "auto", fontSize: 11, color: "#444", fontFamily: "'IBM Plex Mono', monospace" }}>
          {selectedSchema ? `${displayMatches.length} of ${allMatches.length}` : `${allMatches.length}`} results
        </div>
      </div>

      {/* Search Input */}
      <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <SectionLabel marginBottom={12}>SEARCH DATA</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for data across tables..."
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.02)",
              color: "#ddd",
              fontSize: 14,
              fontFamily: "'IBM Plex Sans', sans-serif",
              outline: "none",
            }}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchTerm.trim()}
            style={{
              padding: "12px 20px",
              borderRadius: 8,
              border: "1px solid #93C5FD44",
              background: isSearching || !searchTerm.trim() ? "rgba(255,255,255,0.02)" : "rgba(147,197,253,0.1)",
              color: isSearching || !searchTerm.trim() ? "#555" : "#93C5FD",
              cursor: isSearching || !searchTerm.trim() ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {isSearching ? "..." : "Search"}
          </button>
        </div>
      </div>

      {/* Results Area */}
      <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
        {!hasSearched && !isSearching ? (
          <div style={{ color: "#444", fontSize: 13, fontStyle: "italic" }}>
            Enter a search term to find data across tables.
          </div>
        ) : isSearching ? (
          <div style={{ color: "#93C5FD", fontSize: 13 }}>
            Searching...
          </div>
        ) : displayMatches.length === 0 ? (
          <div style={{ color: "#444", fontSize: 13, fontStyle: "italic" }}>
            {selectedSchema ? "No matches in this schema. Try selecting 'All'." : "No matches found."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {Object.entries(matchesBySchema).map(([schemaKey, schemaMatches]) => {
              if (!schemaMatches || schemaMatches.length === 0) return null;
              const schema = schemas.find(s => s.key === schemaKey);

              return (
                <Card key={schemaKey} padding={0}>
                  {/* Table Header */}
                  <div style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#93C5FD",
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}>
                      ▤ {schema?.name || schemaKey}
                    </span>
                    <span style={{
                      fontSize: 11,
                      color: "#555",
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}>
                      {schemaMatches.length} matches
                    </span>
                  </div>

                  {/* Results List */}
                  <div>
                    {schemaMatches.map((match, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {match.rowData ? (
                          <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                            gap: "8px 16px",
                            marginBottom: 8,
                          }}>
                            {Object.entries(match.rowData).map(([key, value]) => (
                              <div key={key}>
                                <span style={{
                                  fontSize: 10,
                                  color: "#666",
                                  fontFamily: "'IBM Plex Mono', monospace",
                                  textTransform: "uppercase",
                                }}>
                                  {key}
                                </span>
                                <div style={{
                                  fontSize: 13,
                                  color: "#ddd",
                                  marginTop: 2,
                                  wordBreak: "break-word",
                                }}>
                                  {String(value ?? "")}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{
                            fontSize: 13,
                            color: "#ddd",
                            marginBottom: 6,
                            lineHeight: 1.5,
                          }}>
                            {match.text}
                          </div>
                        )}

                        <div style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          fontSize: 11,
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}>
                          <span style={{
                            color: match.score > 0.8 ? "#6EE7B7" : match.score > 0.5 ? "#FCD34D" : "#888",
                          }}>
                            {(match.score * 100).toFixed(1)}% match
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
