import { useState, useEffect } from "react";
import { SectionLabel, FilterButton, Card, LoadingState } from "../components";
import { useSchemas, useRowEmbeddingsQuery } from "@trustgraph/react-state";
import { COLLECTION } from "../config";

// Schema type based on what useSchemas returns
interface SchemaData {
  name: string;
  description?: string;
  fields?: unknown[];
  indexes?: unknown[];
}

interface SchemaInfo {
  key: string;
  name: string;
  description?: string;
}

export function DataView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);

  // Fetch schemas
  const { schemas: rawSchemas, schemasLoading, schemasError } = useSchemas();

  // Row embeddings query
  const { executeQuery, isExecuting, matches, reset } = useRowEmbeddingsQuery();

  // Parse schemas into usable format
  // rawSchemas appears to be array of [key, schemaObject] pairs or just schema objects
  const schemas: SchemaInfo[] = (rawSchemas || []).map((s: unknown, idx: number) => {
    // Handle array format [key, value]
    if (Array.isArray(s)) {
      const schemaData = s[1] as SchemaData | undefined;
      return {
        key: String(s[0]),
        name: schemaData?.name || String(s[0]),
        description: schemaData?.description,
      };
    }
    // Handle object format
    const schemaObj = s as SchemaData & { key?: string };
    return {
      key: schemaObj.key || schemaObj.name || `schema-${idx}`,
      name: schemaObj.name || `Schema ${idx}`,
      description: schemaObj.description,
    };
  });

  // Clear results when schema filter changes
  useEffect(() => {
    reset();
  }, [selectedSchema, reset]);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    // If a schema is selected, search only that schema
    // Otherwise search all schemas
    if (selectedSchema) {
      executeQuery({
        query: searchTerm.trim(),
        schemaName: selectedSchema,
        collection: COLLECTION,
        limit: 20,
      });
    } else {
      // Search all schemas - execute query for each
      schemas.forEach((schema) => {
        executeQuery({
          query: searchTerm.trim(),
          schemaName: schema.key,
          collection: COLLECTION,
          limit: 10,
        });
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Group matches by schema (index_name contains schema info)
  const matchesBySchema = matches.reduce((acc, match) => {
    const schemaKey = match.index_name.split('.')[0] || 'unknown';
    if (!acc[schemaKey]) {
      acc[schemaKey] = [];
    }
    acc[schemaKey].push(match);
    return acc;
  }, {} as Record<string, typeof matches>);

  // Filter by selected schema if any
  const filteredMatchesBySchema = selectedSchema
    ? { [selectedSchema]: matchesBySchema[selectedSchema] || [] }
    : matchesBySchema;

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
            disabled={isExecuting || !searchTerm.trim()}
            style={{
              padding: "12px 20px",
              borderRadius: 8,
              border: "1px solid #93C5FD44",
              background: isExecuting || !searchTerm.trim() ? "rgba(255,255,255,0.02)" : "rgba(147,197,253,0.1)",
              color: isExecuting || !searchTerm.trim() ? "#555" : "#93C5FD",
              cursor: isExecuting || !searchTerm.trim() ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {isExecuting ? "..." : "Search"}
          </button>
        </div>
      </div>

      {/* Results Area */}
      <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
        {matches.length === 0 && !isExecuting ? (
          <div style={{ color: "#444", fontSize: 13, fontStyle: "italic" }}>
            Enter a search term to find data across tables.
          </div>
        ) : isExecuting ? (
          <div style={{ color: "#93C5FD", fontSize: 13 }}>
            Searching...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {Object.entries(filteredMatchesBySchema).map(([schemaKey, schemaMatches]) => {
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
                  <div style={{ maxHeight: 400, overflowY: "auto" }}>
                    {schemaMatches.map((match, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {/* Match Text */}
                        <div style={{
                          fontSize: 13,
                          color: "#ddd",
                          marginBottom: 6,
                          lineHeight: 1.5,
                        }}>
                          {match.text}
                        </div>

                        {/* Index Info & Score */}
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: 11,
                          color: "#666",
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}>
                          <span>
                            {match.index_name}
                            {match.index_value.length > 0 && (
                              <span style={{ color: "#888", marginLeft: 8 }}>
                                [{match.index_value.join(", ")}]
                              </span>
                            )}
                          </span>
                          <span style={{
                            color: match.score > 0.8 ? "#6EE7B7" : match.score > 0.5 ? "#FCD34D" : "#888",
                          }}>
                            {(match.score * 100).toFixed(1)}%
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
