import { describe, expect, it } from 'vitest';
import { detectCollisions, suggestUniqueName } from '../lib/collision';
import { filterEmojis, parseEmojiList, resolveTransferMode } from '../lib/emoji';
import { applyRangeSelection } from '../lib/selection';
import { parseRetryAfterMs } from '../lib/throttle';

describe('parseEmojiList', () => {
  it('parses image and alias emoji entries', () => {
    const emojis = parseEmojiList({
      party: 'https://emoji.slack-edge.com/T1/party.png',
      party2: 'alias:party',
    });

    expect(emojis).toHaveLength(2);
    expect(emojis[0]).toMatchObject({ name: 'party', isAlias: false });
    expect(emojis[1]).toMatchObject({ name: 'party2', isAlias: true, aliasFor: 'party' });
  });
});

describe('filterEmojis', () => {
  it('filters by emoji name and alias target', () => {
    const emojis = parseEmojiList({
      cat: 'https://example.com/cat.png',
      kitten: 'alias:cat',
    });
    expect(filterEmojis(emojis, 'cat')).toHaveLength(2);
    expect(filterEmojis(emojis, 'kitten')).toHaveLength(1);
  });
});

describe('collision helpers', () => {
  it('detects destination name collisions', () => {
    const selected = parseEmojiList({ wave: 'https://example.com/wave.png' });
    const collisions = detectCollisions(selected, new Set(['wave']));
    expect(collisions[0].renameTo).toBe('wave-1');
  });

  it('suggests underscore variants when the base uses underscores', () => {
    expect(suggestUniqueName('cool_cat', new Set(['cool_cat']))).toBe('cool_cat_1');
  });
});

describe('selection helpers', () => {
  it('selects a contiguous range inclusively', () => {
    const items = ['a', 'b', 'c', 'd'];
    const selected = applyRangeSelection(items, new Set(['a']), 1, 3);
    expect(Array.from(selected)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('resolveTransferMode', () => {
  it('uses alias mode when the alias target already exists in destination', () => {
    const alias = parseEmojiList({ copy: 'alias:original' })[0];
    expect(resolveTransferMode(alias, new Set(['original']), new Set())).toBe('alias');
  });

  it('falls back to data mode when alias target is missing', () => {
    const alias = parseEmojiList({ copy: 'alias:original' })[0];
    expect(resolveTransferMode(alias, new Set(), new Set())).toBe('data');
  });
});

describe('parseRetryAfterMs', () => {
  it('reads retry-after from response headers', () => {
    const response = new Response(null, { headers: { 'Retry-After': '2' } });
    expect(parseRetryAfterMs(response)).toBe(2000);
  });
});
