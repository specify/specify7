import { mockTime, requireContext } from '../../../tests/helpers';
import { addMissingFields } from '../addMissingFields';
import {
  isResourceOfType,
  serializeResource,
  toResource,
  toTable,
  toTables,
  toTreeTable,
} from '../helpers';
import { schema } from '../schema';
import type { Tables } from '../types';

mockTime();
requireContext();

describe('serializeResource', () => {
  test('Agent resource', () => {
    const resource = new schema.models.Agent.Resource();
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
      date1: null,
      date1Precision: null,
      date2: null,
      date2Precision: null,
      dateOfBirth: null,
      dateOfBirthPrecision: null,
      dateOfDeath: null,
      dateOfDeathPrecision: null,
      dateType: null,
      division: null,
      email: null,
      firstName: null,
      groups: [],
      guid: null,
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
    const resource = new schema.models.SpQuery.Resource();
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
    const resource = new schema.models.Agent.Resource();
    expect(isResourceOfType(resource, 'Agent')).toBe(true);
  });
  test('negative case', () => {
    const resource = new schema.models.Agent.Resource();
    expect(isResourceOfType(resource, 'CollectionObject')).toBe(false);
  });
});

describe('toTable', () => {
  test('positive case', () => {
    const resource = new schema.models.Agent.Resource();
    expect(toTable(resource, 'Agent')).toBe(resource);
  });
  test('negative case', () => {
    const resource = new schema.models.Agent.Resource();
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
    const resource = new schema.models.Taxon.Resource();
    expect(toTreeTable(resource)).toBe(resource);
  });
  test('negative case', () => {
    const resource = new schema.models.Agent.Resource();
    expect(toTreeTable(resource)).toBeUndefined();
  });
});

describe('toTables', () => {
  test('positive case', () => {
    const resource = new schema.models.Agent.Resource();
    expect(toTables(resource, ['Agent', 'Accession'])).toBe(resource);
  });
  test('negative case', () => {
    const resource = new schema.models.Agent.Resource();
    expect(
      toTables(resource, ['CollectionObject', 'Accession'])
    ).toBeUndefined();
  });
});
