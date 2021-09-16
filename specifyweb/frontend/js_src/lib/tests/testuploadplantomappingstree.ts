import type { UploadPlan } from '../uploadplantomappingstree';
import { uploadPlanToMappingsTree } from '../uploadplantomappingstree';
import mappingsTree1 from './fixtures/mappingstree.1.json';
import uploadPlan1 from './fixtures/uploadplan.1.json';
import { loadDataModel, runTest } from './testmain';

export default function (): void {
  loadDataModel();

  runTest(
    'UploadPlanToMappingsTree.uploadPlanToMappingsTree',
    [
      [
        [
          uploadPlan1.headers,
          (uploadPlan1.uploadPlan as unknown) as UploadPlan,
        ],
        (mappingsTree1 as unknown) as ReturnType<
          typeof uploadPlanToMappingsTree
        >,
      ],
    ],
    uploadPlanToMappingsTree
  );
}
