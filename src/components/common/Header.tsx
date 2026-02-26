import type { TabKey } from "../../types";

interface HeaderProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <div style={{
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "linear-gradient(180deg, rgba(15,15,22,1) 0%, rgba(10,10,15,1) 100%)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "linear-gradient(135deg, #6EE7B7 0%, #93C5FD 50%, #F9A8D4 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 900, color: "#0A0A0F",
        }}>TG</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", color: "#fff" }}>
            TrustGraph
          </div>
          <div style={{ fontSize: 11, color: "#666", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.05em" }}>
            CONTEXT GRAPH DEMO
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
        {(["graph", "query", "data", "ontology"] as const).map((tab) => {
          const labels: Record<typeof tab, string> = {
            graph: "◈ Context Graph",
            query: "⚡ Agent Query",
            data: "▤ Data",
            ontology: "◇ Ontology",
          };
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              style={{
                padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer",
                background: activeTab === tab ? "rgba(255,255,255,0.1)" : "transparent",
                color: activeTab === tab ? "#fff" : "#666",
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: activeTab === tab ? 600 : 400,
                transition: "all 0.2s",
              }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
