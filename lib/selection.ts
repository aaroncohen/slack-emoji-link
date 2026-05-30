export function applyRangeSelection<T>(
  items: T[],
  selected: Set<T>,
  anchorIndex: number,
  targetIndex: number,
): Set<T> {
  const start = Math.min(anchorIndex, targetIndex);
  const end = Math.max(anchorIndex, targetIndex);
  const next = new Set(selected);
  for (let i = start; i <= end; i += 1) {
    next.add(items[i]);
  }
  return next;
}

export function toggleSelection<T>(selected: Set<T>, item: T): Set<T> {
  const next = new Set(selected);
  if (next.has(item)) next.delete(item);
  else next.add(item);
  return next;
}

export function selectAll<T>(items: T[]): Set<T> {
  return new Set(items);
}
