import { createContext, useContext, useMemo } from "react";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import type { AppSettings, RepoConfig } from "../types/app";
import { DEFAULT_REPO_CONFIG, DEFAULT_SETTINGS } from "../utils/constants";
import { usePersistentState } from "../hooks/usePersistentState";

interface SettingsStoreValue {
  settings: AppSettings;
  resolvedRepoConfig: RepoConfig;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  updateSettings: (patch: Partial<AppSettings>) => void;
  updateUiPrefs: (patch: Partial<AppSettings["uiPrefs"]>) => void;
  updateDefaultWorkspaceTemplate: (patch: Partial<AppSettings["defaultWorkspaceTemplate"]>) => void;
  clearSecrets: () => void;
}

const SettingsStoreContext = createContext<SettingsStoreValue | null>(null);

function mergeSettings(partial: AppSettings): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    uiPrefs: {
      ...DEFAULT_SETTINGS.uiPrefs,
      ...partial.uiPrefs,
    },
    defaultWorkspaceTemplate: {
      ...DEFAULT_SETTINGS.defaultWorkspaceTemplate,
      ...partial.defaultWorkspaceTemplate,
    },
  };
}

export function SettingsStoreProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = usePersistentState<AppSettings>("settings", DEFAULT_SETTINGS);
  const normalizedSettings = useMemo(() => mergeSettings(settings), [settings]);

  const value = useMemo<SettingsStoreValue>(() => {
    const resolvedRepoConfig: RepoConfig = {
      ...DEFAULT_REPO_CONFIG,
      ...normalizedSettings.repoOverride,
      githubToken: normalizedSettings.githubPat,
    };

    return {
      settings: normalizedSettings,
      resolvedRepoConfig,
      setSettings,
      updateSettings: (patch) => {
        setSettings((previous) => mergeSettings({ ...previous, ...patch } as AppSettings));
      },
      updateUiPrefs: (patch) => {
        setSettings((previous) =>
          mergeSettings({
            ...previous,
            uiPrefs: {
              ...mergeSettings(previous).uiPrefs,
              ...patch,
            },
          } as AppSettings),
        );
      },
      updateDefaultWorkspaceTemplate: (patch) => {
        setSettings((previous) =>
          mergeSettings({
            ...previous,
            defaultWorkspaceTemplate: {
              ...mergeSettings(previous).defaultWorkspaceTemplate,
              ...patch,
            },
          } as AppSettings),
        );
      },
      clearSecrets: () => {
        setSettings((previous) =>
          mergeSettings({
            ...previous,
            githubPat: undefined,
            openRouterApiKey: undefined,
          } as AppSettings),
        );
      },
    };
  }, [normalizedSettings, setSettings]);

  return <SettingsStoreContext.Provider value={value}>{children}</SettingsStoreContext.Provider>;
}

export function useSettingsStore() {
  const context = useContext(SettingsStoreContext);
  if (!context) {
    throw new Error("useSettingsStore must be used within SettingsStoreProvider");
  }
  return context;
}
