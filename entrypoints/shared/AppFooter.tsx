const SITE_URL = 'https://aaroncohen.github.io/slack-emoji-link/';
const PRIVACY_URL = 'https://aaroncohen.github.io/slack-emoji-link/privacy.html';
const REPO_URL = 'https://github.com/aaroncohen/slack-emoji-link';

export function AppFooter() {
  return (
    <footer className="mt-auto space-y-2 pt-6 text-center text-xs text-slate-500">
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <a
          className="text-indigo-400 hover:text-indigo-300"
          href={SITE_URL}
          target="_blank"
          rel="noreferrer"
        >
          Project site
        </a>
        <span aria-hidden="true">·</span>
        <a
          className="text-indigo-400 hover:text-indigo-300"
          href={PRIVACY_URL}
          target="_blank"
          rel="noreferrer"
        >
          Privacy policy
        </a>
        <span aria-hidden="true">·</span>
        <a
          className="text-indigo-400 hover:text-indigo-300"
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </p>
      <p>Totally vibecoded without much effort by Aaron</p>
    </footer>
  );
}
