import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorPane } from "./components/editor/EditorPane";
import { SettingsModal } from "./components/layout/SettingsModal";
import { TopBar } from "./components/layout/TopBar";
import { TweaksPanel } from "./components/layout/TweaksPanel";
import { OperaView } from "./components/opera/OperaView";
import { CommitPanel } from "./components/repo/CommitPanel";
import { Sidebar } from "./components/repo/Sidebar";
import { ChatPanel } from "./components/workspace/ChatPanel";
import { WorkspaceRail } from "./components/workspace/WorkspaceRail";
import { BridgeClient } from "./services/bridgeClient";
import { OpenRouterClient } from "./services/openRouterClient";
import { CommitStoreProvider, useCommitStore } from "./stores/CommitStore";
import { DraftStoreProvider, useDraftStore } from "./stores/DraftStore";
import { OperaStoreProvider } from "./stores/OperaStore";
import { RepoStoreProvider, useRepoStore } from "./stores/RepoStore";
import { SettingsStoreProvider, useSettingsStore } from "./stores/SettingsStore";
import { WorkspaceStoreProvider, useWorkspaceStore } from "./stores/WorkspaceStore";
import type { DraftEntry, RepoSnapshot } from "./types/app";
import { MAX_ATTACHED_REFERENCE_FILES, NOVEL_DB_ROOT_PATH, createWorkspaceConfig } from "./utils/constants";
import { buildWorkspaceRequest, parseAiResponseEnvelope } from "./utils/openRouter";
import { focusRepoTree, normalizeRepoTree } from "./utils/repoTree";
import { resolveWorkspaceContext } from "./utils/workspaceContext";

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function getUiFontFamily(font: "Instrument Sans" | "Lora" | "JetBrains Mono") {
  if (font === "Lora") {
    return '"Lora", "Noto Serif TC", serif';
  }
  if (font === "JetBrains Mono") {
    return '"JetBrains Mono", "Cascadia Mono", monospace';
  }
  return '"Instrument Sans", "Segoe UI", sans-serif';
}

function AppProviders() {
  return (
    <SettingsStoreProvider>
      <RepoStoreProvider>
        <DraftStoreProvider>
          <WorkspaceStoreProvider>
            <OperaStoreProvider>
              <CommitStoreProvider>
                <ConsoleApp />
              </CommitStoreProvider>
            </OperaStoreProvider>
          </WorkspaceStoreProvider>
        </DraftStoreProvider>
      </RepoStoreProvider>
    </SettingsStoreProvider>
  );
}

