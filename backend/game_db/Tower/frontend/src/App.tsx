import { useState } from "react";
import { GitBranch, MapPinned } from "lucide-react";

import { MapView } from "./MapView";
import { TechTreeView } from "./tech/TechTreeView";

type AppView = "map" | "tech";

const VIEW_TABS: { id: AppView; label: string; icon: typeof MapPinned }[] = [
  { id: "map", label: "地圖", icon: MapPinned },
  { id: "tech", label: "科技樹", icon: GitBranch }
];

export default function App() {
  const [view, setView] = useState<AppView>("map");

  return (
    <div className="root-shell">
      <nav className="view-switch">
        {VIEW_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={view === id ? "is-active" : ""} onClick={() => setView(id)}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>
      <div className="view-body">{view === "map" ? <MapView /> : <TechTreeView />}</div>
    </div>
  );
}
