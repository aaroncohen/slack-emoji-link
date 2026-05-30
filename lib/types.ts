export interface SlackTeam {
  id: string;
  name: string;
  domain: string;
  url: string;
  token: string;
}

export interface EmojiEntry {
  name: string;
  url: string;
  isAlias: boolean;
  aliasFor?: string;
}

export interface CollisionItem {
  originalName: string;
  destinationName: string;
  renameTo: string;
  skipped: boolean;
}

export interface TransferItem {
  name: string;
  url: string;
  isAlias: boolean;
  aliasFor?: string;
  destinationName: string;
}

export type TransferItemStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface TransferProgressEvent {
  type: 'progress' | 'complete' | 'error' | 'cancelled';
  index?: number;
  total?: number;
  name?: string;
  status?: TransferItemStatus;
  message?: string;
  results?: TransferResult[];
}

export interface TransferResult {
  name: string;
  destinationName: string;
  status: 'success' | 'failed' | 'skipped';
  message?: string;
  url?: string;
}

export type AppScreen =
  | 'workspace-picker'
  | 'emoji-browser'
  | 'collision-resolver'
  | 'transfer-progress'
  | 'confirmation';

export type BackgroundMessage =
  | { type: 'refresh-workspaces' }
  | { type: 'list-emoji'; team: SlackTeam }
  | { type: 'start-transfer'; source: SlackTeam; destination: SlackTeam; items: TransferItem[] }
  | { type: 'cancel-transfer' };

export type BackgroundResponse =
  | { ok: true; teams?: SlackTeam[]; emoji?: Record<string, string> }
  | { ok: false; error: string };

export const STORAGE_TEAMS_KEY = 'discoveredTeams';
