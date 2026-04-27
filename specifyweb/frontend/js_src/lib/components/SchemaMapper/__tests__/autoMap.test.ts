import { autoMapFields } from '../autoMap';
import type { MappingField } from '../types';
import type { Vocabulary } from '../vocabulary';

const mockVocabulary: Vocabulary = {
  name: 'Darwin Core',
  abbreviation: 'dwc',
  vocabularyURI: 'http://rs.tdwg.org/dwc/terms/',
  description: 'Darwin Core standard terms',
  terms: {
    'http://rs.tdwg.org/dwc/terms/catalogNumber': {
      name: 'catalogNumber',
      description: 'An identifier for the record within the collection',
      group: 'Occurrence',
      mappingPaths: [['CollectionObject', 'catalogNumber']],
    },
    'http://rs.tdwg.org/dwc/terms/occurrenceID': {
      name: 'occurrenceID',
      description: 'An identifier for the Occurrence',
      group: 'Occurrence',
      mappingPaths: [['CollectionObject', 'guid']],
    },
  },
};

test('auto-maps field with matching stringId to correct term', () => {
  const fields: ReadonlyArray<MappingField> = [
    {
      id: 1,
      position: 0,
      stringId: 'CollectionObject.catalogNumber',
      fieldName: 'catalogNumber',
      term: undefined,
      isStatic: false,
      staticValue: undefined,
    },
  ];

  const result = autoMapFields(fields, mockVocabulary);
  expect(result[0].term).toBe(
    'http://rs.tdwg.org/dwc/terms/catalogNumber'
  );
});

test('does not overwrite fields that already have a term assigned', () => {
  const existingTerm = 'http://example.org/custom/term';
  const fields: ReadonlyArray<MappingField> = [
    {
      id: 1,
      position: 0,
      stringId: 'CollectionObject.catalogNumber',
      fieldName: 'catalogNumber',
      term: existingTerm,
      isStatic: false,
      staticValue: undefined,
    },
  ];

  const result = autoMapFields(fields, mockVocabulary);
  expect(result[0].term).toBe(existingTerm);
});

test('fields with no matching path remain unmapped', () => {
  const fields: ReadonlyArray<MappingField> = [
    {
      id: 1,
      position: 0,
      stringId: 'Agent.lastName',
      fieldName: 'lastName',
      term: undefined,
      isStatic: false,
      staticValue: undefined,
    },
  ];

  const result = autoMapFields(fields, mockVocabulary);
  expect(result[0].term).toBeUndefined();
});

test('auto-maps by fieldName match against last element of mappingPath', () => {
  const fields: ReadonlyArray<MappingField> = [
    {
      id: 1,
      position: 0,
      stringId: 'SomeOther.path.guid',
      fieldName: 'guid',
      term: undefined,
      isStatic: false,
      staticValue: undefined,
    },
  ];

  const result = autoMapFields(fields, mockVocabulary);
  expect(result[0].term).toBe(
    'http://rs.tdwg.org/dwc/terms/occurrenceID'
  );
});
