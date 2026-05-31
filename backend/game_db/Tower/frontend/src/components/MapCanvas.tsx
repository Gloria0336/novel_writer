import { useEffect, useMemo, useRef } from "react";
import type { MouseEvent } from "react";

import type { Army, HexCoord, HexTile, MapLayers, OwnerSide, Structure, TerrainType, TowerMap, ViewMode } from "../types";
import { BONUS_BADGES, OWNER_COLORS, TERRAIN_COLORS } from "../map/constants";

type MapCanvasProps = {
  map: TowerMap;
  layers: MapLayers;
  viewMode: ViewMode;
  zoom: number;
  selectedStructureId: string | null;
  selectedArmyId: string | null;
  reachableTileKeys: Set<string>;
  plannedPath: HexCoord[];
  onSelectStructure: (structureId: string | null) => void;
  onSelectArmy: (armyId: string | null) => void;
  onSelectDestination: (coord: HexCoord | null) => void;
};

const PAPER = "#efeee8";
const INK = "#191916";

const TERRAIN_STROKES: Record<TerrainType, string> = {
  plain: "rgba(40, 44, 26, 0.22)",
  forest: "rgba(20, 44, 22, 0.34)",
  swamp: "rgba(29, 46, 35, 0.32)",
  desert: "rgba(88, 70, 32, 0.26)",
  mountain: "rgba(40, 38, 34, 0.32)",
  water: "rgba(17, 58, 87, 0.32)"
};

function screenPx(value: number, zoom: number): number {
  return value / Math.max(0.001, zoom);
}

function hexCorners(tile: HexTile, size: number): Array<{ x: number; y: number }> {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 30);
    return {
      x: tile.position.x + size * Math.cos(angle),
      y: tile.position.y + size * Math.sin(angle)
    };
  });
}

function traceHex(ctx: CanvasRenderingContext2D, tile: HexTile, size: number) {
  const corners = hexCorners(tile, size);
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (const corner of corners.slice(1)) ctx.lineTo(corner.x, corner.y);
  ctx.closePath();
}

function ownerTint(owner: OwnerSide | null): string | null {
  if (!owner) return null;
  return owner === "human" ? "rgba(42, 92, 154, 0.18)" : "rgba(167, 55, 78, 0.18)";
}

function drawTile(ctx: CanvasRenderingContext2D, tile: HexTile, map: TowerMap, layers: MapLayers, viewMode: ViewMode, zoom: number) {
  const size = map.config.hexSize;
  traceHex(ctx, tile, size);
  ctx.fillStyle = layers.terrain ? TERRAIN_COLORS[tile.terrainType] : PAPER;
  ctx.fill();
  ctx.strokeStyle = TERRAIN_STROKES[tile.terrainType];
  ctx.lineWidth = screenPx(0.7, zoom);
  ctx.stroke();

  if (layers.control) {
    const tint = ownerTint(tile.owner);
    if (tint) {
      traceHex(ctx, tile, size * 0.92);
      ctx.fillStyle = tint;
      ctx.fill();
    }
  }

  if (viewMode !== "omniscient" && tile.owner !== viewMode) {
    traceHex(ctx, tile, size * 0.96);
    ctx.fillStyle = "rgba(12, 12, 12, 0.14)";
    ctx.fill();
  }
}

