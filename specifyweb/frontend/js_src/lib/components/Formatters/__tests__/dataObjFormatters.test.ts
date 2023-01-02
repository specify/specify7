import { requireContext } from '../../../tests/helpers';
import { fetchFormatters, getMainTableFields } from '../dataObjFormatters';
import { Tables } from '../../DataModel/types';
import { TableFields } from '../../DataModel/helperTypes';
import { RA } from '../../../utils/types';

requireContext();

test('formatters are fetched and parsed correctly', async () =>
  expect(fetchFormatters).resolves.toMatchSnapshot());

const tables: {
  readonly [TABLE_NAME in keyof Tables]?: RA<TableFields<Tables[TABLE_NAME]>>;
} = {
  CollectionObject: [
    'catalogNumber',
    'reservedText',
    'guid',
    'altCatalogNumber',
    'projectNumber',
    'reservedText2',
    'fieldNumber',
  ],
  Collection: [
    'collectionName',
    'code',
    'collectionType',
    'dbContentVersion',
    'developmentStatus',
    'guid',
    'institutionType',
    'isaNumber',
    'kingdomCoverage',
    'preservationMethodType',
    'primaryFocus',
    'primaryPurpose',
    'regNumber',
  ],
  Accession: ['accessionNumber', 'status', 'type'],
  Agent: [
    'firstName',
    'lastName',
    'abbreviation',
    'email',
    'guid',
    'jobTitle',
    'middleInitial',
    'interests',
    'title',
    'url',
  ],
  SpQuery: ['name'],
};

describe('getMainTableFields', () => {
  Object.entries(tables).forEach(([tableName, fields]) =>
    test(`returns correct fields for ${tableName}`, () =>
      expect(getMainTableFields(tableName).map(({ name }) => name)).toEqual(
        fields
      ))
  );
});
