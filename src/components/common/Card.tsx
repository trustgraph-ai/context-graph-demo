interface CardProps {
  children: React.ReactNode;
  padding?: number | string;
  borderRadius?: number;
  borderColor?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Card({
  children,
  padding = 24,
  borderRadius = 12,
  borderColor = "rgba(255,255,255,0.04)",
  onClick,
  style,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        padding,
        borderRadius,
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${borderColor}`,
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
