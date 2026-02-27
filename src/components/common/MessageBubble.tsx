export interface Message {
  role: string;
  text: string;
  type?: string;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
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
