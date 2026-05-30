import type { SlackTeam } from './types';

export function dedupeTeams(teams: SlackTeam[]): SlackTeam[] {
  const byId = new Map<string, SlackTeam>();
  for (const team of teams) {
    byId.set(team.id, team);
  }
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}
