import { useEffect, useMemo, useRef } from "react";

import type { MapLayers, RoutePlan, TerrainRegion, TerrainType, TowerMap, TowerMapEdge, TowerMapNode, ViewMode } from "../types";
import { BONUS_BADGES } from "../map/constants";

type MapCanvasProps = {
  map: TowerMap;
  layers: MapLayers;
  viewMode: ViewMode;
  zoom: number;
  selectedNodeId: string | null;
  route: RoutePlan | null;
  hoveredEdgeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onHoverEdge: (edgeId: string | null) => void;
};

type HatchStyle = {
  base: string;
  stroke: string;
  angle: number;
  spacing: number;
  lineWidth: number;
  opacity: number;
  dash?: number[];
  crossAngle?: number;
  dots?: boolean;
  waves?: boolean;
};

type MapDetailLevel = "overview" | "normal" | "detailed" | "inspection" | "drafting";

const PAPER = "#efeee8";
const INK = "#181816";

const TERRAIN_HATCH: Record<TerrainType, HatchStyle> = {
  plain: {
    base: "#f1f0ea",
    stroke: "#272722",
    angle: -Math.PI / 4,
    spacing: 15,
    lineWidth: 0.55,
    opacity: 0.22
  },
  forest: {
    base: "#deded8",
    stroke: "#1f1f1c",
    angle: Math.PI / 4,
    spacing: 8,
    lineWidth: 0.55,
    opacity: 0.25,
    crossAngle: -Math.PI / 4,
    dots: true
  },
  swamp: {
    base: "#e7e6df",
    stroke: "#242421",
    angle: 0,
    spacing: 10,
    lineWidth: 0.6,
    opacity: 0.2,
    dash: [5, 7],
    waves: true
  },
  desert: {
    base: "#f4f3ee",
    stroke: "#22221f",
    angle: Math.PI / 12,
    spacing: 12,
    lineWidth: 0.52,
    opacity: 0.18,
    dash: [2, 8],
    dots: true
  },
  mountain: {
    base: "#d6d6d0",
    stroke: "#181816",
    angle: -Math.PI / 5,
    spacing: 6,
    lineWidth: 0.65,
    opacity: 0.25,
    crossAngle: Math.PI / 7
  },
  water: {
    base: "#eeeeea",
    stroke: "#242421",
    angle: 0,
    spacing: 11,
    lineWidth: 0.6,
    opacity: 0.16,
    dash: [8, 10],
    waves: true
  }
};

const OWNER_FILL: Record<TowerMapNode["owner"], string> = {
  human: PAPER,
  monster: "#20201d",
  neutral: "#8e8e86"
};

const OWNER_STROKE: Record<TowerMapNode["owner"], string> = {
  human: INK,
  monster: PAPER,
  neutral: INK
};

const BONUS_TONES: Record<string, string> = {
  resource_yield: "#1f1f1c",
  recruit_rate: "#3b3b37",
  research_rate: "#62625b",
  vision: "#2c2c28",
  terrain_defense: "#73736b",
  movement: "#96968d"
};

const DETAIL_RANK: Record<MapDetailLevel, number> = {
  overview: 0,
  normal: 1,
  detailed: 2,
  inspection: 3,
  drafting: 4
};

function detailAtLeast(detail: MapDetailLevel, threshold: MapDetailLevel): boolean {
  return DETAIL_RANK[detail] >= DETAIL_RANK[threshold];
}

function detailLevelForZoom(zoom: number): MapDetailLevel {
  if (zoom < 0.7) return "overview";
  if (zoom < 1.15) return "normal";
  if (zoom < 1.65) return "detailed";
  if (zoom < 2.3) return "inspection";
  return "drafting";
}

function screenPx(value: number, zoom: number): number {
  return value / Math.max(0.001, zoom);
}

function scaledDash(dash: number[] | undefined, zoom: number): number[] {
  return dash?.map((value) => screenPx(value, zoom)) ?? [];
}

function isMajorNode(node: TowerMapNode): boolean {
  return node.nodeType === "capital" || node.nodeType === "main_nest";
}

