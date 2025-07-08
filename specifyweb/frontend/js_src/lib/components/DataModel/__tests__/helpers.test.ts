import { overrideAjax } from '../../../tests/ajax';
import { mockTime, requireContext } from '../../../tests/helpers';
import { addMissingFields } from '../addMissingFields';
import {
  fetchDistantRelated,
  isResourceOfType,
  toResource,
  toTable,
  toTables,
  toTreeTable,
} from '../helpers';
import { getResourceApiUrl } from '../resource';
import { serializeResource } from '../serializers';
import { tables } from '../tables';
import type { Tables } from '../types';

mockTime();
requireContext();

describe('serializeResource', () => {
  test('Agent resource', () => {
    const resource = new tables.Agent.Resource();
    expect(serializeResource(resource)).toEqual({
      _tableName: 'Agent',
      abbreviation: null,
      addresses: [],
      agentAttachments: [],
      agentGeographies: [],
      agentSpecialties: [],
      agentType: 0,
      collContentContact: null,
      collTechContact: null,
      createdByAgent: null,
      division: getResourceApiUrl('Division', 2),
      date1: null,
      date1Precision: null,
      date2: null,
      date2Precision: null,
      dateOfBirth: null,
      dateOfBirthPrecision: null,
      dateOfDeath: null,
      dateOfDeathPrecision: null,
      dateType: null,
      email: null,
      firstName: null,
      groups: [],
      guid: null,
      identifiers: [],
      initials: null,
      instContentContact: null,
      instTechContact: null,
      integer1: null,
      integer2: null,
      interests: null,
      jobTitle: null,
      lastName: null,
      middleInitial: null,
      modifiedByAgent: null,
      organization: null,
      remarks: null,
      resource_uri: undefined,
      specifyUser: null,
      suffix: null,
      text1: null,
      text2: null,
      text3: null,
      text4: null,
      text5: null,
      timestampCreated: '2022-08-31',
      timestampModified: null,
      title: null,
      url: null,
      variants: [],
      verbatimDate1: null,
      verbatimDate2: null,
      version: 1,
    });
  });
  test('SpQuery resource', () => {
    const resource = new tables.SpQuery.Resource();
    resource.set('fields', [addMissingFields('SpQueryField', {})]);
    expect(serializeResource(resource)).toEqual({
      _tableName: 'SpQuery',
      contextName: '',
      contextTableId: 0,
      countOnly: null,
      createdByAgent: null,
      fields: [
        {
          _tableName: 'SpQueryField',
          allowNulls: null,
          alwaysFilter: null,
          columnAlias: null,
          contextTableIdent: null,
          createdByAgent: null,
          endValue: null,
          fieldName: '',
          formatName: null,
          isDisplay: false,
          isNot: false,
          isPrompt: null,
          isRelFld: null,
          isStrict: false,
          modifiedByAgent: null,
          operEnd: null,
          operStart: 0,
          position: 0,
          query: null,
          sortType: 0,
          startValue: '',
          stringId: '',
          tableList: '',
          timestampCreated: '2022-08-31',
          timestampModified: null,
          version: 1,
        },
      ],
      formatAuditRecIds: null,
      isFavorite: null,
      modifiedByAgent: null,
      name: '',
      ordinal: null,
      remarks: null,
      searchSynonymy: null,
      selectDistinct: null,
      smushed: null,
      specifyUser: null,
      sqlStr: null,
      timestampCreated: '2022-08-31',
      timestampModified: null,
      version: 1,
    });
  });
});

describe('isResourceOfType', () => {
  test('positive case', () => {
    const resource = new tables.Agent.Resource();
    expect(isResourceOfType(resource, 'Agent')).toBe(true);
  });
  test('negative case', () => {
    const resource = new tables.Agent.Resource();
    expect(isResourceOfType(resource, 'CollectionObject')).toBe(false);
  });
});

