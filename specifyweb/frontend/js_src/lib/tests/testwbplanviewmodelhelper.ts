import type { Tables } from '../datamodel';
import { schema } from '../schema';
import * as WbPlanViewModelHelper from '../wbplanviewmodelhelper';
import mappingsTree1 from './fixtures/mappingstree.1.json';
import { runTest } from './testmain';

export default function (): void {
  runTest(
    'WbPlanViewModelHelper.getMaxToManyValue',
    [
      [
        [
          [
            `${schema.referenceSymbol}1`,
            `${schema.referenceSymbol}2`,
            `${schema.referenceSymbol}3`,
          ],
        ],
        3,
      ],
    ],
    WbPlanViewModelHelper.getMaxToManyIndex
  );

  runTest(
    'WbPlanViewModelHelper.findRequiredMissingFields',
    [
      [
        [
          mappingsTree1.baseTableName as keyof Tables,
          mappingsTree1.mappingsTree as unknown as MappingsTree,
        ],
        [['collectingevent', 'locality', 'localityname']],
      ],
    ],
    WbPlanViewModelHelper.findRequiredMissingFields
  );
}
