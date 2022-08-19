import type { MappingLine } from '../components/wbplanviewmapper';
import { schema } from '../schema';
import type { IR, RA } from '../types';
import type { UploadPlan } from '../uploadplanparser';
import { parseUploadPlan } from '../uploadplanparser';
import mappingLines1 from './fixtures/mappinglines.1.json';
import uploadPlan1 from './fixtures/uploadplan.1.json';
import { theories } from './utils';

theories(parseUploadPlan, [
  [
    [uploadPlan1.uploadPlan as UploadPlan],
    {
      baseTable:
        schema.models[mappingLines1.baseTableName as 'CollectionObject'],
      lines: mappingLines1.lines as RA<MappingLine>,
      mustMatchPreferences: mappingLines1.mustMatchPreferences as IR<boolean>,
    },
  ],
]);
