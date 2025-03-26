import { renderHook } from '@testing-library/react';
import { tables } from '../../components/DataModel/tables';
import { requireContext } from '../../tests/helpers';
import { Parser } from '../../utils/parser/definitions';
import { useParser } from '../resource';
import { useParserDefaultValue } from '../useParserDefaultValue';

requireContext();

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

  expect(resource.get(field.name as never)).toBe(undefined);
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
