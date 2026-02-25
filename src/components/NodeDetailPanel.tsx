import type { Entity, Relationship, OntologyType } from "../types";

interface NodeDetailPanelProps {
  node: Entity;
  relationships: Relationship[];
  entities: Entity[];
  ontology: OntologyType;
  propertyLabels: Record<string, string>;
  onClose: () => void;
  onNodeSelect: (node: Entity) => void;
}

export function NodeDetailPanel({ node, relationships, entities, ontology, propertyLabels, onClose, onNodeSelect }: NodeDetailPanelProps) {
  // Filter relationships for this node
  const nodeRelationships = relationships.filter(
    r => r.from === node.id || r.to === node.id
  );

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
            <span style={{ fontSize: 12, color: "#888" }}>{propertyLabels[k] || k}</span>
            <span style={{ fontSize: 12, color: "#ddd", fontFamily: "'IBM Plex Mono', monospace", textAlign: "right" }}>{String(v)}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 10, color: "#555", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 10, letterSpacing: "0.1em" }}>RELATIONSHIPS</div>
        {nodeRelationships.map((r, i) => {
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
                {r.predicate.replace(/_/g, " ")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
