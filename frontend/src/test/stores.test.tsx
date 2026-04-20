import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DraftStoreProvider, useDraftStore } from "../stores/DraftStore";
import { SettingsStoreProvider, useSettingsStore } from "../stores/SettingsStore";
import { WorkspaceStoreProvider, useWorkspaceStore } from "../stores/WorkspaceStore";
import { createWorkspaceConfig, DEFAULT_WORKSPACE_TEMPLATE } from "../utils/constants";

function DraftHarness() {
  const { drafts, upsertLoadedFile, applySuggestedDraft } = useDraftStore();
  return (
    <div>
      <button
        onClick={() =>
          upsertLoadedFile({
            path: "backend/novel_db/novel_00/chapters/ch001.md",
            sha: "sha-1",
            content: "Original",
            isEditable: true,
          })
        }
        type="button"
      >
        load
      </button>
      <button
        onClick={() =>
          applySuggestedDraft(
            {
              path: "backend/novel_db/novel_00/chapters/ch001.md",
              sha: "sha-1",
              content: "Original",
              isEditable: true,
            },
            "Edited by AI",
          )
        }
        type="button"
      >
        apply
      </button>
      <output>{drafts["backend/novel_db/novel_00/chapters/ch001.md"]?.draftContent ?? ""}</output>
    </div>
  );
}

function WorkspaceHarness() {
  const { state, addWorkspace, addMessage, setActiveWorkspaceId } = useWorkspaceStore();
  return (
    <div>
      <button onClick={() => addWorkspace(createWorkspaceConfig(DEFAULT_WORKSPACE_TEMPLATE, "Checker"))} type="button">
        add
      </button>
      <button
        onClick={() =>
          addMessage(state.activeWorkspaceId, {
            id: "message",
            role: "assistant",
            content: "Scoped reply",
            createdAt: Date.now(),
            sourceFilePaths: [],
            proposedContent: "Edited draft",
            targetPath: "backend/novel_db/novel_00/chapters/ch001.md",
          })
        }
        type="button"
      >
        push
      </button>
      <button onClick={() => setActiveWorkspaceId(state.workspaces.at(-1)!.id)} type="button">
        switch
      </button>
      <output data-testid="active-name">{state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId)?.name}</output>
      <output data-testid="message-count">{(state.messages[state.activeWorkspaceId] ?? []).length}</output>
      <output data-testid="first-count">{(state.messages[state.workspaces[0].id] ?? []).length}</output>
    </div>
  );
}

function SettingsHarness() {
  const { settings, updateUiPrefs } = useSettingsStore();
  return (
    <div>
      <button onClick={() => updateUiPrefs({ activeView: settings.uiPrefs.activeView === "ai" ? "files" : "ai" })} type="button">
        toggle
      </button>
      <output data-testid="active-view">{settings.uiPrefs.activeView}</output>
    </div>
  );
}

describe("persistent stores", () => {
  it("persists AI-applied draft content to localStorage", () => {
    const { unmount } = render(
      <DraftStoreProvider>
        <DraftHarness />
      </DraftStoreProvider>,
    );

    fireEvent.click(screen.getByText("load"));
    fireEvent.click(screen.getByText("apply"));
    expect(screen.getByText("Edited by AI")).toBeInTheDocument();

    unmount();

    render(
      <DraftStoreProvider>
        <DraftHarness />
      </DraftStoreProvider>,
    );

    expect(screen.getByText("Edited by AI")).toBeInTheDocument();
  });

  it("keeps workspace messages isolated per workspace", () => {
    render(
      <WorkspaceStoreProvider>
        <WorkspaceHarness />
      </WorkspaceStoreProvider>,
    );

    fireEvent.click(screen.getByText("push"));
    expect(screen.getByTestId("message-count")).toHaveTextContent("1");
    expect(screen.getByTestId("first-count")).toHaveTextContent("1");

    fireEvent.click(screen.getByText("add"));
    fireEvent.click(screen.getByText("switch"));
    expect(screen.getByTestId("active-name")).toHaveTextContent("Checker");
    expect(screen.getByTestId("message-count")).toHaveTextContent("0");
    expect(screen.getByTestId("first-count")).toHaveTextContent("1");
  });

  it("persists the selected top-level view", () => {
    const { unmount } = render(
      <SettingsStoreProvider>
        <SettingsHarness />
      </SettingsStoreProvider>,
    );

    expect(screen.getByTestId("active-view")).toHaveTextContent("ai");
    fireEvent.click(screen.getByText("toggle"));
    expect(screen.getByTestId("active-view")).toHaveTextContent("files");

    unmount();

    render(
      <SettingsStoreProvider>
        <SettingsHarness />
      </SettingsStoreProvider>,
    );

    expect(screen.getByTestId("active-view")).toHaveTextContent("files");
  });
});
