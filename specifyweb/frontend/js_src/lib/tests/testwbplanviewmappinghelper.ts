import { schema } from '../schema';
import { runTest } from './testmain';
import {
  findDuplicateMappings,
  getNameFromTreeRankName,
  getNumberFromToManyIndex,
  valueIsToManyIndex,
  valueIsTreeRank,
} from '../wbplanviewmappinghelper';

export function testWbPlanViewMappingHelper(): void {
  runTest(
    'WbPlanViewMappingHelper.valueIsToManyIndex',
    [
      [[`${schema.referenceSymbol}1`], true],
      [[`${schema.referenceSymbol}2`], true],
      [[`${schema.referenceSymbol}999`], true],
      [['collectionobject'], false],
      [[`${schema.treeSymbol}Kingdom`], false],
    ],
    valueIsToManyIndex
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
    valueIsTreeRank
  );

  runTest(
    'WbPlanViewMappingHelper.getNumberFromToManyIndex',
    [
      [[`${schema.referenceSymbol}1`], 1],
      [[`${schema.referenceSymbol}99`], 99],
      [[`${schema.referenceSymbol}0`], 0],
      [[`${schema.referenceSymbol}00`], 0],
    ],
    getNumberFromToManyIndex
  );

  runTest(
    'WbPlanViewMappingHelper.getNameFromTreeRankName',
    [
      [[`${schema.treeSymbol}Kingdom`], 'Kingdom'],
      [[`${schema.treeSymbol}County`], 'County'],
    ],
    getNameFromTreeRankName
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
    findDuplicateMappings
  );
}
