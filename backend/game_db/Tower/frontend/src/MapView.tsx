import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import { Download, Eye, FileInput, Flag, Layers, LocateFixed, MapPinned, RefreshCw, Shield, Shuffle, Swords } from "lucide-react";

import { MapCanvas } from "./components/MapCanvas";
import {
  BONUS_LABELS,
  DEFAULT_SEED,
  FEATURE_LABELS,
  OWNER_LABELS,
  STRUCTURE_TYPE_LABELS,
  TERRAIN_LABELS
} from "./map/constants";
import { configForPresets, generateTowerMap } from "./map/generator";
import { coordKey, findTileRoute, reachableTiles } from "./map/routing";
import { parseTowerMapJson, serializeTowerMap } from "./map/serialization";
import type { ArmyMove, DensityPreset, DeployIntent, GenerationPreset, HexCoord, MapLayers, TowerMap, ViewMode } from "./types";

const INTENT_OPTIONS: { value: DeployIntent; label: string }[] = [
  { value: "attack", label: "進攻 Attack" },
  { value: "reinforce", label: "增援 Reinforce" },
  { value: "defend", label: "防守 Defend" },
  { value: "hold", label: "駐守 Hold" }
];

const DEFAULT_LAYERS: MapLayers = {
  terrain: true,
  control: true,
  roads: true,
  bridges: true,
  secretPaths: true,
  features: true,
  structures: true,
  armies: true,
  movement: true,
  plannedPath: true,
  garrison: false
};

const MIN_ZOOM = 0.55;
const MAX_ZOOM = 3;
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