function ConsoleApp() {
  const { settings, resolvedRepoConfig, updateSettings, updateTweaks, updateUiPrefs } = useSettingsStore();
  const { snapshot, updateEntries, setSelectedPath } = useRepoStore();
  const {
    drafts,
    upsertLoadedFile,
    updateDraftContent,
    applySuggestedDraft,
    resetDraftToHead,
    discardDraft,
    replaceOriginalFromHead,
  } = useDraftStore();
  const { state: workspaceState, addWorkspace, updateWorkspace, setActiveWorkspaceId, addMessage } = useWorkspaceStore();
  const { commitDraft, setCommitMessage, toggleIncludedPath, includeAllDirty, syncIncludedPaths, resetCommitDraft } = useCommitStore();

  const bridgeClient = useMemo(() => new BridgeClient(), []);
  const openRouterClient = useMemo(() => {
    const apiKey = settings.openRouterApiKey?.trim();
    return apiKey ? new OpenRouterClient(apiKey) : null;
  }, [settings.openRouterApiKey]);
  const selectedPathRef = useRef<string | undefined>(undefined);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [repoStatus, setRepoStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [repoError, setRepoError] = useState("");
  const [fileStatus, setFileStatus] = useState<"idle" | "loading">("idle");
  const [fileError, setFileError] = useState("");
  const [models, setModels] = useState<import("./types/app").ModelInfo[]>([]);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState("");
  const [sendingWorkspaceId, setSendingWorkspaceId] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [commitFeedback, setCommitFeedback] = useState<{ tone: "muted" | "error" | "success"; message: string }>({
    tone: "muted",
    message: "",
  });
  const [commitAction, setCommitAction] = useState<"" | "commit" | "push">("");

  const dirtyDrafts = useMemo(
    () => Object.values(drafts).filter((draft) => draft.draftContent !== draft.originalContent),
    [drafts],
  );
  const dirtyPaths = useMemo(() => dirtyDrafts.map((draft) => draft.path), [dirtyDrafts]);
  const treeNodes = useMemo(() => focusRepoTree(normalizeRepoTree(snapshot.entries), NOVEL_DB_ROOT_PATH), [snapshot.entries]);
  const selectedDraft = snapshot.selectedPath ? drafts[snapshot.selectedPath] : undefined;
  const activeWorkspace =
    workspaceState.workspaces.find((workspace) => workspace.id === workspaceState.activeWorkspaceId) ?? workspaceState.workspaces[0];
  const activeMessages = workspaceState.messages[activeWorkspace.id] ?? [];
  const activeView =
    settings.uiPrefs.activeView === "editor"
      ? "editor"
      : settings.uiPrefs.activeView === "opera"
      ? "opera"
      : "ai";
  const tweaksOpen = settings.uiPrefs.tweaksOpen ?? false;
  const activeWorkspaceContext = useMemo(
    () =>
      resolveWorkspaceContext({
        entries: snapshot.entries,
        attachedPaths: activeWorkspace.attachedPaths ?? [],
        selectedPath: snapshot.selectedPath,
        autoAttachActiveFile: activeWorkspace.autoAttachActiveFile ?? true,
        autoAttachRelatedFiles: activeWorkspace.autoAttachRelatedFiles ?? true,
      }),
    [activeWorkspace, snapshot.entries, snapshot.selectedPath],
  );
  useEffect(() => {
    selectedPathRef.current = snapshot.selectedPath;
  }, [snapshot.selectedPath]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--app-ui-font", getUiFontFamily(settings.tweaks.uiFont));
    root.style.setProperty("--app-font-size", `${settings.tweaks.fontSize}px`);
  }, [settings.tweaks.fontSize, settings.tweaks.uiFont]);

  useEffect(() => {
    syncIncludedPaths(dirtyPaths);
  }, [dirtyPaths, syncIncludedPaths]);

  useEffect(() => {
    if (commitDraft.branch !== resolvedRepoConfig.branch) {
      resetCommitDraft(resolvedRepoConfig.branch);
    }
  }, [commitDraft.branch, resolvedRepoConfig.branch, resetCommitDraft]);

  useEffect(() => {
    setAttachmentError("");
  }, [activeWorkspace.id]);

  const loadRepoTree = useCallback(async (): Promise<RepoSnapshot> => {
    setRepoStatus("loading");
    setRepoError("");

    try {
      const result = await bridgeClient.getRepoTree(resolvedRepoConfig);
      updateEntries(result.entries, result.headSha, result.baseTreeSha, result.truncated);

      const selectedStillExists =
        selectedPathRef.current && result.entries.some((entry) => entry.path === selectedPathRef.current && entry.type === "blob");
      if (!selectedStillExists) {
        const firstFile = result.entries.find((entry) => entry.type === "blob");
        setSelectedPath(firstFile?.path);
      }

      setRepoStatus("ready");
      return result;
    } catch (error) {
      setRepoStatus("error");
      setRepoError(error instanceof Error ? error.message : "Failed to load the repository tree.");
      throw error;
    }
  }, [bridgeClient, resolvedRepoConfig, setSelectedPath, updateEntries]);

  const loadFile = useCallback(
    async (path: string) => {
      const entry = snapshot.entries.find((item) => item.path === path && item.type === "blob");
      if (!entry) {
        return;
      }

      setFileStatus("loading");
      setFileError("");

      try {
        const file = await bridgeClient.getFileContent(resolvedRepoConfig, path, entry.sha);
        upsertLoadedFile(file);
      } catch (error) {
        setFileError(error instanceof Error ? error.message : "Failed to load the file.");
      } finally {
        setFileStatus("idle");
      }
    },
    [bridgeClient, resolvedRepoConfig, snapshot.entries, upsertLoadedFile],
  );

  useEffect(() => {
    void loadRepoTree().catch(() => undefined);
  }, [loadRepoTree]);

  useEffect(() => {
    if (!snapshot.selectedPath || drafts[snapshot.selectedPath]) {
      return;
    }
    void loadFile(snapshot.selectedPath);
  }, [drafts, loadFile, snapshot.selectedPath]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!openRouterClient) {
        setModels([]);
        setModelError("");
        setModelLoading(false);
        return;
      }

      setModelLoading(true);
      setModelError("");
      try {
        const nextModels = await openRouterClient.getModels();
        if (!cancelled) {
          setModels(nextModels);
        }
      } catch (error) {
        if (!cancelled) {
          setModels([]);
          setModelError(error instanceof Error ? error.message : "Failed to load models.");
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

  const handleToggleAttachment = useCallback(
    (path: string) => {
      const existing = activeWorkspace.attachedPaths ?? [];
      if (existing.includes(path)) {
        updateWorkspace(activeWorkspace.id, { attachedPaths: existing.filter((item) => item !== path) });
        setAttachmentError("");
        return;
      }

      if (existing.length >= MAX_ATTACHED_REFERENCE_FILES) {
        setAttachmentError(`You can attach up to ${MAX_ATTACHED_REFERENCE_FILES} reference files.`);
        return;
      }

      updateWorkspace(activeWorkspace.id, { attachedPaths: [...existing, path] });
      setAttachmentError("");
    },
    [activeWorkspace, updateWorkspace],
  );

  const handleSendPrompt = useCallback(
    async (prompt: string) => {
      if (!openRouterClient) {
        throw new Error("OpenRouter API key is missing.");
      }
      if (!snapshot.selectedPath) {
        throw new Error("Choose a target file before sending a prompt.");
      }

      setSendingWorkspaceId(activeWorkspace.id);
      try {
        const contextResolution = resolveWorkspaceContext({
          entries: snapshot.entries,
          attachedPaths: activeWorkspace.attachedPaths ?? [],
          selectedPath: snapshot.selectedPath,
          autoAttachActiveFile: activeWorkspace.autoAttachActiveFile ?? true,
          autoAttachRelatedFiles: activeWorkspace.autoAttachRelatedFiles ?? true,
        });

        const allPaths = [...new Set([...contextResolution.requestedPaths, ...contextResolution.autoContextPaths])];
        const attachedDrafts = (await Promise.all(allPaths.map((path) => ensureDraftLoaded(path)))).filter(Boolean) as DraftEntry[];
        const sourceFilePaths = attachedDrafts.map((draft) => draft.path);
        const history = workspaceState.messages[activeWorkspace.id] ?? [];

        addMessage(activeWorkspace.id, {
          id: createId(),
          role: "user",
          content: prompt,
          createdAt: Date.now(),
          sourceFilePaths,
          targetPath: snapshot.selectedPath,
        });

        const request = buildWorkspaceRequest({
          workspace: activeWorkspace,
          history,
          prompt,
          attachedDrafts,
          repoStructure: contextResolution.structureSummary,
          targetPath: snapshot.selectedPath,
        });
        const rawResponse = await openRouterClient.sendChat(request);
        const response = parseAiResponseEnvelope(rawResponse, snapshot.selectedPath);

        addMessage(activeWorkspace.id, {
          id: createId(),
          role: "assistant",
          content: response.assistantText,
          createdAt: Date.now(),
          sourceFilePaths,
          proposedContent: response.proposedContent,
          targetPath: response.targetPath ?? snapshot.selectedPath,
        });

        updateUiPrefs({
          recentModels: [activeWorkspace.model, ...settings.uiPrefs.recentModels.filter((model) => model !== activeWorkspace.model)].slice(0, 8),
        });
      } finally {
        setSendingWorkspaceId("");
      }
    },
    [
      activeWorkspace,
      addMessage,
      ensureDraftLoaded,
      openRouterClient,
      settings.uiPrefs.recentModels,
      snapshot.entries,
      snapshot.selectedPath,
      updateUiPrefs,
      workspaceState.messages,
    ],
  );

  const handleApplyProposedDraft = useCallback(
    async (messageId: string) => {
      const message = activeMessages.find((item) => item.id === messageId);
      if (!message?.proposedContent || !message.targetPath) {
        throw new Error("This message does not contain a draft to apply.");
      }

      const loadedDraft = await ensureDraftLoaded(message.targetPath);
      if (!loadedDraft) {
        throw new Error("The target file could not be loaded.");
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
      updateUiPrefs({ activeView: "editor" });
    },
    [activeMessages, applySuggestedDraft, ensureDraftLoaded, setSelectedPath, updateUiPrefs],
  );

  const handleCommitAction = useCallback(
    async (push: boolean) => {
      const includedDrafts = dirtyDrafts.filter((draft) => commitDraft.includedPaths.includes(draft.path));
      if (includedDrafts.length === 0) {
        throw new Error("Select at least one changed file to commit.");
      }

      const message = commitDraft.message.trim();
      if (!message) {
        throw new Error("Enter a commit message first.");
      }

      setCommitAction(push ? "push" : "commit");
      setCommitFeedback({ tone: "muted", message: push ? "Committing and pushing..." : "Committing..." });

      try {
        const result = await bridgeClient.createCommit({
          repoRef: resolvedRepoConfig,
          headSha: snapshot.headSha,
          baseTreeSha: snapshot.baseTreeSha,
          message,
          files: includedDrafts.map((draft) => ({
            path: draft.path,
            content: draft.draftContent,
          })),
          push,
        });

        const refreshed = await loadRepoTree();
        await Promise.all(
          includedDrafts.map(async (draft) => {
            const entry = refreshed.entries.find((item) => item.path === draft.path && item.type === "blob");
            if (!entry) {
              return;
            }

            const file = await bridgeClient.getFileContent(resolvedRepoConfig, draft.path, entry.sha);
            replaceOriginalFromHead(file);
          }),
        );

        resetCommitDraft(resolvedRepoConfig.branch);
        const generatedCount = result.generatedFiles?.length ?? 0;
        const generatedText = generatedCount > 0 ? ` Flatten exports updated: ${generatedCount}.` : "";
        setCommitFeedback({
          tone: "success",
          message: result.pushed
            ? `Committed and pushed ${includedDrafts.length} files to ${result.pushedBranch ?? resolvedRepoConfig.branch}.${generatedText}`
            : `Committed ${includedDrafts.length} files locally.${generatedText}`,
        });
      } catch (error) {
        setCommitFeedback({
          tone: "error",
          message: error instanceof Error ? error.message : "Failed to commit the selected files.",
        });
      } finally {
        setCommitAction("");
      }
    },
    [
      bridgeClient,
      commitDraft.includedPaths,
      commitDraft.message,
      dirtyDrafts,
      loadRepoTree,
      replaceOriginalFromHead,
      resetCommitDraft,
      resolvedRepoConfig,
      snapshot.baseTreeSha,
      snapshot.headSha,
    ],
  );

  return (
    <>
      <div className="app-shell">
        <TopBar
          activeView={activeView}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSwitchView={(view: "ai" | "editor" | "opera") => updateUiPrefs({ activeView: view })}
          onToggleSidebar={() => updateUiPrefs({ sidebarOpen: !settings.uiPrefs.sidebarOpen })}
          onToggleTweaks={() => updateUiPrefs({ tweaksOpen: !tweaksOpen })}
          repoStatus={repoStatus}
          sidebarOpen={settings.uiPrefs.sidebarOpen}
          tweaksOpen={tweaksOpen}
        />

        {repoError ? <div className="screen-banner error">{repoError}</div> : null}

        <div className="main-area">
          {activeView === "ai" ? (
            <div className="ai-layout">
              <WorkspaceRail
                activeWorkspaceId={activeWorkspace.id}
                onAddWorkspace={() =>
                  addWorkspace(createWorkspaceConfig(settings.defaultWorkspaceTemplate, `Workspace ${workspaceState.workspaces.length + 1}`))
                }
                onSelectWorkspace={setActiveWorkspaceId}
                workspaces={workspaceState.workspaces}
              />

              <Sidebar
                attachedPaths={activeWorkspace.attachedPaths ?? []}
                attachmentError={attachmentError}
                attachmentLimit={MAX_ATTACHED_REFERENCE_FILES}
                dirtyPaths={dirtyPaths}
                nodes={treeNodes}
                onSelectPath={(path) => setSelectedPath(path)}
                onToggleAttachment={handleToggleAttachment}
                selectedPath={snapshot.selectedPath}
                sidebarOpen={settings.uiPrefs.sidebarOpen}
              />

              <div className="chat-main">
                <ChatPanel
                  apiKeyMissing={!openRouterClient}
                  attachedPaths={activeWorkspace.attachedPaths ?? []}
                  attachmentError={attachmentError}
                  attachmentLimit={MAX_ATTACHED_REFERENCE_FILES}
                  messages={activeMessages}
                  modelError={modelError}
                  modelLoading={modelLoading}
                  models={models}
                  onApply={handleApplyProposedDraft}
                  onDetachReference={handleToggleAttachment}
                  onSend={handleSendPrompt}
                  onUpdateWorkspace={(patch) => updateWorkspace(activeWorkspace.id, patch)}
                  relatedContextCount={activeWorkspaceContext.autoContextPaths.length}
                  selectedPath={snapshot.selectedPath}
                  sending={sendingWorkspaceId === activeWorkspace.id}
                  workspace={activeWorkspace}
                />
              </div>
            </div>
          ) : activeView === "opera" ? (
            <OperaView
              bridgeClient={bridgeClient}
              models={models}
              openRouterClient={openRouterClient}
              repoConfig={resolvedRepoConfig}
              repoEntries={snapshot.entries}
            />
          ) : activeView === "editor" ? (
            <div className="editor-layout">
              <Sidebar
                attachedPaths={activeWorkspace.attachedPaths ?? []}
                attachmentError={attachmentError}
                attachmentLimit={MAX_ATTACHED_REFERENCE_FILES}
                dirtyPaths={dirtyPaths}
                nodes={treeNodes}
                onSelectPath={(path) => setSelectedPath(path)}
                onToggleAttachment={handleToggleAttachment}
                selectedPath={snapshot.selectedPath}
                sidebarOpen={settings.uiPrefs.sidebarOpen}
              />

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
                onResetToHead={() => {
                  if (!snapshot.selectedPath || !selectedDraft) {
                    return;
                  }
                  resetDraftToHead(snapshot.selectedPath, selectedDraft.originalContent, selectedDraft.originalSha);
                }}
                onUpdateTweak={updateTweaks}
                selectedPath={snapshot.selectedPath}
                tweaks={settings.tweaks}
              />

              <CommitPanel
                branch={resolvedRepoConfig.branch}
                dirtyDrafts={dirtyDrafts}
                includedPaths={commitDraft.includedPaths}
                isSubmitting={commitAction !== ""}
                message={commitDraft.message}
                onCommit={() => void handleCommitAction(false)}
                onCommitAndPush={() => void handleCommitAction(true)}
                onDiscardDraft={discardDraft}
                onIncludeAll={() => includeAllDirty(dirtyPaths)}
                onMessageChange={setCommitMessage}
                onRefreshHead={() => {
                  void loadRepoTree().catch(() => undefined);
                }}
                onTogglePath={toggleIncludedPath}
                statusMessage={commitFeedback.message}
                statusTone={commitFeedback.tone}
                submitLabel={commitAction === "push" ? "Committing and pushing..." : commitAction === "commit" ? "Committing..." : undefined}
              />
            </div>
          ) : null}
        </div>

        <TweaksPanel onChange={updateTweaks} tweaks={settings.tweaks} visible={tweaksOpen} />
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(apiKey) => updateSettings({ openRouterApiKey: apiKey })}
        openRouterApiKey={settings.openRouterApiKey}
      />
    </>
  );
}

export default AppProviders;
