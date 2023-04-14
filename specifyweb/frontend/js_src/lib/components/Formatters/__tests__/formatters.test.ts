import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import { overwriteReadOnly } from '../../../utils/types';
import { getField } from '../../DataModel/helpers';
import type { TableFields } from '../../DataModel/helperTypes';
import { getResourceApiUrl } from '../../DataModel/resource';
import { tables } from '../../DataModel/tables';
import type { Tables } from '../../DataModel/types';
import {
  exportsForTests,
  fetchFormatters,
  format,
  getMainTableFields,
} from '../formatters';
import type { Formatter } from '../spec';

const { formatField } = exportsForTests;

requireContext();

test('Formatters are fetched and parsed correctly', async () =>
  expect(
    fetchFormatters.then((results) =>
      // Remove symbols
      JSON.parse(JSON.stringify(results))
    )
  ).resolves.toMatchSnapshot());

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
        parentResource
      )
    ).resolves.toEqual({
      formatted: 'Person',
      separator: ', ',
    });
  });
});

const referenceWorkId = 1;
const referenceWork = {
  id: referenceWorkId,
  resource_uri: getResourceApiUrl('ReferenceWork', referenceWorkId),
  text1: '1',
};
overrideAjax(
  getResourceApiUrl('ReferenceWork', referenceWorkId),
  referenceWork
);

const taxonCitationId = 2;
const taxonCitation = {
  id: taxonCitationId,
  text1: '2',
  resource_uri: getResourceApiUrl('AccessionAgent', taxonCitationId),
  referenceWork: getResourceApiUrl('ReferenceWork', referenceWorkId),
};
overrideAjax(
  '/api/specify/taxoncitation/?domainfilter=false&referencework=1&offset=0',
  {
    meta: {
      total_count: 1,
    },
    objects: [taxonCitation],
  }
);

test('Circular formatting is detected and prevented', async () => {
  const formatters = await fetchFormatters;
  const originalFormatters = formatters.formatters;
  const referenceWorkFormatter: Formatter = {
    name: tables.ReferenceWork.getFormat() ?? '',
    title: '',
    table: tables.ReferenceWork,
    isDefault: true,
    definition: {
      external: undefined,
      isSingle: true,
      conditionField: undefined,
      fields: [
        {
          value: undefined,
          fields: [
            {
              field: [getField(tables.ReferenceWork, 'text1')],
              aggregator: undefined,
              separator: '',
              formatter: undefined,
              fieldFormatter: undefined,
            },
            {
              field: [getField(tables.ReferenceWork, 'taxonCitations')],
              aggregator: undefined,
              separator: ' - ',
              formatter: undefined,
              fieldFormatter: undefined,
            },
          ],
        },
      ],
    },
  };
  const taxonCitationFormatter: Formatter = {
    name: tables.TaxonCitation.getFormat() ?? '',
    title: '',
    table: tables.TaxonCitation,
    isDefault: true,
    definition: {
      external: undefined,
      isSingle: true,
      conditionField: undefined,
      fields: [
        {
          value: undefined,
          fields: [
            {
              field: [getField(tables.ReferenceWork, 'text1')],
              aggregator: undefined,
              separator: '',
              formatter: undefined,
              fieldFormatter: undefined,
            },
            {
              field: [getField(tables.TaxonCitation, 'referenceWork')],
              aggregator: undefined,
              separator: ' -- ',
              formatter: undefined,
              fieldFormatter: undefined,
            },
          ],
        },
      ],
    },
  };
  overwriteReadOnly(formatters, 'formatters', [
    referenceWorkFormatter,
    taxonCitationFormatter,
    ...formatters.formatters,
  ]);

  const accession = new tables.ReferenceWork.Resource({ id: referenceWorkId });
  await expect(format(accession)).resolves.toBe('1 - 2 -- 1');

  overwriteReadOnly(formatters, 'formatters', originalFormatters);
});
