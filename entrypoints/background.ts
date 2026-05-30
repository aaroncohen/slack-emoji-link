import { dedupeTeams } from '../lib/teams';
import { browser } from 'wxt/browser';
import { parseLocalConfig } from '../lib/slack-discovery';
import { fetchEmojiList, runTransfer } from '../lib/slack-api';
import { STORAGE_TEAMS_KEY, type BackgroundMessage, type SlackTeam, type TransferItem } from '../lib/types';

let transferAbort: AbortController | null = null;
let transferPort: ReturnType<typeof browser.runtime.connect> | null = null;
let transferInProgress = false;

function safePortPost(
  port: ReturnType<typeof browser.runtime.connect>,
  event: unknown,
): void {
  try {
    port.postMessage(event);
  } catch {
    // Port disconnected; transfer may still complete in the background.
  }
}

async function persistTeams(teams: SlackTeam[]): Promise<void> {
  const merged = new Map<string, SlackTeam>();
  const existing = (await browser.storage.local.get(STORAGE_TEAMS_KEY))[STORAGE_TEAMS_KEY] as
    | SlackTeam[]
    | undefined;
  for (const team of existing ?? []) merged.set(team.id, team);
  for (const team of teams) merged.set(team.id, team);
  await browser.storage.local.set({
    [STORAGE_TEAMS_KEY]: Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name)),
  });
}

async function readTeamsFromStorage(): Promise<SlackTeam[]> {
  const stored = (await browser.storage.local.get(STORAGE_TEAMS_KEY))[STORAGE_TEAMS_KEY] as
    | SlackTeam[]
    | undefined;
  return stored ?? [];
}

async function discoverFromSlackTabs(): Promise<SlackTeam[]> {
  const tabs = await browser.tabs.query({ url: ['*://*.slack.com/*'] });
  const discovered: SlackTeam[] = [];

  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      const [{ result }] = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => localStorage.getItem('localConfig_v2'),
      });
      discovered.push(...parseLocalConfig(result as string | null));
    } catch {
      // Tab may not be ready or script blocked.
    }
  }

  if (discovered.length > 0) await persistTeams(discovered);
  return dedupeTeams(discovered);
}

async function refreshWorkspaces(): Promise<SlackTeam[]> {
  const discovered = await discoverFromSlackTabs();
  const stored = await readTeamsFromStorage();
  return dedupeTeams([...stored, ...discovered]);
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
    void (async () => {
      try {
        if (message.type === 'refresh-workspaces') {
          sendResponse({ ok: true, teams: await refreshWorkspaces() });
          return;
        }
        if (message.type === 'list-emoji') {
          const emoji = await fetchEmojiList(message.team);
          sendResponse({ ok: true, emoji });
          return;
        }
        if (message.type === 'start-transfer') {
          sendResponse({ ok: true });
          return;
        }
        sendResponse({ ok: false, error: 'Unknown message type' });
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : 'Unexpected error',
        });
      }
    })();
    return true;
  });

  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== 'transfer') return;

    port.onMessage.addListener((message: { type: string; payload?: unknown }) => {
      void (async () => {
        if (message.type === 'cancel-transfer') {
          transferAbort?.abort();
          return;
        }
        if (message.type !== 'start-transfer') return;

        if (transferInProgress) {
          return;
        }

        const payload = message.payload as {
          destination: SlackTeam;
          destinationNames: string[];
          items: TransferItem[];
        };

        transferPort = port;
        transferAbort?.abort();
        transferAbort = new AbortController();
        transferInProgress = true;

        try {
          await runTransfer({
            destination: payload.destination,
            destinationNames: new Set(payload.destinationNames),
            items: payload.items,
            signal: transferAbort.signal,
            onProgress: (event) => safePortPost(port, event),
          });
        } catch (error) {
          safePortPost(port, {
            type: 'error',
            message: error instanceof Error ? error.message : 'Transfer failed',
          });
        } finally {
          transferInProgress = false;
        }
      })();
    });

    port.onDisconnect.addListener(() => {
      if (transferPort === port) transferPort = null;
    });
  });

  browser.runtime.onMessage.addListener((message) => {
    if (message?.type === 'teams-discovered') {
      void persistTeams(message.teams as SlackTeam[]);
    }
  });

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[STORAGE_TEAMS_KEY]?.newValue) return;
    void browser.runtime.sendMessage({
      type: 'teams-updated',
      teams: changes[STORAGE_TEAMS_KEY].newValue as SlackTeam[],
    });
  });
});
