import type { DomainKey, OntologyDomain } from "../types";
import { useOntology, useRelationships, useEntities } from "../state";

export function OntologyView() {
  const { ontology, isLoading: ontologyLoading } = useOntology();
  const { relationships, isLoading: relationshipsLoading } = useRelationships();
  const { entities, isLoading: entitiesLoading } = useEntities();

  const isLoading = ontologyLoading || relationshipsLoading || entitiesLoading;

  if (isLoading || !ontology) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#666" }}>
        Loading ontology...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: "28px", overflowY: "auto", height: "calc(100vh - 110px)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ fontSize: 10, color: "#555", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", marginBottom: 24 }}>
          ontology SCHEMA · RETAIL INTELLIGENCE DOMAIN
        </div>

        {/* Ontology class cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          {(Object.entries(ontology) as [DomainKey, OntologyDomain][]).map(([key, data]) => (
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
              <div style={{ fontSize: 10, color: "#555", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 8, letterSpacing: "0.05em" }}>PROPERTIES</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {data.properties.map((p) => (
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
          ))}
        </div>

        {/* Relationship predicates */}
        <div style={{
          padding: 24, borderRadius: 12,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ fontSize: 10, color: "#555", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", marginBottom: 16 }}>
            RELATIONSHIP PREDICATES
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[...new Set(relationships.map(r => r.predicate))].map((pred) => {
              const sample = relationships.find(r => r.predicate === pred)!;
              const fromDomain = sample.domain[0];
              const toDomain = sample.domain[1];
              return (
                <div key={pred} style={{
                  padding: "10px 12px", borderRadius: 6,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <div style={{ fontSize: 12, color: "#ccc", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>
                    {pred.replace(/_/g, " ")}
                  </div>
                  <div style={{ fontSize: 10, color: "#555" }}>
                    <span style={{ color: ontology[fromDomain].color }}>{ontology[fromDomain].label}</span>
                    {" → "}
                    <span style={{ color: ontology[toDomain].color }}>{ontology[toDomain].label}</span>
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
            { label: "Classes", value: 4 },
            { label: "Instances", value: entities.length },
            { label: "Predicates", value: [...new Set(relationships.map(r => r.predicate))].length },
            { label: "Triples", value: relationships.length },
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
