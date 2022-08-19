import type { IR, RA } from '../types';
import type { SplitMappingPath } from '../wbplanviewmappinghelper';
import mappingLines1 from './fixtures/mappinglines.1.json';
import { theories } from './testmain';
import { findRequiredMissingFields } from '../wbplanviewmodelhelper';

export function testWbPlanViewModelHelper(): void {
  theories(
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
    findRequiredMissingFields
  );
}
