import React from 'react';
import ReactDOM from 'react-dom/client';
import { openManagerPage } from '../../lib/messaging';
import './style.css';

function Popup() {
  return (
    <main className="w-72 space-y-4 p-4">
      <div>
        <h1 className="text-lg font-semibold text-white">Slack Emoji Link</h1>
        <p className="text-sm text-slate-400">
          Copy custom emoji between Slack workspaces you are already logged into.
        </p>
      </div>
      <button className="btn btn-primary w-full" onClick={openManagerPage}>
        Open emoji manager
      </button>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
);
