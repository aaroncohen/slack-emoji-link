import { useMemo } from 'react';
import { buildFinalNames } from '../../../lib/collision';
import { useAppStore } from '../store';

export function CollisionResolver() {
  const sourceEmojis = useAppStore((state) => state.sourceEmojis);
  const selectedEmojiNames = useAppStore((state) => state.selectedEmojiNames);
  const destinationEmojiNames = useAppStore((state) => state.destinationEmojiNames);
  const collisions = useAppStore((state) => state.collisions);
  const skippedNames = useAppStore((state) => state.skippedNames);
  const updateCollisionRename = useAppStore((state) => state.updateCollisionRename);
  const toggleCollisionSkip = useAppStore((state) => state.toggleCollisionSkip);
  const skipAllCollisions = useAppStore((state) => state.skipAllCollisions);
  const setScreen = useAppStore((state) => state.setScreen);

  const selected = useMemo(
    () => sourceEmojis.filter((emoji) => selectedEmojiNames.has(emoji.name)),
    [sourceEmojis, selectedEmojiNames],
  );

  const renames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const collision of collisions) {
      map[collision.originalName] = collision.renameTo;
    }
    return map;
  }, [collisions]);

  const finalNames = useMemo(
    () => buildFinalNames(selected, destinationEmojiNames, renames, skippedNames),
    [selected, destinationEmojiNames, renames, skippedNames],
  );

  const transferableCount = finalNames.size;
  const activeCollisions = collisions.filter((collision) => !collision.skipped);

  return (
    <section className="card space-y-4">
      {collisions.length === 0 ? (
        <p className="text-sm text-slate-300">
          No name collisions detected. {transferableCount} emoji ready to transfer.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-300">
              {collisions.length} collision{collisions.length === 1 ? '' : 's'} found. Rename or skip
              each one.
            </p>
            {activeCollisions.length > 0 ? (
              <button className="btn btn-secondary" onClick={skipAllCollisions}>
                Skip all conflicts ({activeCollisions.length})
              </button>
            ) : null}
          </div>
          {collisions.map((collision) => (
            <div
              key={collision.originalName}
              className="grid gap-3 rounded-lg border border-slate-700 bg-slate-950/50 p-3 md:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <p className="text-xs uppercase text-slate-400">Original</p>
                <p className="font-medium">:{collision.originalName}:</p>
              </div>
              <label className="space-y-1 text-sm">
                <span className="text-slate-400">Rename to</span>
                <input
                  className="input"
                  value={collision.renameTo}
                  disabled={collision.skipped}
                  onChange={(event) =>
                    updateCollisionRename(collision.originalName, event.target.value)
                  }
                />
              </label>
              <button
                className="btn btn-secondary self-end"
                onClick={() => toggleCollisionSkip(collision.originalName)}
              >
                {collision.skipped ? 'Include' : 'Skip'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <button className="btn btn-secondary" onClick={() => setScreen('emoji-browser')}>
          Back
        </button>
        <button
          className="btn btn-primary"
          disabled={transferableCount === 0}
          onClick={() => setScreen('transfer-progress')}
        >
          Start transfer ({transferableCount})
        </button>
      </div>
    </section>
  );
}
