import { act, waitFor } from '@testing-library/react';
import type { SafeLocation } from 'history';
import React from 'react';
import * as Router from 'react-router-dom';

import { mount } from '../../tests/reactUtils';
import { useSearchParameter } from '../navigation';

let mockNavigate: jest.Mock;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('useSearchParameter', () => {
  beforeEach(() => {
    mockNavigate = jest.fn();
  });

  const initialEntry = {
    pathname: '/specify/overlay/merge/Agent/',
    search: '?records=4%2C5%2C6%2C8%2C7',
    hash: '',
    state: {
      type: 'BackgroundLocation',
      location: {
        pathname: '/specify/query/new/agent/',
        search: '',
        hash: '',
        state: null,
      },
    },
  };

  // This test component is needed because we need MemoryRouter
  function TestSearchParameter({
    rawName,
    overrideLocation,
    onStateSet: handleStateSet,
    onSetterSet: handleSetterSet,
  }: {
    readonly rawName: string | undefined;
    readonly overrideLocation?: SafeLocation;
    readonly onStateSet: (value: string | undefined) => void;
    readonly onSetterSet: (value: (old: string | undefined) => void) => void;
  }) {
    const [state, setState] = useSearchParameter(rawName, overrideLocation);
    React.useEffect(() => {
      handleStateSet(state);
    }, [state]);

    React.useEffect(() => {
      handleSetterSet(setState);
    }, [setState]);

    return <></>;
  }

  test('search parameter gets set', async () => {
    const onStateSet = jest.fn();
    const onSetterSet = jest.fn();

    mount(
      <Router.MemoryRouter initialEntries={[initialEntry]}>
        <TestSearchParameter
          rawName="records"
          onSetterSet={onSetterSet}
          onStateSet={onStateSet}
        />
      </Router.MemoryRouter>
    );

    await waitFor(() => {
      expect(onStateSet).toHaveBeenLastCalledWith('4,5,6,8,7');
    });
  });

  test('navigate gets called on parameter change', async () => {
    const onStateSet = jest.fn();
    const onSetterSet = jest.fn();

    mount(
      <Router.MemoryRouter initialEntries={[initialEntry]}>
        <TestSearchParameter
          rawName="records"
          onSetterSet={onSetterSet}
          onStateSet={onStateSet}
        />
      </Router.MemoryRouter>
    );

    await waitFor(() => {
      expect(onStateSet).toHaveBeenLastCalledWith('4,5,6,8,7');
    });

    await act(() => {
      onSetterSet.mock.calls.at(-1).at(0)('4,5,8');
    });

    await waitFor(() => {
      expect(mockNavigate.mock.calls.at(-1)).toEqual([
        '/specify/overlay/merge/Agent/?records=4%2C5%2C8',
        {
          replace: true,
          state: {
            location: {
              hash: '',
              pathname: '/specify/query/new/agent/',
              search: '',
              state: null,
            },
            type: 'BackgroundLocation',
          },
        },
      ]);
    });
  });

  test('undefined name get handled', async () => {
    const onStateSet = jest.fn();
    const onSetterSet = jest.fn();

    mount(
      <Router.MemoryRouter initialEntries={[initialEntry]}>
        <TestSearchParameter
          rawName={undefined}
          onSetterSet={onSetterSet}
          onStateSet={onStateSet}
        />
      </Router.MemoryRouter>
    );

    await waitFor(() => {
      expect(onStateSet).toHaveBeenLastCalledWith(undefined);
    });

    expect(() => onSetterSet.mock.calls.at(-1).at(0)('4,5,8')).toThrow(
      'Tried to change query string without providing a name'
    );
  });

  test('navigate gets called on parameter change (undefined case)', async () => {
    const onStateSet = jest.fn();
    const onSetterSet = jest.fn();

    mount(
      <Router.MemoryRouter initialEntries={[initialEntry]}>
        <TestSearchParameter
          rawName="records"
          onSetterSet={onSetterSet}
          onStateSet={onStateSet}
        />
      </Router.MemoryRouter>
    );

    await waitFor(() => {
      expect(onStateSet).toHaveBeenLastCalledWith('4,5,6,8,7');
    });

    await act(() => {
      onSetterSet.mock.calls.at(-1).at(0)(undefined);
    });

    await waitFor(() => {
      expect(mockNavigate.mock.calls.at(-1)).toEqual([
        '/specify/overlay/merge/Agent/?records=4%2C5%2C6%2C8%2C7',
        {
          replace: true,
          state: {
            location: {
              hash: '',
              pathname: '/specify/query/new/agent/',
              search: '',
              state: null,
            },
            type: 'BackgroundLocation',
          },
        },
      ]);
    });
  });
});
