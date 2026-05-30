import { useEffect, useMemo, useRef, useState } from 'react';
import { buildFinalNames } from '../../../lib/collision';
import { openTransferPort } from '../../../lib/messaging';
import type { TransferItem, TransferProgressEvent, TransferResult } from '../../../lib/types';
import { useAppStore } from '../store';

export function TransferProgress() {
  const destinationTeam = useAppStore((state) => state.destinationTeam);
  const sourceEmojis = useAppStore((state) => state.sourceEmojis);
  const selectedEmojiNames = useAppStore((state) => state.selectedEmojiNames);
  const destinationEmojiNames = useAppStore((state) => state.destinationEmojiNames);
  const collisions = useAppStore((state) => state.collisions);
  const skippedNames = useAppStore((state) => state.skippedNames);
  const setTransferResults = useAppStore((state) => state.setTransferResults);
  const transferStarted = useAppStore((state) => state.transferStarted);
  const setTransferStarted = useAppStore((state) => state.setTransferStarted);
  const setScreen = useAppStore((state) => state.setScreen);

  const [events, setEvents] = useState<TransferProgressEvent[]>([]);
  const [running, setRunning] = useState(true);
  const cancelRef = useRef<(() => void) | null>(null);
  const startingRef = useRef(false);

  const items = useMemo(() => {
    const selected = sourceEmojis.filter((emoji) => selectedEmojiNames.has(emoji.name));
    const renames = Object.fromEntries(
      collisions.map((collision) => [collision.originalName, collision.renameTo]),
    );
    const finalNames = buildFinalNames(selected, destinationEmojiNames, renames, skippedNames);
    const transferItems: TransferItem[] = [];
    for (const emoji of selected) {
      const destinationName = finalNames.get(emoji.name);
      if (!destinationName) continue;
      transferItems.push({
        name: emoji.name,
        url: emoji.url,
        isAlias: emoji.isAlias,
        aliasFor: emoji.aliasFor,
        destinationName,
      });
    }
    return transferItems;
  }, [
    sourceEmojis,
    selectedEmojiNames,
    destinationEmojiNames,
    collisions,
    skippedNames,
  ]);

  useEffect(() => {
    if (!destinationTeam || items.length === 0 || startingRef.current || transferStarted) return;
    startingRef.current = true;
    setTransferStarted(true);

    const itemsSnapshot = items;
    const { start, cancel } = openTransferPort((event) => {
      setEvents((current) => [...current, event]);
      if (event.type === 'complete' || event.type === 'cancelled' || event.type === 'error') {
        setRunning(false);
        if (event.results) {
          setTransferResults(event.results);
          setScreen('confirmation');
        } else if (event.type === 'error') {
          setTransferResults([
            {
              name: 'transfer',
              destinationName: 'transfer',
              status: 'failed',
              message: event.message,
            },
          ]);
          setScreen('confirmation');
        }
      }
    });

    cancelRef.current = cancel;
    start({
      destination: destinationTeam,
      destinationNames: Array.from(destinationEmojiNames),
      items: itemsSnapshot,
    });
  }, [
    destinationTeam,
    destinationEmojiNames,
    items,
    selectedEmojiNames.size,
    setScreen,
    setTransferResults,
    setTransferStarted,
    transferStarted,
  ]);

  const progressByItem = useMemo(() => {
    const byName = new Map<string, { status: string; message?: string }>();
    for (const event of events) {
      if (event.type !== 'progress' || !event.name) continue;
      byName.set(event.name, { status: event.status ?? 'pending', message: event.message });
    }
    return byName;
  }, [events]);

  const latest = events.at(-1);
  const completed = items.filter((item) => {
    const status = progressByItem.get(item.destinationName)?.status;
    return status === 'success' || status === 'failed';
  }).length;
  const total = latest?.total ?? items.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="card space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>{running ? 'Transferring emoji in background worker…' : 'Transfer finished'}</span>
          <span>
            {completed}/{total}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950/40 p-3 text-sm">
        {items.map((item) => {
          const progress = progressByItem.get(item.destinationName);
          const status = progress?.status ?? 'pending';
          return (
            <div key={item.destinationName} className="flex justify-between gap-3">
              <span>:{item.destinationName}:</span>
              <span
                className={
                  status === 'success'
                    ? 'text-emerald-300'
                    : status === 'failed'
                      ? 'text-rose-300'
                      : status === 'running'
                        ? 'text-slate-300'
                        : 'text-slate-500'
                }
              >
                {status}
                {progress?.message ? ` — ${progress.message}` : ''}
              </span>
            </div>
          );
        })}
      </div>

      {running ? (
        <div className="flex justify-end">
          <button className="btn btn-secondary" onClick={() => cancelRef.current?.()}>
            Cancel
          </button>
        </div>
      ) : null}
    </section>
  );
}
