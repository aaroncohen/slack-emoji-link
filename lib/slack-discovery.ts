import type { SlackTeam } from './types';

interface LocalConfigTeam {
  id?: string;
  name?: string;
  domain?: string;
  url?: string;
  token?: string;
}

interface LocalConfigV2 {
  teams?: Record<string, LocalConfigTeam>;
}

export function parseLocalConfig(raw: string | null): SlackTeam[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LocalConfigV2;
    const teams = parsed.teams ?? {};
    return Object.values(teams)
      .filter((team): team is LocalConfigTeam & { id: string; token: string } =>
        Boolean(team?.id && team?.token && team.token.startsWith('xoxc-')),
      )
      .map((team) => ({
        id: team.id,
        name: team.name ?? team.domain ?? team.id,
        domain: team.domain ?? extractDomain(team.url) ?? team.id,
        url: team.url ?? `https://${team.domain ?? team.id}.slack.com`,
        token: team.token,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

function extractDomain(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('.slack.com', '');
  } catch {
    return undefined;
  }
}

export function teamApiBase(team: SlackTeam): string {
  return team.url.replace(/\/$/, '');
}
