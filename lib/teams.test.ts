import { describe, expect, it } from 'vitest';
import { dedupeTeams } from '../lib/teams';
import type { SlackTeam } from '../lib/types';

describe('dedupeTeams', () => {
  it('keeps one entry per workspace id', () => {
    const team: SlackTeam = {
      id: 'T039TF3PJ',
      name: 'Example',
      domain: 'example',
      url: 'https://example.slack.com',
      token: 'xoxc-test',
    };
    expect(dedupeTeams([team, team])).toEqual([team]);
  });
});
