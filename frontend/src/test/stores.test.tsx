import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DraftStoreProvider, useDraftStore } from "../stores/DraftStore";
import { WorkspaceStoreProvider, useWorkspaceStore } from "../stores/WorkspaceStore";
import { createWorkspaceConfig, DEFAULT_WORKSPACE_TEMPLATE } from "../utils/constants";

function DraftHarness() {
  const { drafts, upsertLoadedFile, updateDraftContent } = useDraftStore();
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
      <button onClick={() => updateDraftContent("backend/novel_db/novel_00/chapters/ch001.md", "Edited")} type="button">
        edit
      </button>
      <output>{drafts["backend/novel_db/novel_00/chapters/ch001.md"]?.draftContent ?? ""}</output>
    </div>
  );
}

function WorkspaceHarness() {
  const { state, addWorkspace, addMessage, setActiveWorkspaceId } = useWorkspaceStore();
  return (
    <div>
      <button
        onClick={() => addWorkspace(createWorkspaceConfig(DEFAULT_WORKSPACE_TEMPLATE, "Checker"))}
        type="button"
      >
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

describe("persistent stores", () => {
  it("persists draft content to localStorage", () => {
    const { unmount } = render(
      <DraftStoreProvider>
        <DraftHarness />
      </DraftStoreProvider>,
    );

    fireEvent.click(screen.getByText("load"));
    fireEvent.click(screen.getByText("edit"));
    expect(screen.getByText("Edited")).toBeInTheDocument();

    unmount();

    render(
      <DraftStoreProvider>
        <DraftHarness />
      </DraftStoreProvider>,
    );

    expect(screen.getByText("Edited")).toBeInTheDocument();
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
});

