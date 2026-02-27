import type { DomainKey, Entity, OntologyDomain } from "../types";
import { GraphCanvasSVG as GraphCanvas, NodeDetailPanel, FilterButton, LoadingState } from "../components";
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
    return <LoadingState message="Loading graph data..." />;
  }

  if (isError || !ontology) {
    return <LoadingState variant="error" message="Error loading graph data" />;
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
            <FilterButton
              label="All"
              isActive={!activeFilter}
              onClick={() => onFilterChange(null)}
            />
            {(Object.entries(ontology) as [DomainKey, OntologyDomain][])
              .filter(([key]) => relevantDomains?.has(key))
              .slice(0, 10)
              .map(([key, data]) => (
                <FilterButton
                  key={key}
                  label={data.label}
                  icon={data.icon}
                  color={data.color}
                  isActive={activeFilter === key}
                  onClick={() => onFilterChange(activeFilter === key ? null : key)}
                />
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