describe('toTable', () => {
  test('positive case', () => {
    const resource = new tables.Agent.Resource();
    expect(toTable(resource, 'Agent')).toBe(resource);
  });
  test('negative case', () => {
    const resource = new tables.Agent.Resource();
    expect(toTable(resource, 'CollectionObject')).toBeUndefined();
  });
});

describe('toResource', () => {
  test('positive case', () => {
    const tableName = 'Agent' as keyof Tables;
    const resource = addMissingFields(tableName, {});
    expect(toResource(resource, 'Agent')).toBe(resource);
  });
  test('negative case', () => {
    const tableName = 'Agent' as keyof Tables;
    const resource = addMissingFields(tableName, {});
    expect(toResource(resource, 'CollectionObject')).toBeUndefined();
  });
});

describe('toTreeTable', () => {
  test('positive case', () => {
    const resource = new tables.Taxon.Resource();
    expect(toTreeTable(resource)).toBe(resource);
  });
  test('negative case', () => {
    const resource = new tables.Agent.Resource();
    expect(toTreeTable(resource)).toBeUndefined();
  });
});

describe('toTables', () => {
  test('positive case', () => {
    const resource = new tables.Agent.Resource();
    expect(toTables(resource, ['Agent', 'Accession'])).toBe(resource);
  });
  test('negative case', () => {
    const resource = new tables.Agent.Resource();
    expect(
      toTables(resource, ['CollectionObject', 'Accession'])
    ).toBeUndefined();
  });
});

describe('fetchDistantRelated', () => {
  test('empty path', async () => {
    const resource = new tables.Agent.Resource();
    await expect(fetchDistantRelated(resource, [])).resolves.toEqual({
      resource,
      field: undefined,
    });
  });

  test('undefined path', async () => {
    const resource = new tables.Agent.Resource();
    await expect(fetchDistantRelated(resource, undefined)).resolves.toEqual({
      resource,
      field: undefined,
    });
  });

  const collectorId = 1;
  const agentId = 2;
  overrideAjax(`/api/specify/collector/${collectorId}/`, {
    resource_uri: getResourceApiUrl('Collector', collectorId),
    id: collectorId,
    agent: getResourceApiUrl('Agent', agentId),
  });

  test('single field path', async () => {
    const resource = new tables.Collector.Resource({ id: collectorId });
    const field = tables.Collector.strictGetField('agent');
    const data = (await fetchDistantRelated(resource, [field]))!;
    expect(data.resource).toBe(resource);
    expect(data.field).toBe(field);
    expect(data.resource!.get('agent')).toBe(
      getResourceApiUrl('Agent', agentId)
    );
  });

  const emptyCollectorId = 2;
  overrideAjax(`/api/specify/collector/${emptyCollectorId}/`, {
    resource_uri: getResourceApiUrl('Collector', emptyCollectorId),
    id: emptyCollectorId,
  });
  const agent = {
    resource_uri: getResourceApiUrl('Agent', agentId),
    id: agentId,
    lastname: 'a',
  };
  overrideAjax(`/api/specify/agent/${agentId}/`, agent);
  test('valid field with missing related resource', async () => {
    const resource = new tables.Collector.Resource({
      id: emptyCollectorId,
    });
    const field = tables.Collector.strictGetField('agent');
    const data = (await fetchDistantRelated(resource, [field]))!;
    expect(data.resource).toBe(resource);
    expect(data.field).toBe(field);
    expect(data.resource!.get(field.name)).toBeUndefined();
  });

  test('multi field path', async () => {
    const resource = new tables.Collector.Resource({ id: collectorId });
    const fields = [
      tables.Collector.strictGetField('agent'),
      tables.Agent.strictGetField('lastName'),
    ];
    const data = (await fetchDistantRelated(resource, fields))!;
    expect(data.resource!.toJSON()).toEqual(agent);
    expect(data.field).toBe(fields.at(-1));
  });
});
