import { useEffect, useMemo } from 'react';
import type { EmojiEntry } from '../../../lib/types';
import { detectCollisions } from '../../../lib/collision';
import { filterEmojis, parseEmojiList } from '../../../lib/emoji';
import { sendBackgroundMessage } from '../../../lib/messaging';
import { applyRangeSelection, toggleSelection } from '../../../lib/selection';
import { useAppStore } from '../store';

function emojiPreviewUrl(url: string): string {
  return url.startsWith('alias:') ? '' : url;
}

export function EmojiBrowser() {
  const sourceTeam = useAppStore((state) => state.sourceTeam);
  const sourceEmojis = useAppStore((state) => state.sourceEmojis);
  const selectedEmojiNames = useAppStore((state) => state.selectedEmojiNames);
  const lastClickedIndex = useAppStore((state) => state.lastClickedIndex);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const loading = useAppStore((state) => state.loading);
  const setSourceEmojis = useAppStore((state) => state.setSourceEmojis);
  const setSelectedEmojiNames = useAppStore((state) => state.setSelectedEmojiNames);
  const setLastClickedIndex = useAppStore((state) => state.setLastClickedIndex);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const setDestinationEmojiNames = useAppStore((state) => state.setDestinationEmojiNames);
  const setCollisions = useAppStore((state) => state.setCollisions);
  const setSkippedNames = useAppStore((state) => state.setSkippedNames);
  const setScreen = useAppStore((state) => state.setScreen);
  const setLoading = useAppStore((state) => state.setLoading);
  const setError = useAppStore((state) => state.setError);
  const destinationTeam = useAppStore((state) => state.destinationTeam);

  useEffect(() => {
    if (!sourceTeam) return;
    void (async () => {
      setLoading(true);
      setError(null);
      const response = await sendBackgroundMessage({ type: 'list-emoji', team: sourceTeam });
      setLoading(false);
      if (!response.ok || !response.emoji) {
        setError(response.ok ? 'No emoji returned' : response.error);
        return;
      }
      setSourceEmojis(parseEmojiList(response.emoji));
    })();
  }, [sourceTeam, setSourceEmojis, setLoading, setError]);

  const filteredEmojis = useMemo(
    () => filterEmojis(sourceEmojis, searchQuery),
    [sourceEmojis, searchQuery],
  );

  function handleEmojiClick(
    event: React.MouseEvent,
    emojiName: string,
    index: number,
  ): void {
    if (event.shiftKey && lastClickedIndex !== null) {
      setSelectedEmojiNames(
        applyRangeSelection(
          filteredEmojis.map((item) => item.name),
          selectedEmojiNames,
          lastClickedIndex,
          index,
        ),
      );
      return;
    }

    if (event.metaKey || event.ctrlKey) {
      setSelectedEmojiNames(toggleSelection(selectedEmojiNames, emojiName));
      setLastClickedIndex(index);
      return;
    }

    setSelectedEmojiNames(toggleSelection(selectedEmojiNames, emojiName));
    setLastClickedIndex(index);
  }

  function selectAllFiltered() {
    setSelectedEmojiNames(new Set(filteredEmojis.map((emoji) => emoji.name)));
  }

  function clearSelection() {
    setSelectedEmojiNames(new Set());
    setLastClickedIndex(null);
  }

  async function proceedToCollisions(allEmoji: EmojiEntry[], namesToTransfer = selectedEmojiNames) {
    if (!destinationTeam) return;
    setLoading(true);
    setError(null);
    const response = await sendBackgroundMessage({ type: 'list-emoji', team: destinationTeam });
    setLoading(false);
    if (!response.ok || !response.emoji) {
      setError(response.ok ? 'No destination emoji returned' : response.error);
      return;
    }
    const destinationNames = new Set(Object.keys(response.emoji));
    setDestinationEmojiNames(destinationNames);
    const selected = allEmoji.filter((emoji) => namesToTransfer.has(emoji.name));
    setCollisions(detectCollisions(selected, destinationNames));
    setSkippedNames(new Set());
    setScreen('collision-resolver');
  }

  async function continueWithSelection() {
    const selected = sourceEmojis.filter((emoji) => selectedEmojiNames.has(emoji.name));
    if (selected.length === 0) return;
    await proceedToCollisions(sourceEmojis);
  }

  async function copyEntireWorkspace() {
    const allNames = new Set(sourceEmojis.map((emoji) => emoji.name));
    setSelectedEmojiNames(allNames);
    await proceedToCollisions(sourceEmojis, allNames);
  }

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input max-w-md"
          placeholder="Search emoji by name"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <button className="btn btn-secondary" onClick={selectAllFiltered}>
          Select all filtered
        </button>
        <button className="btn btn-secondary" onClick={clearSelection}>
          Clear selection
        </button>
        <button className="btn btn-secondary" onClick={() => void copyEntireWorkspace()} disabled={loading}>
          Copy entire workspace
        </button>
        <span className="badge">{selectedEmojiNames.size} selected</span>
      </div>

      <p className="text-xs text-slate-400">
        Click to toggle. Shift+click selects a contiguous range. Cmd/Ctrl+click toggles without
        changing the range anchor.
      </p>

      {loading && sourceEmojis.length === 0 ? (
        <p className="text-sm text-slate-300">Loading emoji…</p>
      ) : null}

      <div className="grid max-h-[60vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-4 lg:grid-cols-6">
        {filteredEmojis.map((emoji, index) => {
          const selected = selectedEmojiNames.has(emoji.name);
          const preview = emojiPreviewUrl(emoji.url);
          return (
            <button
              key={emoji.name}
              type="button"
              className={`emoji-tile ${selected ? 'emoji-tile-selected' : ''}`}
              onClick={(event) => handleEmojiClick(event, emoji.name, index)}
            >
              {preview ? (
                <img src={preview} alt={emoji.name} className="h-10 w-10 object-contain" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-800 text-xs">
                  alias
                </div>
              )}
              <span className="truncate text-xs text-slate-200">:{emoji.name}:</span>
              {emoji.isAlias ? <span className="badge">alias → {emoji.aliasFor}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between">
        <button className="btn btn-secondary" onClick={() => setScreen('workspace-picker')}>
          Back
        </button>
        <button
          className="btn btn-primary"
          disabled={selectedEmojiNames.size === 0 || loading}
          onClick={() => void continueWithSelection()}
        >
          Continue ({selectedEmojiNames.size})
        </button>
      </div>
    </section>
  );
}
