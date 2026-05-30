import type { CollisionItem, EmojiEntry } from './types';

export function detectCollisions(
  selected: EmojiEntry[],
  destinationNames: Set<string>,
  renames: Record<string, string> = {},
): CollisionItem[] {
  const collisions: CollisionItem[] = [];
  const plannedNames = new Set<string>();

  for (const emoji of selected) {
    const desiredName = renames[emoji.name] ?? emoji.name;
    if (destinationNames.has(desiredName) || plannedNames.has(desiredName)) {
      collisions.push({
        originalName: emoji.name,
        destinationName: desiredName,
        renameTo: suggestUniqueName(desiredName, destinationNames, plannedNames),
        skipped: false,
      });
    }
    plannedNames.add(desiredName);
  }

  return collisions;
}

export function suggestUniqueName(
  baseName: string,
  destinationNames: Set<string>,
  plannedNames: Set<string> = new Set(),
): string {
  const separator = baseName.includes('-') ? '-' : baseName.includes('_') ? '_' : '-';
  let index = 1;
  let candidate = `${baseName}${separator}${index}`;
  while (destinationNames.has(candidate) || plannedNames.has(candidate)) {
    index += 1;
    candidate = `${baseName}${separator}${index}`;
  }
  return candidate;
}

export function buildFinalNames(
  selected: EmojiEntry[],
  destinationNames: Set<string>,
  renames: Record<string, string>,
  skipped: Set<string>,
): Map<string, string> {
  const finalNames = new Map<string, string>();
  const plannedNames = new Set<string>();

  for (const emoji of selected) {
    if (skipped.has(emoji.name)) continue;
    let name = renames[emoji.name] ?? emoji.name;
    if (destinationNames.has(name) || plannedNames.has(name)) {
      name = suggestUniqueName(name, destinationNames, plannedNames);
    }
    finalNames.set(emoji.name, name);
    plannedNames.add(name);
  }

  return finalNames;
}
