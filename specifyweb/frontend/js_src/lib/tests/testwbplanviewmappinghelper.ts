import type { FullMappingPath } from '../components/wbplanviewmapper';
import * as WbPlanViewMappingHelper from '../wbplanviewmappinghelper';
import { runTest } from './testmain';
import { schema } from '../schema';

export default function (): void {
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
      [[`${schema.referenceSymbol}1`], true],
      [[`${schema.referenceSymbol}2`], true],
      [[`${schema.referenceSymbol}999`], true],
      [['collectionobject'], false],
      [[`${schema.treeSymbol}Kingdom`], false],
    ],
    WbPlanViewMappingHelper.valueIsToManyIndex
  );

  runTest(
    'WbPlanViewMappingHelper.valueIsTreeRank',
    [
      [[`${schema.referenceSymbol}1`], false],
      [[`${schema.referenceSymbol}2`], false],
      [[`${schema.referenceSymbol}999`], false],
      [['collectionobject'], false],
      [[`${schema.treeSymbol}Kingdom`], true],
      [[`${schema.treeSymbol}County`], true],
    ],
    WbPlanViewMappingHelper.valueIsTreeRank
  );

  runTest(
    'WbPlanViewMappingHelper.getNumberFromToManyIndex',
    [
      [[`${schema.referenceSymbol}1`], 1],
      [[`${schema.referenceSymbol}99`], 99],
      [[`${schema.referenceSymbol}0`], 0],
      [[`${schema.referenceSymbol}00`], 0],
    ],
    WbPlanViewMappingHelper.getNumberFromToManyIndex
  );

  runTest(
    'WbPlanViewMappingHelper.getNameFromTreeRankName',
    [
      [[`${schema.treeSymbol}Kingdom`], 'Kingdom'],
      [[`${schema.treeSymbol}County`], 'County'],
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
