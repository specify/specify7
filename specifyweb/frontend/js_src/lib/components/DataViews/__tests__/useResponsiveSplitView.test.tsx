import { act, render, screen } from '@testing-library/react';
import React from 'react';

import {
  minimumHorizontalSplitWidth,
  minimumSplitPaneWidth,
  splitViewHandleWidth,
  useResponsiveSplitView,
} from '../../../hooks/useResponsiveSplitView';

const horizontalAttribute = 'data-horizontal';
const falseValue = 'false';
const splitContainerTestId = 'split-container';

function TestSplit({
  preferredHorizontal,
  showContainer = true,
}: {
  readonly preferredHorizontal: boolean;
  readonly showContainer?: boolean;
}): JSX.Element {
  const {
    canUseHorizontalSplit,
    containerRef,
    isHorizontal,
    maximumPrimaryPaneWidth,
  } = useResponsiveSplitView(preferredHorizontal);
  return showContainer ? (
    <div
      data-can-use-horizontal={canUseHorizontalSplit}
      data-horizontal={isHorizontal}
      data-primary-pane-max-width={maximumPrimaryPaneWidth}
      data-testid={splitContainerTestId}
      ref={containerRef}
    />
  ) : (
    <span />
  );
}

function resizeContainer(width: number): void {
  const container = screen.getByTestId(splitContainerTestId);
  Object.defineProperty(container, 'clientWidth', {
    configurable: true,
    value: width,
  });
  act((): void => {
    window.dispatchEvent(new Event('resize'));
  });
}

test('uses the container width to switch split orientation while resizing', () => {
  render(<TestSplit preferredHorizontal />);
  const container = screen.getByTestId(splitContainerTestId);

  resizeContainer(minimumHorizontalSplitWidth - 1);
  expect(container).toHaveAttribute('data-can-use-horizontal', falseValue);
  expect(container).toHaveAttribute(horizontalAttribute, falseValue);

  resizeContainer(minimumHorizontalSplitWidth);
  expect(container).toHaveAttribute('data-can-use-horizontal', 'true');
  expect(container).toHaveAttribute(horizontalAttribute, 'true');
  expect(container).toHaveAttribute(
    'data-primary-pane-max-width',
    String(minimumSplitPaneWidth + splitViewHandleWidth)
  );
});

test('keeps the preferred vertical orientation when there is enough width', () => {
  const { rerender } = render(<TestSplit preferredHorizontal />);
  const container = screen.getByTestId(splitContainerTestId);
  resizeContainer(minimumHorizontalSplitWidth);

  rerender(<TestSplit preferredHorizontal={false} />);
  expect(container).toHaveAttribute(horizontalAttribute, falseValue);
});

test('remeasures a replacement container after the query editor closes', () => {
  const { rerender } = render(<TestSplit preferredHorizontal />);
  const originalContainer = screen.getByTestId(splitContainerTestId);
  resizeContainer(minimumHorizontalSplitWidth - 1);
  expect(originalContainer).toHaveAttribute(horizontalAttribute, falseValue);

  rerender(<TestSplit preferredHorizontal showContainer={false} />);
  rerender(<TestSplit preferredHorizontal />);

  const replacementContainer = screen.getByTestId(splitContainerTestId);
  expect(replacementContainer).not.toBe(originalContainer);
  resizeContainer(minimumHorizontalSplitWidth);
  expect(replacementContainer).toHaveAttribute(horizontalAttribute, 'true');
});