function drawTileFeature(ctx: CanvasRenderingContext2D, tile: HexTile, map: TowerMap, layers: MapLayers, zoom: number) {
  const size = map.config.hexSize;
  const { x, y } = tile.position;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (layers.roads && tile.features.includes("road")) {
    ctx.strokeStyle = "rgba(84, 57, 30, 0.82)";
    ctx.lineWidth = screenPx(2.2, zoom);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.56, y + size * 0.1);
    ctx.lineTo(x + size * 0.56, y - size * 0.1);
    ctx.stroke();
  }

  if (layers.bridges && tile.features.includes("bridge")) {
    ctx.strokeStyle = "rgba(92, 55, 28, 0.95)";
    ctx.lineWidth = screenPx(3, zoom);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.5, y);
    ctx.lineTo(x + size * 0.5, y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(240, 236, 220, 0.82)";
    ctx.lineWidth = screenPx(1, zoom);
    ctx.stroke();
  }

  if (layers.secretPaths && tile.features.includes("secret_path")) {
    ctx.strokeStyle = "rgba(75, 28, 112, 0.74)";
    ctx.lineWidth = screenPx(1.8, zoom);
    ctx.setLineDash([screenPx(2, zoom), screenPx(4, zoom)]);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.48, y - size * 0.25);
    ctx.lineTo(x + size * 0.48, y + size * 0.25);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (layers.features) {
    const feature = tile.features.find((item) => item === "mine" || item === "ruin" || item === "ford" || item === "wall" || item === "moat");
    if (feature) {
      ctx.fillStyle = feature === "mine" ? "#8a5a23" : feature === "ruin" ? "#5d5960" : feature === "ford" ? "#e9e0b8" : "#262522";
      ctx.beginPath();
      ctx.arc(x + size * 0.38, y - size * 0.3, screenPx(3.4, zoom), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawReachableTile(ctx: CanvasRenderingContext2D, tile: HexTile, map: TowerMap, selected: boolean, zoom: number) {
  traceHex(ctx, tile, map.config.hexSize * 0.84);
  ctx.fillStyle = selected ? "rgba(246, 202, 92, 0.42)" : "rgba(246, 202, 92, 0.19)";
  ctx.fill();
  ctx.strokeStyle = selected ? "rgba(55, 39, 13, 0.78)" : "rgba(246, 202, 92, 0.28)";
  ctx.lineWidth = screenPx(selected ? 1.8 : 0.8, zoom);
  ctx.stroke();
}

function drawPlannedPath(ctx: CanvasRenderingContext2D, map: TowerMap, path: HexCoord[], zoom: number) {
  if (path.length < 2) return;
  const byKey = new Map(map.tileMap.tiles.map((tile) => [`${tile.coord.q},${tile.coord.r}`, tile]));
  ctx.save();
  ctx.beginPath();
  path.forEach((coord, index) => {
    const tile = byKey.get(`${coord.q},${coord.r}`);
    if (!tile) return;
    if (index === 0) ctx.moveTo(tile.position.x, tile.position.y);
    else ctx.lineTo(tile.position.x, tile.position.y);
  });
  ctx.strokeStyle = "rgba(255, 248, 220, 0.96)";
  ctx.lineWidth = screenPx(4, zoom);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.strokeStyle = "rgba(38, 37, 34, 0.86)";
  ctx.lineWidth = screenPx(1.5, zoom);
  ctx.stroke();
  ctx.restore();
}

function structureRadius(structure: Structure): number {
  if (structure.structureType === "capital" || structure.structureType === "main_nest") return 11;
  if (structure.structureType === "city" || structure.structureType === "sub_nest") return 8;
  return 5.5;
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

function drawStructure(ctx: CanvasRenderingContext2D, structure: Structure, selected: boolean, zoom: number) {
  const r = structureRadius(structure);
  const fill = structure.owner ? OWNER_COLORS[structure.owner] : "#777";
  const stroke = structure.owner === "monster" ? PAPER : INK;
  const { x, y } = structure.position;

  ctx.save();
  if (selected) {
    ctx.beginPath();
    ctx.arc(x, y, r + screenPx(7, zoom), 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 252, 235, 0.95)";
    ctx.lineWidth = screenPx(5, zoom);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r + screenPx(7, zoom), 0, Math.PI * 2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = screenPx(1.8, zoom);
    ctx.stroke();
  }

  if (structure.structureType === "capital") {
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = "#d8b84c";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r - 1.5, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  } else if (structure.structureType === "main_nest") {
    drawStar(ctx, x, y, 9, r + 2, r * 0.48);
    ctx.fillStyle = fill;
    ctx.fill();
  } else if (structure.structureType === "sub_nest") {
    drawStar(ctx, x, y, 6, r + 1, r * 0.5);
    ctx.fillStyle = fill;
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  ctx.lineWidth = screenPx(1.8, zoom);
  ctx.strokeStyle = stroke;
  ctx.stroke();
  ctx.restore();
}

function armyPosition(map: TowerMap, army: Army) {
  const position = map.tileMap.tiles.find((tile) => tile.coord.q === army.position.q && tile.coord.r === army.position.r)?.position ?? { x: 0, y: 0 };
  const offset = map.config.hexSize * 0.85;
  return {
    x: position.x + (army.owner === "human" ? -offset : offset),
    y: position.y - offset * 0.35
  };
}

function drawArmy(ctx: CanvasRenderingContext2D, map: TowerMap, army: Army, selected: boolean, zoom: number) {
  const { x, y } = armyPosition(map, army);
  const radius = army.owner === "human" ? 6.8 : 7.4;
  ctx.save();
  if (selected) {
    ctx.beginPath();
    ctx.arc(x, y, radius + screenPx(7, zoom), 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 248, 220, 0.96)";
    ctx.lineWidth = screenPx(4, zoom);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius * 0.92, y + radius * 0.7);
  ctx.lineTo(x - radius * 0.92, y + radius * 0.7);
  ctx.closePath();
  ctx.fillStyle = army.owner === "human" ? "#1f5f9f" : "#a62e4b";
  ctx.fill();
  ctx.lineWidth = screenPx(1.8, zoom);
  ctx.strokeStyle = "#fff8dc";
  ctx.stroke();
  ctx.restore();
}

export function MapCanvas({
  map,
  layers,
  viewMode,
  zoom,
  selectedStructureId,
  selectedArmyId,
  reachableTileKeys,
  plannedPath,
  onSelectStructure,
  onSelectArmy,
  onSelectDestination
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visibleStructures = useMemo(
    () => map.structures.filter((structure) => viewMode === "omniscient" || structure.owner === viewMode),
    [map.structures, viewMode]
  );
  const visibleArmies = useMemo(
    () => map.armies.filter((army) => viewMode === "omniscient" || army.owner === viewMode),
    [map.armies, viewMode]
  );

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
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, map.pixelWidth, map.pixelHeight);

    for (const tile of map.tileMap.tiles) drawTile(ctx, tile, map, layers, viewMode, zoom);
    if (layers.movement) {
      for (const tile of map.tileMap.tiles) {
        const tileKey = `${tile.coord.q},${tile.coord.r}`;
        const destination = plannedPath[plannedPath.length - 1];
        if (reachableTileKeys.has(tileKey)) drawReachableTile(ctx, tile, map, destination?.q === tile.coord.q && destination?.r === tile.coord.r, zoom);
      }
    }
    for (const tile of map.tileMap.tiles) drawTileFeature(ctx, tile, map, layers, zoom);
    if (layers.plannedPath) drawPlannedPath(ctx, map, plannedPath, zoom);
    if (layers.structures) {
      for (const structure of visibleStructures) drawStructure(ctx, structure, selectedStructureId === structure.id, zoom);
    }
    if (layers.armies) {
      for (const army of visibleArmies) drawArmy(ctx, map, army, selectedArmyId === army.id, zoom);
    }
  }, [layers, map, plannedPath, reachableTileKeys, selectedArmyId, selectedStructureId, viewMode, visibleArmies, visibleStructures, zoom]);

  const toMapPoint = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * map.pixelWidth,
      y: ((event.clientY - rect.top) / rect.height) * map.pixelHeight
    };
  };

  const findStructure = (point: { x: number; y: number }) =>
    visibleStructures.find((structure) => Math.hypot(structure.position.x - point.x, structure.position.y - point.y) <= structureRadius(structure) + 8);

  const findArmy = (point: { x: number; y: number }) =>
    visibleArmies.find((army) => {
      const pos = armyPosition(map, army);
      return Math.hypot(pos.x - point.x, pos.y - point.y) <= 9;
    });

  const findTile = (point: { x: number; y: number }) =>
    map.tileMap.tiles.reduce<{ tile: HexTile | null; distance: number }>(
      (best, tile) => {
        const distance = Math.hypot(tile.position.x - point.x, tile.position.y - point.y);
        return distance < best.distance ? { tile, distance } : best;
      },
      { tile: null, distance: Number.POSITIVE_INFINITY }
    ).tile;

  const renderLabels = () =>
    <>
      {visibleStructures.map((structure) => {
      const r = structureRadius(structure);
      const selected = selectedStructureId === structure.id;
      const showGarrison = layers.garrison || selected;
      const uniqueBonuses = layers.features ? [...new Map(structure.bonuses.map((item) => [item.type, item])).values()].slice(0, 4) : [];
      return (
        <g key={structure.id}>
          <text
            className={`map-svg-label${structure.structureType === "capital" || structure.structureType === "main_nest" ? " is-major" : ""}`}
            x={structure.position.x}
            y={structure.position.y + r + 5}
            fontSize={structure.structureType === "capital" || structure.structureType === "main_nest" ? 11 : 9}
          >
            {structure.name}
          </text>
          {showGarrison ? (
            <text className="map-svg-label is-garrison" x={structure.position.x} y={structure.position.y + r + 17} fontSize={8}>
              {`駐 ${structure.garrisonSummary.strength} 工 ${structure.fortification}`}
            </text>
          ) : null}
          {uniqueBonuses.map((bonus, index) => (
            <text
              key={bonus.type}
              className="map-svg-badge-label"
              x={structure.position.x + r + 8 + index * 12}
              y={structure.position.y - r - 7}
              fontSize={8}
              fill={BONUS_BADGES[bonus.type].color}
            >
              {BONUS_BADGES[bonus.type].label}
            </text>
          ))}
        </g>
      );
    })}
      {layers.armies
        ? visibleArmies.map((army) => {
            const pos = armyPosition(map, army);
            return (
              <text
                key={army.id}
                className="map-svg-label is-army"
                x={pos.x}
                y={pos.y + 12}
                fontSize={8}
              >
                {army.id}
              </text>
            );
          })
        : null}
    </>;

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
        onClick={(event) => {
          const point = toMapPoint(event);
          const army = findArmy(point);
          if (army) {
            onSelectArmy(army.id);
            return;
          }
          const structure = findStructure(point);
          if (structure) {
            onSelectStructure(structure.id);
            return;
          }
          const tile = findTile(point);
          onSelectDestination(tile?.coord ?? null);
        }}
      />
      <svg className="map-label-layer" viewBox={`0 0 ${map.pixelWidth} ${map.pixelHeight}`} aria-hidden="true">
        {renderLabels()}
      </svg>
    </div>
  );
}
