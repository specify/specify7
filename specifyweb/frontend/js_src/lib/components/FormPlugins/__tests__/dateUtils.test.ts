import { mockTime, requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import { getDateParser } from '../dateUtils';
import { dateTestUtils } from './dateTestUtils';

const { dateFieldName } = dateTestUtils;

mockTime();
requireContext();

describe('getDateParser', () => {
  test('full', () =>
    expect(
      getDateParser(
        tables.CollectionObject.strictGetLiteralField(dateFieldName),
        'full',
        new Date()
      )
    ).toMatchInlineSnapshot(`
      {
        "formatters": [
          [Function],
          [Function],
        ],
        "max": "9999-12-31",
        "minLength": 10,
        "parser": [Function],
        "required": false,
        "title": "Required Format: MM/DD/YYYY.",
        "type": "date",
        "validators": [
          [Function],
        ],
        "value": "2022-08-31",
        "whiteSpaceSensitive": false,
      }
    `));

  test('month-year', () =>
    expect(getDateParser(undefined, 'month-year', undefined))
      .toMatchInlineSnapshot(`
        {
          "value": undefined,
        }
      `));

  test('year', () =>
    expect(
      getDateParser(
        tables.CollectionObject.strictGetLiteralField(dateFieldName),
        'year',
        undefined
      )
    ).toMatchInlineSnapshot(`
      {
        "formatters": [
          [Function],
        ],
        "max": 9999,
        "min": 1,
        "required": false,
        "step": 1,
        "type": "number",
        "validators": [
          [Function],
        ],
        "value": undefined,
        "whiteSpaceSensitive": false,
      }
    `));
});
