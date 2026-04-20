import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorPane, type EditorHandle } from "./components/editor/EditorPane";
import { AppShell } from "./components/layout/AppShell";
import { SettingsModal } from "./components/layout/SettingsModal";
import { TopBar } from "./components/layout/TopBar";
import { CommitPanel } from "./components/repo/CommitPanel";
import { Sidebar } from "./components/repo/Sidebar";
import { AiWorkspaceView } from "./components/workspace/AiWorkspaceView";
import { useSplitter } from "./hooks/useSplitter";
import { BridgeClient, BridgeConflictError } from "./services/bridgeClient";
import { CommitStoreProvider, useCommitStore } from "./stores/CommitStore";
import { DraftStoreProvider, useDraftStore } from "./stores/DraftStore";
import { RepoStoreProvider, useRepoStore } from "./stores/RepoStore";
import { SettingsStoreProvider, useSettingsStore } from "./stores/SettingsStore";
import { WorkspaceStoreProvider, useWorkspaceStore } from "./stores/WorkspaceStore";
import type { BridgeStatus, DraftEntry, ModelInfo } from "./types/app";
import { createWorkspaceConfig } from "./utils/constants";
import { buildCommitTreeEntries } from "./utils/githubCommit";
import { flattenFilePaths, normalizeRepoTree } from "./utils/repoTree";
import { resolveWorkspaceContext } from "./utils/workspaceContext";

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function AppProviders() {
  return (
    <SettingsStoreProvider>
      <RepoStoreProvider>
        <DraftStoreProvider>
          <CommitStoreProvider>
            <WorkspaceStoreProvider>
              <ConsoleApp />
            </WorkspaceStoreProvider>
          </CommitStoreProvider>
        </DraftStoreProvider>
      </RepoStoreProvider>
    </SettingsStoreProvider>
  );
}

