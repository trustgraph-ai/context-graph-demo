import type { DomainKey, Entity, OntologyDomain } from "../types";
import { GraphCanvas, NodeDetailPanel } from "../components";
import { useGraphData } from "../state";

interface GraphViewProps {
  activeFilter: DomainKey | null;
  onFilterChange: (filter: DomainKey | null) => void;
  selectedNode: Entity | null;
  onNodeSelect: (node: Entity | null) => void;
}

export function GraphView({ activeFilter, onFilterChange, selectedNode, onNodeSelect }: GraphViewProps) {
  const { entities, relationships, ontology, propertyLabels, isLoading, isError } = useGraphData();

  const highlightedEntities = selectedNode
    ? [selectedNode.id, ...relationships.filter(r => r.from === selectedNode.id || r.to === selectedNode.id).map(r => r.from === selectedNode.id ? r.to : r.from)]
    : [];

  // Compute relevant filter domains based on selected node's connections
  const relevantDomains = selectedNode
    ? (() => {
        const domains = new Set<DomainKey>([selectedNode.domain]);
        const connectedIds = relationships
          .filter(r => r.from === selectedNode.id || r.to === selectedNode.id)
          .map(r => r.from === selectedNode.id ? r.to : r.from);
        for (const id of connectedIds) {
          const entity = entities.find(e => e.id === id);
          if (entity) domains.add(entity.domain);
        }
        return domains;
      })()
    : null;

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#666" }}>
        Loading graph data...
      </div>
    );
  }

  if (isError || !ontology) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#f66" }}>
        Error loading graph data
      </div>
    );
  }

  return (
    <>
      {/* Domain Filter Bar */}
      <div style={{
        padding: "12px 28px", display: "flex", gap: 8, alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <span style={{ fontSize: 11, color: "#555", fontFamily: "'IBM Plex Mono', monospace", marginRight: 8 }}>FILTER:</span>
        {selectedNode ? (
          <>
            <button onClick={() => onFilterChange(null)}
              style={{
                padding: "5px 12px", borderRadius: 20, border: `1px solid ${!activeFilter ? '#fff' : 'rgba(255,255,255,0.1)'}`,
                background: !activeFilter ? "rgba(255,255,255,0.08)" : "transparent",
                color: !activeFilter ? "#fff" : "#777", fontSize: 11, cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace",
              }}>All</button>
            {(Object.entries(ontology) as [DomainKey, OntologyDomain][])
              .filter(([key]) => relevantDomains?.has(key))
              .slice(0, 10)
              .map(([key, data]) => (
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
          </>
        ) : (
          <span style={{ fontSize: 11, color: "#555", fontStyle: "italic" }}>Select a node to filter</span>
        )}
        <div style={{ marginLeft: "auto", fontSize: 11, color: "#444", fontFamily: "'IBM Plex Mono', monospace" }}>
          {entities.length} entities · {relationships.length} relationships
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", height: "calc(100vh - 150px)" }}>
        <div style={{ flex: 1, minWidth: 0, position: "relative", overflow: "hidden" }}>
          <GraphCanvas
            entities={entities}
            relationships={relationships}
            ontology={ontology}
            highlightedEntities={highlightedEntities}
            onNodeClick={(node) => onNodeSelect(selectedNode?.id === node.id ? null : node)}
            activeFilter={activeFilter}
          />
        </div>
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            relationships={relationships}
            entities={entities}
            ontology={ontology}
            propertyLabels={propertyLabels}
            onClose={() => onNodeSelect(null)}
            onNodeSelect={onNodeSelect}
          />
        )}
      </div>
    </>
  );
}
