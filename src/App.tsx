import { useState } from "react";
import type { TabKey, DomainKey, Entity } from "./types";
import { Header, StatusBar } from "./components";
import { GraphView, QueryView, OntologyView } from "./pages";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("graph");
  const [activeFilter, setActiveFilter] = useState<DomainKey | null>(null);
  const [selectedNode, setSelectedNode] = useState<Entity | null>(null);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab !== "graph") {
      setSelectedNode(null);
    }
  };

  return (
    <div style={{
      width: "100%", minHeight: "100vh", background: "#0A0A0F",
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
      color: "#E5E5E5", overflow: "hidden",
    }}>
      <Header activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === "graph" && (
        <GraphView
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          selectedNode={selectedNode}
          onNodeSelect={setSelectedNode}
        />
      )}

      {activeTab === "query" && <QueryView />}

      {activeTab === "ontology" && <OntologyView />}

      <StatusBar />
    </div>
  );
}
