import { browser } from 'wxt/browser';
import type {
  BackgroundMessage,
  BackgroundResponse,
  SlackTeam,
  TransferItem,
  TransferProgressEvent,
} from './types';

export async function sendBackgroundMessage(message: BackgroundMessage): Promise<BackgroundResponse> {
  return browser.runtime.sendMessage(message) as Promise<BackgroundResponse>;
}

export function openTransferPort(
  onEvent: (event: TransferProgressEvent) => void,
): {
  port: browser.runtime.Port;
  start: (payload: {
    destination: SlackTeam;
    destinationNames: string[];
    items: TransferItem[];
  }) => void;
  cancel: () => void;
} {
  const port = browser.runtime.connect({ name: 'transfer' });
  port.onMessage.addListener(onEvent);
  return {
    port,
    start: (payload) => port.postMessage({ type: 'start-transfer', payload }),
    cancel: () => port.postMessage({ type: 'cancel-transfer' }),
  };
}

export function openManagerPage(): void {
  const url = browser.runtime.getURL('/manager.html');
  void browser.tabs.create({ url });
}
