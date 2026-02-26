import { useConnectionState } from "@trustgraph/react-provider";
import { useGraphData } from "../../state";

export function StatusBar() {
  const { ontology, isLoading } = useGraphData();
  const connectionState = useConnectionState();

  const domainLabels = ontology
    ? Object.values(ontology).map(d => d.label).join(" × ")
    : "Loading...";

  const getStatusDisplay = () => {
    if (!connectionState) return { color: "#888", text: "Initializing..." };
    switch (connectionState.status) {
      case "authenticated":
        return { color: "#6EE7B7", text: "Authenticated" };
      case "connected":
        return { color: "#6EE7B7", text: "Connected" };
      case "unauthenticated":
        return { color: "#93C5FD", text: "Connected" };
      case "connecting":
        return { color: "#FCD34D", text: "Connecting..." };
      case "reconnecting":
        return { color: "#F97316", text: `Reconnecting (${connectionState.reconnectAttempt}/${connectionState.maxAttempts})...` };
      case "failed":
        return { color: "#f66", text: "Connection failed" };
      default:
        return { color: "#888", text: connectionState.status };
    }
  };

  const status = getStatusDisplay();

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
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ color: status.color }}>●</span> {status.text}
        <span style={{ color: "#888" }}>|</span>
        <span>trustgraph.ai</span>
      </div>
    </div>
  );
}
