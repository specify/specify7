import type { Tables } from '../datamodel';
import { mappingsTreeToUploadPlan } from '../mappingstreetouploadplan';
import mappingsTree1 from './fixtures/mappingstree.1.json';
import uploadPlan1 from './fixtures/uploadplan.1.json';
import { runTest } from './testmain';

export default function (): void {
  runTest(
    'MappingsTreeToUploadPlan.mappingsTreeToUploadPlan',
    [
      [
        [
          mappingsTree1.baseTableName as keyof Tables,
          mappingsTree1.mappingsTree as unknown as MappingsTree,
          mappingsTree1.mustMatchPreferences,
        ],
        uploadPlan1.uploadPlan as unknown as ReturnType<
          typeof mappingsTreeToUploadPlan
        >,
      ],
    ],
    mappingsTreeToUploadPlan
  );
}
