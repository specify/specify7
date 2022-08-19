import { schema } from '../schema';
import {
  findDuplicateMappings,
  getNameFromTreeRankName,
  getNumberFromToManyIndex,
  valueIsToManyIndex,
  valueIsTreeRank,
} from '../wbplanviewmappinghelper';
import { theories } from './utils';

theories(valueIsToManyIndex, [
  [[`${schema.referenceSymbol}1`], true],
  [[`${schema.referenceSymbol}2`], true],
  [[`${schema.referenceSymbol}999`], true],
  [['collectionobject'], false],
  [[`${schema.treeSymbol}Kingdom`], false],
]);

theories(valueIsTreeRank, [
  [[`${schema.referenceSymbol}1`], false],
  [[`${schema.referenceSymbol}2`], false],
  [[`${schema.referenceSymbol}999`], false],
  [['collectionobject'], false],
  [[`${schema.treeSymbol}Kingdom`], true],
  [[`${schema.treeSymbol}County`], true],
]);

theories(getNumberFromToManyIndex, [
  [[`${schema.referenceSymbol}1`], 1],
  [[`${schema.referenceSymbol}99`], 99],
  [[`${schema.referenceSymbol}0`], 0],
  [[`${schema.referenceSymbol}00`], 0],
]);

theories(getNameFromTreeRankName, [
  [[`${schema.treeSymbol}Kingdom`], 'Kingdom'],
  [[`${schema.treeSymbol}County`], 'County'],
]);

theories(findDuplicateMappings, [
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
]);
