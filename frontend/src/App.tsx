import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GitHubClient, GitHubConflictError } from "./services/githubClient";
import { OpenRouterClient } from "./services/openRouterClient";
import { DraftStoreProvider, useDraftStore } from "./stores/DraftStore";
import { CommitStoreProvider, useCommitStore } from "./stores/CommitStore";
import { RepoStoreProvider, useRepoStore } from "./stores/RepoStore";
import { SettingsStoreProvider, useSettingsStore } from "./stores/SettingsStore";
import { WorkspaceStoreProvider, useWorkspaceStore } from "./stores/WorkspaceStore";
import { AppShell } from "./components/layout/AppShell";
import { TopBar } from "./components/layout/TopBar";
import { SettingsModal } from "./components/layout/SettingsModal";
import { Sidebar } from "./components/repo/Sidebar";
import { EditorPane, type EditorHandle } from "./components/editor/EditorPane";
import { WorkspaceDock } from "./components/workspace/WorkspaceDock";
import { useSplitter } from "./hooks/useSplitter";
import type { DraftEntry, ModelInfo, WorkspaceMessage } from "./types/app";
import { flattenFilePaths, normalizeRepoTree } from "./utils/repoTree";
import { buildWorkspaceRequest } from "./utils/openRouter";
import { buildCommitTreeEntries } from "./utils/githubCommit";
import { createWorkspaceConfig } from "./utils/constants";

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
  const { drafts, setDrafts, upsertLoadedFile, updateDraftContent, resetDraftToHead, discardDraft, replaceOriginalFromHead } = useDraftStore();
  const { commitDraft, setCommitMessage, toggleIncludedPath, includeAllDirty, syncIncludedPaths, resetCommitDraft } = useCommitStore();
  const { state: workspaceState, addWorkspace, updateWorkspace, removeWorkspace, setActiveWorkspaceId, addMessage, clearMessages } = useWorkspaceStore();

  const editorHandleRef = useRef<EditorHandle | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [repoStatus, setRepoStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [repoError, setRepoError] = useState<string>("");
  const [fileStatus, setFileStatus] = useState<"idle" | "loading">("idle");
  const [fileError, setFileError] = useState<string>("");
  const [commitStatus, setCommitStatus] = useState<string>("");
  const [isSubmittingCommit, setIsSubmittingCommit] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string>("");
  const [sendingWorkspaceId, setSendingWorkspaceId] = useState<string>("");

  const repoClient = useMemo(() => new GitHubClient(resolvedRepoConfig), [resolvedRepoConfig]);
  const openRouterClient = useMemo(
    () => (settings.openRouterApiKey ? new OpenRouterClient(settings.openRouterApiKey) : null),
    [settings.openRouterApiKey],
  );

  const dirtyDrafts = useMemo(
    () => Object.values(drafts).filter((draft) => draft.draftContent !== draft.originalContent),
    [drafts],
  );
  const selectedDraft = snapshot.selectedPath ? drafts[snapshot.selectedPath] : undefined;
  const treeNodes = useMemo(() => normalizeRepoTree(snapshot.entries), [snapshot.entries]);
  const filePaths = useMemo(() => flattenFilePaths(treeNodes), [treeNodes]);

  const sidebarSplitter = useSplitter({
    direction: "horizontal",
    value: settings.uiPrefs.sidebarWidth,
    min: 260,
    max: 520,
    onChange: (nextValue) => updateUiPrefs({ sidebarWidth: nextValue }),
  });
  const dockSplitter = useSplitter({
    direction: "vertical",
    value: settings.uiPrefs.dockHeight,
    min: 220,
    max: 520,
    onChange: (nextValue) => updateUiPrefs({ dockHeight: nextValue }),
  });

  const activeWorkspace = workspaceState.workspaces.find((workspace) => workspace.id === workspaceState.activeWorkspaceId) ?? workspaceState.workspaces[0];

  useEffect(() => {
    syncIncludedPaths(dirtyDrafts.map((draft) => draft.path));
  }, [dirtyDrafts, syncIncludedPaths]);

  useEffect(() => {
    if (commitDraft.branch !== resolvedRepoConfig.branch) {
      resetCommitDraft(resolvedRepoConfig.branch);
    }
  }, [commitDraft.branch, resetCommitDraft, resolvedRepoConfig.branch]);

  const loadRepoTree = useCallback(async () => {
    setRepoStatus("loading");
    setRepoError("");

    try {
      const result = await repoClient.getRepoTree();
      updateEntries(result.entries, result.headSha, result.baseTreeSha);

      const selectedStillExists = snapshot.selectedPath && result.entries.some((entry) => entry.path === snapshot.selectedPath);
      if (!selectedStillExists) {
        const firstFile = result.entries.find((entry) => entry.type === "blob");
        setSelectedPath(firstFile?.path);
      }

      setRepoStatus("ready");
    } catch (error) {
      setRepoStatus("error");
      setRepoError(error instanceof Error ? error.message : "Failed to load repository tree.");
    }
  }, [repoClient, setSelectedPath, snapshot.selectedPath, updateEntries]);

  const loadFile = useCallback(
    async (path: string, replaceFromHead = false) => {
      const entry = snapshot.entries.find((item) => item.path === path && item.type === "blob");
      if (!entry) {
        return;
      }

      setFileStatus("loading");
      setFileError("");

      try {
        const file = await repoClient.getFileContent(path, entry.sha);
        if (replaceFromHead) {
          replaceOriginalFromHead(file);
        } else {
          upsertLoadedFile(file);
        }
        setFileStatus("idle");
      } catch (error) {
        setFileStatus("idle");
        setFileError(error instanceof Error ? error.message : "Failed to load file.");
      }
    },
    [replaceOriginalFromHead, repoClient, snapshot.entries, upsertLoadedFile],
  );

  useEffect(() => {
    if (snapshot.entries.length === 0) {
      void loadRepoTree();
    }
  }, [loadRepoTree, snapshot.entries.length]);

  useEffect(() => {
    if (!snapshot.selectedPath) {
      return;
    }
    if (drafts[snapshot.selectedPath]) {
      return;
    }
    void loadFile(snapshot.selectedPath);
  }, [drafts, loadFile, snapshot.selectedPath]);

  useEffect(() => {
    if (!openRouterClient) {
      setModels([]);
      setModelError("");
      return;
    }

    let cancelled = false;
    const run = async () => {
      setModelLoading(true);
      setModelError("");
      try {
        const nextModels = await openRouterClient.getModels();
        if (!cancelled) {
          setModels(nextModels);
        }
      } catch (error) {
        if (!cancelled) {
          setModelError(error instanceof Error ? error.message : "Failed to load OpenRouter models.");
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
  }, [openRouterClient]);

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

      const loaded = await repoClient.getFileContent(path, entry.sha);
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
    [drafts, repoClient, snapshot.entries, upsertLoadedFile],
  );

  const handleCommit = useCallback(async () => {
    setCommitStatus("");
    setIsSubmittingCommit(true);

    try {
      const files = buildCommitTreeEntries(dirtyDrafts, commitDraft.includedPaths).map((entry) => ({
        path: entry.path,
        content: entry.content,
      }));

      await repoClient.createCommit({
        headSha: snapshot.headSha,
        baseTreeSha: snapshot.baseTreeSha,
        message: commitDraft.message,
        files,
      });

      const refreshed = await repoClient.getRepoTree();
      updateEntries(refreshed.entries, refreshed.headSha, refreshed.baseTreeSha);

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
      setCommitStatus("Commit completed successfully.");
    } catch (error) {
      if (error instanceof GitHubConflictError) {
        setCommitStatus(error.message);
      } else {
        setCommitStatus(error instanceof Error ? error.message : "Commit failed.");
      }
    } finally {
      setIsSubmittingCommit(false);
    }
  }, [
    commitDraft.includedPaths,
    commitDraft.message,
    dirtyDrafts,
    repoClient,
    resetCommitDraft,
    resolvedRepoConfig.branch,
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
      if (!openRouterClient) {
        throw new Error("OpenRouter API key 尚未設定。");
      }

      setSendingWorkspaceId(workspaceId);
      try {
        const allPaths = [...workspace.attachedPaths];
        if (workspace.autoAttachActiveFile && snapshot.selectedPath) {
          allPaths.push(snapshot.selectedPath);
        }

        const attachedDrafts = (await Promise.all([...new Set(allPaths)].map((path) => ensureDraftLoaded(path)))).filter(
          Boolean,
        ) as DraftEntry[];

        const history = workspaceState.messages[workspaceId] ?? [];
        const request = buildWorkspaceRequest({
          workspace,
          history,
          prompt,
          attachedDrafts,
        });

        const userMessage: WorkspaceMessage = {
          id: createId(),
          role: "user",
          content: prompt,
          createdAt: Date.now(),
          sourceFilePaths: attachedDrafts.map((draft) => draft.path),
        };
        addMessage(workspaceId, userMessage);

        const response = await openRouterClient.sendChat(request);
        addMessage(workspaceId, {
          id: createId(),
          role: "assistant",
          content: response,
          createdAt: Date.now(),
          sourceFilePaths: attachedDrafts.map((draft) => draft.path),
        });

        updateUiPrefs({
          recentModels: [workspace.model, ...settings.uiPrefs.recentModels.filter((model) => model !== workspace.model)].slice(0, 8),
        });
      } finally {
        setSendingWorkspaceId("");
      }
    },
    [addMessage, ensureDraftLoaded, openRouterClient, settings.uiPrefs.recentModels, snapshot.selectedPath, updateUiPrefs, workspaceState.messages, workspaceState.workspaces],
  );

  return (
    <>
      <AppShell
        dock={
          <WorkspaceDock
            activeWorkspaceId={workspaceState.activeWorkspaceId}
            availablePaths={filePaths}
            favoriteModels={settings.uiPrefs.favoriteModels}
            messages={workspaceState.messages}
            modelError={modelError}
            modelLoading={modelLoading}
            models={models}
            onAddWorkspace={() => addWorkspace(createWorkspaceConfig(settings.defaultWorkspaceTemplate, `Workspace ${workspaceState.workspaces.length + 1}`))}
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
            onInsertToEditor={(content) => editorHandleRef.current?.insertText(content)}
            onRemoveWorkspace={removeWorkspace}
            onReplaceEditor={(content) => editorHandleRef.current?.replaceAll(content)}
            onReplaceSelection={(content) => editorHandleRef.current?.replaceSelection(content)}
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
            selectedPath={snapshot.selectedPath}
            sendingWorkspaceId={sendingWorkspaceId}
            workspaces={workspaceState.workspaces}
          />
        }
        dockHeight={settings.uiPrefs.dockHeight}
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
            commitMessage={commitDraft.message}
            dirtyDrafts={dirtyDrafts}
            hasGitHubToken={Boolean(resolvedRepoConfig.githubToken)}
            includedPaths={commitDraft.includedPaths}
            isSubmittingCommit={isSubmittingCommit}
            nodes={treeNodes}
            onCommit={handleCommit}
            onCommitMessageChange={setCommitMessage}
            onDiscardDraft={(path) => {
              discardDraft(path);
              if (snapshot.selectedPath === path) {
                void loadFile(path, true);
              }
            }}
            onIncludeAllDirty={() => includeAllDirty(dirtyDrafts.map((draft) => draft.path))}
            onRefreshHead={() => {
              void loadRepoTree();
              if (snapshot.selectedPath) {
                void loadFile(snapshot.selectedPath, true);
              }
            }}
            onSelectPath={(path) => setSelectedPath(path)}
            onToggleCommitPath={toggleIncludedPath}
            selectedPath={snapshot.selectedPath}
          />
        }
        sidebarOpen={settings.uiPrefs.sidebarOpen}
        sidebarWidth={settings.uiPrefs.sidebarWidth}
        topBar={
          <TopBar
            hasGitHubToken={Boolean(settings.githubPat)}
            hasOpenRouterKey={Boolean(settings.openRouterApiKey)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onRefreshRepo={() => {
              void loadRepoTree();
              if (snapshot.selectedPath) {
                void loadFile(snapshot.selectedPath, true);
              }
            }}
            onToggleSidebar={() => updateUiPrefs({ sidebarOpen: !settings.uiPrefs.sidebarOpen })}
            repoConfig={resolvedRepoConfig}
            repoStatus={repoStatus}
            selectedPath={snapshot.selectedPath}
            sidebarOpen={settings.uiPrefs.sidebarOpen}
          />
        }
      />

      {repoError ? <div className="toast-banner error">{repoError}</div> : null}
      {commitStatus ? <div className={`toast-banner ${commitStatus.includes("successfully") ? "success" : "error"}`}>{commitStatus}</div> : null}
      {activeWorkspace && !settings.openRouterApiKey ? <div className="toast-banner">設定 OpenRouter API key 後，AI dock 才能送出 prompt。</div> : null}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClearSecrets={clearSecrets}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(nextSettings) => {
          setSettings(nextSettings);
          setIsSettingsOpen(false);
        }}
        onTestGitHub={async (token) => {
          try {
            const client = new GitHubClient({
              ...resolvedRepoConfig,
              githubToken: token,
            });
            await client.testConnection();
            return "GitHub connection OK";
          } catch (error) {
            return error instanceof Error ? error.message : "GitHub test failed";
          }
        }}
        onTestOpenRouter={async (apiKey) => {
          if (!apiKey) {
            return "Missing OpenRouter API key";
          }
          try {
            const client = new OpenRouterClient(apiKey);
            await client.testConnection();
            return "OpenRouter connection OK";
          } catch (error) {
            return error instanceof Error ? error.message : "OpenRouter test failed";
          }
        }}
        settings={settings}
      />
    </>
  );
}

export default AppProviders;
