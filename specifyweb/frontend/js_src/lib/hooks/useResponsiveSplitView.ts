import React from 'react';

import { useElementSize } from './useElementSize';

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
  const { elementWidth, elementRef } = useElementSize();

  const canUseHorizontalSplit = elementWidth >= minimumHorizontalSplitWidth;
  return {
    canUseHorizontalSplit,
    containerRef: elementRef,
    isHorizontal: preferredHorizontal && canUseHorizontalSplit,
    maximumPrimaryPaneWidth: Math.max(
      0,
      elementWidth - minimumSplitPaneWidth - splitViewHandleWidth
    ),
  };
}
