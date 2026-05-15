export interface GameLogFilenameMeta {
  timestamp: string;
  seed: number;
  profileId: string;
}

export function makeGameLogFilename(meta: GameLogFilenameMeta): string {
  const ts = meta.timestamp.replace(/:/g, "-").replace(/\..+$/, "");
  return `${ts}-seed${meta.seed}-${meta.profileId}.json`;
}
