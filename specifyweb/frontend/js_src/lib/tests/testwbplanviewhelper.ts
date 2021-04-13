import { FullMappingPath } from '../components/wbplanviewmapper';
import * as WBPlanViewHelper from '../wbplanviewhelper';
import { loadDataModel, runTest } from './testmain';

export default function(): void {

  loadDataModel();

  runTest(
    'UploadPlanToMappingsTree.uploadPlanToMappingsTree', [
      [['collectionObject'], 'Collection Object'],
      [['taxonomy'], 'Taxonomy'],
      [['latLongPt'], 'Lat Long Pt'],
      [[''], ''],
    ], WBPlanViewHelper.getFriendlyName,
  );

  runTest(
    'WBPlanViewHelper.findArrayDivergencePoint', [
      [
        [
          ['Accession', 'Accession Agents', '#1', 'Agent', 'First Name'],
          [],
        ],
        0,
      ],
      [
        [
          ['Accession', 'Accession Agents', '#1', 'Agent', 'First Name'],
          [''],
        ],
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
    ], WBPlanViewHelper.findArrayDivergencePoint,
  );

  runTest(
    'WBPlanViewHelper.findDuplicateMappings', [
      [
        [
          [
            ['collectionobject', 'collector', 'firstname'],
            ['collectionobject', 'collector', 'firstname'],
          ],
          false,
        ],
        [1],
      ],
      [
        [
          [
            ['collectionobject', 'collector', 'firstname'],
            ['collectionobject', 'collector', 'firstname'],
          ],
          1,
        ],
        [0],
      ],
      [
        [
          [
            ['collectionobject', 'collector', 'firstname'],
            ['collectionobject', 'collector', 'lastname'],
            ['collectionobject', 'collector', 'firstname'],
            ['collectionobject', 'collector', 'title'],
            ['collectionobject', 'collector', 'title'],
          ],
          2,
        ],
        [0, 4],
      ],
    ], WBPlanViewHelper.findDuplicateMappings,
  );

  runTest(
    'WBPlanViewHelper.fullMappingPathParser', [
      [
        [
          [
            'collectionobject',
            'collector',
            'firstname',
            'existingHeader',
            'Collector Name',
            {
              matchBehavior: 'ignoreWhenBlank',
              nullAllowed: false,
              default: null,
            },
          ] as FullMappingPath,
        ],
        [
          [
            'collectionobject',
            'collector',
            'firstname',
          ],
          'existingHeader',
          'Collector Name',
          {
            matchBehavior: 'ignoreWhenBlank',
            nullAllowed: false,
            default: null,
          },
        ],
      ],
    ], WBPlanViewHelper.fullMappingPathParser,
  );

}
