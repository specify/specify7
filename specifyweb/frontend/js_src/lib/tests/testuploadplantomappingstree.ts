import {
  UploadPlan,
  uploadPlanToMappingsTree,
} from '../uploadplantomappingstree';
import uploadPlan1 from './fixtures/uploadplan.1.json';
import mappingsTree1 from './fixtures/mappingstree.1.json';
import { loadDataModel, runTest } from './testmain';


export default function():void {

  loadDataModel();

  runTest(
    'UploadPlanToMappingsTree.uploadPlanToMappingsTree',
    [
      [
        [
          uploadPlan1.headers,
          uploadPlan1.uploadPlan as unknown as UploadPlan
        ],
        mappingsTree1 as unknown as ReturnType<typeof uploadPlanToMappingsTree>,
      ],
    ],
    uploadPlanToMappingsTree
  );

}
