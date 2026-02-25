import { useState, useEffect, useRef } from "react";
import { GraphCanvas } from "../components";
import { useGraphData } from "../state";
import { useChat, useConversation } from "@trustgraph/react-state";

// Pre-canned queries
const QUICK_QUERIES = [
  "Which consumers have the highest loyalty scores and what brands do they prefer?",
  "What retail channels are most effective for reaching eco-conscious consumers?",
  "How do recommendation agents connect brands with consumer segments?",
];

export function QueryView() {
  const [customInput, setCustomInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { entities, relationships, ontology, isLoading: graphLoading } = useGraphData();
  const { submitMessage, isSubmitting } = useChat();
  const messages = useConversation((state) => state.messages);
  const setChatMode = useConversation((state) => state.setChatMode);

  // Set chat mode to agent on mount
  useEffect(() => {
    setChatMode("agent");
  }, [setChatMode]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (query: string) => {
    if (query.trim() && !isSubmitting) {
      submitMessage({ input: query.trim() });
      setCustomInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(customInput);
    }
  };

  // Extract entities mentioned in the latest answer for highlighting
  const highlightedEntities: string[] = [];
  // TODO: Could parse entity URIs from agent response or use workbench state

  if (graphLoading || !ontology) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#666" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 110px)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Query input area */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 10, color: "#555", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 12, letterSpacing: "0.1em" }}>
            QUICK QUERIES
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {QUICK_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSubmit(q)}
                disabled={isSubmitting}
                style={{
                  padding: "8px 14px", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.02)",
                  color: isSubmitting ? "#555" : "#aaa",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  fontSize: 12, lineHeight: 1.4,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  textAlign: "left",
                  transition: "all 0.2s",
                  maxWidth: "100%",
                }}
              >
                <span style={{ color: "#FCD34D88", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}>⚡</span>{" "}
                {q}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your own question..."
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.02)",
                color: "#ddd",
                fontSize: 14,
                fontFamily: "'IBM Plex Sans', sans-serif",
                outline: "none",
              }}
            />
            <button
              onClick={() => handleSubmit(customInput)}
              disabled={isSubmitting || !customInput.trim()}
              style={{
                padding: "12px 20px",
                borderRadius: 8,
                border: "1px solid #FCD34D44",
                background: isSubmitting || !customInput.trim() ? "rgba(255,255,255,0.02)" : "rgba(252,211,77,0.1)",
                color: isSubmitting || !customInput.trim() ? "#555" : "#FCD34D",
                cursor: isSubmitting || !customInput.trim() ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {isSubmitting ? "..." : "Ask"}
            </button>
          </div>
        </div>

        {/* Response area */}
        <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
          {messages.length === 0 ? (
            <div style={{ color: "#444", fontSize: 13, fontStyle: "italic" }}>
              Select a quick query or type your own question to get started.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((msg, idx) => (
                <MessageBubble key={idx} message={msg} />
              ))}
              {isSubmitting && (
                <div style={{
                  padding: "8px 12px",
                  fontSize: 11,
                  color: "#FCD34D66",
                  fontFamily: "'IBM Plex Mono', monospace"
                }}>
                  Processing...
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </div>
      </div>

      {/* Graph visualization */}
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

// Message bubble component
function MessageBubble({ message }: { message: { role: string; text: string; type?: string } }) {
  const isUser = message.role === "human";
  const messageType = message.type;

  const getTypeStyles = () => {
    switch (messageType) {
      case "thinking":
        return {
          bg: "rgba(147,197,253,0.08)",
          border: "rgba(147,197,253,0.2)",
          icon: "◈",
          label: "THINKING",
          color: "#93C5FD",
        };
      case "observation":
        return {
          bg: "rgba(196,181,253,0.08)",
          border: "rgba(196,181,253,0.2)",
          icon: "◉",
          label: "OBSERVATION",
          color: "#C4B5FD",
        };
      case "answer":
        return {
          bg: "rgba(110,231,183,0.08)",
          border: "rgba(110,231,183,0.2)",
          icon: "✓",
          label: "ANSWER",
          color: "#6EE7B7",
        };
      default:
        return null;
    }
  };

  const typeStyles = getTypeStyles();

  if (isUser) {
    return (
      <div style={{
        padding: "12px 16px",
        borderRadius: 10,
        background: "rgba(252,211,77,0.08)",
        border: "1px solid rgba(252,211,77,0.2)",
        alignSelf: "flex-end",
        maxWidth: "80%",
      }}>
        <div style={{ fontSize: 10, color: "#FCD34D88", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6 }}>
          YOU
        </div>
        <div style={{ fontSize: 14, color: "#ddd", lineHeight: 1.5 }}>
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "12px 16px",
      borderRadius: 10,
      background: typeStyles?.bg || "rgba(255,255,255,0.02)",
      border: `1px solid ${typeStyles?.border || "rgba(255,255,255,0.06)"}`,
      maxWidth: "90%",
    }}>
      {typeStyles && (
        <div style={{
          fontSize: 10,
          color: typeStyles.color + "88",
          fontFamily: "'IBM Plex Mono', monospace",
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <span style={{ color: typeStyles.color }}>{typeStyles.icon}</span>
          {typeStyles.label}
        </div>
      )}
      <div style={{ fontSize: 13, color: "#bbb", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
        {message.text}
      </div>
    </div>
  );
}
