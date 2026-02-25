import { useState } from "react";
import type { QueryPhase } from "../types";
import { GraphCanvas, Typewriter } from "../components";
import { useGraphData, useDemoQueries } from "../state";

export function QueryView() {
  const [selectedQuery, setSelectedQuery] = useState<number | null>(null);
  const [queryPhase, setQueryPhase] = useState<QueryPhase>("idle");
  const [thinkingStep, setThinkingStep] = useState(0);

  const { entities, relationships, ontology, isLoading: graphLoading } = useGraphData();
  const { queries: demoQueries, isLoading: queriesLoading } = useDemoQueries();

  const isLoading = graphLoading || queriesLoading;

  const runQuery = (idx: number) => {
    setSelectedQuery(idx);
    setQueryPhase("thinking");
    setThinkingStep(0);
    const q = demoQueries[idx];
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= q.thinking.length) {
        clearInterval(interval);
        setTimeout(() => setQueryPhase("answering"), 400);
      }
      setThinkingStep(step);
    }, 800);
  };

  const highlightedEntities = selectedQuery !== null && queryPhase !== "idle"
    ? demoQueries[selectedQuery].entities
    : [];

  if (isLoading || !ontology) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#666" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 110px)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Query selector */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 10, color: "#555", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 12, letterSpacing: "0.1em" }}>
            SELECT A QUERY TO SEE GRAPH-POWERED AGENT INTELLIGENCE
          </div>
          {demoQueries.map((dq, idx) => (
            <button key={idx} onClick={() => runQuery(idx)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "12px 16px", marginBottom: 8, borderRadius: 8,
                border: `1px solid ${selectedQuery === idx ? '#FCD34D33' : 'rgba(255,255,255,0.06)'}`,
                background: selectedQuery === idx ? "rgba(252,211,77,0.05)" : "rgba(255,255,255,0.02)",
                color: selectedQuery === idx ? "#FCD34D" : "#bbb",
                cursor: "pointer", fontSize: 13, lineHeight: 1.5,
                fontFamily: "'IBM Plex Sans', sans-serif",
                transition: "all 0.2s",
              }}>
              <span style={{ color: "#FCD34D88", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>⚡ QUERY {idx + 1}</span><br />
              {dq.q}
            </button>
          ))}
        </div>

        {/* Response area */}
        {selectedQuery !== null && (
          <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
            {/* Graph traversal steps */}
            {(queryPhase === "thinking" || queryPhase === "answering" || queryPhase === "done") && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, color: "#FCD34D88", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 12, letterSpacing: "0.1em" }}>
                  ◈ GRAPH TRAVERSAL
                </div>
                {demoQueries[selectedQuery].thinking.map((step, i) => (
                  <div key={i} style={{
                    padding: "8px 12px", marginBottom: 4, borderRadius: 6,
                    background: i < thinkingStep ? "rgba(252,211,77,0.04)" : "rgba(255,255,255,0.01)",
                    borderLeft: `2px solid ${i < thinkingStep ? '#FCD34D44' : 'rgba(255,255,255,0.04)'}`,
                    opacity: i < thinkingStep ? 1 : 0.3,
                    transition: "all 0.4s",
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#aaa",
                  }}>
                    {i < thinkingStep && <span style={{ color: "#6EE7B7", marginRight: 8 }}>✓</span>}
                    {step}
                  </div>
                ))}
                {queryPhase === "thinking" && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "#FCD34D66", fontFamily: "'IBM Plex Mono', monospace" }}>
                    Traversing graph...
                  </div>
                )}
              </div>
            )}

            {/* Answer */}
            {(queryPhase === "answering" || queryPhase === "done") && (
              <div style={{
                padding: 20, borderRadius: 10,
                background: "linear-gradient(135deg, rgba(252,211,77,0.04) 0%, rgba(110,231,183,0.04) 100%)",
                border: "1px solid rgba(252,211,77,0.12)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
                  <div style={{ fontSize: 10, color: "#FCD34D88", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em" }}>
                    AGENT RESPONSE
                  </div>
                  <div style={{ fontSize: 10, color: "#555", fontFamily: "'IBM Plex Mono', monospace" }}>
                    {demoQueries[selectedQuery].triples} triples traversed · {demoQueries[selectedQuery].entities.length} entities resolved
                  </div>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#ddd" }}>
                  <Typewriter
                    text={demoQueries[selectedQuery].answer}
                    speed={10}
                    onDone={() => setQueryPhase("done")}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Graph visualization alongside query */}
      <div style={{ width: "45%", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
        <GraphCanvas
          entities={entities}
          relationships={relationships}
          ontology={ontology}
          highlightedEntities={highlightedEntities}
          onNodeClick={() => {}}
          activeFilter={null}
        />
      </div>
    </div>
  );
}
