/**
 * Defines front-end only fields and misc front-end only schema mutations
 */

import type { IR, RA, RR } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { getField } from './helpers';
import type { FilterTablesByEndsWith, TableFields } from './helperTypes';
import { LiteralField, Relationship } from './specifyField';
import type { SpecifyTable } from './specifyTable';
import type { Tables } from './types';
import { schema } from './schema';

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

const treeDefinitionFields = [
  'fullNameSeparator',
  'isEnforced',
  'isInFullName',
  'textAfter',
  'textBefore',
];

const treeDefItem = (
  table: SpecifyTable<FilterTablesByEndsWith<'TreeDefItem'>>
) =>
  [
    [],
    [],
    (): void =>
      filterArray(
        treeDefinitionFields.map((fieldName) =>
          table.getLiteralField(fieldName)
        )
      ).forEach((field) => {
        field.isReadOnly = true;
        field.overrides.isReadOnly = true;
      }),
  ] as const;

export const schemaExtras: {
  readonly [TABLE_NAME in keyof Tables]?: (
    table: SpecifyTable<Tables[TABLE_NAME]>
  ) => readonly [
    fields: RA<LiteralField>,
    relationships: RA<Relationship>,
    callback?: () => void
  ];
} = {
  Agent(table) {
    const catalogerOf = new Relationship(table, {
      name: 'catalogerOf',
      required: false,
      type: 'one-to-many',
      otherSideName: 'Cataloger',
      relatedModelName: 'CollectionObject',
      dependent: false,
    });
    catalogerOf.isHidden = true;
    catalogerOf.overrides.isHidden = true;
    return [[], [catalogerOf]];
  },
  Collection(table) {
    const collectionObjects = new Relationship(table, {
      name: 'collectionObjects',
      required: false,
      type: 'one-to-many',
      otherSideName: 'Collection',
      relatedModelName: 'CollectionObject',
      dependent: false,
    });
    collectionObjects.isHidden = true;
    collectionObjects.overrides.isHidden = true;
    return [[], [collectionObjects]];
  },
  CollectionObject(table) {
    const currentDetermination = new Relationship(table, {
      name: 'currentDetermination',
      required: false,
      type: 'one-to-one',
      otherSideName: 'CollectionObject',
      relatedModelName: 'Determination',
      readOnly: true,
      dependent: false,
    });
    currentDetermination.isHidden = true;
    currentDetermination.overrides.isHidden = true;

    const totalCountAmt = new LiteralField(table, {
      name: 'totalCountAmt',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    totalCountAmt.isHidden = true;
    totalCountAmt.overrides.isHidden = true;

    const actualTotalCountAmt = new LiteralField(table, {
      name: 'actualTotalCountAmt',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    actualTotalCountAmt.isHidden = true;
    actualTotalCountAmt.overrides.isHidden = true;

    return [
      [totalCountAmt, actualTotalCountAmt],
      [currentDetermination],
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
    ];
  },
  Division(table) {
    const accessions = new Relationship(table, {
      name: 'accessions',
      required: false,
      type: 'one-to-many',
      otherSideName: 'Division',
      relatedModelName: 'Accession',
      dependent: false,
    });
    accessions.isHidden = true;
    accessions.overrides.isHidden = true;
    return [[], [accessions]];
  },
  Accession: (table) => {
    const actualTotalCountAmt = new LiteralField(table, {
      name: 'actualTotalCountAmt',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    actualTotalCountAmt.isHidden = true;
    actualTotalCountAmt.overrides.isHidden = true;

    const totalCountAmt = new LiteralField(table, {
      name: 'totalCountAmt',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    totalCountAmt.isHidden = true;
    totalCountAmt.overrides.isHidden = true;

    const preparationCount = new LiteralField(table, {
      name: 'preparationCount',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    preparationCount.isHidden = true;
    preparationCount.overrides.isHidden = true;

    const collectionObjectCount = new LiteralField(table, {
      name: 'collectionObjectCount',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    collectionObjectCount.isHidden = true;
    collectionObjectCount.overrides.isHidden = true;

    return [
      [actualTotalCountAmt],
      [],
      (): void => {
        getField(table, 'division').otherSideName = 'accessions';
      },
    ];
  },
  Loan(table) {
    const totalPreps = new LiteralField(table, {
      name: 'totalPreps',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    totalPreps.isHidden = true;
    totalPreps.overrides.isHidden = true;

    const totalItems = new LiteralField(table, {
      name: 'totalItems',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    totalItems.isHidden = true;
    totalItems.overrides.isHidden = true;

    const unresolvedPreps = new LiteralField(table, {
      name: 'unresolvedPreps',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    unresolvedPreps.isHidden = true;
    unresolvedPreps.overrides.isHidden = true;

    const unresolvedItems = new LiteralField(table, {
      name: 'unresolvedItems',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    unresolvedItems.isHidden = true;
    unresolvedItems.overrides.isHidden = true;

    const resolvedPreps = new LiteralField(table, {
      name: 'resolvedPreps',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    resolvedPreps.isHidden = true;
    resolvedPreps.overrides.isHidden = true;

    const resolvedItems = new LiteralField(table, {
      name: 'resolvedItems',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    resolvedItems.isHidden = true;
    resolvedItems.overrides.isHidden = true;

    return [
      [
        totalPreps,
        totalItems,
        unresolvedPreps,
        unresolvedItems,
        resolvedPreps,
        resolvedItems,
      ],
      [],
    ];
  },
  PrepType(table) {
    const preparations = new Relationship(table, {
      name: 'preparations',
      required: false,
      type: 'one-to-many',
      otherSideName: 'PrepType',
      relatedModelName: 'Preparation',
      dependent: false,
    });
    preparations.isHidden = true;
    preparations.overrides.isHidden = true;
    return [[], [preparations]];
  },
  Preparation(table) {
    const isOnLoan = new LiteralField(table, {
      name: 'isOnLoan',
      required: false,
      readOnly: true,
      type: 'java.lang.Boolean',
      indexed: false,
      unique: false,
    });
    isOnLoan.isHidden = true;
    isOnLoan.overrides.isHidden = true;

    const actualCountAmt = new LiteralField(table, {
      name: 'actualCountAmt',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    actualCountAmt.isHidden = true;
    actualCountAmt.overrides.isHidden = true;

    return [
      [isOnLoan, actualCountAmt],
      [],
      (): void => {
        const preptype = getField(table, 'prepType');
        preptype.otherSideName = 'preparations';
      },
    ];
  },
  Taxon(table) {
    const preferredTaxonOf = new Relationship(table, {
      name: 'preferredTaxonOf',
      required: false,
      type: 'one-to-many',
      otherSideName: 'preferredTaxon',
      relatedModelName: 'Determination',
      dependent: false,
    });
    preferredTaxonOf.isHidden = true;
    preferredTaxonOf.overrides.isHidden = true;

    return [[], [preferredTaxonOf]];
  },
  AddressOfRecord(table) {
    const borrow = new Relationship(table, {
      name: 'borrow',
      required: false,
      type: 'one-to-many',
      otherSideName: 'addressOfRecord',
      relatedModelName: 'Borrow',
      dependent: false,
    });
    borrow.isHidden = true;
    borrow.overrides.isHidden = true;
    return [[], [borrow]];
  },
  Borrow: (table) => [
    [],
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
    [],
  ],
  GeographyTreeDefItem: treeDefItem,
  StorageTreeDefItem: treeDefItem,
  TaxonTreeDefItem: treeDefItem,
  GeologicTimePeriodTreeDefItem: treeDefItem,
  LithoStratTreeDefItem: treeDefItem,
};
