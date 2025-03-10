import { overrideAjax } from '../../../tests/ajax';
import { mockTime, requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import { fetchBlockers } from '../DeleteButton';

requireContext();
mockTime();

const agentId = 2;
const loanAgentId = 1;
const loanId = 3;
overrideAjax(`/api/delete_blockers/agent/${agentId}/`, [
  {
    table: 'LoanAgent',
    field: 'agent',
    ids: [loanAgentId],
  },
  {
    table: 'CollectionObject',
    field: 'createdByAgent',
    ids: [2, 3, 4],
  },
]);

overrideAjax(
  '/stored_query/ephemeral/',
  {
    results: [[loanAgentId, loanId]],
  },
  {
    method: 'POST',
    body: {
      _tablename: 'SpQuery',
      contextname: 'Loan',
      contexttableid: 52,
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
          fieldname: 'loanId',
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
          stringid: '52.loan.loanId',
          tablelist: '52',
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
          startvalue: '2',
          stringid: '52,53-loanAgents,5.agent.agentId',
          tablelist: '52,53-loanAgents,5',
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
      searchsynonymy: false,
      selectdistinct: false,
      smushed: null,
      specifyuser: '/api/specify/specifyuser/2/',
      sqlstr: null,
      timestampcreated: '2022-08-31',
      timestampmodified: null,
      version: 1,
    },
  }
);

test('fetchBlockers', async () => {
  const resource = new tables.Agent.Resource({ id: agentId });
  const resources = await fetchBlockers(resource);

  expect(JSON.parse(JSON.stringify(resources))).toEqual([
    {
      blockers: [
        {
          directRelationship: '[relationship LoanAgent.agent]',
          ids: [
            {
              direct: 1,
              parent: 3,
            },
          ],
          parentRelationship: '[relationship LoanAgent.loan]',
        },
      ],
      table: '[table Loan]',
    },
    {
      blockers: [
        {
          directRelationship: '[relationship CollectionObject.createdByAgent]',
          ids: [
            {
              direct: 2,
            },
            {
              direct: 3,
            },
            {
              direct: 4,
            },
          ],
        },
      ],
      table: '[table CollectionObject]',
    },
  ]);
});