export function MapView() {
  const [seedInput, setSeedInput] = useState(DEFAULT_SEED);
  const [preset, setPreset] = useState<GenerationPreset>("standard");
  const [density, setDensity] = useState<DensityPreset>("standard");
  const [map, setMap] = useState<TowerMap>(makeInitialMap);
  const [layers, setLayers] = useState<MapLayers>(DEFAULT_LAYERS);
  const [viewMode, setViewMode] = useState<ViewMode>("omniscient");
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [selectedArmyId, setSelectedArmyId] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<HexCoord | null>(null);
  const [selectedIntent, setSelectedIntent] = useState<DeployIntent>("attack");
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [status, setStatus] = useState("地圖已生成");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef(1);
  const targetZoomRef = useRef(1);
  const zoomFrameRef = useRef<number | null>(null);
  const zoomAnchorRef = useRef<{ localX: number; localY: number; mapX: number; mapY: number } | null>(null);
  const panRef = useRef<{ pointerId: number; x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);

  const selectedStructure = useMemo(
    () => map.structures.find((structure) => structure.id === selectedStructureId) ?? null,
    [map.structures, selectedStructureId]
  );
  const selectedArmy = useMemo(() => map.armies.find((army) => army.id === selectedArmyId) ?? null, [map.armies, selectedArmyId]);
  const reachableMap = useMemo(() => (selectedArmy ? reachableTiles(map, selectedArmy) : new Map<string, number>()), [map, selectedArmy]);
  const plannedPath = useMemo(() => {
    if (!selectedArmy || !selectedDestination || !reachableMap.has(coordKey(selectedDestination))) return [];
    return findTileRoute(map, selectedArmy.position, selectedDestination) ?? [];
  }, [map, reachableMap, selectedArmy, selectedDestination]);
  const selectedTile = useMemo(() => {
    const coord = selectedDestination ?? selectedStructure?.footprint[0] ?? selectedArmy?.position;
    if (!coord) return null;
    return map.tileMap.tiles.find((tile) => tile.coord.q === coord.q && tile.coord.r === coord.r) ?? null;
  }, [map.tileMap.tiles, selectedArmy, selectedDestination, selectedStructure]);
  const plannedMove = useMemo<ArmyMove | null>(() => {
    if (!selectedArmy || plannedPath.length < 2) return null;
    return { armyId: selectedArmy.id, path: plannedPath, intent: selectedIntent, eliteIds: [] };
  }, [plannedPath, selectedArmy, selectedIntent]);

  useEffect(() => {
    (window as unknown as { __TOWER_MAP__?: TowerMap }).__TOWER_MAP__ = map;
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
    setSelectedStructureId(null);
    setSelectedArmyId(null);
    setSelectedDestination(null);
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
    anchor.download = `tower-hex-map-${map.seed}.json`;
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
      setSelectedStructureId(null);
      setSelectedArmyId(null);
      setSelectedDestination(null);
      setStatus(`已匯入 ${importedMap.seed}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "匯入失敗");
    }
  }

  const setLayer = (key: keyof MapLayers, checked: boolean) => {
    setLayers((current) => ({ ...current, [key]: checked }));
  };

  const selectStructure = (structureId: string | null) => {
    setSelectedStructureId(structureId);
    setSelectedArmyId(null);
    setSelectedDestination(null);
  };

  const selectArmy = (armyId: string | null) => {
    setSelectedArmyId(armyId);
    setSelectedStructureId(null);
    setSelectedDestination(null);
  };

  const selectDestination = (coord: HexCoord | null) => {
    if (!coord || !selectedArmy || !reachableMap.has(coordKey(coord))) {
      setSelectedDestination(null);
      return;
    }
    setSelectedDestination(coord);
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
    zoomAnchorRef.current = { localX, localY, mapX: contentX / current, mapY: contentY / current };
    targetZoomRef.current = clampZoom(targetZoomRef.current * Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY));
    scheduleAnimatedZoom();
  };

  const handleViewportPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 1) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    event.preventDefault();
    viewport.setPointerCapture(event.pointerId);
    panRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, scrollLeft: viewport.scrollLeft, scrollTop: viewport.scrollTop };
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
              <span>Hex Map</span>
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
          <LayerToggle label="控制" checked={layers.control} onChange={(checked) => setLayer("control", checked)} />
          <LayerToggle label="道路" checked={layers.roads} onChange={(checked) => setLayer("roads", checked)} />
          <LayerToggle label="橋" checked={layers.bridges} onChange={(checked) => setLayer("bridges", checked)} />
          <LayerToggle label="密道" checked={layers.secretPaths} onChange={(checked) => setLayer("secretPaths", checked)} />
          <LayerToggle label="地物" checked={layers.features} onChange={(checked) => setLayer("features", checked)} />
          <LayerToggle label="結構" checked={layers.structures} onChange={(checked) => setLayer("structures", checked)} />
          <LayerToggle label="軍隊" checked={layers.armies} onChange={(checked) => setLayer("armies", checked)} />
          <LayerToggle label="可達" checked={layers.movement} onChange={(checked) => setLayer("movement", checked)} />
          <LayerToggle label="路徑" checked={layers.plannedPath} onChange={(checked) => setLayer("plannedPath", checked)} />
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
            selectedStructureId={selectedStructureId}
            selectedArmyId={selectedArmyId}
            reachableTileKeys={new Set(reachableMap.keys())}
            plannedPath={plannedPath}
            onSelectStructure={selectStructure}
            onSelectArmy={selectArmy}
            onSelectDestination={selectDestination}
          />
        </div>
        <div className="status-strip">
          <span>Seed {map.seed}</span>
          <span>地塊 {map.counts.tiles}</span>
          <span>結構 {map.counts.structures}</span>
          <span>軍隊 {map.counts.armies}</span>
          <span>道路 {map.counts.roads}</span>
          <span>橋 {map.counts.bridges}</span>
          <span>密道 {map.counts.secrets}</span>
          <span>{Math.round(zoom * 100)}%</span>
          <span>{selectedArmy ? selectedArmy.id : selectedStructure ? selectedStructure.name : "未選取"}</span>
        </div>
      </main>

      <aside className="right-rail">
        <section className="inspector-section">
          <h2>
            <Flag size={16} />
            結構
          </h2>
          {selectedStructure ? (
            <div className="node-detail">
              <header>
                <strong>{selectedStructure.name}</strong>
                <span>{STRUCTURE_TYPE_LABELS[selectedStructure.structureType]}</span>
              </header>
              <dl className="detail-grid">
                <div>
                  <dt>陣營</dt>
                  <dd>{selectedStructure.owner ? OWNER_LABELS[selectedStructure.owner] : "-"}</dd>
                </div>
                <div>
                  <dt>座標</dt>
                  <dd>
                    {selectedStructure.footprint[0].q},{selectedStructure.footprint[0].r}
                  </dd>
                </div>
                <div>
                  <dt>地形</dt>
                  <dd>{selectedTile ? TERRAIN_LABELS[selectedTile.terrainType] : "-"}</dd>
                </div>
                <div>
                  <dt>工事</dt>
                  <dd>{selectedStructure.fortification.toFixed(2)}</dd>
                </div>
                <div>
                  <dt>駐軍</dt>
                  <dd>{selectedStructure.garrisonSummary.strength}</dd>
                </div>
                <div>
                  <dt>控制</dt>
                  <dd>{selectedStructure.controlRadius}</dd>
                </div>
              </dl>
              <div className="chip-list">
                {selectedStructure.bonuses.map((bonus, index) => (
                  <span key={`${bonus.type}-${bonus.source}-${index}`} title={bonus.description}>
                    {BONUS_LABELS[bonus.type]} {bonus.magnitude > 0 ? "+" : ""}
                    {bonus.magnitude}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">--</div>
          )}
        </section>

        <section className="inspector-section">
          <h2>
            <Swords size={16} />
            Army
          </h2>
          {selectedArmy ? (
            <div className="node-detail">
              <header>
                <strong>{selectedArmy.id}</strong>
                <span>{OWNER_LABELS[selectedArmy.owner]}</span>
              </header>
              <dl className="detail-grid">
                <div>
                  <dt>Position</dt>
                  <dd>
                    {selectedArmy.position.q},{selectedArmy.position.r}
                  </dd>
                </div>
                <div>
                  <dt>Move</dt>
                  <dd>{selectedArmy.movementPoints.toFixed(1)}</dd>
                </div>
                <div>
                  <dt>Strength</dt>
                  <dd>{selectedArmy.strength}</dd>
                </div>
                <div>
                  <dt>Reach</dt>
                  <dd>{reachableMap.size}</dd>
                </div>
              </dl>
              <div className="chip-list">
                {selectedArmy.units.map((unit) => (
                  <span key={unit.templateId}>
                    {unit.templateId} x{unit.count}
                  </span>
                ))}
              </div>
              <label className="intent-select">
                <span>意圖 Intent</span>
                <select
                  value={selectedIntent}
                  onChange={(event) => setSelectedIntent(event.target.value as DeployIntent)}
                  aria-label="army-intent"
                >
                  {INTENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {plannedPath.length ? (
                <div className="route-chain">
                  {plannedPath.map((coord) => (
                    <span key={`${coord.q},${coord.r}`}>
                      {coord.q},{coord.r}
                    </span>
                  ))}
                </div>
              ) : null}
              {plannedMove ? (
                <button
                  type="button"
                  className="intent-submit"
                  onClick={() =>
                    setStatus(
                      `已下達 ${plannedMove.armyId} ${selectedIntent} → ${plannedMove.path[plannedMove.path.length - 1].q},${plannedMove.path[plannedMove.path.length - 1].r}`
                    )
                  }
                >
                  下達命令 ({selectedIntent})
                </button>
              ) : null}
            </div>
          ) : (
            <div className="empty-state">--</div>
          )}
        </section>

        <section className="inspector-section">
          <h2>
            <MapPinned size={16} />
            地塊
          </h2>
          {selectedTile ? (
            <dl className="detail-grid">
              <div>
                <dt>通行</dt>
                <dd>{selectedTile.passable ? "可" : "否"}</dd>
              </div>
              <div>
                <dt>成本</dt>
                <dd>{selectedTile.movementCost.toFixed(2)}</dd>
              </div>
              <div>
                <dt>高度</dt>
                <dd>{selectedTile.elevation}</dd>
              </div>
              <div>
                <dt>地物</dt>
                <dd>{selectedTile.features.map((feature) => FEATURE_LABELS[feature]).join("、") || "-"}</dd>
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
              <dd>{map.counts.humanStructures}</dd>
            </div>
            <div>
              <dt>魔物</dt>
              <dd>{map.counts.monsterStructures}</dd>
            </div>
            <div>
              <dt>中立地物</dt>
              <dd>{map.counts.neutralFeatures}</dd>
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
