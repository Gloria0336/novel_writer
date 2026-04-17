import type { PointerEvent, ReactNode } from "react";

interface AppShellProps {
  sidebarOpen: boolean;
  sidebarWidth: number;
  dockHeight: number;
  onSidebarResizeStart: (event: PointerEvent<HTMLDivElement>) => void;
  onDockResizeStart: (event: PointerEvent<HTMLDivElement>) => void;
  topBar: ReactNode;
  sidebar: ReactNode;
  editor: ReactNode;
  dock: ReactNode;
}

export function AppShell(props: AppShellProps) {
  const { sidebarOpen, sidebarWidth, dockHeight, onSidebarResizeStart, onDockResizeStart, topBar, sidebar, editor, dock } = props;

  return (
    <div className="app-shell">
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
          <div className="splitter splitter-horizontal" onPointerDown={onDockResizeStart} />
          <section className="dock-panel" style={{ height: `${dockHeight}px` }}>
            {dock}
          </section>
        </main>
      </div>
    </div>
  );
}