function ConsoleApp() {
  const { settings, resolvedRepoConfig, updateUiPrefs, setSettings, clearSecrets } = useSettingsStore();
  const { snapshot, updateEntries, setSelectedPath } = useRepoStore();
  const {
    drafts,
    setDrafts,
    upsertLoadedFile,
    updateDraftContent,
    applySuggestedDraft,
    resetDraftToHead,
    discardDraft,
    replaceOriginalFromHead,
  } = useDraftStore();
  const { commitDraft, setCommitMessage, toggleIncludedPath, includeAllDirty, syncIncludedPaths, resetCommitDraft } =
    useCommitStore();
  const { state: workspaceState, addWorkspace, updateWorkspace, removeWorkspace, setActiveWorkspaceId, addMessage, clearMessages } =
    useWorkspaceStore();

  const bridgeClient = useMemo(() => new BridgeClient(), []);
  const editorHandleRef = useRef<EditorHandle | null>(null);
  const selectedPathRef = useRef<string | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [repoStatus, setRepoStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);
  const [repoError, setRepoError] = useState("");
  const [fileStatus, setFileStatus] = useState<"idle" | "loading">("idle");
  const [fileError, setFileError] = useState("");
  const [commitStatus, setCommitStatus] = useState("");
  const [commitTone, setCommitTone] = useState<"success" | "error">("success");
  const [isSubmittingCommit, setIsSubmittingCommit] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState("");
  const [sendingWorkspaceId, setSendingWorkspaceId] = useState("");

  const dirtyDrafts = useMemo(
    () => Object.values(drafts).filter((draft) => draft.draftContent !== draft.originalContent),
    [drafts],
  );
  const selectedDraft = snapshot.selectedPath ? drafts[snapshot.selectedPath] : undefined;
  const treeNodes = useMemo(() => normalizeRepoTree(snapshot.entries), [snapshot.entries]);
  const filePaths = useMemo(() => flattenFilePaths(treeNodes), [treeNodes]);
  const activeWorkspace =
    workspaceState.workspaces.find((workspace) => workspace.id === workspaceState.activeWorkspaceId) ?? workspaceState.workspaces[0];
  const activeWorkspaceContext = useMemo(
    () =>
      resolveWorkspaceContext({
        entries: snapshot.entries,
        attachedPaths: activeWorkspace?.attachedPaths ?? [],
        selectedPath: snapshot.selectedPath,
        autoAttachActiveFile: activeWorkspace?.autoAttachActiveFile ?? true,
        autoAttachRelatedFiles: activeWorkspace?.autoAttachRelatedFiles ?? true,
      }),
    [activeWorkspace, snapshot.entries, snapshot.selectedPath],
  );

  const sidebarSplitter = useSplitter({
    direction: "horizontal",
    value: settings.uiPrefs.sidebarWidth,
    min: 180,
    max: 360,
    onChange: (nextValue) => updateUiPrefs({ sidebarWidth: nextValue }),
  });
  const dockSplitter = useSplitter({
    direction: "vertical",
    value: settings.uiPrefs.dockHeight,
    min: 220,
    max: 460,
    onChange: (nextValue) => updateUiPrefs({ dockHeight: nextValue }),
  });

  useEffect(() => {
    syncIncludedPaths(dirtyDrafts.map((draft) => draft.path));
  }, [dirtyDrafts, syncIncludedPaths]);

  useEffect(() => {
    selectedPathRef.current = snapshot.selectedPath;
  }, [snapshot.selectedPath]);

  useEffect(() => {
    if (commitDraft.branch !== resolvedRepoConfig.branch) {
      resetCommitDraft(resolvedRepoConfig.branch);
    }
  }, [commitDraft.branch, resetCommitDraft, resolvedRepoConfig.branch]);

  const loadBridgeStatus = useCallback(async () => {
    try {
      const status = await bridgeClient.getStatus();
      setBridgeStatus(status);
      return status;
    } catch (error) {
      setBridgeStatus(null);
      throw error;
    }
  }, [bridgeClient]);

  const loadRepoTree = useCallback(async () => {
    setRepoStatus("loading");
    setRepoError("");

    try {
      const status = await loadBridgeStatus();
      setBridgeStatus(status);
      const result = await bridgeClient.getRepoTree(resolvedRepoConfig);
      updateEntries(result.entries, result.headSha, result.baseTreeSha, result.truncated);

      const selectedStillExists =
        selectedPathRef.current && result.entries.some((entry) => entry.path === selectedPathRef.current);
      if (!selectedStillExists) {
        const firstFile = result.entries.find((entry) => entry.type === "blob");
        setSelectedPath(firstFile?.path);
      }

      setRepoStatus("ready");
    } catch (error) {
      setRepoStatus("error");
      setRepoError(error instanceof Error ? error.message : "Failed to load repository tree.");
    }
  }, [bridgeClient, loadBridgeStatus, resolvedRepoConfig, setSelectedPath, updateEntries]);

  const loadFile = useCallback(
    async (path: string, replaceFromHead = false) => {
      const entry = snapshot.entries.find((item) => item.path === path && item.type === "blob");
      if (!entry) {
        return;
      }

      setFileStatus("loading");
      setFileError("");

      try {
        const file = await bridgeClient.getFileContent(resolvedRepoConfig, path, entry.sha);
        if (replaceFromHead) {
          replaceOriginalFromHead(file);
        } else {
          upsertLoadedFile(file);
        }
      } catch (error) {
        setFileError(error instanceof Error ? error.message : "Failed to load file content.");
      } finally {
        setFileStatus("idle");
      }
    },
    [bridgeClient, replaceOriginalFromHead, resolvedRepoConfig, snapshot.entries, upsertLoadedFile],
  );

  useEffect(() => {
    void loadRepoTree();
  }, [loadRepoTree, resolvedRepoConfig.branch, resolvedRepoConfig.owner, resolvedRepoConfig.repo]);

  useEffect(() => {
    if (!snapshot.selectedPath || drafts[snapshot.selectedPath]) {
      return;
    }
    void loadFile(snapshot.selectedPath);
  }, [drafts, loadFile, snapshot.selectedPath]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setModelLoading(true);
      setModelError("");
      try {
        const status = bridgeStatus ?? (await loadBridgeStatus());
        if (!status.hasOpenRouterApiKey) {
          if (!cancelled) {
            setModels([]);
            setModelError("The bridge is missing NOVEL_WRITER_OPENROUTER_API_KEY.");
          }
          return;
        }
        const nextModels = await bridgeClient.getModels();
        if (!cancelled) {
          setModels(nextModels);
        }
      } catch (error) {
        if (!cancelled) {
          setModels([]);
          setModelError(error instanceof Error ? error.message : "Failed to load bridge models.");
        }
      } finally {
        if (!cancelled) {
          setModelLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [bridgeClient, bridgeStatus, loadBridgeStatus, resolvedRepoConfig]);

  const ensureDraftLoaded = useCallback(
    async (path: string): Promise<DraftEntry | null> => {
      const existing = drafts[path];
      if (existing) {
        return existing;
      }

      const entry = snapshot.entries.find((item) => item.path === path && item.type === "blob");
      if (!entry) {
        return null;
      }

      const loaded = await bridgeClient.getFileContent(resolvedRepoConfig, path, entry.sha);
      upsertLoadedFile(loaded);
      return {
        path: loaded.path,
        originalSha: loaded.sha,
        originalContent: loaded.content,
        draftContent: loaded.content,
        isEditable: loaded.isEditable,
        updatedAt: Date.now(),
        readOnlyReason: loaded.readOnlyReason,
      };
    },
    [bridgeClient, drafts, resolvedRepoConfig, snapshot.entries, upsertLoadedFile],
  );

  const handleCommit = useCallback(async () => {
    setCommitStatus("");
    setIsSubmittingCommit(true);

    try {
      const files = buildCommitTreeEntries(dirtyDrafts, commitDraft.includedPaths).map((entry) => ({
        path: entry.path,
        content: entry.content,
      }));

      await bridgeClient.createCommit({
        repoRef: resolvedRepoConfig,
        headSha: snapshot.headSha,
        baseTreeSha: snapshot.baseTreeSha,
        message: commitDraft.message,
        files,
      });

      const refreshed = await bridgeClient.getRepoTree(resolvedRepoConfig);
      updateEntries(refreshed.entries, refreshed.headSha, refreshed.baseTreeSha, refreshed.truncated);

      setDrafts((previous) => {
        const next = { ...previous };
        for (const path of commitDraft.includedPaths) {
          const existing = next[path];
          if (!existing) {
            continue;
          }

          const updatedEntry = refreshed.entries.find((item) => item.path === path && item.type === "blob");
          next[path] = {
            ...existing,
            originalSha: updatedEntry?.sha ?? existing.originalSha,
            originalContent: existing.draftContent,
            updatedAt: Date.now(),
          };
        }
        return next;
      });

      resetCommitDraft(resolvedRepoConfig.branch);
      setCommitTone("success");
      setCommitStatus("Commit completed successfully.");
    } catch (error) {
      setCommitTone("error");
      if (error instanceof BridgeConflictError) {
        setCommitStatus(error.message);
      } else {
        setCommitStatus(error instanceof Error ? error.message : "Commit failed.");
      }
    } finally {
      setIsSubmittingCommit(false);
    }
  }, [
    bridgeClient,
    commitDraft.includedPaths,
    commitDraft.message,
    dirtyDrafts,
    resetCommitDraft,
    resolvedRepoConfig,
    setDrafts,
    snapshot.baseTreeSha,
    snapshot.headSha,
    updateEntries,
  ]);

  const handleSendPrompt = useCallback(
    async (workspaceId: string, prompt: string) => {
      const workspace = workspaceState.workspaces.find((item) => item.id === workspaceId);
      if (!workspace) {
        return;
      }

      if (!snapshot.selectedPath) {
        throw new Error("Select the file you want the AI to revise first.");
      }

      setSendingWorkspaceId(workspaceId);
      try {
        const contextResolution = resolveWorkspaceContext({
          entries: snapshot.entries,
          attachedPaths: workspace.attachedPaths,
          selectedPath: snapshot.selectedPath,
          autoAttachActiveFile: workspace.autoAttachActiveFile,
          autoAttachRelatedFiles: workspace.autoAttachRelatedFiles,
        });
        const allPaths = [...new Set([snapshot.selectedPath, ...contextResolution.requestedPaths, ...contextResolution.autoContextPaths])];
        const attachedDrafts = (await Promise.all(allPaths.map((path) => ensureDraftLoaded(path)))).filter(Boolean) as DraftEntry[];
        const history = workspaceState.messages[workspaceId] ?? [];
        const sourceFilePaths = attachedDrafts.map((draft) => draft.path);

        addMessage(workspaceId, {
          id: createId(),
          role: "user",
          content: prompt,
          createdAt: Date.now(),
          sourceFilePaths,
          targetPath: snapshot.selectedPath,
        });

        const response = await bridgeClient.sendChat({
          repoRef: resolvedRepoConfig,
          workspace,
          history,
          prompt,
          attachedDrafts,
          repoStructure: contextResolution.structureSummary,
          targetPath: snapshot.selectedPath,
        });

        addMessage(workspaceId, {
          id: createId(),
          role: "assistant",
          content: response.assistantText,
          createdAt: Date.now(),
          sourceFilePaths,
          proposedContent: response.proposedContent,
          targetPath: response.targetPath ?? snapshot.selectedPath,
        });

        updateUiPrefs({
          recentModels: [workspace.model, ...settings.uiPrefs.recentModels.filter((model) => model !== workspace.model)].slice(0, 8),
        });
      } finally {
        setSendingWorkspaceId("");
      }
    },
    [
      addMessage,
      bridgeClient,
      ensureDraftLoaded,
      resolvedRepoConfig,
      settings.uiPrefs.recentModels,
      snapshot.entries,
      snapshot.selectedPath,
      updateUiPrefs,
      workspaceState.messages,
      workspaceState.workspaces,
    ],
  );

  const handleApplyProposedDraft = useCallback(
    async (workspaceId: string, messageId: string) => {
      const message = (workspaceState.messages[workspaceId] ?? []).find((item) => item.id === messageId);
      if (!message?.proposedContent || !message.targetPath) {
        throw new Error("This message does not contain a proposed draft.");
      }

      const loadedDraft = await ensureDraftLoaded(message.targetPath);
      if (!loadedDraft) {
        throw new Error("Could not load the target file before applying the draft.");
      }

      applySuggestedDraft(
        {
          path: loadedDraft.path,
          sha: loadedDraft.originalSha,
          content: loadedDraft.originalContent,
          isEditable: loadedDraft.isEditable,
          readOnlyReason: loadedDraft.readOnlyReason,
        },
        message.proposedContent,
      );
      setSelectedPath(message.targetPath);
    },
    [applySuggestedDraft, ensureDraftLoaded, setSelectedPath, workspaceState.messages],
  );

  return (
    <>
      <div className="app-shell">
        <TopBar
          activeView={settings.uiPrefs.activeView}
          bridgeStatus={bridgeStatus}
          dockOpen={settings.uiPrefs.dockOpen}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onRefreshRepo={() => {
            void loadRepoTree();
            if (snapshot.selectedPath) {
              void loadFile(snapshot.selectedPath, true);
            }
          }}
          onSwitchView={(view) => updateUiPrefs({ activeView: view })}
          onToggleDock={() => updateUiPrefs({ dockOpen: !settings.uiPrefs.dockOpen })}
          onToggleSidebar={() => updateUiPrefs({ sidebarOpen: !settings.uiPrefs.sidebarOpen })}
          repoConfig={resolvedRepoConfig}
          repoStatus={repoStatus}
          selectedPath={snapshot.selectedPath}
          sidebarOpen={settings.uiPrefs.sidebarOpen}
        />

        <div className="app-view">
          {settings.uiPrefs.activeView === "ai" ? (
            <AiWorkspaceView
              activeWorkspaceId={workspaceState.activeWorkspaceId}
              availablePaths={filePaths}
              dirtyDrafts={dirtyDrafts}
              favoriteModels={settings.uiPrefs.favoriteModels}
              messages={workspaceState.messages}
              modelError={modelError}
              modelLoading={modelLoading}
              models={models}
              nodes={treeNodes}
              onAddWorkspace={() =>
                addWorkspace(createWorkspaceConfig(settings.defaultWorkspaceTemplate, `Workspace ${workspaceState.workspaces.length + 1}`))
              }
              onApplyProposedDraft={handleApplyProposedDraft}
              onAttachPath={(workspaceId, path) => {
                const workspace = workspaceState.workspaces.find((item) => item.id === workspaceId);
                if (!workspace || workspace.attachedPaths.includes(path)) {
                  return;
                }
                updateWorkspace(workspaceId, {
                  attachedPaths: [...workspace.attachedPaths, path],
                });
              }}
              onClearMessages={clearMessages}
              onDetachPath={(workspaceId, path) => {
                const workspace = workspaceState.workspaces.find((item) => item.id === workspaceId);
                if (!workspace) {
                  return;
                }
                updateWorkspace(workspaceId, {
                  attachedPaths: workspace.attachedPaths.filter((item) => item !== path),
                });
              }}
              onRemoveWorkspace={removeWorkspace}
              onSelectPath={(path) => setSelectedPath(path)}
              onSelectWorkspace={setActiveWorkspaceId}
              onSendPrompt={handleSendPrompt}
              onToggleFavoriteModel={(modelId) => {
                const favorites = new Set(settings.uiPrefs.favoriteModels);
                if (favorites.has(modelId)) {
                  favorites.delete(modelId);
                } else if (modelId) {
                  favorites.add(modelId);
                }
                updateUiPrefs({ favoriteModels: [...favorites] });
              }}
              onUpdateWorkspace={updateWorkspace}
              recentModels={settings.uiPrefs.recentModels}
              relatedContextCount={activeWorkspaceContext.autoContextPaths.length}
              selectedPath={snapshot.selectedPath}
              sendingWorkspaceId={sendingWorkspaceId}
              workspaces={workspaceState.workspaces}
            />
          ) : (
            <AppShell
              dock={
                <CommitPanel
                  branch={resolvedRepoConfig.branch}
                  dirtyDrafts={dirtyDrafts}
                  hasGitHubToken={Boolean(bridgeStatus?.hasGitHubToken)}
                  includedPaths={commitDraft.includedPaths}
                  isSubmitting={isSubmittingCommit}
                  message={commitDraft.message}
                  onCommit={handleCommit}
                  onDiscardDraft={(path) => {
                    discardDraft(path);
                    if (snapshot.selectedPath === path) {
                      void loadFile(path, true);
                    }
                  }}
                  onIncludeAll={() => includeAllDirty(dirtyDrafts.map((draft) => draft.path))}
                  onMessageChange={setCommitMessage}
                  onRefreshHead={() => {
                    void loadRepoTree();
                    if (snapshot.selectedPath) {
                      void loadFile(snapshot.selectedPath, true);
                    }
                  }}
                  onTogglePath={toggleIncludedPath}
                />
              }
              dockHeight={settings.uiPrefs.dockHeight}
              dockOpen={settings.uiPrefs.dockOpen}
              editor={
                <EditorPane
                  draft={selectedDraft}
                  error={fileError}
                  isLoading={fileStatus === "loading"}
                  onChange={(value) => {
                    if (!snapshot.selectedPath) {
                      return;
                    }
                    updateDraftContent(snapshot.selectedPath, value);
                  }}
                  onReady={(handle) => {
                    editorHandleRef.current = handle;
                  }}
                  onResetToHead={() => {
                    if (!snapshot.selectedPath || !selectedDraft) {
                      return;
                    }
                    resetDraftToHead(snapshot.selectedPath, selectedDraft.originalContent, selectedDraft.originalSha);
                  }}
                  selectedPath={snapshot.selectedPath}
                />
              }
              onDockResizeStart={dockSplitter.startDragging}
              onSidebarResizeStart={sidebarSplitter.startDragging}
              sidebar={
                <Sidebar
                  branch={resolvedRepoConfig.branch}
                  dirtyDrafts={dirtyDrafts}
                  nodes={treeNodes}
                  onSelectPath={(path) => setSelectedPath(path)}
                  selectedPath={snapshot.selectedPath}
                />
              }
              sidebarOpen={settings.uiPrefs.sidebarOpen}
              sidebarWidth={settings.uiPrefs.sidebarWidth}
              topBar={null}
            />
          )}
        </div>
      </div>

      {repoError ? <div className="toast-banner error">{repoError}</div> : null}
      {commitStatus ? <div className={`toast-banner ${commitTone}`}>{commitStatus}</div> : null}

      <SettingsModal
        bridgeStatus={bridgeStatus}
        isOpen={isSettingsOpen}
        onCheckBridge={async () => {
          try {
            const status = await loadBridgeStatus();
            return `Bridge ready. Adapter: ${status.repoAdapter}. GitHub: ${status.hasGitHubToken ? "ok" : "missing"}. OpenRouter: ${
              status.hasOpenRouterApiKey ? "ok" : "missing"
            }.`;
          } catch (error) {
            return error instanceof Error ? error.message : "Bridge check failed.";
          }
        }}
        onClearSecrets={clearSecrets}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(nextSettings) => {
          setSettings(nextSettings);
          setIsSettingsOpen(false);
        }}
        settings={settings}
      />
    </>
  );
}

export default AppProviders;
