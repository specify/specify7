import type { RA } from '../types';
import type { MappingPath } from '../components/wbplanviewmapper';
import * as WbPlanViewTreeHelper from '../wbplanviewtreehelper';
import { loadDataModel, runTest } from './testmain';

export default function (): void {
  loadDataModel();

  runTest(
    'WbPlanViewTreeHelper.deepMergeObject',
    [
      [
        [
          {
            accession: {
              accessionagents: {
                '#1': {
                  agent: ['firstname'],
                },
              },
            },
            collector: ['firstname'],
          },
          {
            accession: {
              accessionagents: {
                '#2': {
                  agent: ['lastname'],
                },
              },
            },
          },
        ],
        {
          accession: {
            accessionagents: {
              '#1': {
                agent: ['firstname'],
              },
              '#2': {
                agent: ['lastname'],
              },
            },
          },
          collector: ['firstname'],
        },
      ],
    ],
    WbPlanViewTreeHelper.deepMergeObject
  );

  runTest(
    'WbPlanViewTreeHelper.arrayToTree',
    [
      [
        [['accession', 'accessionagents', '#1', 'agent']],
        {
          accession: {
            accessionagents: {
              '#1': {
                agent: {},
              },
            },
          },
        },
      ],
    ],
    WbPlanViewTreeHelper.arrayToTree
  );

  runTest(
    'WbPlanViewTreeHelper.arrayOfMappingsToMappingsTree',
    [
      [
        [
          [
            ['accession', 'accessionagents', '#1', 'agent', 'firstname'],
            ['accession', 'accessionagents', '#1', 'agent', 'lastname'],
            ['accession', 'accessionagents', '#2', 'agent', 'firstname'],
          ] as RA<MappingPath>,
          false,
        ],
        {
          accession: {
            accessionagents: {
              '#1': {
                agent: {
                  firstname: {},
                  lastname: {},
                },
              },
              '#2': {
                agent: {
                  firstname: {},
                },
              },
            },
          },
        },
      ],
    ],
    WbPlanViewTreeHelper.arrayOfMappingsToMappingsTree
  );
}
