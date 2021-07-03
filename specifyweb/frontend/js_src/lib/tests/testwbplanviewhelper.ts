import * as WBPlanViewHelper from '../wbplanviewhelper';
import { loadDataModel, runTest } from './testmain';

export default function (): void {
  loadDataModel();

  runTest(
    'UploadPlanToMappingsTree.uploadPlanToMappingsTree',
    [
      [['collectionObject'], 'Collection Object'],
      [['taxonomy'], 'Taxonomy'],
      [['latLongPt'], 'Lat Long Pt'],
      [[''], ''],
    ],
    WBPlanViewHelper.getFriendlyName
  );

  runTest(
    'WBPlanViewHelper.findArrayDivergencePoint',
    [
      [[['Accession', 'Accession Agents', '#1', 'Agent', 'First Name'], []], 0],
      [
        [['Accession', 'Accession Agents', '#1', 'Agent', 'First Name'], ['']],
        -1,
      ],
      [
        [
          ['Accession', 'Accession Agents', '#1', 'Agent', 'First Name'],
          ['Collection Object'],
        ],
        -1,
      ],
      [
        [
          ['Accession', 'Accession Agents', '#1', 'Agent', 'First Name'],
          ['Accession', 'Accession Agents'],
        ],
        2,
      ],
      [
        [
          ['Accession', 'Accession Agents', '#1', 'Agent', 'First Name'],
          ['Accession', 'Accession Agents', '#2'],
        ],
        -1,
      ],
    ],
    WBPlanViewHelper.findArrayDivergencePoint
  );
}
