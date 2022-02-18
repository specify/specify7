import type { UploadPlan } from '../uploadplanparser';
import { uploadPlanToMappingsTree } from '../uploadplanparser';
import mappingsTree1 from './fixtures/mappingstree.1.json';
import uploadPlan1 from './fixtures/uploadplan.1.json';
import { runTest } from './testmain';

export default function (): void {
  runTest(
    'UploadPlanToMappingsTree.uploadPlanToMappingsTree',
    [
      [
        [uploadPlan1.headers, uploadPlan1.uploadPlan as unknown as UploadPlan],
        mappingsTree1 as unknown as ReturnType<typeof uploadPlanToMappingsTree>,
      ],
    ],
    uploadPlanToMappingsTree
  );
}
