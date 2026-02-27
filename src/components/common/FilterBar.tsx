import { FilterButton } from "./FilterButton";

export interface FilterItem {
  key: string;
  label: string;
  icon?: string;
  color?: string;
}

interface FilterBarProps {
  items: FilterItem[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  stats?: string;
  showAll?: boolean;
  allLabel?: string;
  emptyMessage?: string;
  maxItems?: number;
}

export function FilterBar({
  items,
  selectedKey,
  onSelect,
  stats,
  showAll = true,
  allLabel = "All",
  emptyMessage,
  maxItems = 10,
}: FilterBarProps) {
  const displayItems = items.slice(0, maxItems);

  return (
    <div style={{
      padding: "12px 28px",
      display: "flex",
      gap: 8,
      alignItems: "center",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 11, color: "#555", fontFamily: "'IBM Plex Mono', monospace", marginRight: 8 }}>
        FILTER:
      </span>

      {emptyMessage && items.length === 0 ? (
        <span style={{ fontSize: 11, color: "#555", fontStyle: "italic" }}>{emptyMessage}</span>
      ) : (
        <>
          {showAll && (
            <FilterButton
              label={allLabel}
              isActive={!selectedKey}
              onClick={() => onSelect(null)}
            />
          )}
          {displayItems.map((item) => (
            <FilterButton
              key={item.key}
              label={item.label}
              icon={item.icon}
              color={item.color}
              isActive={selectedKey === item.key}
              onClick={() => onSelect(selectedKey === item.key ? null : item.key)}
            />
          ))}
        </>
      )}

      {stats && (
        <div style={{ marginLeft: "auto", fontSize: 11, color: "#444", fontFamily: "'IBM Plex Mono', monospace" }}>
          {stats}
        </div>
      )}
    </div>
  );
}
