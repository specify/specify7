import { render } from '@testing-library/react';
import React from 'react';

import { SplitView } from '../SplitView';

const mockSetState = jest.fn();
const mockSplitterProps = jest.fn();

jest.mock('m-react-splitters', () => {
  const actualReact = jest.requireActual<typeof React>('react');
  const MockSplitter = actualReact.forwardRef(function MockSplitter(
    {
      children,
      ...props
    }: {
      readonly children?: React.ReactNode;
      readonly [key: string]: unknown;
    },
    ref: React.ForwardedRef<{ readonly setState: typeof mockSetState }>
  ): JSX.Element {
    actualReact.useImperativeHandle(
      ref,
      () => ({ setState: mockSetState }),
      []
    );
    mockSplitterProps(props);
    return <div>{children}</div>;
  });
  return { __esModule: true, default: MockSplitter };
});

test('uses the full width for a vertical split', () => {
  render(
    <SplitView
      isHorizontal={false}
      primaryPane={primaryPane}
      primaryPaneKey="primary"
      secondaryPane={secondaryPane}
      secondaryPaneKey="secondary"
    />
  );

  expect(mockSplitterProps).toHaveBeenLastCalledWith(
    expect.objectContaining({
      primaryPaneHeight: '50%',
      primaryPaneWidth: '100%',
      primaryPaneMaxWidth: '100%',
    })
  );
});

const primaryPane = <div />;
const secondaryPane = <div />;

test('clears the dragged pane size when the orientation changes', () => {
  const { rerender } = render(
    <SplitView
      isHorizontal
      primaryPane={primaryPane}
      primaryPaneKey="primary"
      secondaryPane={secondaryPane}
      secondaryPaneKey="secondary"
    />
  );
  expect(mockSetState).not.toHaveBeenCalled();

  rerender(
    <SplitView
      isHorizontal={false}
      primaryPane={primaryPane}
      primaryPaneKey="primary"
      secondaryPane={secondaryPane}
      secondaryPaneKey="secondary"
    />
  );
  expect(mockSetState).toHaveBeenCalledWith({ primaryPane: undefined });
});
