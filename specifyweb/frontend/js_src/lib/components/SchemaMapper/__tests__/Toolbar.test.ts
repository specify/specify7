import { findDuplicateTerms } from '../Toolbar';
import type { MappingField } from '../types';

function makeField(
  term: string | undefined,
  id: number = 1
): MappingField {
  return {
    id,
    position: id,
    stringId: `field.${id}`,
    fieldName: `field${id}`,
    term,
    isStatic: false,
    staticValue: undefined,
  };
}

test('returns empty array when there are no duplicate terms', () => {
  const fields = [
    makeField('http://rs.tdwg.org/dwc/terms/catalogNumber', 1),
    makeField('http://rs.tdwg.org/dwc/terms/occurrenceID', 2),
    makeField('http://rs.tdwg.org/dwc/terms/scientificName', 3),
  ];
  expect(findDuplicateTerms(fields)).toEqual([]);
});

test('returns duplicate IRIs when duplicates exist', () => {
  const duplicateIri = 'http://rs.tdwg.org/dwc/terms/catalogNumber';
  const fields = [
    makeField(duplicateIri, 1),
    makeField('http://rs.tdwg.org/dwc/terms/occurrenceID', 2),
    makeField(duplicateIri, 3),
  ];
  expect(findDuplicateTerms(fields)).toEqual([duplicateIri]);
});

test('ignores fields with undefined terms', () => {
  const fields = [
    makeField(undefined, 1),
    makeField(undefined, 2),
    makeField('http://rs.tdwg.org/dwc/terms/catalogNumber', 3),
  ];
  expect(findDuplicateTerms(fields)).toEqual([]);
});

test('handles all fields being undefined', () => {
  const fields = [
    makeField(undefined, 1),
    makeField(undefined, 2),
  ];
  expect(findDuplicateTerms(fields)).toEqual([]);
});

test('handles empty fields array', () => {
  expect(findDuplicateTerms([])).toEqual([]);
});
