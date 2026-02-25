import type { DomainKey, Entity, OntologyDomain } from "../types";
import { GraphCanvas, NodeDetailPanel } from "../components";
import { ONTOLOGY, RELATIONSHIPS, getAllEntities } from "../data";

interface GraphViewProps {
  activeFilter: DomainKey | null;
  onFilterChange: (filter: DomainKey | null) => void;
  selectedNode: Entity | null;
  onNodeSelect: (node: Entity | null) => void;
}

export function GraphView({ activeFilter, onFilterChange, selectedNode, onNodeSelect }: GraphViewProps) {
  const highlightedEntities = selectedNode
    ? [selectedNode.id, ...RELATIONSHIPS.filter(r => r.from === selectedNode.id || r.to === selectedNode.id).map(r => r.from === selectedNode.id ? r.to : r.from)]
    : [];

  return (
    <>
      {/* Domain Filter Bar */}
      <div style={{
        padding: "12px 28px", display: "flex", gap: 8, alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <span style={{ fontSize: 11, color: "#555", fontFamily: "'IBM Plex Mono', monospace", marginRight: 8 }}>FILTER:</span>
        <button onClick={() => onFilterChange(null)}
          style={{
            padding: "5px 12px", borderRadius: 20, border: `1px solid ${!activeFilter ? '#fff' : 'rgba(255,255,255,0.1)'}`,
            background: !activeFilter ? "rgba(255,255,255,0.08)" : "transparent",
            color: !activeFilter ? "#fff" : "#777", fontSize: 11, cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace",
          }}>All</button>
        {(Object.entries(ONTOLOGY) as [DomainKey, OntologyDomain][]).map(([key, data]) => (
          <button key={key} onClick={() => onFilterChange(activeFilter === key ? null : key)}
            style={{
              padding: "5px 12px", borderRadius: 20,
              border: `1px solid ${activeFilter === key ? data.color + '88' : 'rgba(255,255,255,0.1)'}`,
              background: activeFilter === key ? data.color + "15" : "transparent",
              color: activeFilter === key ? data.color : "#777",
              fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace",
            }}>
            {data.icon} {data.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 11, color: "#444", fontFamily: "'IBM Plex Mono', monospace" }}>
          {getAllEntities().length} entities · {RELATIONSHIPS.length} relationships
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", height: "calc(100vh - 150px)" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <GraphCanvas
            highlightedEntities={highlightedEntities}
            onNodeClick={(node) => onNodeSelect(selectedNode?.id === node.id ? null : node)}
            activeFilter={activeFilter}
          />
        </div>
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            onClose={() => onNodeSelect(null)}
            onNodeSelect={onNodeSelect}
          />
        )}
      </div>
    </>
  );
}
