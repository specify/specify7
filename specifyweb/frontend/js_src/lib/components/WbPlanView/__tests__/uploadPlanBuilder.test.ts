import type { MappingLine } from '../Mapper';
import type { IR, RA } from '../../../utils/types';
import { uploadPlanBuilder } from '../uploadPlanBuilder';
import type { UploadPlan } from '../uploadPlanParser';
import mappingLines1 from '../../../tests/fixtures/mappinglines.1.json';
import uploadPlan1 from '../../../tests/fixtures/uploadplan.1.json';
import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';

requireContext();

theories(uploadPlanBuilder, [
  {
    in: [
      mappingLines1.baseTableName as 'Accession',
      mappingLines1.lines as RA<MappingLine>,
      mappingLines1.mustMatchPreferences as IR<boolean>,
    ],
    out: uploadPlan1.uploadPlan as unknown as UploadPlan,
  },
]);
