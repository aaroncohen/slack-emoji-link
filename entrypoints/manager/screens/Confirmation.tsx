import { useAppStore } from '../store';

export function Confirmation() {
  const transferResults = useAppStore((state) => state.transferResults);
  const resetFlow = useAppStore((state) => state.resetFlow);

  const successes = transferResults.filter((result) => result.status === 'success');
  const failures = transferResults.filter((result) => result.status === 'failed');

  return (
    <section className="card space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Transfer complete</h2>
        <p className="text-sm text-slate-300">
          {successes.length} emoji copied successfully
          {failures.length > 0 ? `, ${failures.length} failed` : ''}.
        </p>
      </div>

      {successes.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">
            Copied emoji
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {successes.map((result) => (
              <div key={result.destinationName} className="emoji-tile emoji-tile-selected">
                {result.url && !result.url.startsWith('alias:') ? (
                  <img src={result.url} alt={result.destinationName} className="h-10 w-10 object-contain" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-800 text-xs">
                    alias
                  </div>
                )}
                <span className="truncate text-xs">:{result.destinationName}:</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {failures.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium uppercase tracking-wide text-rose-300">Failures</h3>
          <ul className="space-y-1 text-sm text-rose-100">
            {failures.map((result) => (
              <li key={`${result.name}-${result.message}`}>
                :{result.destinationName}: — {result.message ?? 'Unknown error'}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex justify-end">
        <button className="btn btn-primary" onClick={resetFlow}>
          Start over
        </button>
      </div>
    </section>
  );
}
