import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Slack Emoji Link',
    description: 'Copy custom Slack emoji between workspaces you are logged into.',
    permissions: ['storage', 'scripting', 'tabs', 'cookies', 'activeTab'],
    host_permissions: ['*://*.slack.com/*', '*://*.slack-edge.com/*'],
    browser_specific_settings: {
      gecko: {
        id: 'slack-emoji-link@aaroncohen.github.io',
        strict_min_version: '109.0',
        data_collection_permissions: {
          required: ['none'],
        },
      },
    },
  },
});
