import type { PointerEvent, ReactNode } from "react";

interface AppShellProps {
  sidebarOpen: boolean;
  sidebarWidth: number;
  dockOpen: boolean;
  dockHeight: number;
  onSidebarResizeStart: (event: PointerEvent<HTMLDivElement>) => void;
  onDockResizeStart: (event: PointerEvent<HTMLDivElement>) => void;
  topBar: ReactNode;
  sidebar: ReactNode;
  editor: ReactNode;
  dock: ReactNode;
}

export function AppShell(props: AppShellProps) {
  const { sidebarOpen, sidebarWidth, dockOpen, dockHeight, onSidebarResizeStart, onDockResizeStart, topBar, sidebar, editor, dock } =
    props;

  return (
    <div className="workspace-layout">
      {topBar}
      <div className="shell-body">
        <aside
          className={`sidebar-panel ${sidebarOpen ? "is-open" : ""}`}
          style={{ width: sidebarOpen ? `${sidebarWidth}px` : undefined }}
        >
          {sidebar}
        </aside>
        {sidebarOpen ? <div className="splitter splitter-vertical" onPointerDown={onSidebarResizeStart} /> : null}
        <main className="content-panel">
          <section className="editor-panel">{editor}</section>
          {dockOpen ? <div className="splitter splitter-horizontal" onPointerDown={onDockResizeStart} /> : null}
          {dockOpen ? (
            <section className="dock-panel" style={{ height: `${dockHeight}px` }}>
              {dock}
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
