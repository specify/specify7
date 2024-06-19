import type { LiteralField } from '../../components/DataModel/specifyField';
import {
  exportsForTests,
  fieldFormat,
  syncFieldFormat,
} from '../../components/Formatters/fieldFormat';
import {
  createPickListItem,
  definePicklist,
} from '../../components/PickLists/definitions';
import { fetchPickList } from '../../components/PickLists/fetch';
import { queryText } from '../../localization/query';
import { requireContext } from '../../tests/helpers';

requireContext();

const { formatValue, formatPickList } = exportsForTests;

jest.mock('../../components/PickLists/fetch', () => {
  const definitions = jest.requireActual<{
    readonly definePicklist: typeof definePicklist;
    readonly createPickListItem: typeof createPickListItem;
  }>('../../components/PickLists/definitions');
  const actual = jest.requireActual<{}>('../../components/PickLists/fetch');
  return {
    ...actual,
    fetchPickList: jest.fn(async () =>
      definitions.definePicklist('PickList', [
        definitions.createPickListItem('Value', 'Title'),
      ])
    ),
  };
});

jest.mock('../../components/PickLists/definitions', () => {
  const actual = jest.requireActual<{
    readonly definePicklist: typeof definePicklist;
    readonly createPickListItem: typeof createPickListItem;
  }>('../../components/PickLists/definitions');
  return {
    ...actual,
    unsafeGetPickLists: jest.fn(() => ({
      PickList: actual.definePicklist('PickList', [
        actual.createPickListItem('Value', 'Title'),
      ]),
    })),
  };
});

const field = {
  type: 'java.lang.String',
  getPickList: jest.fn(() => 'PickList'),
} as unknown as LiteralField;

describe('fieldFormat', () => {
  test('ignores undefined values', async () => {
    await expect(fieldFormat(field, undefined)).resolves.toBe('');
  });
  test('ignores null values', async () => {
    await expect(fieldFormat(field, null)).resolves.toBe('');
  });
  test('handles pick list in parser', async () => {
    const field = {
      getPickList: jest.fn(() => undefined),
    } as unknown as LiteralField;
    await expect(
      fieldFormat(field, 'Value', { pickListName: 'PickList' })
    ).resolves.toBe('Title');
    expect(fetchPickList).toHaveBeenLastCalledWith('PickList');
  });
  test('handles pick list assigned to a field', async () => {
    await expect(fieldFormat(field, 'Value')).resolves.toBe('Title');
    expect(fetchPickList).toHaveBeenLastCalledWith('PickList');
  });
});

describe('formatPickList', () => {
  test('return pick list item title on correct value', () => {
    const pickList = definePicklist('PickList', [
      createPickListItem('Value', 'Title'),
    ]);
    expect(formatPickList(pickList, 'Value')).toBe('Title');
  });
  test('return undefined on invalid value', () => {
    const pickList = definePicklist('PickList', []);
    expect(formatPickList(pickList, 'SomeValue')).toBeUndefined();
  });
});

test('formatValue resolves parser and formats value', () => {
  const field = { type: 'java.lang.Boolean' } as unknown as LiteralField;
  expect(formatValue(field, undefined, true)).toBe(queryText.yes());
});

test('syncFieldFormat formats pick list synchronously', () => {
  expect(syncFieldFormat(field, 'Value')).toBe('Title');
});
