import type { DomainKey, OntologyDomain } from "../types";
import { useOntology, useOntologySchema } from "../state";

// Helper to get local name from URI
function getLocalName(uri: string): string {
  const hashIndex = uri.lastIndexOf("#");
  const slashIndex = uri.lastIndexOf("/");
  const index = Math.max(hashIndex, slashIndex);
  return index >= 0 ? uri.substring(index + 1) : uri;
}

export function OntologyView() {
  const { ontology, isLoading: ontologyLoading } = useOntology();
  const { schema, isLoading: schemaLoading } = useOntologySchema();

  const isLoading = ontologyLoading || schemaLoading;

  if (isLoading || !ontology || !schema) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#666" }}>
        Loading ontology...
      </div>
    );
  }

  // Count total instances
  const totalInstances = Object.values(ontology).reduce((sum, d) => sum + d.subclasses.length, 0);

  return (
    <div style={{ flex: 1, padding: "28px", overflowY: "auto", height: "calc(100vh - 110px)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ fontSize: 10, color: "#555", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", marginBottom: 24 }}>
          ONTOLOGY SCHEMA · RETAIL INTELLIGENCE DOMAIN
        </div>

        {/* Ontology class cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          {(Object.entries(ontology) as [DomainKey, OntologyDomain][]).map(([key, data]) => {
            // Find datatype properties for this domain from schema
            const domainProps = schema.datatypeProperties
              .filter(p => p.domain && getLocalName(p.domain) === data.label)
              .map(p => p.label);

            return (
              <div key={key} style={{
                padding: 24, borderRadius: 12,
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${data.color}22`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 24 }}>{data.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: data.color }}>{data.label}</div>
                    <div style={{ fontSize: 11, color: "#666", fontFamily: "'IBM Plex Mono', monospace" }}>owl:Class</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5, marginBottom: 14 }}>{data.description}</div>
                <div style={{ fontSize: 10, color: "#555", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 8, letterSpacing: "0.05em" }}>
                  PROPERTIES ({domainProps.length})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {domainProps.map((p) => (
                    <span key={p} style={{
                      padding: "3px 8px", borderRadius: 4, fontSize: 10,
                      background: data.color + "10", color: data.color + "cc",
                      fontFamily: "'IBM Plex Mono', monospace",
                      border: `1px solid ${data.color}22`,
                    }}>{p}</span>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: "#555", fontFamily: "'IBM Plex Mono', monospace", marginTop: 14, marginBottom: 8, letterSpacing: "0.05em" }}>
                  INSTANCES ({data.subclasses.length})
                </div>
                {data.subclasses.map((sc) => (
                  <div key={sc.id} style={{
                    padding: "6px 10px", marginBottom: 3, borderRadius: 4,
                    background: "rgba(255,255,255,0.02)", fontSize: 11, color: "#aaa",
                    display: "flex", justifyContent: "space-between",
                  }}>
                    <span>{sc.label}</span>
                    <span style={{ color: "#555", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}>{sc.id}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Relationship predicates (Object Properties) */}
        <div style={{
          padding: 24, borderRadius: 12,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ fontSize: 10, color: "#555", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", marginBottom: 16 }}>
            RELATIONSHIP PREDICATES ({schema.objectProperties.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {schema.objectProperties.map((prop) => {
              const fromDomain = prop.domain ? getLocalName(prop.domain).toLowerCase() as DomainKey : null;
              const toDomain = prop.range ? getLocalName(prop.range).toLowerCase() as DomainKey : null;

              return (
                <div key={prop.uri} style={{
                  padding: "10px 12px", borderRadius: 6,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <div style={{ fontSize: 12, color: "#ccc", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>
                    {prop.label}
                  </div>
                  <div style={{ fontSize: 10, color: "#555" }}>
                    {fromDomain && ontology[fromDomain] && (
                      <span style={{ color: ontology[fromDomain].color }}>{ontology[fromDomain].label}</span>
                    )}
                    {fromDomain && toDomain && " → "}
                    {toDomain && ontology[toDomain] && (
                      <span style={{ color: ontology[toDomain].color }}>{ontology[toDomain].label}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Triple count summary */}
        <div style={{
          marginTop: 20, padding: "16px 24px", borderRadius: 10,
          background: "linear-gradient(135deg, rgba(110,231,183,0.04) 0%, rgba(147,197,253,0.04) 50%, rgba(249,168,212,0.04) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex", justifyContent: "space-around",
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          {[
            { label: "Classes", value: schema.classes.length },
            { label: "Instances", value: totalInstances },
            { label: "Object Props", value: schema.objectProperties.length },
            { label: "Data Props", value: schema.datatypeProperties.length },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#666", letterSpacing: "0.05em" }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
