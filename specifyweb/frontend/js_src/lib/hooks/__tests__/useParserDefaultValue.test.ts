import { renderHook } from '@testing-library/react';

import { tables } from '../../components/DataModel/tables';
import { mockTime, requireContext } from '../../tests/helpers';
import type { Parser } from '../../utils/parser/definitions';
import { useParser } from '../resource';
import { useParserDefaultValue } from '../useParserDefaultValue';

mockTime();
requireContext();

describe("useParserDefaultValue", ()=>{
  const getFakeDate = ()=>(new Date()).toISOString().slice(0, 10);

  test('Simple parser', () => {
    const resource = new tables.ExchangeOut.Resource();
    const field = tables.ExchangeOut.strictGetLiteralField('number1');
    expect(resource.get(field.name as never)).toBeUndefined();
    const parser: Parser = {
      type: 'number',
      value: '2',
    };
    renderHook(() => useParserDefaultValue(resource, field, parser));

    expect(resource.get(field.name as never)).toBe('2');
  });


  test('Only overwrites when needed', () => {
    const resource = new tables.ExchangeOut.Resource({
      number1: 42,
    });
    const field = tables.ExchangeOut.strictGetLiteralField('number1');
    expect(resource.get(field.name as never)).toBe(42);
    const parser: Parser = {
      type: 'number',
      value: '2',
    };
    renderHook(() => useParserDefaultValue(resource, field, parser));

    expect(resource.get(field.name as never)).toBe(42);
  });

  test("Doesn't override an existing resource's values", () => {
    const resource = new tables.ExchangeOut.Resource({ id: 1 });
    const field = tables.ExchangeOut.strictGetLiteralField('number1');
    expect(resource.get(field.name as never)).toBeUndefined();
    const parser: Parser = {
      type: 'number',
      value: '2',
    };
    renderHook(() => useParserDefaultValue(resource, field, parser));

    expect(resource.get(field.name as never)).toBeUndefined();
  });

  test("Doesn't assume default value", () => {
    const resource = new tables.Accession.Resource();
    const field = tables.Accession.strictGetLiteralField('integer1');
    expect(resource.get(field.name as never)).toBeUndefined();
    const { result } = renderHook(() => useParser(field, resource));

    renderHook(() => useParserDefaultValue(resource, field, result.current));

    expect(resource.get(field.name as never)).toBeUndefined();
  });

  test('CatalogNumber parser', () => {
    const resource = new tables.CollectionObject.Resource();
    const field = tables.CollectionObject.strictGetLiteralField('catalogNumber');
    expect(resource.get('catalogNumber')).toBeUndefined();
    const { result } = renderHook(() => useParser(field, resource));
    renderHook(() => useParserDefaultValue(resource, field, result.current));

    expect(resource.get(field.name as never)).toBe('#########');
  });

  test('Regex parser', () => {
    const resource = new tables.CollectingEvent.Resource();
    const field = tables.CollectingEvent.strictGetLiteralField('text1');
    expect(resource.get(field.name as never)).toBeUndefined();
    const parser: Parser = {
      type: 'text',
      value: 'ResourceValue-3',
      pattern: new RegExp("^ResourceValue-\d+$", 'u')
    };
    renderHook(() => useParserDefaultValue(resource, field, parser));

    expect(resource.get(field.name as never)).toBe('ResourceValue-3');
  });

  /**
   * Notes:
   * The following tests are added to improve branch and statement coverage within 
   * the useParserDefaultValue.
   */


  test('Checkbox parser', () => {
    const resource = new tables.CollectingEventAttribute.Resource();
    const field = tables.CollectingEventAttribute.strictGetLiteralField('yesno1');
    expect(resource.get(field.name as never)).toBeUndefined();
    const parser: Parser = {
      type: 'checkbox',
      value: true,
    };
    renderHook(() => useParserDefaultValue(resource, field, parser));

    expect(resource.get(field.name as never)).toBe(true);
  });

  test('Checkbox parser overrides empty value', () => {
    const resource = new tables.CollectingEventAttribute.Resource();
    const field = tables.CollectingEventAttribute.strictGetLiteralField('yesno1');
    resource.set(field.name as never, undefined as never);
    expect(resource.get(field.name as never)).toBeUndefined();
    const parser: Parser = {
      type: 'checkbox',
      value: true,
    };
    renderHook(() => useParserDefaultValue(resource, field, parser));

    expect(resource.get(field.name as never)).toBe(true);
  });

  test('Date parser sets value', () => {
    const resource = new tables.CollectingTrip.Resource();
    const field = tables.CollectingTrip.strictGetLiteralField('date1');
    expect(resource.get(field.name as never)).toBeUndefined();
    const parser: Parser = {
      type: 'date',
      value: getFakeDate(),
    };
    renderHook(() => useParserDefaultValue(resource, field, parser));

    expect(resource.get(field.name as never)).toBe(getFakeDate());
  });

  test('Date parser overrides empty value', () => {
    const resource = new tables.CollectingTrip.Resource({
      date1: "",
    });
    const field = tables.CollectingTrip.strictGetLiteralField('date1');
    expect(resource.get(field.name as never)).toBe("");
    const parser: Parser = {
      type: 'date',
      value: getFakeDate(),
    };
    renderHook(() => useParserDefaultValue(resource, field, parser));

    expect(resource.get(field.name as never)).toBe(getFakeDate());
  });

  test('Date parser sets current date on incorrect value', () => {
    const resource = new tables.CollectingTrip.Resource();
    const field = tables.CollectingTrip.strictGetLiteralField('date1');
    expect(resource.get(field.name as never)).toBeUndefined();

    const parser: Parser = {
      type: 'date',
      value: 'this is not a correct date!',
    };
    renderHook(() => useParserDefaultValue(resource, field, parser));

    expect(resource.get(field.name as never)).toBe(getFakeDate());
  });

  test('Date parser sets current date on empty parser value', () => {
    const resource = new tables.CollectingTrip.Resource();
    const field = tables.CollectingTrip.strictGetLiteralField('date1');
    expect(resource.get(field.name as never)).toBeUndefined();

    const parser: Parser = {
      type: 'date',
      value: "",
    };
    renderHook(() => useParserDefaultValue(resource, field, parser));

    expect(resource.get(field.name as never)).toBe(getFakeDate());
  });

});
