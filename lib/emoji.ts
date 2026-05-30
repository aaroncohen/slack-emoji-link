import type { EmojiEntry } from './types';

export function parseEmojiList(emojiMap: Record<string, string>): EmojiEntry[] {
  return Object.entries(emojiMap)
    .map(([name, url]) => {
      if (url.startsWith('alias:')) {
        return {
          name,
          url,
          isAlias: true,
          aliasFor: url.slice('alias:'.length),
        };
      }
      return { name, url, isAlias: false };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function filterEmojis(emojis: EmojiEntry[], query: string): EmojiEntry[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return emojis;
  return emojis.filter(
    (emoji) =>
      emoji.name.toLowerCase().includes(normalized) ||
      (emoji.aliasFor?.toLowerCase().includes(normalized) ?? false),
  );
}

export function resolveTransferMode(
  item: EmojiEntry,
  destinationNames: Set<string>,
  copiedNames: Set<string>,
): 'alias' | 'data' {
  if (!item.isAlias || !item.aliasFor) return 'data';
  if (copiedNames.has(item.aliasFor) || destinationNames.has(item.aliasFor)) {
    return 'alias';
  }
  return 'data';
}
