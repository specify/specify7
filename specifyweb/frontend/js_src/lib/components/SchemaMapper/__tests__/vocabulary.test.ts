import { findTermByIri } from '../vocabulary';
import type { SchemaTerms } from '../vocabulary';

const mockVocabularies: SchemaTerms['vocabularies'] = {
  dwc: {
    name: 'Darwin Core',
    abbreviation: 'dwc',
    vocabularyURI: 'http://rs.tdwg.org/dwc/terms/',
    description: 'Darwin Core standard terms for biodiversity data',
    terms: {
      'http://rs.tdwg.org/dwc/terms/occurrenceID': {
        name: 'occurrenceID',
        description: 'An identifier for the Occurrence',
        group: 'Occurrence',
        mappingPaths: [['CollectionObject', 'guid']],
      },
      'http://rs.tdwg.org/dwc/terms/catalogNumber': {
        name: 'catalogNumber',
        description:
          'An identifier for the record within the data set or collection',
        group: 'Occurrence',
        mappingPaths: [['CollectionObject', 'catalogNumber']],
      },
    },
  },
  dc: {
    name: 'Dublin Core',
    abbreviation: 'dc',
    vocabularyURI: 'http://purl.org/dc/terms/',
    description: 'Dublin Core metadata terms',
    terms: {
      'http://purl.org/dc/terms/modified': {
        name: 'modified',
        description:
          'The most recent date-time on which the resource was changed',
        group: 'Record',
        mappingPaths: [['CollectionObject', 'timestampModified']],
      },
    },
  },
};

describe('findTermByIri', () => {
  test('returns correct term and vocabulary for a known DwC IRI', () => {
    const result = findTermByIri(
      mockVocabularies,
      'http://rs.tdwg.org/dwc/terms/occurrenceID'
    );
    expect(result).toBeDefined();
    expect(result!.term.name).toBe('occurrenceID');
    expect(result!.term.group).toBe('Occurrence');
    expect(result!.vocabulary.abbreviation).toBe('dwc');
  });

  test('returns correct term for a Dublin Core IRI', () => {
    const result = findTermByIri(
      mockVocabularies,
      'http://purl.org/dc/terms/modified'
    );
    expect(result).toBeDefined();
    expect(result!.term.name).toBe('modified');
    expect(result!.vocabulary.abbreviation).toBe('dc');
  });

  test('returns undefined for an unknown IRI', () => {
    const result = findTermByIri(
      mockVocabularies,
      'http://example.org/unknown/term'
    );
    expect(result).toBeUndefined();
  });
});
