import type { Entity } from "../types";
import { useOntology, useEntityRelationships, useEntities } from "../state";

interface NodeDetailPanelProps {
  node: Entity;
  onClose: () => void;
  onNodeSelect: (node: Entity) => void;
}

export function NodeDetailPanel({ node, onClose, onNodeSelect }: NodeDetailPanelProps) {
  const { ontology } = useOntology();
  const { incoming, outgoing } = useEntityRelationships(node.uri);
  const { entities } = useEntities();

  const relationships = [...incoming, ...outgoing];

  if (!ontology) return null;
  return (
    <div style={{
      width: 320, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(12,12,18,0.95)", padding: 24, overflowY: "auto",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ color: ontology[node.domain].color, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
          {ontology[node.domain].label.toUpperCase()} ENTITY
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 18 }}>×</button>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
        {node.icon} {node.label}
      </div>
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 10, color: "#555", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 10, letterSpacing: "0.1em" }}>PROPERTIES</div>
        {Object.entries(node.props || {}).map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontSize: 12, color: "#888" }}>{k}</span>
            <span style={{ fontSize: 12, color: "#ddd", fontFamily: "'IBM Plex Mono', monospace" }}>{String(v)}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 10, color: "#555", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 10, letterSpacing: "0.1em" }}>RELATIONSHIPS</div>
        {relationships.map((r, i) => {
          const otherId = r.from === node.id ? r.to : r.from;
          const other = entities.find(e => e.id === otherId);
          const direction = r.from === node.id ? "→" : "←";
          return (
            <div key={i} style={{
              padding: "8px 10px", marginBottom: 4, borderRadius: 6,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
              cursor: "pointer",
            }} onClick={() => { if (other) onNodeSelect(other); }}>
              <div style={{ fontSize: 11, color: "#aaa" }}>
                <span style={{ color: other?.color || "#888" }}>{direction} {other?.label}</span>
              </div>
              <div style={{ fontSize: 10, color: "#666", fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>
                {r.predicate.replace(/_/g, " ")} · strength: {r.strength}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
