import { act, renderHook, waitFor } from '@testing-library/react';

import { tables } from '../../components/DataModel/tables';
import type { Tables } from '../../components/DataModel/types';
import type { DeleteBlocker } from '../../components/Forms/DeleteBlocked';
import { overrideAjax } from '../../tests/ajax';
import { mockTime, requireContext } from '../../tests/helpers';
import type { RA } from '../../utils/types';
import { useDeleteBlockers } from '../useDeleteBlockers';

mockTime();
requireContext();

const agentId = 2;

const collectorIds = [1, 2];
const collectingEventIds = [1, 2];

const collectionObjectIds = [3, 4];

const deleteBlockerResponse = [
  {
    table: 'Collector',
    field: 'agent',
    ids: collectorIds,
  },
  {
    table: 'CollectionObject',
    field: 'createdByAgent',
    ids: collectionObjectIds,
  },
];

overrideAjax(`/api/delete_blockers/agent/${agentId}/`, deleteBlockerResponse);
overrideAjax(
  '/stored_query/ephemeral/',
  {
    results: collectorIds.map((collectorId, index) => [
      collectorId,
      collectingEventIds[index],
    ]),
  },
  {
    method: 'POST',
    body: {
      _tablename: 'SpQuery',
      contextname: 'CollectingEvent',
      contexttableid: 10,
      countonly: false,
      createdbyagent: null,
      fields: [
        {
          _tablename: 'SpQueryField',
          allownulls: null,
          alwaysfilter: null,
          columnalias: null,
          contexttableident: null,
          createdbyagent: null,
          endvalue: null,
          fieldname: 'collectingEventId',
          formatname: null,
          isdisplay: true,
          isnot: false,
          isprompt: null,
          isrelfld: false,
          isstrict: false,
          modifiedbyagent: null,
          operend: null,
          operstart: 8,
          position: 0,
          query: null,
          resource_uri: undefined,
          sorttype: 0,
          startvalue: '',
          stringid: '10.collectingevent.collectingEventId',
          tablelist: '10',
          timestampcreated: '2022-08-31',
          timestampmodified: null,
          version: 1,
        },
        {
          _tablename: 'SpQueryField',
          allownulls: null,
          alwaysfilter: null,
          columnalias: null,
          contexttableident: null,
          createdbyagent: null,
          endvalue: null,
          fieldname: 'agentId',
          formatname: null,
          isdisplay: false,
          isnot: false,
          isprompt: null,
          isrelfld: false,
          isstrict: false,
          modifiedbyagent: null,
          operend: null,
          operstart: 1,
          position: 0,
          query: null,
          resource_uri: undefined,
          sorttype: 0,
          startvalue: agentId.toString(),
          stringid: '10,30-collectors,5.agent.agentId',
          tablelist: '10,30-collectors,5',
          timestampcreated: '2022-08-31',
          timestampmodified: null,
          version: 1,
        },
      ],
      formatauditrecids: false,
      isfavorite: true,
      limit: 0,
      modifiedbyagent: null,
      name: 'Delete blockers',
      ordinal: 32_767,
      remarks: null,
      resource_uri: undefined,
      searchsynonymy: null,
      selectdistinct: false,
      smushed: false,
      specifyuser: '/api/specify/specifyuser/2/',
      sqlstr: null,
      timestampcreated: '2022-08-31',
      timestampmodified: null,
      version: 1,
    },
  }
);

/**
 * Jest's serializers don't like the circular structure of the Table type
 * (fields and relationships have a reference to the table), so we
 * serialize the tables and relationships to make it easier to compare results
 */
type SerializedBlocker = {
  readonly table: keyof Tables;
  readonly blockers: RA<{
    readonly parentRelationship: string | undefined;
    readonly directRelationship: string;
    readonly ids: RA<{
      readonly direct: number;
      readonly parent: number | undefined;
    }>;
  }>;
};

const serializeBlocker = (blocker: DeleteBlocker): SerializedBlocker => ({
  ...blocker,
  table: blocker.table.name,
  blockers: blocker.blockers.map((innerBlocker) => ({
    ...innerBlocker,
    directRelationship: innerBlocker.directRelationship.name,
    parentRelationship: innerBlocker.parentRelationship?.name,
    ids: innerBlocker.ids,
  })),
});

const serializeBlockers = (
  blockers: RA<DeleteBlocker> | false | undefined
): RA<SerializedBlocker> | false | undefined =>
  Array.isArray(blockers) ? blockers.map(serializeBlocker) : blockers;

const deleteBlockers: RA<SerializedBlocker> = [
  {
    table: 'CollectingEvent',
    blockers: [
      {
        parentRelationship: 'collectingEvent',
        directRelationship: 'agent',
        ids: collectorIds.map((collectorId, index) => ({
          direct: collectorId,
          parent: collectingEventIds[index],
        })),
      },
    ],
  },
  {
    table: 'CollectionObject',
    blockers: [
      {
        directRelationship: 'createdByAgent',
        parentRelationship: undefined,
        ids: collectionObjectIds.map((collectionObjectId) => ({
          direct: collectionObjectId,
          parent: undefined,
        })),
      },
    ],
  },
];

describe('useDeleteBlockers', () => {
  test('fetches blockers', async () => {
    const agent = new tables.Agent.Resource({ id: agentId });
    const { result } = renderHook(() => useDeleteBlockers(agent));
    await waitFor(() => {
      expect(serializeBlockers(result.current.blockers)).toStrictEqual(
        deleteBlockers
      );
    });
  });
  test('Blockers can be deferred and later fetched', async () => {
    const agent = new tables.Agent.Resource({ id: agentId });
    const { result } = renderHook(() => useDeleteBlockers(agent, true));
    await waitFor(() => {
      expect(serializeBlockers(result.current.blockers)).toBe(false);
    });
    await act(() => result.current.fetchBlockers());
    await waitFor(() => {
      expect(serializeBlockers(result.current.blockers)).toStrictEqual(
        deleteBlockers
      );
    });
  });
});
