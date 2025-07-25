import type { RA } from '../../../utils/types';
import type { AppResourcesConformation } from '../Aside';
import { exportsForTests } from '../Aside';

const { mutateConformation } = exportsForTests;
// Temp code.
describe('mutateConfirmation', () => {
  test('child replaced', () => {
    const conformations: RA<AppResourcesConformation> = [
      {
        children: [],
        key: 'TestKey1',
      },
      {
        children: [
          {
            children: [],
            key: 'ChildTestKey2_1',
          },
          {
            children: [],
            key: 'ChildTestKey2_2',
          },
        ],
        key: 'TestKey2',
      },
      {
        children: [],
        key: 'TestKey3',
      },
      {
        children: [],
        key: 'TestKey34',
      },
    ];

    const childConformation = {
      children: [
        {
          children: [],
          key: 'ChildTestKey3_1',
        },
        {
          children: [],
          key: 'ChildTestKey3_2',
        },
      ],
      key: 'TestKey3',
    };

    const mutated = mutateConformation(conformations, 'TestKey3', [
      childConformation,
    ]);

    const expected = [
      {
        children: [],
        key: 'TestKey1',
      },
      {
        children: [
          {
            children: [],
            key: 'ChildTestKey2_1',
          },
          {
            children: [],
            key: 'ChildTestKey2_2',
          },
        ],
        key: 'TestKey2',
      },
      {
        children: [childConformation],
        key: 'TestKey3',
      },
      {
        children: [],
        key: 'TestKey34',
      },
    ];

    expect(mutated).toEqual(expected);
  });
});
