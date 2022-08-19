import type { MappingLine } from '../components/wbplanviewmapper';
import type { IR, RA } from '../types';
import { uploadPlanBuilder } from '../uploadplanbuilder';
import type { UploadPlan } from '../uploadplanparser';
import mappingLines1 from './fixtures/mappinglines.1.json';
import uploadPlan1 from './fixtures/uploadplan.1.json';
import { requireContext } from './helpers';
import { theories } from './utils';

requireContext();

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
