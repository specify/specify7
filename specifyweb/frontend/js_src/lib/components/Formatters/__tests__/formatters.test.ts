import { requireContext } from '../../../tests/helpers';
import {
  exportsForTests,
  fetchFormatters,
  getMainTableFields,
} from '../formatters';
import { Tables } from '../../DataModel/types';
import { TableFields } from '../../DataModel/helperTypes';
import { RA } from '../../../utils/types';
import { overrideAjax } from '../../../tests/ajax';
import { getResourceApiUrl } from '../../DataModel/resource';
import { tables } from '../../DataModel/tables';

const { formatField } = exportsForTests;

requireContext();

test('formatters are fetched and parsed correctly', async () =>
  expect(fetchFormatters).resolves.toMatchSnapshot());

const mainTableFields: {
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
  Object.entries(mainTableFields).forEach(([tableName, fields]) =>
    test(`returns correct fields for ${tableName}`, () =>
      expect(getMainTableFields(tableName).map(({ name }) => name)).toEqual(
        fields
      ))
  );
});

describe('formatField', () => {
  const collectorId = 1;
  const agentId = 2;
  overrideAjax(`/api/specify/collector/${collectorId}/`, {
    resource_uri: getResourceApiUrl('Collector', collectorId),
    id: collectorId,
    agent: getResourceApiUrl('Agent', agentId),
  });
  const agent = {
    resource_uri: getResourceApiUrl('Agent', agentId),
    id: agentId,
    agenttype: 1,
  };
  overrideAjax(`/api/specify/agent/${agentId}/`, agent);

  test('handles distant picklist fields with a separator', async () => {
    const parentResource = new tables.Collector.Resource({
      id: collectorId,
    });
    const fields = [
      tables.Collector.strictGetField('agent'),
      tables.Agent.strictGetField('agentType'),
    ];
    await expect(
      formatField(
        {
          field: fields,
          formatter: undefined,
          aggregator: undefined,
          fieldFormatter: undefined,
          separator: ', ',
        },
        parentResource,
        true
      )
    ).resolves.toBe(', Person');
  });
});
