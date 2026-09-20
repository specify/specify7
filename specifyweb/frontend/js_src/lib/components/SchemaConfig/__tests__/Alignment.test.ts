import type { LiteralField } from '../../DataModel/specifyField';
import { getFieldAlignments } from '../Alignment';

const field = (table: string, name: string): LiteralField =>
  ({ table: { name: table }, name }) as unknown as LiteralField;

describe('data model vocabulary alignments', () => {
  test('matches field identities case-insensitively', () => {
    const [alignment] = getFieldAlignments(
      field('CollectingEvent', 'StartDate')
    );

    expect(alignment?.term.name).toBe('http://rs.tdwg.org/dwc/terms/eventDate');
  });

  test('returns all terms matching one field pattern', () => {
    const alignments = getFieldAlignments(
      field('CollectionObjectAttribute', 'CountAmt')
    );

    expect(alignments.map(({ term }) => term.name)).toEqual(
      expect.arrayContaining([
        'http://rs.tdwg.org/dwc/terms/individualCount',
        'http://rs.tdwg.org/dwc/terms/organismQuantity',
      ])
    );
  });

  test('resolves alignments from GBIF extension catalogs', () => {
    const alignments = getFieldAlignments(field('CollectionObject', 'GUID'));

    expect(
      alignments.some(
        ({ term, vocabulary }) =>
          term.name === 'http://rs.tdwg.org/dwc/terms/occurrenceID' &&
          vocabulary.rowType !== 'http://rs.tdwg.org/dwc/terms/Occurrence'
      )
    ).toBe(true);
  });

  test('returns no alignments for an unknown field', () => {
    expect(
      getFieldAlignments(field('CollectionObject', 'UnknownField'))
    ).toEqual([]);
  });
});
