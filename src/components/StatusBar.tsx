import { useGraphData } from "../state";

export function StatusBar() {
  const { ontology, isLoading } = useGraphData();

  const domainLabels = ontology
    ? Object.values(ontology).map(d => d.label).join(" × ")
    : "Loading...";

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      padding: "8px 28px", borderTop: "1px solid rgba(255,255,255,0.04)",
      background: "rgba(10,10,15,0.95)", backdropFilter: "blur(8px)",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#444",
    }}>
      <div style={{ display: "flex", gap: 20 }}>
        <span>◈ Ontology: {isLoading ? "Loading..." : domainLabels}</span>
        <span>⬡ GraphRAG: Active</span>
        <span>⚡ Agent Orchestration: Online</span>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ color: "#6EE7B7" }}>●</span> Context Graph Connected
        <span style={{ color: "#888" }}>|</span>
        <span>trustgraph.ai</span>
      </div>
    </div>
  );
}
