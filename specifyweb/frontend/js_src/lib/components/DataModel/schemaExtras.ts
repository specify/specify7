/**
 * Defines front-end only fields and misc front-end only schema mutations
 */

import type { IR, RA, RR } from '../../utils/types';
import { getField } from './helpers';
import type { TableFields } from './helperTypes';
import { schema } from './schema';
import { LiteralField, Relationship } from './specifyField';
import type { SpecifyTable } from './specifyTable';
import type { Tables } from './types';

export const schemaAliases: RR<'', IR<string>> & {
  readonly [TABLE_NAME in keyof Tables]?: IR<TableFields<Tables[TABLE_NAME]>>;
} = {
  '': {
    divisionCBX: 'division',
  },
  PickList: {
    fieldsCBX: 'fieldName',
    formatterCBX: 'formatter',
    tablesCBX: 'tableName',
    typesCBX: 'type',
  },
};

export const schemaExtras: {
  readonly [TABLE_NAME in keyof Tables]?: (
    table: SpecifyTable<Tables[TABLE_NAME]>
  ) => readonly [
    fields: RA<LiteralField | Relationship>,
    callback?: () => void
  ];
} = {
  Agent: (table) => [
    [
      new Relationship(table, {
        name: 'catalogerOf',
        required: false,
        type: 'one-to-many',
        otherSideName: 'Cataloger',
        relatedModelName: 'CollectionObject',
        dependent: false,
      }),
    ],
  ],
  Collection: (table) => [
    [
      new Relationship(table, {
        name: 'collectionObjects',
        required: false,
        type: 'one-to-many',
        otherSideName: 'Collection',
        relatedModelName: 'CollectionObject',
        dependent: false,
      }),
    ],
  ],
  CollectionObject: (table) => [
    [
      new Relationship(table, {
        name: 'currentDetermination',
        required: false,
        type: 'one-to-one',
        otherSideName: 'CollectionObject',
        relatedModelName: 'Determination',
        readOnly: true,
        dependent: false,
      }),
      new LiteralField(table, {
        name: 'totalCountAmt',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
      new LiteralField(table, {
        name: 'actualTotalCountAmt',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
    ],
    (): void => {
      const collection = getField(table, 'collection');
      collection.otherSideName = 'collectionObjects';

      /*
       * Catalog number formatter is taken from the field on the collection,
       * if present
       */
      const catalognumber = getField(table, 'catalogNumber');
      catalognumber.getFormat = (): string | undefined =>
        schema.catalogNumFormatName ||
        LiteralField.prototype.getFormat.call(catalognumber);
    },
  ],
  Division: (table) => [
    [
      new Relationship(table, {
        name: 'accessions',
        required: false,
        type: 'one-to-many',
        otherSideName: 'Division',
        relatedModelName: 'Accession',
        dependent: false,
      }),
    ],
  ],
  Accession: (table) => [
    [
      new LiteralField(table, {
        name: 'actualTotalCountAmt',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
      new LiteralField(table, {
        name: 'totalCountAmt',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
      new LiteralField(table, {
        name: 'preparationCount',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
      new LiteralField(table, {
        name: 'collectionObjectCount',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
    ],
    (): void => {
      getField(table, 'division').otherSideName = 'accessions';
    },
  ],
  Deaccession: (table) => [
    [
      new LiteralField(table, {
        name: 'totalPreps',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
      new LiteralField(table, {
        name: 'totalItems',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
    ],
  ],
  Disposal: (table) => [
    [
      new LiteralField(table, {
        name: 'totalPreps',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
      new LiteralField(table, {
        name: 'totalItems',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
    ],
  ],
  ExchangeOut: (table) => [
    [
      new LiteralField(table, {
        name: 'totalPreps',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
      new LiteralField(table, {
        name: 'totalItems',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
    ],
  ],
  Gift: (table) => [
    [
      new LiteralField(table, {
        name: 'totalPreps',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
      new LiteralField(table, {
        name: 'totalItems',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
    ],
  ],
  Loan: (table) => [
    [
      new LiteralField(table, {
        name: 'totalPreps',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
      new LiteralField(table, {
        name: 'totalItems',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
      new LiteralField(table, {
        name: 'unresolvedPreps',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
      new LiteralField(table, {
        name: 'unresolvedItems',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
      new LiteralField(table, {
        name: 'resolvedPreps',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
      new LiteralField(table, {
        name: 'resolvedItems',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
    ],
  ],
  PrepType: (table) => [
    [
      new Relationship(table, {
        name: 'preparations',
        required: false,
        type: 'one-to-many',
        otherSideName: 'PrepType',
        relatedModelName: 'Preparation',
        dependent: false,
      }),
    ],
  ],
  Preparation: (table) => [
    [
      new LiteralField(table, {
        name: 'isOnLoan',
        required: false,
        readOnly: true,
        type: 'java.lang.Boolean',
        indexed: false,
        unique: false,
      }),
      new LiteralField(table, {
        name: 'actualCountAmt',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }),
    ],
    (): void => {
      const preptype = getField(table, 'prepType');
      preptype.otherSideName = 'preparations';
    },
  ],
  Taxon: (table) => [
    [
      new Relationship(table, {
        name: 'preferredTaxonOf',
        required: false,
        type: 'one-to-many',
        otherSideName: 'preferredTaxon',
        relatedModelName: 'Determination',
        dependent: false,
      }),
    ],
  ],
  AddressOfRecord: (table) => [
    [
      new Relationship(table, {
        name: 'borrow',
        required: false,
        type: 'one-to-many',
        otherSideName: 'addressOfRecord',
        relatedModelName: 'Borrow',
        dependent: false,
      }),
    ],
  ],
  Borrow: (table) => [
    [],
    (): void => {
      table.getRelationship('addressOfRecord')!.otherSideName = 'borrow';
    },
  ],
  SpecifyUser: (table) => [
    [
      new LiteralField(table, {
        name: 'isAdmin',
        required: true,
        readOnly: true,
        type: 'java.lang.Boolean',
        indexed: false,
        unique: false,
      }),
    ],
  ],
};
