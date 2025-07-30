import { render, renderHook } from '@testing-library/react';
import React from 'react';
import * as Router from 'react-router-dom';

import { requireContext } from '../../../tests/helpers';
import type { RA, WritableArray } from '../../../utils/types';
import { removeKey } from '../../../utils/utils';
import type { SerializedResource } from '../../DataModel/helperTypes';
import type { SpAppResource } from '../../DataModel/types';
import type { AppResourcesConformation } from '../Aside';
import { exportsForTests } from '../Aside';
import { utilsForTests } from './utils';

requireContext();

const { simpleTree, makeAppResourceNode, makeDirectory } = utilsForTests;

const { useOpenCurrent } = exportsForTests;

function TestComponent(props: {
  readonly args: Parameters<typeof useOpenCurrent>;
}) {
  useOpenCurrent(...props.args);
  return <></>;
}

function TestComponentWrapper(
  props: {
    readonly initialEntries: WritableArray<string>;
  } & { readonly args: Parameters<typeof useOpenCurrent> }
): JSX.Element {
  return (
    <Router.MemoryRouter initialEntries={props.initialEntries}>
      <Router.Routes>
        <Router.Route
          element={<TestComponent {...removeKey(props, 'initialEntries')} />}
          path=":id"
        />
      </Router.Routes>
    </Router.MemoryRouter>
  );
}

describe('useOpenCurrent', () => {
  const makeAppResources = (id: number) =>
    [
      {
        id,
        _tableName: 'SpAppResource',
        resource_uri: '/api/spappresource/10',
      },
    ] as unknown as RA<SerializedResource<SpAppResource>>;

  test('no conformation no tree', () => {
    const setConformation = jest.fn();

    renderHook(() => useOpenCurrent([], setConformation, []));
    expect(setConformation).toHaveBeenCalledTimes(0);
  });

  test('not found in app resources', () => {
    const setConformation = jest.fn();

    const testConformation: RA<AppResourcesConformation> = [];
    render(
      <TestComponentWrapper
        args={[testConformation, setConformation, simpleTree()]}
        initialEntries={[`/10`]}
      />
    );

    expect(setConformation).toHaveBeenCalledTimes(1);
    expect(setConformation.mock.calls.at(-1)).toEqual([[]]);
  });

  test('found in app resources (simple)', () => {
    const setConformation = jest.fn();

    const testConformation: RA<AppResourcesConformation> = [
      {
        key: 'TestKey',
        children: [{ key: 'TestKey2', children: [] }],
      },
    ];

    const tree = [
      makeAppResourceNode(
        'TestLabel',
        'TestKey',
        makeDirectory(1),
        [],
        makeAppResources(10)
      ),
      makeAppResourceNode(
        'TestLabel2',
        'TestKey2',
        makeDirectory(2),
        [],
        makeAppResources(11)
      ),
      makeAppResourceNode('TestLabel3', 'TestKey3', makeDirectory(3), []),
    ];

    render(
      <TestComponentWrapper
        args={[testConformation, setConformation, tree]}
        initialEntries={[`/10`]}
      />
    );

    expect(setConformation).toHaveBeenCalledTimes(1);
    expect(setConformation.mock.lastCall).toEqual([
      [{ key: 'TestKey', children: [] }],
    ]);
  });

  test('found in app resources (nested tree)', () => {
    const setConformation = jest.fn();

    const testConformation: RA<AppResourcesConformation> = [
      {
        key: 'TestKey',
        children: [
          {
            key: 'TestKey2',
            children: [
              { key: 'TestKey3', children: [] },
              {
                key: 'TestKey4',
                children: [
                  {
                    key: 'TestKey5',
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const tree = [
      makeAppResourceNode(
        'TestLabel',
        'TestKey',
        makeDirectory(1),
        [
          makeAppResourceNode('TestLabel2', 'TestKey2', makeDirectory(2), [
            makeAppResourceNode('TestLabel3', 'TestKey3', makeDirectory(3), []),
            makeAppResourceNode('TestLabel4', 'TestKey4', makeDirectory(4), [
              makeAppResourceNode(
                'TestLabel5',
                'TestKey5',
                makeDirectory(5),
                [],
                makeAppResources(10)
              ),
            ]),
          ]),
        ],
        makeAppResources(90)
      ),
      makeAppResourceNode('TestLabel8', 'TestKey10', makeDirectory(3), []),
    ];

    render(
      <TestComponentWrapper
        args={[testConformation, setConformation, tree]}
        initialEntries={[`/10`]}
      />
    );

    expect(setConformation).toHaveBeenCalledTimes(1);
    expect(setConformation.mock.lastCall).toEqual([
      [
        {
          key: 'TestKey',
          children: [
            {
              key: 'TestKey2',
              children: [
                {
                  key: 'TestKey3',
                  children: [],
                },
                {
                  key: 'TestKey4',
                  children: [
                    {
                      key: 'TestKey5',
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    ]);
    /*
     * Expect((setConformation.mock.lastCall)).toEqual([
     *     [{ key: "TestKey", children: [] }]
     * ]);
     */
  });
});
