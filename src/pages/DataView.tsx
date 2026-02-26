import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState<string | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [allMatches, setAllMatches] = useState<AccumulatedMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const lastSearchedRef = useRef<string | null>(null);

  // Fetch schemas
  const { schemas: rawSchemas, schemasLoading, schemasError } = useSchemas();

  // Get embeddings for the active search term
  // Note: passing empty string when no search to avoid null issues
  const { embeddings, isLoading: embeddingsLoading } = useEmbeddings({
    flow: "structured",
    term: activeSearchTerm || "",
  });

  // Row embeddings query - now takes vectors instead of text
  const { executeQueryAsync } = useRowEmbeddingsQuery({ flow: "structured" });

  // Rows query for fetching full row data
  const { executeQueryAsync: executeRowsQueryAsync } = useRowsQuery({ flow: "structured" });

  // Parse schemas into usable format including fields (memoized to prevent rerenders)
  // rawSchemas appears to be array of [key, schemaObject] pairs or just schema objects
  const schemas: SchemaInfo[] = useMemo(() => {
    return (rawSchemas || []).map((s: unknown, idx: number) => {
      // Handle array format [key, value]
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
      // Handle object format
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

  // Store refs to avoid stale closures and prevent multiple executions
  const schemasRef = useRef(schemas);
  schemasRef.current = schemas;
  const executeQueryAsyncRef = useRef(executeQueryAsync);
  executeQueryAsyncRef.current = executeQueryAsync;
  const executeRowsQueryAsyncRef = useRef(executeRowsQueryAsync);
  executeRowsQueryAsyncRef.current = executeRowsQueryAsync;

  // Clear results when schema filter changes
  useEffect(() => {
    setAllMatches([]);
  }, [selectedSchema]);

  // Build GraphQL query for a schema
  const buildGraphQLQuery = useCallback((schema: SchemaInfo) => {
    // Convert schema key to valid GraphQL name (replace hyphens with underscores)
    const gqlName = schema.key.replace(/-/g, '_');
    const fieldNames = schema.fields.map(f => f.name).join('\n    ');
    return `query { ${gqlName} { ${fieldNames} } }`;
  }, []);

  const buildGraphQLQueryRef = useRef(buildGraphQLQuery);
  buildGraphQLQueryRef.current = buildGraphQLQuery;

  // Trigger search - sets the active search term to start embeddings lookup
  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) return;
    const term = searchTerm.trim();
    setIsSearching(true);
    setAllMatches([]);
    lastSearchedRef.current = null; // Reset so we can search again
    setActiveSearchTerm(term);
  }, [searchTerm]);

  // When embeddings are ready, perform the search (only once per search term)
  useEffect(() => {
    // Guard: need active search term, embeddings ready, not already searched this term
    if (!activeSearchTerm || !embeddings || embeddings.length === 0 || embeddingsLoading) {
      return;
    }
    if (lastSearchedRef.current === activeSearchTerm) {
      return; // Already searched this term
    }
    lastSearchedRef.current = activeSearchTerm;

    const performSearch = async () => {
      const currentSchemas = schemasRef.current;
      const currentSelectedSchema = selectedSchema;
      const schemasToSearch = currentSelectedSchema
        ? currentSchemas.filter(s => s.key === currentSelectedSchema)
        : currentSchemas;

      try {
        // Search all selected schemas in parallel with vectors
        const embeddingsResults = await Promise.all(
          schemasToSearch.map(async (schema) => {
            try {
              const matches = await executeQueryAsyncRef.current({
                vectors: embeddings,
                schemaName: schema.key,
                collection: COLLECTION,
                limit: currentSelectedSchema ? 20 : 10,
              });
              // Tag each match with its schema
              return matches.map(m => ({
                ...m,
                schemaKey: schema.key,
              }));
            } catch {
              return [];
            }
          })
        );

        const flatMatches = embeddingsResults.flat();

        // Now fetch full row data for each schema that has matches
        const schemaKeysWithMatches = [...new Set(flatMatches.map(m => m.schemaKey))];

        // Fetch all rows for schemas with matches
        const rowDataBySchema: Record<string, Record<string, unknown>[]> = {};

        await Promise.all(
          schemaKeysWithMatches.map(async (schemaKey) => {
            const schema = currentSchemas.find(s => s.key === schemaKey);
            if (!schema || schema.fields.length === 0) return;

            try {
              const query = buildGraphQLQueryRef.current(schema);
              const result = await executeRowsQueryAsyncRef.current({
                query,
                collection: COLLECTION,
              });

              // Result should have data.schemaName array
              const gqlName = schemaKey.replace(/-/g, '_');
              const rows = (result?.data as Record<string, unknown[]>)?.[gqlName] || [];
              rowDataBySchema[schemaKey] = rows as Record<string, unknown>[];
            } catch (err) {
              console.error(`Failed to fetch rows for ${schemaKey}:`, err);
            }
          })
        );

        // Match row data to embeddings results using index values
        const matchesWithRowData = flatMatches.map(match => {
          const rows = rowDataBySchema[match.schemaKey] || [];
          // Try to find the matching row by index value
          // The index_value contains the key values for this match
          const indexFields = match.index_name.split('.');
          const indexFieldName = indexFields[indexFields.length - 1]; // Get last part as field name

          const matchedRow = rows.find(row => {
            const rowValue = row[indexFieldName];
            // Check if any index value matches
            return match.index_value.some(iv =>
              String(rowValue).toLowerCase() === iv.toLowerCase()
            );
          });

          return {
            ...match,
            rowData: matchedRow,
          };
        });

        setAllMatches(matchesWithRowData);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [activeSearchTerm, embeddings, embeddingsLoading, selectedSchema]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Group matches by schema
  const matchesBySchema = allMatches.reduce((acc, match) => {
    if (!acc[match.schemaKey]) {
      acc[match.schemaKey] = [];
    }
    acc[match.schemaKey].push(match);
    return acc;
  }, {} as Record<string, AccumulatedMatch[]>);

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
        <span style={{ fontSize: 11, color: "#555", fontFamily: "'IBM Plex Mono', monospace", marginRight: 8 }}>SCHEMA:</span>
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
          {schemas.length} schemas
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
        {allMatches.length === 0 && !isSearching ? (
          <div style={{ color: "#444", fontSize: 13, fontStyle: "italic" }}>
            Enter a search term to find data across tables.
          </div>
        ) : isSearching ? (
          <div style={{ color: "#93C5FD", fontSize: 13 }}>
            Searching...
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
                        {/* Row Data or Match Text */}
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

                        {/* Score Badge */}
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
