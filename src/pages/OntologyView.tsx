import { useOntologySchema } from "../state";

// Helper to get local name from URI
function getLocalName(uri: string): string {
  const hashIndex = uri.lastIndexOf("#");
  const slashIndex = uri.lastIndexOf("/");
  const index = Math.max(hashIndex, slashIndex);
  return index >= 0 ? uri.substring(index + 1) : uri;
}

export function OntologyView() {
  const { schema, isLoading, isError } = useOntologySchema();

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#666" }}>
        Loading ontology schema...
      </div>
    );
  }

  if (isError || !schema) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#f66" }}>
        Error loading ontology schema
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: "28px", overflowY: "auto", height: "calc(100vh - 110px)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: 10, color: "#555", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", marginBottom: 24 }}>
          ONTOLOGY SCHEMA · LOADED FROM TRUSTGRAPH
        </div>

        {/* Summary stats */}
        <div style={{
          marginBottom: 24, padding: "16px 24px", borderRadius: 10,
          background: "linear-gradient(135deg, rgba(110,231,183,0.04) 0%, rgba(147,197,253,0.04) 50%, rgba(249,168,212,0.04) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex", justifyContent: "space-around",
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          {[
            { label: "Classes", value: schema.classes.length, color: "#6EE7B7" },
            { label: "Object Properties", value: schema.objectProperties.length, color: "#F9A8D4" },
            { label: "Datatype Properties", value: schema.datatypeProperties.length, color: "#93C5FD" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#666", letterSpacing: "0.05em" }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Classes */}
        <div style={{
          padding: 24, borderRadius: 12, marginBottom: 16,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(110,231,183,0.2)",
        }}>
          <div style={{ fontSize: 10, color: "#6EE7B7", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", marginBottom: 16 }}>
            OWL:CLASS ({schema.classes.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {schema.classes.map((cls) => (
              <div key={cls.uri} style={{
                padding: "10px 12px", borderRadius: 6,
                background: "rgba(110,231,183,0.05)",
                border: "1px solid rgba(110,231,183,0.1)",
              }}>
                <div style={{ fontSize: 13, color: "#6EE7B7", fontWeight: 600, marginBottom: 2 }}>
                  {cls.label}
                </div>
                <div style={{ fontSize: 10, color: "#555", fontFamily: "'IBM Plex Mono', monospace", wordBreak: "break-all" }}>
                  {cls.uri}
                </div>
                {cls.comment && (
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                    {cls.comment}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Object Properties (Relationships) */}
        <div style={{
          padding: 24, borderRadius: 12, marginBottom: 16,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(249,168,212,0.2)",
        }}>
          <div style={{ fontSize: 10, color: "#F9A8D4", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", marginBottom: 16 }}>
            OWL:OBJECTPROPERTY ({schema.objectProperties.length}) — RELATIONSHIPS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {schema.objectProperties.map((prop) => (
              <div key={prop.uri} style={{
                padding: "10px 12px", borderRadius: 6,
                background: "rgba(249,168,212,0.05)",
                border: "1px solid rgba(249,168,212,0.1)",
              }}>
                <div style={{ fontSize: 12, color: "#F9A8D4", fontWeight: 600, marginBottom: 4 }}>
                  {prop.label}
                </div>
                {(prop.domain || prop.range) && (
                  <div style={{ fontSize: 10, color: "#888", fontFamily: "'IBM Plex Mono', monospace" }}>
                    {prop.domain && <span style={{ color: "#6EE7B7" }}>{getLocalName(prop.domain)}</span>}
                    {prop.domain && prop.range && " → "}
                    {prop.range && <span style={{ color: "#93C5FD" }}>{getLocalName(prop.range)}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Datatype Properties */}
        <div style={{
          padding: 24, borderRadius: 12,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(147,197,253,0.2)",
        }}>
          <div style={{ fontSize: 10, color: "#93C5FD", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", marginBottom: 16 }}>
            OWL:DATATYPEPROPERTY ({schema.datatypeProperties.length}) — ATTRIBUTES
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {schema.datatypeProperties.map((prop) => (
              <div key={prop.uri} style={{
                padding: "10px 12px", borderRadius: 6,
                background: "rgba(147,197,253,0.05)",
                border: "1px solid rgba(147,197,253,0.1)",
              }}>
                <div style={{ fontSize: 12, color: "#93C5FD", fontWeight: 600, marginBottom: 2 }}>
                  {prop.label}
                </div>
                {prop.domain && (
                  <div style={{ fontSize: 10, color: "#666", fontFamily: "'IBM Plex Mono', monospace" }}>
                    domain: <span style={{ color: "#6EE7B7" }}>{getLocalName(prop.domain)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
