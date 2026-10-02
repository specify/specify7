import { render } from '@testing-library/react';
import React from 'react';

import { SplitView } from '../SplitView';

const mockSetState = jest.fn();

jest.mock('m-react-splitters', () => {
  const actualReact = jest.requireActual<typeof React>('react');
  const MockSplitter = actualReact.forwardRef(function MockSplitter(
    { children }: { readonly children?: React.ReactNode },
    ref: React.ForwardedRef<{ readonly setState: typeof mockSetState }>
  ): JSX.Element {
    actualReact.useImperativeHandle(
      ref,
      () => ({ setState: mockSetState }),
      []
    );
    return <div>{children}</div>;
  });
  return { __esModule: true, default: MockSplitter };
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
