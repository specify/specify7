import React from 'react';

import { listen } from '../utils/events';

export const minimumSplitPaneWidth = 768;
export const splitViewHandleWidth = 10;
const minimumCombinedPaneWidth = minimumSplitPaneWidth * 2;
const combinedHandleAllowance = splitViewHandleWidth * 2;
export const minimumHorizontalSplitWidth =
  minimumCombinedPaneWidth + combinedHandleAllowance;

export function useResponsiveSplitView(preferredHorizontal: boolean): {
  readonly canUseHorizontalSplit: boolean;
  readonly containerRef: React.RefCallback<HTMLDivElement>;
  readonly isHorizontal: boolean;
  readonly maximumPrimaryPaneWidth: number;
} {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const containerRef = React.useCallback(setContainer, [setContainer]);
  const [containerWidth, setContainerWidth] = React.useState(0);

  React.useEffect(() => {
    if (container === null) return undefined;

    const updateWidth = (): void => setContainerWidth(container.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    const removeResizeListener = listen(window, 'resize', updateWidth);
    return (): void => {
      observer.disconnect();
      removeResizeListener();
    };
  }, [container]);

  const canUseHorizontalSplit = containerWidth >= minimumHorizontalSplitWidth;
  return {
    canUseHorizontalSplit,
    containerRef,
    isHorizontal: preferredHorizontal && canUseHorizontalSplit,
    maximumPrimaryPaneWidth: Math.max(
      0,
      containerWidth - minimumSplitPaneWidth - splitViewHandleWidth
    ),
  };
}
