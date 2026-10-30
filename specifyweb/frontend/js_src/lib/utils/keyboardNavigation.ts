export function getListKeyboardNavigationIndex({
  activeIndex,
  itemCount,
  key,
  wrap = false,
}: {
  readonly activeIndex: number;
  readonly itemCount: number;
  readonly key: string;
  readonly wrap?: boolean;
}): number {
  if (key === 'Home') return 0;
  if (key === 'End') return itemCount - 1;

  const direction = key === 'ArrowDown' ? 1 : -1;
  if (activeIndex === -1) return direction === 1 ? 0 : itemCount - 1;

  const nextIndex = activeIndex + direction;
  if (wrap)
    return nextIndex < 0
      ? itemCount - 1
      : nextIndex >= itemCount
        ? 0
        : nextIndex;
  return Math.min(itemCount - 1, Math.max(0, nextIndex));
}
