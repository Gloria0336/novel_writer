import { useEffect, useMemo, useRef } from "react";

import type { MapLayers, RoutePlan, TowerMap, TowerMapEdge, TowerMapNode, ViewMode } from "../types";
import { BONUS_BADGES, OWNER_COLORS, TERRAIN_COLORS } from "../map/constants";

type MapCanvasProps = {
  map: TowerMap;
  layers: MapLayers;
  viewMode: ViewMode;
  selectedNodeId: string | null;
  route: RoutePlan | null;
  hoveredEdgeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onHoverEdge: (edgeId: string | null) => void;
};

function nodeRadius(node: TowerMapNode): number {
  if (node.nodeType === "capital" || node.nodeType === "main_nest") return 12;
  if (node.nodeType === "city" || node.nodeType === "sub_nest") return 8;
  if (node.nodeType === "tribe") return 5;
  return 6;
}

function pointSegmentDistance(point: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t));
}

function edgePolyline(map: TowerMap, edge: TowerMapEdge) {
  const a = map.nodes.find((node) => node.id === edge.a);
  const b = map.nodes.find((node) => node.id === edge.b);
  if (!a || !b) return [];
  return edge.polyline ?? [a.position, b.position];
}

function edgeVisible(edge: TowerMapEdge, layers: MapLayers, viewMode: ViewMode): boolean {
  if (edge.pathType === "road" && !layers.roads) return false;
  if (edge.pathType === "trail" && !layers.trails) return false;
  if (edge.pathType === "secret" && !layers.secrets) return false;
  if (viewMode !== "omniscient" && !edge.revealedTo.includes(viewMode)) return false;
  return true;
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size = 10, bold = false) {
  ctx.font = `${bold ? "700 " : "600 "}${size}px "Noto Sans TC", "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(250, 247, 235, 0.9)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = "#17110b";
  ctx.fillText(text, x, y);
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, spikes: number, outer: number, inner: number) {
  let rotation = -Math.PI / 2;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(x, y - outer);
  for (let index = 0; index < spikes; index += 1) {
    ctx.lineTo(x + Math.cos(rotation) * outer, y + Math.sin(rotation) * outer);
    rotation += step;
    ctx.lineTo(x + Math.cos(rotation) * inner, y + Math.sin(rotation) * inner);
    rotation += step;
  }
  ctx.closePath();
}

function drawNode(ctx: CanvasRenderingContext2D, node: TowerMapNode, selected: boolean, layers: MapLayers) {
  const color = OWNER_COLORS[node.owner];
  const r = nodeRadius(node);
  ctx.save();

  if (selected) {
    ctx.beginPath();
    ctx.arc(node.position.x, node.position.y, r + 7, 0, Math.PI * 2);
    ctx.strokeStyle = "#f2c45c";
    ctx.lineWidth = 3.5;
    ctx.stroke();
  }

  if (node.nodeType === "capital") {
    ctx.beginPath();
    ctx.arc(node.position.x, node.position.y, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = "#d8b149";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(node.position.x, node.position.y, r - 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  } else if (node.nodeType === "main_nest") {
    drawStar(ctx, node.position.x, node.position.y, 9, r + 2, r * 0.45);
    ctx.fillStyle = color;
    ctx.fill();
  } else if (node.nodeType === "sub_nest") {
    drawStar(ctx, node.position.x, node.position.y, 6, r + 1, r * 0.5);
    ctx.fillStyle = color;
    ctx.fill();
  } else if (node.nodeType === "neutral") {
    ctx.beginPath();
    ctx.moveTo(node.position.x, node.position.y - r);
    ctx.lineTo(node.position.x + r, node.position.y);
    ctx.lineTo(node.position.x, node.position.y + r);
    ctx.lineTo(node.position.x - r, node.position.y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(node.position.x, node.position.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.stroke();
  drawLabel(ctx, node.name, node.position.x, node.position.y + r + 3, 10, node.nodeType === "capital" || node.nodeType === "main_nest");

  if (layers.bonuses && node.bonuses.length) {
    const uniqueBonuses = [...new Map(node.bonuses.map((bonus) => [bonus.type, bonus])).values()];
    uniqueBonuses.slice(0, 4).forEach((bonus, index) => {
      const badge = BONUS_BADGES[bonus.type];
      const x = node.position.x + r + 7 + index * 13;
      const y = node.position.y - r - 8;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = badge.color;
      ctx.fill();
      ctx.font = '700 8px "Noto Sans TC", sans-serif';
      ctx.fillStyle = "#fffaf0";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badge.label, x, y + 0.5);
    });
  }

  if (layers.garrison) {
    drawLabel(ctx, `駐 ${node.garrisonSummary.strength}  工 ${node.fortification}`, node.position.x, node.position.y + r + 16, 9);
  }

  ctx.restore();
}

function drawEdge(ctx: CanvasRenderingContext2D, map: TowerMap, edge: TowerMapEdge, highlighted: boolean, hovered: boolean) {
  const polyline = edgePolyline(map, edge);
  if (polyline.length < 2) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(polyline[0].x, polyline[0].y);
  for (const point of polyline.slice(1)) ctx.lineTo(point.x, point.y);

  if (highlighted) {
    ctx.strokeStyle = "#f2c45c";
    ctx.lineWidth = 5.5;
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(polyline[0].x, polyline[0].y);
    for (const point of polyline.slice(1)) ctx.lineTo(point.x, point.y);
  }

  if (edge.pathType === "road") {
    ctx.strokeStyle = hovered ? "#4c2b13" : "rgba(82, 49, 22, 0.92)";
    ctx.lineWidth = hovered ? 3.6 : 2.7;
    ctx.setLineDash([]);
  } else if (edge.pathType === "trail") {
    ctx.strokeStyle = hovered ? "#6d431f" : "rgba(93, 63, 32, 0.78)";
    ctx.lineWidth = hovered ? 2.4 : 1.55;
    ctx.setLineDash([6, 4]);
  } else {
    ctx.strokeStyle = hovered ? "#a66ad4" : "rgba(138, 78, 174, 0.82)";
    ctx.lineWidth = hovered ? 2.6 : 1.7;
    ctx.setLineDash([2, 4]);
  }
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();
}

export function MapCanvas({
  map,
  layers,
  viewMode,
  selectedNodeId,
  route,
  hoveredEdgeId,
  onSelectNode,
  onHoverEdge
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const routeEdges = useMemo(() => new Set(route?.edgeIds ?? []), [route]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(map.pixelWidth * ratio);
    canvas.height = Math.round(map.pixelHeight * ratio);
    canvas.style.aspectRatio = `${map.pixelWidth} / ${map.pixelHeight}`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, map.pixelWidth, map.pixelHeight);

    if (layers.terrain) {
      for (let r = 0; r < map.terrainGrid.length; r += 1) {
        for (let c = 0; c < map.terrainGrid[r].length; c += 1) {
          ctx.fillStyle = TERRAIN_COLORS[map.terrainGrid[r][c]];
          ctx.fillRect(c * map.config.cellSize, r * map.config.cellSize, map.config.cellSize, map.config.cellSize);
        }
      }
    } else {
      ctx.fillStyle = "#d1d5c7";
      ctx.fillRect(0, 0, map.pixelWidth, map.pixelHeight);
    }

    if (layers.factionZones) {
      const humanMax = Math.round(map.config.width * 0.42);
      const monsterMin = Math.round(map.config.width * 0.58);
      ctx.fillStyle = "rgba(45, 92, 154, 0.18)";
      ctx.fillRect(0, 0, humanMax * map.config.cellSize, map.pixelHeight);
      ctx.fillStyle = "rgba(167, 55, 78, 0.18)";
      ctx.fillRect(monsterMin * map.config.cellSize, 0, map.pixelWidth - monsterMin * map.config.cellSize, map.pixelHeight);
      ctx.fillStyle = "rgba(207, 157, 54, 0.14)";
      ctx.fillRect(humanMax * map.config.cellSize, 0, (monsterMin - humanMax) * map.config.cellSize, map.pixelHeight);
    }

    ctx.strokeStyle = "rgba(22, 19, 13, 0.06)";
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= map.config.height; r += 1) {
      ctx.beginPath();
      ctx.moveTo(0, r * map.config.cellSize);
      ctx.lineTo(map.pixelWidth, r * map.config.cellSize);
      ctx.stroke();
    }
    for (let c = 0; c <= map.config.width; c += 1) {
      ctx.beginPath();
      ctx.moveTo(c * map.config.cellSize, 0);
      ctx.lineTo(c * map.config.cellSize, map.pixelHeight);
      ctx.stroke();
    }

    for (const pathType of ["road", "trail", "secret"] as const) {
      for (const edge of map.edges.filter((entry) => entry.pathType === pathType && edgeVisible(entry, layers, viewMode))) {
        drawEdge(ctx, map, edge, routeEdges.has(edge.id), hoveredEdgeId === edge.id);
      }
    }

    for (const node of map.nodes) {
      drawNode(ctx, node, selectedNodeId === node.id, layers);
    }
  }, [hoveredEdgeId, layers, map, routeEdges, selectedNodeId, viewMode]);

  const toMapPoint = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * map.pixelWidth,
      y: ((event.clientY - rect.top) / rect.height) * map.pixelHeight
    };
  };

  const findNode = (point: { x: number; y: number }) =>
    map.nodes.find((node) => Math.hypot(node.position.x - point.x, node.position.y - point.y) <= nodeRadius(node) + 8);

  const findEdge = (point: { x: number; y: number }) => {
    let best: { edge: TowerMapEdge; distance: number } | null = null;
    for (const edge of map.edges) {
      if (!edgeVisible(edge, layers, viewMode)) continue;
      const polyline = edgePolyline(map, edge);
      for (let index = 0; index < polyline.length - 1; index += 1) {
        const distance = pointSegmentDistance(point, polyline[index], polyline[index + 1]);
        if (distance < 7 && (!best || distance < best.distance)) {
          best = { edge, distance };
        }
      }
    }
    return best?.edge ?? null;
  };

  return (
    <canvas
      ref={canvasRef}
      className="map-canvas"
      data-testid="tower-map-canvas"
      onMouseLeave={() => onHoverEdge(null)}
      onMouseMove={(event) => {
        const point = toMapPoint(event);
        onHoverEdge(findEdge(point)?.id ?? null);
      }}
      onClick={(event) => {
        const node = findNode(toMapPoint(event));
        onSelectNode(node?.id ?? null);
      }}
    />
  );
}
