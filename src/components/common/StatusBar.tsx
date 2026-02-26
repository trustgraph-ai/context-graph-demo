import { useConnectionState } from "@trustgraph/react-provider";
import { useProgressStateStore } from "@trustgraph/react-state";

export function StatusBar() {
  const connectionState = useConnectionState();
  const activity = useProgressStateStore((state) => state.activity);

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
  const activeActivity = activity.size > 0 ? Array.from(activity)[0] : null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      padding: "8px 28px", borderTop: "1px solid rgba(255,255,255,0.04)",
      background: "rgba(10,10,15,0.95)", backdropFilter: "blur(8px)",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#444",
    }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {activeActivity ? (
          <>
            <span style={{ color: "#FCD34D" }}>◌</span>
            <span style={{ color: "#666" }}>{activeActivity}...</span>
          </>
        ) : (
          <>
            <span style={{ color: "#6EE7B7" }}>◈</span>
            <span style={{ color: "#555" }}>Ready</span>
          </>
        )}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ color: status.color }}>●</span> {status.text}
        <span style={{ color: "#888" }}>|</span>
        <span>trustgraph.ai</span>
      </div>
    </div>
  );
}
