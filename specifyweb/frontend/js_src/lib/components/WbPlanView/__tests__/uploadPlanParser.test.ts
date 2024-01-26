import mappingLines1 from '../../../tests/fixtures/mappinglines.1.json';
import uploadPlan1 from '../../../tests/fixtures/uploadplan.1.json';
import { requireContext } from '../../../tests/helpers';
import type { IR, RA } from '../../../utils/types';
import { genericTables } from '../../DataModel/tables';
import type { MappingLine } from '../Mapper';
import type { UploadPlan } from '../uploadPlanParser';
import { parseUploadPlan } from '../uploadPlanParser';

requireContext();

test('parseUploadPlan', () => {
  expect(parseUploadPlan(uploadPlan1.uploadPlan as UploadPlan)).toEqual({
    baseTable: genericTables[mappingLines1.baseTableName as 'CollectionObject'],
    lines: mappingLines1.lines as RA<MappingLine>,
    mustMatchPreferences: mappingLines1.mustMatchPreferences as IR<boolean>,
  });
});
