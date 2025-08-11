import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { localized, overwriteReadOnly } from '../../../utils/types';
import { getField } from '../../DataModel/helpers';
import { getResourceApiUrl } from '../../DataModel/resource';
import { tables } from '../../DataModel/tables';
import { CatalogNumberNumeric } from '../../FieldFormatters';
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

test('getMainTableFields', () =>
  expect(
    Object.fromEntries(
      Object.keys(tables).map((name) => [
        name,
        getMainTableFields(name).map(({ name }) => name),
      ])
    )
  ).toMatchSnapshot());

test('CO -> catalogNumber format resolved by COT -> catalogNumberFormatName', () => {
  const catalogNumberField =
    tables.CollectionObject.strictGetLiteralField('catalogNumber');
  const baseCo = new tables.CollectionObject.Resource();

  expect(catalogNumberField.getUiFormatter(baseCo)).toStrictEqual(
    new CatalogNumberNumeric()
  );

  /**
   * This COT is defined in the domain.json endpoint to have the
   * catalogNumberFormatName of CatalogNumber
   */
  const cot2 = new tables.CollectionObjectType.Resource({ id: 2 });
  baseCo.set('collectionObjectType', cot2);

  expect(catalogNumberField.getUiFormatter(baseCo)?.title).toBe(
    'CatalogNumber'
  );

  /**
   * This COT is defined in the domain.json endpoint to have the
   * catalogNumberFormatName of CatalogNumberNumericRegex
   */
  const cot3 = new tables.CollectionObjectType.Resource({ id: 3 });
  baseCo.set('collectionObjectType', cot3);

  expect(catalogNumberField.getUiFormatter(baseCo)?.title).toBe(
    'CatalogNumberNumericRegex'
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
          separator: localized(', '),
          trimZeros: false,
        },
        parentResource
      )
    ).resolves.toEqual({
      formatted: 'Person',
      separator: ', ',
    });
  });

  test('converts numeric and boolean values', async () => {
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
          formatFieldValue: false,
          separator: localized(', '),
          trimZeros: false,
        },
        parentResource
      )
    ).resolves.toEqual({
      formatted: '1',
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
    name: localized(tables.ReferenceWork.getFormat() ?? ''),
    title: localized(''),
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
              separator: localized(''),
              formatter: undefined,
              fieldFormatter: undefined,
              trimZeros: false,
            },
            {
              field: [getField(tables.ReferenceWork, 'taxonCitations')],
              aggregator: undefined,
              separator: localized(''),
              formatter: undefined,
              fieldFormatter: undefined,
              trimZeros: false,
            },
          ],
        },
      ],
    },
  };
  const taxonCitationFormatter: Formatter = {
    name: localized(tables.TaxonCitation.getFormat() ?? ''),
    title: localized(''),
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
              separator: localized(' - '),
              formatter: undefined,
              fieldFormatter: undefined,
              trimZeros: false,
            },
            {
              field: [getField(tables.TaxonCitation, 'referenceWork')],
              aggregator: undefined,
              separator: localized(' -- '),
              formatter: undefined,
              fieldFormatter: undefined,
              trimZeros: false,
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

  const referenceWork = new tables.ReferenceWork.Resource({
    id: referenceWorkId,
  });
  await expect(format(referenceWork)).resolves.toBe('1 - 2 -- 1');

  overwriteReadOnly(formatters, 'formatters', originalFormatters);
});
