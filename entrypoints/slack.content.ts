import { parseLocalConfig } from '../lib/slack-discovery';

export default defineContentScript({
  matches: ['*://*.slack.com/*'],
  runAt: 'document_idle',
  main() {
    const teams = parseLocalConfig(localStorage.getItem('localConfig_v2'));
    if (teams.length === 0) return;
    void browser.runtime.sendMessage({ type: 'teams-discovered', teams });
  },
});
