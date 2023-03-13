import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { getResourceApiUrl } from '../../DataModel/resource';
import { tables } from '../../DataModel/tables';
import {
  exportsForTests,
  fetchFormatters,
  getMainTableFields,
} from '../formatters';

const { formatField } = exportsForTests;

requireContext();

test('formatters are fetched and parsed correctly', async () =>
  expect(fetchFormatters).resolves.toMatchSnapshot());

test('getMainTableFields', () =>
  expect(
    Object.fromEntries(
      Object.keys(tables).map((name) => [
        name,
        getMainTableFields(name).map(({ name }) => name),
      ])
    )
  ).toMatchSnapshot());

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
