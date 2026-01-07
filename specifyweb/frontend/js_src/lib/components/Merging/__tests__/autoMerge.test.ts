import { mockTime, requireContext } from '../../../tests/helpers';
import type { DeepPartial, RA } from '../../../utils/types';
import { addMissingFields } from '../../DataModel/addMissingFields';
import type {
  AnySchema,
  SerializedResource,
} from '../../DataModel/helperTypes';
import { tables } from '../../DataModel/tables';
import type { Agent } from '../../DataModel/types';
import { autoMerge } from '../autoMerge';

requireContext();
mockTime();

const records: RA<DeepPartial<SerializedResource<Agent>>> = [
  {
    id: 2305,
    agentType: 1,
    // This won't be merged when cautious because it differs between resources
    date1: '2021-01-01',
    date1Precision: 2,
    // This won't be auto merged because date2 is missing
    date2Precision: 2,
    guid: 'd513a358-d978-496d-8f54-52b63d3d2f4c',
    lastName: '1',
    timestampCreated: '2023-01-28T00:37:23',
    timestampModified: '2023-01-28T00:37:23',
    version: 0,
    createdByAgent: '/api/specify/agent/1313/',
    division: '/api/specify/division/2/',
    orgMembers: '/api/specify/agent/?organization=2305',
    collectors: '/api/specify/collector/?agent=2305',
    members: '/api/specify/groupperson/?member=2305',
    resource_uri: '/api/specify/agent/2305/',
    catalogerOf: '/api/specify/CollectionObject?cataloger=2305',
    _tableName: 'Agent',
  },
  // This record was more recently modified, so it takes priority when merging
  {
    lastName: '2',
    timestampCreated: '2023-01-28T00:36:28',
    timestampModified: '2023-01-29T00:36:28',
    date1: '2020-01-01',
    /*
     * Even though other record has a non-null date1precision, since date1 value
     * from this record was used, the date1precision from this record will be
     * used as well.
     */
    date1Precision: null,
    addresses: [
      {
        id: 742,
        address: '1',
        timestampCreated: '2023-01-28T00:04:16',
        timestampModified: '2023-01-28T00:04:16',
        agent: '/api/specify/agent/2300/',
        createdByAgent: '/api/specify/agent/1313/',
        divisions: '/api/specify/division/?address=742',
        insitutions: '/api/specify/institution/?address=742',
        resource_uri: '/api/specify/address/742/',
        _tableName: 'Address',
      },
      {
        id: 745,
        address: '10',
        timestampCreated: '2023-01-28T00:04:16',
        timestampModified: '2023-01-28T00:04:16',
        agent: '/api/specify/agent/2300/',
        createdByAgent: '/api/specify/agent/1313/',
        divisions: '/api/specify/division/?address=742',
        insitutions: '/api/specify/institution/?address=742',
        resource_uri: '/api/specify/address/742/',
        _tableName: 'Address',
        // This should always be dropped
        version: 100,
      },
    ],
  },
  {
    // Ids are removed from merged resource
    id: 2300,
    lastName: '1',
    timestampCreated: '2023-01-28T00:04:16',
    timestampModified: '2023-01-28T00:04:16',
    addresses: [
      {
        id: 744,
        address: '2',
        timestampCreated: '2023-04-28T00:04:16',
        timestampModified: '2023-05-28T00:04:16',
        agent: '/api/specify/agent/2300/',
        createdByAgent: '/api/specify/agent/1313/',
        divisions: '/api/specify/division/?address=742',
        insitutions: '/api/specify/institution/?address=742',
        resource_uri: '/api/specify/address/742/',
        _tableName: 'Address',
      },
      // This address will be skipped because it is identical to another address
      {
        id: 743,
        address: '1',
        timestampCreated: '2023-02-28T00:04:16',
        timestampModified: '2023-03-28T00:04:16',
        agent: '/api/specify/agent/2300/',
        createdByAgent: '/api/specify/agent/1313/',
        divisions: '/api/specify/division/?address=742',
        insitutions: '/api/specify/institution/?address=742',
        resource_uri: '/api/specify/address/742/',
        _tableName: 'Address',
      },
    ],
    orgMembers: '/api/specify/agent/?organization=2300',
    collectors: '/api/specify/collector/?agent=2300',
    members: '/api/specify/groupperson/?member=2300',
    resource_uri: '/api/specify/agent/2300/',
    catalogerOf: '/api/specify/CollectionObject?cataloger=2300',
    _tableName: 'Agent',
  },
];

describe('autoMerge', () => {
  const run = (
    cautious: boolean,
    targetId?: number
  ): SerializedResource<AnySchema> =>
    autoMerge(
      tables.Agent,
      records.map(
        (record) =>
          addMissingFields(
            'Agent',
            record
          ) as unknown as SerializedResource<AnySchema>
      ),
      cautious,
      targetId
    );

  test('cautious', () => {
    expect(run(true)).toMatchSnapshot();
  });

  test('not cautious', () => expect(run(false)).toMatchSnapshot());
});