function isRegionalNode(node: TowerMapNode): boolean {
  return node.nodeType === "city" || node.nodeType === "sub_nest";
}

function shouldDrawNode(node: TowerMapNode, detail: MapDetailLevel, selected: boolean): boolean {
  if (selected) return true;
  if (detail === "overview") return isMajorNode(node) || isRegionalNode(node);
  return true;
}

function shouldShowNodeLabel(node: TowerMapNode, detail: MapDetailLevel, selected: boolean): boolean {
  if (selected) return true;
  if (detail === "overview") return isMajorNode(node);
  if (detail === "normal") return isMajorNode(node) || isRegionalNode(node);
  return true;
}

function shouldDrawEdge(edge: TowerMapEdge, detail: MapDetailLevel, highlighted: boolean, hovered: boolean): boolean {
  if (highlighted || hovered) return true;
  if (detail === "overview") return edge.pathType === "road";
  if (detail === "normal") return edge.pathType !== "secret";
  return true;
}

function nodeRadius(node: TowerMapNode): number {
  if (node.nodeType === "capital" || node.nodeType === "main_nest") return 12;
  if (node.nodeType === "city" || node.nodeType === "sub_nest") return 8;
  if (node.nodeType === "tribe") return 5;
  return 6;
}

function nodeVisualRadius(node: TowerMapNode, zoom: number): number {
  return nodeRadius(node) / Math.sqrt(Math.max(0.5, zoom));
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

function tracePolyline(ctx: CanvasRenderingContext2D, polyline: Array<{ x: number; y: number }>) {
  if (polyline.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(polyline[0].x, polyline[0].y);
  for (const point of polyline.slice(1)) ctx.lineTo(point.x, point.y);
}

function pathForRegion(region: TerrainRegion, cellSize: number): Path2D {
  const path = new Path2D();
  for (const cell of region.cells) {
    path.rect(cell.c * cellSize, cell.r * cellSize, cellSize, cellSize);
  }
  return path;
}

function drawHatchLines(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  style: HatchStyle,
  zoom: number,
  angle = style.angle
) {
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const extent = Math.hypot(bounds.width, bounds.height) + style.spacing * 4;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.beginPath();
  for (let x = -extent; x <= extent; x += style.spacing) {
    ctx.moveTo(x, -extent);
    ctx.lineTo(x, extent);
  }
  ctx.strokeStyle = style.stroke;
  ctx.globalAlpha = style.opacity;
  ctx.lineWidth = screenPx(style.lineWidth, zoom);
  ctx.setLineDash(scaledDash(style.dash, zoom));
  ctx.stroke();
  ctx.restore();
}

function drawStipple(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  terrainType: TerrainType,
  zoom: number,
  detail: MapDetailLevel
) {
  const density = detail === "detailed" ? 0.92 : detail === "inspection" ? 0.82 : detail === "drafting" ? 0.72 : 1;
  const spacing = (terrainType === "forest" ? 19 : 17) * density;
  const radius = screenPx(terrainType === "forest" ? 1.25 : 0.85, zoom);
  ctx.save();
  ctx.fillStyle = "rgba(24, 24, 22, 0.24)";
  for (let y = bounds.y + spacing * 0.45; y < bounds.y + bounds.height; y += spacing) {
    for (let x = bounds.x + spacing * 0.45; x < bounds.x + bounds.width; x += spacing) {
      const jitterX = Math.sin((x + y) * 0.09) * 2.2;
      const jitterY = Math.cos((x - y) * 0.07) * 2.2;
      ctx.beginPath();
      ctx.arc(x + jitterX, y + jitterY, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawWaveHatch(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  terrainType: TerrainType,
  zoom: number,
  detail: MapDetailLevel
) {
  const density = detail === "detailed" ? 0.92 : detail === "inspection" ? 0.82 : detail === "drafting" ? 0.72 : 1;
  const spacing = (terrainType === "water" ? 13 : 16) * density;
  const amplitude = terrainType === "water" ? 1.8 : 1.15;
  ctx.save();
  ctx.strokeStyle = "rgba(24, 24, 22, 0.18)";
  ctx.lineWidth = screenPx(0.65, zoom);
  for (let y = bounds.y + spacing * 0.6; y < bounds.y + bounds.height; y += spacing) {
    ctx.beginPath();
    for (let x = bounds.x - 4; x <= bounds.x + bounds.width + 4; x += 4) {
      const yy = y + Math.sin((x + bounds.y) * 0.06) * amplitude;
      if (x === bounds.x - 4) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function hatchStyleForDetail(style: HatchStyle, detail: MapDetailLevel): HatchStyle {
  const spacingScale: Record<MapDetailLevel, number> = {
    overview: 2.15,
    normal: 1.25,
    detailed: 1,
    inspection: 0.84,
    drafting: 0.68
  };
  const opacityScale: Record<MapDetailLevel, number> = {
    overview: 0.62,
    normal: 0.86,
    detailed: 1,
    inspection: 1,
    drafting: 1.08
  };
  return {
    ...style,
    spacing: Math.max(3.5, style.spacing * spacingScale[detail]),
    opacity: Math.min(0.32, style.opacity * opacityScale[detail])
  };
}

function drawTerrainLayer(ctx: CanvasRenderingContext2D, map: TowerMap, zoom: number, detail: MapDetailLevel) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, map.pixelWidth, map.pixelHeight);

  const richRegions = map.terrainRegions.filter((region) => Array.isArray(region.cells) && region.cells.length > 0);
  if (!richRegions.length) {
    for (let r = 0; r < map.terrainGrid.length; r += 1) {
      for (let c = 0; c < map.terrainGrid[r].length; c += 1) {
        ctx.fillStyle = TERRAIN_HATCH[map.terrainGrid[r][c]].base;
        ctx.fillRect(c * map.config.cellSize, r * map.config.cellSize, map.config.cellSize, map.config.cellSize);
      }
    }
    return;
  }

  for (const region of richRegions) {
    const style = hatchStyleForDetail(TERRAIN_HATCH[region.terrainType], detail);
    const [minC, minR, maxC, maxR] = region.bounds;
    const bounds = {
      x: minC * map.config.cellSize,
      y: minR * map.config.cellSize,
      width: (maxC - minC + 1) * map.config.cellSize,
      height: (maxR - minR + 1) * map.config.cellSize
    };
    const path = pathForRegion(region, map.config.cellSize);
    ctx.fillStyle = style.base;
    ctx.fill(path);
    ctx.save();
    ctx.clip(path);
    drawHatchLines(ctx, bounds, style, zoom);
    if (style.crossAngle !== undefined && detail !== "overview") {
      drawHatchLines(ctx, bounds, { ...style, opacity: style.opacity * 0.58 }, zoom, style.crossAngle);
    }
    if (style.dots && detailAtLeast(detail, "detailed")) drawStipple(ctx, bounds, region.terrainType, zoom, detail);
    if (style.waves && detailAtLeast(detail, "normal")) drawWaveHatch(ctx, bounds, region.terrainType, zoom, detail);
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = "rgba(22, 22, 20, 0.18)";
  ctx.lineWidth = screenPx(0.55, zoom);
  ctx.lineJoin = "round";
  for (const region of richRegions) {
    for (const outline of region.outlines) {
      if (outline.length < 2) continue;
      tracePolyline(ctx, outline);
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawContourLayer(ctx: CanvasRenderingContext2D, map: TowerMap, zoom: number, detail: MapDetailLevel) {
  if (!Array.isArray(map.contourLines)) return;
  if (detail === "overview") return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const contour of map.contourLines) {
    if (contour.points.length < 2) continue;
    if (!detailAtLeast(detail, "detailed") && contour.kind !== "major") continue;
    tracePolyline(ctx, contour.points);
    ctx.strokeStyle = contour.kind === "major" ? "rgba(18, 18, 16, 0.46)" : "rgba(18, 18, 16, 0.24)";
    ctx.lineWidth = screenPx(contour.kind === "major" ? 0.95 : 0.48, zoom);
    ctx.setLineDash([]);
    ctx.stroke();
  }
  ctx.restore();
}

function drawNode(ctx: CanvasRenderingContext2D, node: TowerMapNode, selected: boolean, layers: MapLayers, zoom: number, detail: MapDetailLevel) {
  const fill = OWNER_FILL[node.owner];
  const stroke = OWNER_STROKE[node.owner];
  const r = nodeVisualRadius(node, zoom);
  ctx.save();

  if (selected) {
    ctx.beginPath();
    ctx.arc(node.position.x, node.position.y, r + screenPx(7, zoom), 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(247, 246, 239, 0.95)";
    ctx.lineWidth = screenPx(5, zoom);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(node.position.x, node.position.y, r + screenPx(7, zoom), 0, Math.PI * 2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = screenPx(2, zoom);
    ctx.stroke();
  }

  if (node.nodeType === "capital") {
    ctx.beginPath();
    ctx.arc(node.position.x, node.position.y, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = screenPx(1.4, zoom);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(node.position.x, node.position.y, r - 2, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  } else if (node.nodeType === "main_nest") {
    drawStar(ctx, node.position.x, node.position.y, 9, r + 2, r * 0.45);
    ctx.fillStyle = fill;
    ctx.fill();
  } else if (node.nodeType === "sub_nest") {
    drawStar(ctx, node.position.x, node.position.y, 6, r + 1, r * 0.5);
    ctx.fillStyle = fill;
    ctx.fill();
  } else if (node.nodeType === "neutral") {
    ctx.beginPath();
    ctx.moveTo(node.position.x, node.position.y - r);
    ctx.lineTo(node.position.x + r, node.position.y);
    ctx.lineTo(node.position.x, node.position.y + r);
    ctx.lineTo(node.position.x - r, node.position.y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(node.position.x, node.position.y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  ctx.lineWidth = screenPx(node.owner === "monster" ? 1.8 : 2.1, zoom);
  ctx.strokeStyle = stroke;
  ctx.stroke();
  if (layers.bonuses && node.bonuses.length && detailAtLeast(detail, "detailed")) {
    const uniqueBonuses = [...new Map(node.bonuses.map((bonus) => [bonus.type, bonus])).values()];
    uniqueBonuses.slice(0, 4).forEach((bonus, index) => {
      const x = node.position.x + r + screenPx(7 + index * 13, zoom);
      const y = node.position.y - r - screenPx(8, zoom);
      ctx.beginPath();
      ctx.arc(x, y, screenPx(6, zoom), 0, Math.PI * 2);
      ctx.fillStyle = BONUS_TONES[bonus.type] ?? "#565650";
      ctx.fill();
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = screenPx(1, zoom);
      ctx.stroke();
    });
  }

  ctx.restore();
}

function drawEdge(
  ctx: CanvasRenderingContext2D,
  map: TowerMap,
  edge: TowerMapEdge,
  highlighted: boolean,
  hovered: boolean,
  zoom: number
) {
  const polyline = edgePolyline(map, edge);
  if (polyline.length < 2) return;

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (edge.pathType === "road") {
    tracePolyline(ctx, polyline);
    ctx.strokeStyle = hovered ? "rgba(250, 249, 242, 0.98)" : "rgba(250, 249, 242, 0.92)";
    ctx.lineWidth = screenPx(hovered ? 7.6 : 6.2, zoom);
    ctx.setLineDash([]);
    ctx.stroke();

    tracePolyline(ctx, polyline);
    ctx.strokeStyle = hovered ? "rgba(16, 16, 14, 0.78)" : "rgba(16, 16, 14, 0.52)";
    ctx.lineWidth = screenPx(hovered ? 1.8 : 1.15, zoom);
    ctx.stroke();
  } else if (edge.pathType === "trail") {
    tracePolyline(ctx, polyline);
    ctx.strokeStyle = hovered ? "rgba(18, 18, 16, 0.84)" : "rgba(18, 18, 16, 0.58)";
    ctx.lineWidth = screenPx(hovered ? 2.4 : 1.45, zoom);
    ctx.setLineDash(scaledDash([7, 5], zoom));
    ctx.stroke();
  } else {
    tracePolyline(ctx, polyline);
    ctx.strokeStyle = hovered ? "rgba(18, 18, 16, 0.82)" : "rgba(18, 18, 16, 0.48)";
    ctx.lineWidth = screenPx(hovered ? 2.15 : 1.35, zoom);
    ctx.setLineDash(scaledDash([1.5, 4.5], zoom));
    ctx.stroke();
  }

  if (highlighted) {
    tracePolyline(ctx, polyline);
    ctx.strokeStyle = "rgba(246, 245, 238, 0.96)";
    ctx.lineWidth = screenPx(edge.pathType === "road" ? 3.8 : 4.6, zoom);
    ctx.setLineDash([]);
    ctx.stroke();
    tracePolyline(ctx, polyline);
    ctx.strokeStyle = INK;
    ctx.lineWidth = screenPx(edge.pathType === "road" ? 1.6 : 2.1, zoom);
    ctx.stroke();
  }
  ctx.restore();
}

export function MapCanvas({
  map,
  layers,
  viewMode,
  zoom,
  selectedNodeId,
  route,
  hoveredEdgeId,
  onSelectNode,
  onHoverEdge
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const routeEdges = useMemo(() => new Set(route?.edgeIds ?? []), [route]);
  const detail = detailLevelForZoom(zoom);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const displayWidth = map.pixelWidth * zoom;
    const displayHeight = map.pixelHeight * zoom;
    canvas.width = Math.round(displayWidth * ratio);
    canvas.height = Math.round(displayHeight * ratio);
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.style.aspectRatio = `${map.pixelWidth} / ${map.pixelHeight}`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio * zoom, 0, 0, ratio * zoom, 0, 0);
    ctx.clearRect(0, 0, map.pixelWidth, map.pixelHeight);

    if (layers.terrain) {
      drawTerrainLayer(ctx, map, zoom, detail);
    } else {
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, map.pixelWidth, map.pixelHeight);
    }

    if (layers.factionZones) {
      const humanMax = Math.round(map.config.width * 0.42);
      const monsterMin = Math.round(map.config.width * 0.58);
      ctx.fillStyle = "rgba(0, 0, 0, 0.025)";
      ctx.fillRect(0, 0, humanMax * map.config.cellSize, map.pixelHeight);
      ctx.fillStyle = "rgba(0, 0, 0, 0.045)";
      ctx.fillRect(monsterMin * map.config.cellSize, 0, map.pixelWidth - monsterMin * map.config.cellSize, map.pixelHeight);
      ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
      ctx.fillRect(humanMax * map.config.cellSize, 0, (monsterMin - humanMax) * map.config.cellSize, map.pixelHeight);
      ctx.strokeStyle = "rgba(18, 18, 16, 0.34)";
      ctx.lineWidth = screenPx(1, zoom);
      ctx.setLineDash(scaledDash([9, 7], zoom));
      for (const c of [humanMax, monsterMin]) {
        ctx.beginPath();
        ctx.moveTo(c * map.config.cellSize, 0);
        ctx.lineTo(c * map.config.cellSize, map.pixelHeight);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    if (layers.terrain) drawContourLayer(ctx, map, zoom, detail);

    for (const pathType of ["road", "trail", "secret"] as const) {
      for (const edge of map.edges.filter((entry) => {
        const highlighted = routeEdges.has(entry.id);
        const hovered = hoveredEdgeId === entry.id;
        return entry.pathType === pathType && edgeVisible(entry, layers, viewMode) && shouldDrawEdge(entry, detail, highlighted, hovered);
      })) {
        drawEdge(ctx, map, edge, routeEdges.has(edge.id), hoveredEdgeId === edge.id, zoom);
      }
    }

    for (const node of map.nodes) {
      const selected = selectedNodeId === node.id;
      if (shouldDrawNode(node, detail, selected)) drawNode(ctx, node, selected, layers, zoom, detail);
    }
  }, [detail, hoveredEdgeId, layers, map, routeEdges, selectedNodeId, viewMode, zoom]);

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
    map.nodes.find((node) => {
      const selected = selectedNodeId === node.id;
      if (!shouldDrawNode(node, detail, selected)) return false;
      return Math.hypot(node.position.x - point.x, node.position.y - point.y) <= nodeVisualRadius(node, zoom) + screenPx(8, zoom);
    });

  const findEdge = (point: { x: number; y: number }) => {
    let best: { edge: TowerMapEdge; distance: number } | null = null;
    for (const edge of map.edges) {
      if (!edgeVisible(edge, layers, viewMode)) continue;
      const highlighted = routeEdges.has(edge.id);
      const hovered = hoveredEdgeId === edge.id;
      if (!shouldDrawEdge(edge, detail, highlighted, hovered)) continue;
      const polyline = edgePolyline(map, edge);
      for (let index = 0; index < polyline.length - 1; index += 1) {
        const distance = pointSegmentDistance(point, polyline[index], polyline[index + 1]);
        if (distance < screenPx(7, zoom) && (!best || distance < best.distance)) {
          best = { edge, distance };
        }
      }
    }
    return best?.edge ?? null;
  };

  const renderSvgLabels = () =>
    map.nodes.map((node) => {
      const selected = selectedNodeId === node.id;
      if (!shouldDrawNode(node, detail, selected)) return null;

      const r = nodeVisualRadius(node, zoom);
      const isMajor = isMajorNode(node);
      const showName = shouldShowNodeLabel(node, detail, selected);
      const showGarrison = layers.garrison && detailAtLeast(detail, "inspection");
      const showDrafting = detail === "drafting";
      const uniqueBonuses = layers.bonuses && detail === "drafting"
        ? [...new Map(node.bonuses.map((bonus) => [bonus.type, bonus])).values()].slice(0, 4)
        : [];

      return (
        <g key={node.id}>
          {showName ? (
            <text
              className={`map-svg-label${isMajor ? " is-major" : ""}`}
              x={node.position.x}
              y={node.position.y + r + screenPx(3, zoom)}
              fontSize={screenPx(isMajor ? 11 : 10, zoom)}
            >
              {node.name}
            </text>
          ) : null}
          {showGarrison ? (
            <text
              className="map-svg-label is-garrison"
              x={node.position.x}
              y={node.position.y + r + screenPx(16, zoom)}
              fontSize={screenPx(9, zoom)}
            >
              {`駐 ${node.garrisonSummary.strength}  工 ${node.fortification}`}
            </text>
          ) : null}
          {showDrafting ? (
            <text
              className="map-svg-label is-garrison"
              x={node.position.x}
              y={node.position.y + r + screenPx(showGarrison ? 28 : 16, zoom)}
              fontSize={screenPx(8, zoom)}
            >
              {`${node.grid.c},${node.grid.r}`}
            </text>
          ) : null}
          {uniqueBonuses.map((bonus, index) => {
            const x = node.position.x + r + screenPx(7 + index * 13, zoom);
            const y = node.position.y - r - screenPx(8, zoom);
            return (
              <text key={bonus.type} className="map-svg-badge-label" x={x} y={y + screenPx(0.5, zoom)} fontSize={screenPx(8, zoom)}>
                {BONUS_BADGES[bonus.type].label}
              </text>
            );
          })}
        </g>
      );
    });

  return (
    <div
      className="map-canvas-shell"
      style={{
        width: `${map.pixelWidth * zoom}px`,
        height: `${map.pixelHeight * zoom}px`,
        aspectRatio: `${map.pixelWidth} / ${map.pixelHeight}`
      }}
    >
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
      <svg className="map-label-layer" viewBox={`0 0 ${map.pixelWidth} ${map.pixelHeight}`} aria-hidden="true">
        {renderSvgLabels()}
      </svg>
    </div>
  );
}
