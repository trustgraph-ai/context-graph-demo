import { useEffect, useRef, useCallback, useState, MouseEvent } from "react";
import type { DomainKey, Entity, GraphNode, OntologyType, Relationship } from "../../types";

interface GraphCanvasProps {
  entities: Entity[];
  relationships: Relationship[];
  ontology: OntologyType;
  highlightedEntities: string[];
  onNodeClick: (node: GraphNode) => void;
  activeFilter: DomainKey | null;
}

const SETTLE_TIME = 10000; // 10 seconds until nodes settle
const FRAME_INTERVAL = 1000 / 30; // 30fps

export function GraphCanvas({ entities, relationships, ontology, highlightedEntities, onNodeClick, activeFilter }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const nodesCanvasRef = useRef<HTMLCanvasElement>(null);
  const edgesCanvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const animRef = useRef<number>(0);
  const hoveredRef = useRef<string | null>(null);
  const settledRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Track container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Draw static layer (grid + domain labels) - only once
  const drawStaticLayer = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, domainPositions: Record<DomainKey, { x: number; y: number }>) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.015)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Domain labels
    (Object.entries(domainPositions) as [DomainKey, { x: number; y: number }][]).forEach(([domain, pos]) => {
      const data = ontology[domain];
      ctx.font = "bold 22px 'IBM Plex Mono', monospace";
      ctx.fillStyle = data.color + "44";
      ctx.textAlign = "center";
      ctx.fillText(data.label.toUpperCase(), pos.x, pos.y - Math.min(canvas.width, canvas.height) * 0.14);
    });
  }, [ontology]);

  // Draw nodes layer
  const drawNodesLayer = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const nodes = nodesRef.current;
    const settled = settledRef.current;

    nodes.forEach((node) => {
      const isHighlighted = highlightedEntities && highlightedEntities.includes(node.id);
      const isHovered = hoveredRef.current === node.id;
      const isDimmed = highlightedEntities && highlightedEntities.length > 0 && !isHighlighted;
      const isFiltered = activeFilter && node.domain !== activeFilter && !relationships.some(
        r => r.domain.includes(activeFilter) && (r.from === node.id || r.to === node.id)
      );

      const alpha = isFiltered ? 0.15 : isDimmed ? 0.3 : 1;
      const r = isHighlighted || isHovered ? node.r * 1.4 : node.r;
      const pulseR = isHighlighted && !settled ? Math.sin(time * 3) * 3 : 0;

      // Glow
      if ((isHighlighted || isHovered) && !isFiltered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 12 + pulseR, 0, Math.PI * 2);
        const grd = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r + 12 + pulseR);
        grd.addColorStop(0, node.glow);
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = node.color + Math.round(alpha * 255 * 0.2).toString(16).padStart(2, "0");
      ctx.fill();
      ctx.strokeStyle = node.color + Math.round(alpha * 255).toString(16).padStart(2, "0");
      ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
      ctx.stroke();

      // Label
      ctx.font = `${isHighlighted ? "bold " : ""}${isHovered ? 17 : 14}px 'IBM Plex Sans', sans-serif`;
      ctx.fillStyle = `rgba(255,255,255,${alpha * (isHighlighted ? 1 : 0.75)})`;
      ctx.textAlign = "center";
      ctx.fillText(node.label, node.x, node.y + r + 18);

      // Update node positions (spring physics + drift) - only if not settled
      if (!settled) {
        node.x += (node.targetX - node.x) * 0.02;
        node.y += (node.targetY - node.y) * 0.02;
        node.x += Math.sin(time + node.targetX * 0.01) * 0.3;
        node.y += Math.cos(time + node.targetY * 0.01) * 0.3;
      }
    });
  }, [highlightedEntities, activeFilter, relationships]);

  // Draw edges layer
  const drawEdgesLayer = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const nodes = nodesRef.current;

    const filteredRels = activeFilter
      ? relationships.filter((r) => r.domain.includes(activeFilter))
      : relationships;

    filteredRels.forEach((rel) => {
      const fromNode = nodes.find((n) => n.id === rel.from);
      const toNode = nodes.find((n) => n.id === rel.to);
      if (!fromNode || !toNode) return;

      const isHighlighted =
        highlightedEntities &&
        highlightedEntities.includes(rel.from) &&
        highlightedEntities.includes(rel.to);

      const baseAlpha = isHighlighted ? 0.7 : 0.12;
      const pulse = isHighlighted ? Math.sin(time * 4) * 0.15 + 0.15 : 0;

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      // Curved edges
      const mx = (fromNode.x + toNode.x) / 2 + (fromNode.y - toNode.y) * 0.1;
      const my = (fromNode.y + toNode.y) / 2 + (toNode.x - fromNode.x) * 0.1;
      ctx.quadraticCurveTo(mx, my, toNode.x, toNode.y);

      const gradient = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
      gradient.addColorStop(0, fromNode.color + Math.round((baseAlpha + pulse) * 255).toString(16).padStart(2, "0"));
      gradient.addColorStop(1, toNode.color + Math.round((baseAlpha + pulse) * 255).toString(16).padStart(2, "0"));
      ctx.strokeStyle = gradient;
      ctx.lineWidth = isHighlighted ? 3 : 1.5;
      ctx.stroke();

      // Animated particles on highlighted edges
      if (isHighlighted) {
        const t = (time * 2) % 1;
        const px = (1 - t) * (1 - t) * fromNode.x + 2 * (1 - t) * t * mx + t * t * toNode.x;
        const py = (1 - t) * (1 - t) * fromNode.y + 2 * (1 - t) * t * my + t * t * toNode.y;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }
    });
  }, [relationships, highlightedEntities, activeFilter]);

  // Main setup and animation loop
  useEffect(() => {
    const staticCanvas = staticCanvasRef.current;
    const nodesCanvas = nodesCanvasRef.current;
    const edgesCanvas = edgesCanvasRef.current;
    if (!staticCanvas || !nodesCanvas || !edgesCanvas || containerSize.width === 0) return;

    // Setup all canvases
    [staticCanvas, nodesCanvas, edgesCanvas].forEach(canvas => {
      canvas.width = containerSize.width * 2;
      canvas.height = containerSize.height * 2;
      canvas.style.width = containerSize.width + "px";
      canvas.style.height = containerSize.height + "px";
    });

    const cx = staticCanvas.width / 2;
    const cy = staticCanvas.height / 2;

    // Position nodes in domain clusters
    const domainKeys = Object.keys(ontology);
    const domainPositions: Record<DomainKey, { x: number; y: number }> = {};
    domainKeys.forEach((domain, i) => {
      const angle = (Math.PI * 2 * i) / domainKeys.length - Math.PI / 2;
      const radius = Math.min(cx, cy) * 0.45;
      domainPositions[domain] = {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      };
    });

    nodesRef.current = entities.map((e) => {
      const dp = domainPositions[e.domain];
      const subIdx = ontology[e.domain].subclasses.findIndex((s) => s.id === e.id);
      const total = ontology[e.domain].subclasses.length;
      const angle = ((Math.PI * 2) / total) * subIdx - Math.PI / 2;
      const radius = Math.min(staticCanvas.width, staticCanvas.height) * 0.1;
      return {
        ...e,
        x: dp.x + Math.cos(angle) * radius,
        y: dp.y + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        targetX: dp.x + Math.cos(angle) * radius,
        targetY: dp.y + Math.sin(angle) * radius,
        r: 18,
      };
    });

    const staticCtx = staticCanvas.getContext("2d");
    const nodesCtx = nodesCanvas.getContext("2d");
    const edgesCtx = edgesCanvas.getContext("2d");
    if (!staticCtx || !nodesCtx || !edgesCtx) return;

    // Draw static layer once
    drawStaticLayer(staticCtx, staticCanvas, domainPositions);

    // Reset animation state
    settledRef.current = false;
    startTimeRef.current = performance.now();
    let time = 0;
    let lastFrameTime = 0;

    function animate(currentTime: number) {
      // Throttle to target fps
      if (currentTime - lastFrameTime < FRAME_INTERVAL) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = currentTime;
      time += 0.01;

      // Check if we should settle
      if (!settledRef.current && currentTime - startTimeRef.current > SETTLE_TIME) {
        settledRef.current = true;
      }

      const hasHighlights = highlightedEntities && highlightedEntities.length > 0;
      const isSettled = settledRef.current;

      // Draw edges layer (always needed for highlight animations)
      if (edgesCtx && edgesCanvas) {
        drawEdgesLayer(edgesCtx, edgesCanvas, time);
      }

      // Draw nodes layer (only if not settled, or if there are highlights/hover)
      if (nodesCtx && nodesCanvas) {
        if (!isSettled || hasHighlights || hoveredRef.current) {
          drawNodesLayer(nodesCtx, nodesCanvas, time);
        }
      }

      // Continue animation if not settled, or if there are highlights
      if (!isSettled || hasHighlights) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Settled with no highlights - do one final draw and stop
        if (nodesCtx && nodesCanvas) {
          drawNodesLayer(nodesCtx, nodesCanvas, time);
        }
        if (edgesCtx && edgesCanvas) {
          drawEdgesLayer(edgesCtx, edgesCanvas, time);
        }
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [entities, relationships, ontology, highlightedEntities, activeFilter, containerSize, drawStaticLayer, drawNodesLayer, drawEdgesLayer]);

  // Restart animation on hover (if settled)
  const restartAnimationIfNeeded = useCallback(() => {
    if (settledRef.current && animRef.current === 0) {
      const nodesCanvas = nodesCanvasRef.current;
      const edgesCanvas = edgesCanvasRef.current;
      const nodesCtx = nodesCanvas?.getContext("2d");
      const edgesCtx = edgesCanvas?.getContext("2d");

      if (nodesCtx && nodesCanvas && edgesCtx && edgesCanvas) {
        let time = 0;
        let lastFrameTime = 0;

        function animateHover(currentTime: number) {
          if (currentTime - lastFrameTime < FRAME_INTERVAL) {
            animRef.current = requestAnimationFrame(animateHover);
            return;
          }
          lastFrameTime = currentTime;
          time += 0.01;

          drawNodesLayer(nodesCtx!, nodesCanvas!, time);
          drawEdgesLayer(edgesCtx!, edgesCanvas!, time);

          const hasHighlights = highlightedEntities && highlightedEntities.length > 0;
          if (hasHighlights || hoveredRef.current) {
            animRef.current = requestAnimationFrame(animateHover);
          } else {
            animRef.current = 0;
          }
        }

        animRef.current = requestAnimationFrame(animateHover);
      }
    }
  }, [highlightedEntities, drawNodesLayer, drawEdgesLayer]);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = nodesCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * 2;
    const y = (e.clientY - rect.top) * 2;
    const nodes = nodesRef.current;
    let found: string | null = null;
    for (const node of nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < node.r * 1.5) {
        found = node.id;
        break;
      }
    }
    const wasHovered = hoveredRef.current;
    hoveredRef.current = found;
    setHovered(found);
    canvas.style.cursor = found ? "pointer" : "default";

    // Restart animation if hover state changed and we're settled
    if (wasHovered !== found) {
      restartAnimationIfNeeded();
    }
  }, [restartAnimationIfNeeded]);

  const handleClick = useCallback(() => {
    if (hoveredRef.current && onNodeClick) {
      const node = nodesRef.current.find((n) => n.id === hoveredRef.current);
      if (node) onNodeClick(node);
    }
  }, [onNodeClick]);

  const canvasStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Layer 1: Static (grid + domain labels) */}
      <canvas ref={staticCanvasRef} style={canvasStyle} />
      {/* Layer 2: Edges */}
      <canvas ref={edgesCanvasRef} style={canvasStyle} />
      {/* Layer 3: Nodes (on top for interaction) */}
      <canvas
        ref={nodesCanvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={canvasStyle}
      />
      {hovered && (() => {
        const node = nodesRef.current.find((n) => n.id === hovered);
        if (!node) return null;
        const sx = node.x / 2;
        const sy = node.y / 2;
        return (
          <div style={{
            position: "absolute", left: sx + 20, top: sy - 20,
            background: "rgba(15,15,20,0.95)", border: `1px solid ${node.color}44`,
            borderRadius: 8, padding: "10px 14px", pointerEvents: "none",
            backdropFilter: "blur(12px)", zIndex: 10, minWidth: 180,
          }}>
            <div style={{ color: node.color, fontWeight: 700, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }}>
              {node.icon} {node.label}
            </div>
            <div style={{ color: "#888", fontSize: 11, marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
              {Object.entries(node.props || {}).map(([k, v]) => (
                <div key={k}><span style={{ color: "#666" }}>{k}:</span> <span style={{ color: "#ccc" }}>{String(v)}</span></div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
