import type { MappingLine } from '../components/wbplanviewmapper';
import type { IR, RA } from '../types';
import { uploadPlanBuilder } from '../uploadplanbuilder';
import type { UploadPlan } from '../uploadplanparser';
import mappingLines1 from './fixtures/mappinglines.1.json';
import uploadPlan1 from './fixtures/uploadplan.1.json';
import { theories } from './utils';
import { initialContext, unlockInitialContext } from '../initialcontext';
import { treeRanksPromise } from '../treedefinitions';

beforeEach(async () => {
  unlockInitialContext('main');
  await initialContext;
  await treeRanksPromise;
});

theories(uploadPlanBuilder, [
  [
    [
      mappingLines1.baseTableName as 'Accession',
      mappingLines1.lines as RA<MappingLine>,
      mappingLines1.mustMatchPreferences as IR<boolean>,
    ],
    uploadPlan1.uploadPlan as unknown as UploadPlan,
  ],
]);
