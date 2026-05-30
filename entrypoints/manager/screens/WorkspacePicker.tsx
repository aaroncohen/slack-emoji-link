import { useAppStore } from '../store';
import { sendBackgroundMessage } from '../../../lib/messaging';

export function WorkspacePicker() {
  const teams = useAppStore((state) => state.teams);
  const sourceTeam = useAppStore((state) => state.sourceTeam);
  const destinationTeam = useAppStore((state) => state.destinationTeam);
  const loading = useAppStore((state) => state.loading);
  const setTeams = useAppStore((state) => state.setTeams);
  const setSourceTeam = useAppStore((state) => state.setSourceTeam);
  const setDestinationTeam = useAppStore((state) => state.setDestinationTeam);
  const setScreen = useAppStore((state) => state.setScreen);
  const setError = useAppStore((state) => state.setError);
  const setLoading = useAppStore((state) => state.setLoading);

  const sameTeamSelected =
    sourceTeam && destinationTeam && sourceTeam.id === destinationTeam.id;

  async function refreshWorkspaces() {
    setLoading(true);
    setError(null);
    const response = await sendBackgroundMessage({ type: 'refresh-workspaces' });
    setLoading(false);
    if (response.ok && response.teams) setTeams(response.teams);
    else setError(response.ok ? null : response.error);
  }

  function continueToBrowser() {
    if (!sourceTeam || !destinationTeam || sameTeamSelected) return;
    setScreen('emoji-browser');
  }

  return (
    <section className="card space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-300">
          {teams.length > 0
            ? `${teams.length} workspace${teams.length === 1 ? '' : 's'} detected`
            : 'No workspaces detected yet'}
        </p>
        <button className="btn btn-secondary" onClick={() => void refreshWorkspaces()} disabled={loading}>
          Refresh workspaces
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-600 bg-slate-950/60 p-6 text-sm text-slate-300">
          Open Slack in another tab and sign into the workspaces you want to use, then click
          <span className="font-medium text-white"> Refresh workspaces</span>.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="text-slate-300">Source workspace</span>
          <select
            className="select"
            value={sourceTeam?.id ?? ''}
            onChange={(event) => {
              const team = teams.find((item) => item.id === event.target.value) ?? null;
              setSourceTeam(team);
            }}
          >
            <option value="">Select source</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.domain})
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="text-slate-300">Destination workspace</span>
          <select
            className="select"
            value={destinationTeam?.id ?? ''}
            onChange={(event) => {
              const team = teams.find((item) => item.id === event.target.value) ?? null;
              setDestinationTeam(team);
            }}
          >
            <option value="">Select destination</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.domain})
              </option>
            ))}
          </select>
        </label>
      </div>

      {sameTeamSelected ? (
        <p className="text-sm text-amber-300">Source and destination must be different workspaces.</p>
      ) : null}

      <div className="flex justify-end">
        <button
          className="btn btn-primary"
          disabled={!sourceTeam || !destinationTeam || Boolean(sameTeamSelected)}
          onClick={continueToBrowser}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
