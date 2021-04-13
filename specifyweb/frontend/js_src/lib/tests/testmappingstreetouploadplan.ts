import {mappingsTreeToUploadPlan} from '../mappingstreetouploadplan';
import { MappingsTree } from '../wbplanviewtreehelper';
import uploadPlan1 from './fixtures/uploadplan.1.json';
import mappingsTree1 from './fixtures/mappingstree.1.json';
import { loadDataModel, runTest } from './testmain';


export default function():void {

  loadDataModel();

  runTest(
    'MappingsTreeToUploadPlan.mappingsTreeToUploadPlan',
    [
      [
        [
          mappingsTree1.baseTableName,
          mappingsTree1.mappingsTree as unknown as MappingsTree,
          mappingsTree1.mustMatchPreferences
        ],
        uploadPlan1.uploadPlan as unknown as ReturnType<typeof mappingsTreeToUploadPlan>,
      ],
    ],
    mappingsTreeToUploadPlan
  );

}
