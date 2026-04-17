declare module "diff" {
  export interface Change {
    value: string;
    added?: boolean;
    removed?: boolean;
  }

  export function diffLines(oldText: string, newText: string): Change[];
}
