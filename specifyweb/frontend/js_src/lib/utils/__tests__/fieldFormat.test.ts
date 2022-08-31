import type { LiteralField } from '../../components/DataModel/specifyField';
import { definePicklist } from '../../components/PickLists/definitions';
import {
  createPickListItem,
  fetchPickList,
} from '../../components/PickLists/fetch';
import { queryText } from '../../localization/query';
import { requireContext } from '../../tests/helpers';
import { fieldFormat, formatPickList, formatValue } from '../fieldFormat';

requireContext();

jest.mock('../../components/PickLists/fetch', () => {
  const actual = jest.requireActual<{
    readonly definePicklist: typeof definePicklist;
  }>('../../components/PickLists/fetch');
  const pickListFetch = jest.requireActual<{
    readonly createPickListItem: typeof createPickListItem;
  }>('../../components/PickLists/fetch');
  return {
    ...actual,
    unsafeGetPickLists: jest.fn(() => ({
      PickList: actual.definePicklist('PickList', [
        pickListFetch.createPickListItem('Value', 'Title'),
      ]),
    })),
    fetchPickList: jest.fn(async () =>
      actual.definePicklist('PickList', [
        pickListFetch.createPickListItem('Value', 'Title'),
      ])
    ),
  };
});

const field = {
  type: 'java.lang.String',
  getPickList: jest.fn(() => 'PickList'),
} as unknown as LiteralField;

describe('fieldFormat', () => {
  test('ignores undefined values', async () => {
    await expect(fieldFormat(field, {}, undefined)).resolves.toBeUndefined();
  });
  test('ignores null values', async () => {
    await expect(fieldFormat(field, {}, null)).resolves.toBeUndefined();
  });
  test('handles pick list in parser', async () => {
    const field = {
      getPickList: jest.fn(() => undefined),
    } as unknown as LiteralField;
    await expect(
      fieldFormat(field, { pickListName: 'PickList' }, 'Value')
    ).resolves.toBe('Title');
    expect(fetchPickList).toHaveBeenLastCalledWith('PickList');
  });
  test('handles pick list assigned to a field', async () => {
    await expect(fieldFormat(field, undefined, 'Value')).resolves.toBe('Title');
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
    expect(formatPickList(pickList, 'SomeValue')).toBe('Title');
  });
});

test('formatValue resolves parser and formats value', () => {
  const field = { type: 'java.lang.Boolean' } as unknown as LiteralField;
  expect(formatValue(field, undefined, true)).toBe(queryText('yes'));
});

test('syncFieldFormat formats pick list synchronously', () => {
  expect(formatValue(field, undefined, true)).toBe('Value');
});
