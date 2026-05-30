import { create } from 'zustand';
import type {
  AppScreen,
  CollisionItem,
  EmojiEntry,
  SlackTeam,
  TransferResult,
} from '../lib/types';

interface AppState {
  screen: AppScreen;
  teams: SlackTeam[];
  sourceTeam: SlackTeam | null;
  destinationTeam: SlackTeam | null;
  sourceEmojis: EmojiEntry[];
  destinationEmojiNames: Set<string>;
  selectedEmojiNames: Set<string>;
  lastClickedIndex: number | null;
  searchQuery: string;
  collisions: CollisionItem[];
  skippedNames: Set<string>;
  transferResults: TransferResult[];
  transferStarted: boolean;
  loading: boolean;
  error: string | null;
  setScreen: (screen: AppScreen) => void;
  setTeams: (teams: SlackTeam[]) => void;
  setSourceTeam: (team: SlackTeam | null) => void;
  setDestinationTeam: (team: SlackTeam | null) => void;
  setSourceEmojis: (emojis: EmojiEntry[]) => void;
  setDestinationEmojiNames: (names: Set<string>) => void;
  setSelectedEmojiNames: (names: Set<string>) => void;
  setLastClickedIndex: (index: number | null) => void;
  setSearchQuery: (query: string) => void;
  setCollisions: (collisions: CollisionItem[]) => void;
  updateCollisionRename: (originalName: string, renameTo: string) => void;
  toggleCollisionSkip: (originalName: string) => void;
  skipAllCollisions: () => void;
  setSkippedNames: (names: Set<string>) => void;
  setTransferResults: (results: TransferResult[]) => void;
  setTransferStarted: (started: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetFlow: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  screen: 'workspace-picker',
  teams: [],
  sourceTeam: null,
  destinationTeam: null,
  sourceEmojis: [],
  destinationEmojiNames: new Set(),
  selectedEmojiNames: new Set(),
  lastClickedIndex: null,
  searchQuery: '',
  collisions: [],
  skippedNames: new Set(),
  transferResults: [],
  transferStarted: false,
  loading: false,
  error: null,
  setScreen: (screen) =>
    set((state) => ({
      screen,
      transferStarted: screen === 'transfer-progress' ? false : state.transferStarted,
    })),
  setTeams: (teams) => set({ teams }),
  setSourceTeam: (sourceTeam) => set({ sourceTeam }),
  setDestinationTeam: (destinationTeam) => set({ destinationTeam }),
  setSourceEmojis: (sourceEmojis) => set({ sourceEmojis }),
  setDestinationEmojiNames: (destinationEmojiNames) => set({ destinationEmojiNames }),
  setSelectedEmojiNames: (selectedEmojiNames) => set({ selectedEmojiNames }),
  setLastClickedIndex: (lastClickedIndex) => set({ lastClickedIndex }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCollisions: (collisions) => set({ collisions }),
  updateCollisionRename: (originalName, renameTo) =>
    set((state) => ({
      collisions: state.collisions.map((item) =>
        item.originalName === originalName ? { ...item, renameTo } : item,
      ),
    })),
  toggleCollisionSkip: (originalName) =>
    set((state) => {
      const skippedNames = new Set(state.skippedNames);
      const collisions = state.collisions.map((item) => {
        if (item.originalName !== originalName) return item;
        const skipped = !item.skipped;
        if (skipped) skippedNames.add(originalName);
        else skippedNames.delete(originalName);
        return { ...item, skipped };
      });
      return { collisions, skippedNames };
    }),
  skipAllCollisions: () =>
    set((state) => {
      const skippedNames = new Set(state.skippedNames);
      for (const collision of state.collisions) {
        skippedNames.add(collision.originalName);
      }
      return {
        collisions: state.collisions.map((item) => ({ ...item, skipped: true })),
        skippedNames,
      };
    }),
  setSkippedNames: (skippedNames) => set({ skippedNames }),
  setTransferResults: (transferResults) => set({ transferResults }),
  setTransferStarted: (transferStarted) => set({ transferStarted }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  resetFlow: () =>
    set({
      screen: 'workspace-picker',
      sourceTeam: null,
      destinationTeam: null,
      sourceEmojis: [],
      destinationEmojiNames: new Set(),
      selectedEmojiNames: new Set(),
      lastClickedIndex: null,
      searchQuery: '',
      collisions: [],
      skippedNames: new Set(),
      transferResults: [],
      transferStarted: false,
      loading: false,
      error: null,
    }),
}));
