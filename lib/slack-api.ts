import { parseRetryAfterMs, RateLimiter, sleep, withRetry } from './throttle';
import { teamApiBase } from './slack-discovery';
import type { SlackTeam, TransferItem, TransferProgressEvent, TransferResult } from './types';

const ADD_INTERVAL_MS = 3000;
const limiter = new RateLimiter(ADD_INTERVAL_MS);

export async function fetchEmojiList(team: SlackTeam): Promise<Record<string, string>> {
  const base = teamApiBase(team);
  const response = await fetch(`${base}/api/emoji.list`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token: team.token }),
  });
  const data = (await response.json()) as {
    ok: boolean;
    emoji?: Record<string, string>;
    error?: string;
  };
  if (!data.ok || !data.emoji) {
    throw new Error(data.error ?? 'Failed to fetch emoji list');
  }
  return data.emoji;
}

async function downloadEmojiBlob(url: string): Promise<Blob> {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error(`Failed to download emoji image (${response.status})`);
  return response.blob();
}

async function addEmojiData(
  team: SlackTeam,
  name: string,
  blob: Blob,
  attempt = 1,
): Promise<void> {
  await limiter.wait();
  const base = teamApiBase(team);
  const form = new FormData();
  form.set('token', team.token);
  form.set('mode', 'data');
  form.set('name', name);
  form.set('image', blob, `${name}.png`);

  const response = await fetch(`${base}/api/emoji.add`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const data = (await response.json()) as { ok: boolean; error?: string; retry_after?: number };
  if (data.error === 'error_name_taken') return;
  if (response.status === 429 || data.error === 'ratelimited') {
    await sleep(parseRetryAfterMs(response, data));
    return addEmojiData(team, name, blob, attempt + 1);
  }
  if (!data.ok) throw new Error(data.error ?? 'Failed to upload emoji');
}

async function addEmojiAlias(team: SlackTeam, name: string, aliasFor: string): Promise<void> {
  await limiter.wait();
  const base = teamApiBase(team);
  const form = new FormData();
  form.set('token', team.token);
  form.set('mode', 'alias');
  form.set('name', name);
  form.set('alias_for', aliasFor);

  const response = await fetch(`${base}/api/emoji.add`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const data = (await response.json()) as { ok: boolean; error?: string; retry_after?: number };
  if (data.error === 'error_name_taken') return;
  if (response.status === 429 || data.error === 'ratelimited') {
    await sleep(parseRetryAfterMs(response, data));
    return addEmojiAlias(team, name, aliasFor);
  }
  if (!data.ok) throw new Error(data.error ?? 'Failed to create emoji alias');
}

export interface TransferContext {
  destination: SlackTeam;
  destinationNames: Set<string>;
  items: TransferItem[];
  signal: AbortSignal;
  onProgress: (event: TransferProgressEvent) => void;
}

export async function runTransfer(context: TransferContext): Promise<TransferResult[]> {
  const { destination, destinationNames, items, signal, onProgress } = context;
  const results: TransferResult[] = [];
  const copiedNames = new Set<string>(destinationNames);

  try {
    const freshEmoji = await fetchEmojiList(destination);
    for (const name of Object.keys(freshEmoji)) {
      destinationNames.add(name);
      copiedNames.add(name);
    }
  } catch {
    // Continue with the snapshot we already have.
  }

  const total = items.length;

  for (let index = 0; index < items.length; index += 1) {
    if (signal.aborted) {
      onProgress({ type: 'cancelled', results });
      return results;
    }

    const item = items[index];
    onProgress({
      type: 'progress',
      index,
      total,
      name: item.destinationName,
      status: 'running',
    });

    try {
      if (copiedNames.has(item.destinationName)) {
        results.push({
          name: item.name,
          destinationName: item.destinationName,
          status: 'success',
          url: item.url,
        });
        onProgress({
          type: 'progress',
          index,
          total,
          name: item.destinationName,
          status: 'success',
        });
        continue;
      }

      if (item.isAlias && item.aliasFor) {
        const aliasTargetExists =
          copiedNames.has(item.aliasFor) || destinationNames.has(item.aliasFor);
        if (aliasTargetExists) {
          await withRetry(() => addEmojiAlias(destination, item.destinationName, item.aliasFor!));
        } else {
          const blob = await downloadEmojiBlob(item.url);
          await withRetry(() => addEmojiData(destination, item.destinationName, blob));
        }
      } else {
        const blob = await downloadEmojiBlob(item.url);
        await withRetry(() => addEmojiData(destination, item.destinationName, blob));
      }

      copiedNames.add(item.destinationName);
      results.push({
        name: item.name,
        destinationName: item.destinationName,
        status: 'success',
        url: item.url,
      });
      onProgress({
        type: 'progress',
        index,
        total,
        name: item.destinationName,
        status: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        name: item.name,
        destinationName: item.destinationName,
        status: 'failed',
        message,
        url: item.url,
      });
      onProgress({
        type: 'progress',
        index,
        total,
        name: item.destinationName,
        status: 'failed',
        message,
      });
    }
  }

  onProgress({ type: 'complete', results, total });
  return results;
}
