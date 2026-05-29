import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import {
  Download,
  Eye,
  FileInput,
  Flag,
  Layers,
  LocateFixed,
  MapPinned,
  RefreshCw,
  Route,
  Shuffle,
  Shield,
  Swords
} from "lucide-react";

import { MapCanvas } from "./components/MapCanvas";
import {
  BONUS_LABELS,
  DEFAULT_SEED,
  NODE_TYPE_LABELS,
  OWNER_LABELS,
  PATH_LABELS,
  TERRAIN_LABELS
} from "./map/constants";
import { configForPresets, generateTowerMap } from "./map/generator";
import { neighborsFor, findShortestRoute } from "./map/routing";
import { parseTowerMapJson, serializeTowerMap } from "./map/serialization";
import type { DensityPreset, GenerationPreset, MapLayers, TowerMap, ViewMode } from "./types";

const DEFAULT_LAYERS: MapLayers = {
  terrain: true,
  factionZones: true,
  roads: true,
  trails: true,
  secrets: true,
  bonuses: true,
  garrison: false
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const WHEEL_ZOOM_SENSITIVITY = 0.0012;
const ZOOM_EASING = 0.24;

const presetLabels: Record<GenerationPreset, string> = {
  compact: "緊湊",
  standard: "標準",
  wide: "寬幅"
};

const densityLabels: Record<DensityPreset, string> = {
  low: "低密度",
  standard: "標準",
  high: "高密度"
};

const viewModeLabels: Record<ViewMode, string> = {
  omniscient: "全知",
  human: "人類",
  monster: "魔物"
};

function makeInitialMap() {
  return generateTowerMap(configForPresets(DEFAULT_SEED, "standard", "standard"));
}

function shortCost(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : "-";
}

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function LayerToggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

export default function App() {
  const [seedInput, setSeedInput] = useState(DEFAULT_SEED);
  const [preset, setPreset] = useState<GenerationPreset>("standard");
  const [density, setDensity] = useState<DensityPreset>("standard");
  const [map, setMap] = useState<TowerMap>(makeInitialMap);
  const [layers, setLayers] = useState<MapLayers>(DEFAULT_LAYERS);
  const [viewMode, setViewMode] = useState<ViewMode>("omniscient");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [routeStartId, setRouteStartId] = useState<string | null>(null);
  const [routeEndId, setRouteEndId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [status, setStatus] = useState("地圖已生成");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef(1);
  const targetZoomRef = useRef(1);
  const zoomFrameRef = useRef<number | null>(null);
  const zoomAnchorRef = useRef<{
    localX: number;
    localY: number;
    mapX: number;
    mapY: number;
  } | null>(null);
  const panRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  const selectedNode = useMemo(() => map.nodes.find((node) => node.id === selectedNodeId) ?? null, [map.nodes, selectedNodeId]);
  const hoveredEdge = useMemo(() => map.edges.find((edge) => edge.id === hoveredEdgeId) ?? null, [hoveredEdgeId, map.edges]);
  const route = useMemo(
    () => (routeStartId && routeEndId ? findShortestRoute(map, routeStartId, routeEndId, viewMode) : null),
    [map, routeEndId, routeStartId, viewMode]
  );
  const routeStart = useMemo(() => map.nodes.find((node) => node.id === routeStartId) ?? null, [map.nodes, routeStartId]);
  const routeEnd = useMemo(() => map.nodes.find((node) => node.id === routeEndId) ?? null, [map.nodes, routeEndId]);
  const selectedNeighbors = useMemo(
    () => (selectedNode ? neighborsFor(map, selectedNode.id, viewMode) : []),
    [map, selectedNode, viewMode]
  );

  useEffect(() => {
    window.__TOWER_MAP__ = map;
  }, [map]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    return () => {
      if (zoomFrameRef.current !== null) cancelAnimationFrame(zoomFrameRef.current);
    };
  }, []);

  function regenerate(nextSeed = seedInput) {
    const trimmedSeed = nextSeed.trim() || DEFAULT_SEED;
    const nextMap = generateTowerMap(configForPresets(trimmedSeed, preset, density));
    setMap(nextMap);
    setSeedInput(trimmedSeed);
    setSelectedNodeId(null);
    setHoveredEdgeId(null);
    setRouteStartId(null);
    setRouteEndId(null);
    setStatus(`已生成 ${trimmedSeed}`);
  }

  function randomize() {
    const nextSeed = Math.floor(Math.random() * 4294967296).toString(10);
    regenerate(nextSeed);
  }

  function exportJson() {
    const blob = new Blob([serializeTowerMap(map)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `tower-map-${map.seed}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("JSON 已匯出");
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const importedMap = parseTowerMapJson(text);
      setMap(importedMap);
      setSeedInput(importedMap.seed);
      setPreset(importedMap.config.preset);
      setDensity(importedMap.config.density);
      setSelectedNodeId(null);
      setHoveredEdgeId(null);
      setRouteStartId(null);
      setRouteEndId(null);
      setStatus(`已匯入 ${importedMap.seed}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "匯入失敗");
    }
  }

  const setLayer = (key: keyof MapLayers, checked: boolean) => {
    setLayers((current) => ({ ...current, [key]: checked }));
  };

  const applyAnimatedZoomFrame = () => {
    const viewport = viewportRef.current;
    const current = zoomRef.current;
    const target = targetZoomRef.current;
    const diff = target - current;
    const next = Math.abs(diff) < 0.001 ? target : current + diff * ZOOM_EASING;
    const anchor = zoomAnchorRef.current;

    zoomRef.current = next;
    setZoom(next);

    if (viewport && anchor) {
      viewport.scrollLeft = anchor.mapX * next - anchor.localX;
      viewport.scrollTop = anchor.mapY * next - anchor.localY;
    }

    if (next === target) {
      zoomFrameRef.current = null;
      return;
    }

    zoomFrameRef.current = requestAnimationFrame(applyAnimatedZoomFrame);
  };

  const scheduleAnimatedZoom = () => {
    if (zoomFrameRef.current !== null) return;
    zoomFrameRef.current = requestAnimationFrame(applyAnimatedZoomFrame);
  };

  const handleViewportWheel = (event: WheelEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    event.preventDefault();

    const rect = viewport.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const contentX = viewport.scrollLeft + localX;
    const contentY = viewport.scrollTop + localY;
    const current = zoomRef.current;
    const zoomFactor = Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY);

    zoomAnchorRef.current = {
      localX,
      localY,
      mapX: contentX / current,
      mapY: contentY / current
    };
    targetZoomRef.current = clampZoom(targetZoomRef.current * zoomFactor);
    scheduleAnimatedZoom();
  };

  const handleViewportPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 1) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    event.preventDefault();
    viewport.setPointerCapture(event.pointerId);
    panRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop
    };
    setIsPanning(true);
  };

  const handleViewportPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pan = panRef.current;
    const viewport = viewportRef.current;
    if (!pan || !viewport || pan.pointerId !== event.pointerId) return;
    event.preventDefault();
    viewport.scrollLeft = pan.scrollLeft - (event.clientX - pan.x);
    viewport.scrollTop = pan.scrollTop - (event.clientY - pan.y);
  };

  const stopViewportPan = (event: PointerEvent<HTMLDivElement>) => {
    const pan = panRef.current;
    const viewport = viewportRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    if (viewport?.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    panRef.current = null;
    setIsPanning(false);
  };

  return (
    <div className="app-shell">
      <aside className="left-rail">
        <header className="brand-panel">
          <div className="brand-mark">
            <MapPinned size={22} />
            <div>
              <strong>Tower</strong>
              <span>Map Sandbox</span>
            </div>
          </div>
          <small>{status}</small>
        </header>

        <section className="control-section">
          <h2>
            <LocateFixed size={16} />
            生成
          </h2>
          <label className="field-label">
            <span>Seed</span>
            <input value={seedInput} onChange={(event) => setSeedInput(event.target.value)} />
          </label>
          <div className="select-grid">
            <label className="field-label">
              <span>尺寸</span>
              <select value={preset} onChange={(event) => setPreset(event.target.value as GenerationPreset)}>
                {Object.entries(presetLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              <span>密度</span>
              <select value={density} onChange={(event) => setDensity(event.target.value as DensityPreset)}>
                {Object.entries(densityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="button-row">
            <button type="button" className="icon-button primary" onClick={() => regenerate()} title="重新生成">
              <RefreshCw size={16} />
              生成
            </button>
            <button type="button" className="icon-button" onClick={randomize} title="隨機 seed">
              <Shuffle size={16} />
              隨機
            </button>
          </div>
          <div className="button-row">
            <button type="button" className="icon-button" onClick={exportJson} data-testid="export-json" title="匯出 JSON">
              <Download size={16} />
              匯出
            </button>
            <button type="button" className="icon-button" onClick={() => importInputRef.current?.click()} title="匯入 JSON">
              <FileInput size={16} />
              匯入
            </button>
            <input ref={importInputRef} className="hidden-input" type="file" accept="application/json,.json" onChange={importJson} />
          </div>
        </section>

        <section className="control-section">
          <h2>
            <Eye size={16} />
            視角
          </h2>
          <div className="segmented">
            {(Object.keys(viewModeLabels) as ViewMode[]).map((mode) => (
              <button key={mode} type="button" className={viewMode === mode ? "is-active" : ""} onClick={() => setViewMode(mode)}>
                {viewModeLabels[mode]}
              </button>
            ))}
          </div>
        </section>

        <section className="control-section">
          <h2>
            <Layers size={16} />
            圖層
          </h2>
          <LayerToggle label="地形" checked={layers.terrain} onChange={(checked) => setLayer("terrain", checked)} />
          <LayerToggle label="勢力" checked={layers.factionZones} onChange={(checked) => setLayer("factionZones", checked)} />
          <LayerToggle label="大道" checked={layers.roads} onChange={(checked) => setLayer("roads", checked)} />
          <LayerToggle label="小徑" checked={layers.trails} onChange={(checked) => setLayer("trails", checked)} />
          <LayerToggle label="密道" checked={layers.secrets} onChange={(checked) => setLayer("secrets", checked)} />
          <LayerToggle label="加成" checked={layers.bonuses} onChange={(checked) => setLayer("bonuses", checked)} />
          <LayerToggle label="駐軍" checked={layers.garrison} onChange={(checked) => setLayer("garrison", checked)} />
        </section>
      </aside>

      <main className="map-stage">
        <div
          ref={viewportRef}
          className={`map-viewport${isPanning ? " is-panning" : ""}`}
          data-testid="map-viewport"
          onWheel={handleViewportWheel}
          onPointerDown={handleViewportPointerDown}
          onPointerMove={handleViewportPointerMove}
          onPointerUp={stopViewportPan}
          onPointerCancel={stopViewportPan}
          onAuxClick={(event) => event.preventDefault()}
        >
          <MapCanvas
            map={map}
            layers={layers}
            viewMode={viewMode}
            zoom={zoom}
            selectedNodeId={selectedNodeId}
            route={route}
            hoveredEdgeId={hoveredEdgeId}
            onSelectNode={setSelectedNodeId}
            onHoverEdge={setHoveredEdgeId}
          />
        </div>
        <div className="status-strip">
          <span>Seed {map.seed}</span>
          <span>節點 {map.nodes.length}</span>
          <span>邊 {map.edges.length}</span>
          <span>大道 {map.counts.roads}</span>
          <span>小徑 {map.counts.trails}</span>
          <span>密道 {map.counts.secrets}</span>
          <span>{Math.round(zoom * 100)}%</span>
          <span>{selectedNode ? selectedNode.name : "未選取"}</span>
        </div>
      </main>

      <aside className="right-rail">
        <section className="inspector-section">
          <h2>
            <Flag size={16} />
            據點
          </h2>
          {selectedNode ? (
            <div className="node-detail">
              <header>
                <strong>{selectedNode.name}</strong>
                <span>{NODE_TYPE_LABELS[selectedNode.nodeType]}</span>
              </header>
              <dl className="detail-grid">
                <div>
                  <dt>陣營</dt>
                  <dd>{OWNER_LABELS[selectedNode.owner]}</dd>
                </div>
                <div>
                  <dt>地形</dt>
                  <dd>{TERRAIN_LABELS[selectedNode.terrainType]}</dd>
                </div>
                <div>
                  <dt>駐軍</dt>
                  <dd>{selectedNode.garrisonSummary.strength}</dd>
                </div>
                <div>
                  <dt>工事</dt>
                  <dd>{selectedNode.fortification.toFixed(2)}</dd>
                </div>
              </dl>
              <div className="button-row">
                <button type="button" className="icon-button" onClick={() => setRouteStartId(selectedNode.id)} title="設為起點">
                  <Route size={16} />
                  起點
                </button>
                <button type="button" className="icon-button" onClick={() => setRouteEndId(selectedNode.id)} title="設為終點">
                  <MapPinned size={16} />
                  終點
                </button>
              </div>
              <div className="chip-list">
                {selectedNode.bonuses.map((bonus, index) => (
                  <span key={`${bonus.type}-${bonus.source}-${index}`} title={bonus.description}>
                    {BONUS_LABELS[bonus.type]} {bonus.magnitude > 0 ? "+" : ""}
                    {bonus.magnitude}
                  </span>
                ))}
              </div>
              <div className="neighbor-list">
                {selectedNeighbors.map(({ node, edge }) => (
                  <button key={`${edge.id}-${node.id}`} type="button" onClick={() => setSelectedNodeId(node.id)}>
                    <span>{node.name}</span>
                    <small>
                      {PATH_LABELS[edge.pathType]} · {shortCost(edge.travelCost)}
                    </small>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">--</div>
          )}
        </section>

        <section className="inspector-section">
          <h2>
            <Route size={16} />
            路線
          </h2>
          <dl className="detail-grid">
            <div>
              <dt>起點</dt>
              <dd>{routeStart?.name ?? "-"}</dd>
            </div>
            <div>
              <dt>終點</dt>
              <dd>{routeEnd?.name ?? "-"}</dd>
            </div>
            <div>
              <dt>成本</dt>
              <dd>{route ? shortCost(route.totalCost) : "-"}</dd>
            </div>
            <div>
              <dt>視角</dt>
              <dd>{viewModeLabels[viewMode]}</dd>
            </div>
          </dl>
          {route && (
            <div className="route-chain">
              {route.nodeIds.map((nodeId) => (
                <span key={nodeId}>{map.nodes.find((node) => node.id === nodeId)?.name ?? nodeId}</span>
              ))}
            </div>
          )}
        </section>

        <section className="inspector-section">
          <h2>
            <Swords size={16} />
            路徑
          </h2>
          {hoveredEdge ? (
            <dl className="detail-grid">
              <div>
                <dt>類型</dt>
                <dd>{PATH_LABELS[hoveredEdge.pathType]}</dd>
              </div>
              <div>
                <dt>地形</dt>
                <dd>{TERRAIN_LABELS[hoveredEdge.dominantTerrain]}</dd>
              </div>
              <div>
                <dt>長度</dt>
                <dd>{hoveredEdge.length.toFixed(1)}</dd>
              </div>
              <div>
                <dt>成本</dt>
                <dd>{hoveredEdge.travelCost.toFixed(1)}</dd>
              </div>
            </dl>
          ) : (
            <div className="empty-state">--</div>
          )}
        </section>

        <section className="inspector-section">
          <h2>
            <Shield size={16} />
            盤面
          </h2>
          <dl className="detail-grid">
            <div>
              <dt>人類</dt>
              <dd>{map.counts.humanNodes}</dd>
            </div>
            <div>
              <dt>魔物</dt>
              <dd>{map.counts.monsterNodes}</dd>
            </div>
            <div>
              <dt>中立</dt>
              <dd>{map.counts.neutralNodes}</dd>
            </div>
            <div>
              <dt>尺寸</dt>
              <dd>
                {map.config.width}x{map.config.height}
              </dd>
            </div>
          </dl>
        </section>
      </aside>
    </div>
  );
}
