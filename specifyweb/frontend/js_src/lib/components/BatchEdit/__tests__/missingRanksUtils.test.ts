import { requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import { tables } from '../../DataModel/tables';
import { QueryFieldSpec } from '../../QueryBuilder/fieldSpec';
import type { MappingPath } from '../../WbPlanView/Mapper';
import { anyTreeRank, formatTreeRank } from '../../WbPlanView/mappingHelpers';
import { findAllMissing } from '../missingRanksUtils';

requireContext();

const atRank = (rank: string, field = 'name'): MappingPath => [
  formatTreeRank(rank),
  field,
];

const taxonQuery = (...paths: RA<MappingPath>): RA<QueryFieldSpec> =>
  paths.map((path) => QueryFieldSpec.fromPath('Taxon', path));

const missing = (...ranks: RA<string>): RA<string> =>
  ranks.map((rank) => `${rank} - ${tables.Taxon.strictGetField('name').label}`);

describe('findAllMissing', () => {
  test('a query at a rank that is not the lowest is missing every rank below it', () => {
    expect(findAllMissing(taxonQuery(atRank('Genus')))).toEqual({
      Taxon: { Taxonomy: missing('Subgenus', 'Species', 'Subspecies') },
    });
  });
  
  test('a query at the lowest rank is missing nothing', () => {
    expect(findAllMissing(taxonQuery(atRank('Subspecies')))).toEqual({});
  });

  test('ranks between two queried ranks are still required', () => {
    expect(
      findAllMissing(taxonQuery(atRank('Genus'), atRank('Species')))
    ).toEqual({
      Taxon: { Taxonomy: missing('Subgenus', 'Subspecies') },
    });
  });

  test('a rank queried without its name counts as missing', () => {
    expect(findAllMissing(taxonQuery(atRank('Genus', 'author')))).toEqual({
      Taxon: { Taxonomy: missing('Genus', 'Subgenus', 'Species', 'Subspecies') },
    });
  });

  test('ignores fields that are not tied to a specific rank', () => {
    expect(
      findAllMissing([
        QueryFieldSpec.fromPath('CollectionObject', ['catalogNumber']),
        ...taxonQuery([formatTreeRank(anyTreeRank), 'name']),
      ])
    ).toEqual({});
  });
});
