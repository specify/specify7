import type { IR, RA } from '../types';
import type { SplitMappingPath } from '../wbplanviewmappinghelper';
import * as WbPlanViewModelHelper from '../wbplanviewmodelhelper';
import mappingLines1 from './fixtures/mappinglines.1.json';
import { runTest } from './testmain';

export default function (): void {
  runTest(
    'WbPlanViewModelHelper.findRequiredMissingFields',
    [
      [
        [
          mappingLines1.baseTableName as 'Accession',
          (mappingLines1.lines as RA<SplitMappingPath>).map(
            ({ mappingPath }) => mappingPath
          ),
          mappingLines1.mustMatchPreferences as IR<boolean>,
        ],
        [['collectingEvent', 'locality', 'localityName']],
      ],
    ],
    WbPlanViewModelHelper.findRequiredMissingFields
  );
}
