import { useEffect } from 'react';
import { browser } from 'wxt/browser';
import { useAppStore } from './store';
import { sendBackgroundMessage } from '../../lib/messaging';
import type { SlackTeam } from '../../lib/types';
import { WorkspacePicker } from './screens/WorkspacePicker';
import { EmojiBrowser } from './screens/EmojiBrowser';
import { CollisionResolver } from './screens/CollisionResolver';
import { TransferProgress } from './screens/TransferProgress';
import { Confirmation } from './screens/Confirmation';
import { AppFooter } from '../shared/AppFooter';

const SCREEN_TITLES = {
  'workspace-picker': 'Choose workspaces',
  'emoji-browser': 'Select emoji',
  'collision-resolver': 'Resolve name collisions',
  'transfer-progress': 'Transfer in progress',
  confirmation: 'Transfer complete',
} as const;

export default function App() {
  const screen = useAppStore((state) => state.screen);
  const setTeams = useAppStore((state) => state.setTeams);
  const setLoading = useAppStore((state) => state.setLoading);
  const setError = useAppStore((state) => state.setError);
  const error = useAppStore((state) => state.error);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const response = await sendBackgroundMessage({ type: 'refresh-workspaces' });
      setLoading(false);
      if (response.ok && response.teams) setTeams(response.teams);
      else if (!response.ok) setError(response.error);
    })();

    const onMessage = (message: { type?: string; teams?: SlackTeam[] }) => {
      if (message?.type === 'teams-updated' && message.teams) {
        setTeams(message.teams);
      }
    };
    browser.runtime.onMessage.addListener(onMessage);
    return () => browser.runtime.onMessage.removeListener(onMessage);
  }, [setTeams, setLoading, setError]);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">Slack Emoji Link</p>
        <h1 className="text-3xl font-semibold text-white">{SCREEN_TITLES[screen]}</h1>
        <p className="text-sm text-slate-400">
          Copy custom emoji between Slack workspaces using your existing browser sessions.
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {screen === 'workspace-picker' ? <WorkspacePicker /> : null}
      {screen === 'emoji-browser' ? <EmojiBrowser /> : null}
      {screen === 'collision-resolver' ? <CollisionResolver /> : null}
      {screen === 'transfer-progress' ? <TransferProgress /> : null}
      {screen === 'confirmation' ? <Confirmation /> : null}

      <AppFooter />
    </div>
  );
}
