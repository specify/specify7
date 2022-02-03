import type { FullMappingPath } from '../components/wbplanviewmapper';
import * as WbPlanViewMappingHelper from '../wbplanviewmappinghelper';
import dataModelStorage from '../wbplanviewmodel';
import { loadDataModel, runTest } from './testmain';

export default function (): void {
  loadDataModel();

  runTest(
    'WbPlanViewMappingHelper.relationshipIsToMany',
    [
      [['one-to-many'], true],
      [['many-to-many'], true],
      [['one-to-one'], false],
      [['many-to-one'], false],
    ],
    WbPlanViewMappingHelper.relationshipIsToMany
  );

  runTest(
    'WbPlanViewMappingHelper.valueIsToManyIndex',
    [
      [[`${dataModelStorage.referenceSymbol}1`], true],
      [[`${dataModelStorage.referenceSymbol}2`], true],
      [[`${dataModelStorage.referenceSymbol}999`], true],
      [['collectionobject'], false],
      [[`${dataModelStorage.treeSymbol}Kingdom`], false],
    ],
    WbPlanViewMappingHelper.valueIsToManyIndex
  );

  runTest(
    'WbPlanViewMappingHelper.valueIsTreeRank',
    [
      [[`${dataModelStorage.referenceSymbol}1`], false],
      [[`${dataModelStorage.referenceSymbol}2`], false],
      [[`${dataModelStorage.referenceSymbol}999`], false],
      [['collectionobject'], false],
      [[`${dataModelStorage.treeSymbol}Kingdom`], true],
      [[`${dataModelStorage.treeSymbol}County`], true],
    ],
    WbPlanViewMappingHelper.valueIsTreeRank
  );

  runTest(
    'WbPlanViewMappingHelper.getNumberFromToManyIndex',
    [
      [[`${dataModelStorage.referenceSymbol}1`], 1],
      [[`${dataModelStorage.referenceSymbol}99`], 99],
      [[`${dataModelStorage.referenceSymbol}0`], 0],
      [[`${dataModelStorage.referenceSymbol}00`], 0],
    ],
    WbPlanViewMappingHelper.getNumberFromToManyIndex
  );

  runTest(
    'WbPlanViewMappingHelper.getNameFromTreeRankName',
    [
      [[`${dataModelStorage.treeSymbol}Kingdom`], 'Kingdom'],
      [[`${dataModelStorage.treeSymbol}County`], 'County'],
    ],
    WbPlanViewMappingHelper.getNameFromTreeRankName
  );

  runTest(
    'WbPlanViewMappingHelper.findDuplicateMappings',
    [
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
    ],
    WbPlanViewMappingHelper.findDuplicateMappings
  );

  runTest(
    'WbPlanViewMappingHelper.splitFullMappingPathComponents',
    [
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
        {
          mappingPath: ['collectionobject', 'collector', 'firstname'],
          mappingType: 'existingHeader',
          headerName: 'Collector Name',
          columnOptions: {
            matchBehavior: 'ignoreWhenBlank',
            nullAllowed: false,
            default: null,
          },
        },
      ],
    ],
    WbPlanViewMappingHelper.splitFullMappingPathComponents
  );
}
