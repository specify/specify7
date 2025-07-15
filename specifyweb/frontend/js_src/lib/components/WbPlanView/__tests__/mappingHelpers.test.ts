import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { schema } from '../../DataModel/schema';
import {
  findDuplicateMappings,
  getNameFromTreeRankName,
  getNumberFromToManyIndex,
  valueIsToManyIndex,
  valueIsTreeRank,
} from '../mappingHelpers';

requireContext();

theories(valueIsToManyIndex, [
  [[`${schema.referenceSymbol}1`], true],
  [[`${schema.referenceSymbol}2`], true],
  [[`${schema.referenceSymbol}999`], true],
  [['collectionobject'], false],
  [[`${schema.treeRankSymbol}Kingdom`], false],
]);

theories(valueIsTreeRank, [
  [[`${schema.referenceSymbol}1`], false],
  [[`${schema.referenceSymbol}2`], false],
  [[`${schema.referenceSymbol}999`], false],
  [['collectionobject'], false],
  [[`${schema.treeRankSymbol}Kingdom`], true],
  [[`${schema.treeRankSymbol}County`], true],
]);

theories(getNumberFromToManyIndex, [
  [[`${schema.referenceSymbol}1`], 1],
  [[`${schema.referenceSymbol}99`], 99],
  [[`${schema.referenceSymbol}0`], 0],
  [[`${schema.referenceSymbol}00`], 0],
]);

theories(getNameFromTreeRankName, [
  [[`${schema.treeRankSymbol}Kingdom`], 'Kingdom'],
  [[`${schema.treeRankSymbol}County`], 'County'],
]);

theories(findDuplicateMappings, [
  {
    in: [
      [
        ['collectionobject', 'collector', 'firstname'],
        ['collectionobject', 'collector', 'firstname'],
      ],
      false,
    ],
    out: [1],
  },
  {
    in: [
      [
        ['collectionobject', 'collector', 'firstname'],
        ['collectionobject', 'collector', 'firstname'],
      ],
      1,
    ],
    out: [0],
  },
  {
    in: [
      [
        ['collectionobject', 'collector', 'firstname'],
        ['collectionobject', 'collector', 'lastname'],
        ['collectionobject', 'collector', 'firstname'],
        ['collectionobject', 'collector', 'title'],
        ['collectionobject', 'collector', 'title'],
      ],
      2,
    ],
    out: [0, 4],
  },
]);
