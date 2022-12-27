/**
 * Defines front-end only fields and misc front-end only schema mutations
 */

import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import type { FilterTablesByEndsWith } from './helperTypes';
import { schema } from './schema';
import { LiteralField, Relationship } from './specifyField';
import type { SpecifyModel } from './specifyModel';
import type { Tables } from './types';

const treeDefinitionFields = [
  'fullNameSeparator',
  'isEnforced',
  'isInFullName',
  'textAfter',
  'textBefore',
];

const treeDefItem = (
  model: SpecifyModel<FilterTablesByEndsWith<'TreeDefItem'>>
) =>
  [
    [],
    [],
    (): void =>
      filterArray(
        treeDefinitionFields.map((fieldName) =>
          model.getLiteralField(fieldName)
        )
      ).forEach((field) => {
        field.isReadOnly = true;
        field.overrides.isReadOnly = true;
      }),
  ] as const;

export const schemaExtras: {
  readonly [TABLE_NAME in keyof Tables]?: (
    model: SpecifyModel<Tables[TABLE_NAME]>
  ) => readonly [
    fields: RA<LiteralField>,
    relationships: RA<Relationship>,
    callback?: () => void
  ];
} = {
  Agent(model) {
    const catalogerOf = new Relationship(model, {
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
  Collection(model) {
    const collectionObjects = new Relationship(model, {
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
  CollectionObject(model) {
    const currentDetermination = new Relationship(model, {
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

    const totalCountAmt = new LiteralField(model, {
      name: 'totalCountAmt',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    totalCountAmt.isHidden = true;
    totalCountAmt.overrides.isHidden = true;

    const actualTotalCountAmt = new LiteralField(model, {
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
        const collection = model.strictGetRelationship('collection');
        collection.otherSideName = 'collectionObjects';

        /*
         * Catalog number formatter is taken from the field on the collection,
         * if present
         */
        const catalognumber = model.strictGetLiteralField('catalogNumber');
        catalognumber.getFormat = (): string | undefined =>
          schema.catalogNumFormatName ||
          LiteralField.prototype.getFormat.call(catalognumber);
      },
    ];
  },
  Division(model) {
    const accessions = new Relationship(model, {
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
  Accession: (model) => {
    const actualTotalCountAmt = new LiteralField(model, {
      name: 'actualTotalCountAmt',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    actualTotalCountAmt.isHidden = true;
    actualTotalCountAmt.overrides.isHidden = true;

    const totalCountAmt = new LiteralField(model, {
      name: 'totalCountAmt',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    totalCountAmt.isHidden = true;
    totalCountAmt.overrides.isHidden = true;

    const preparationCount = new LiteralField(model, {
      name: 'preparationCount',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    preparationCount.isHidden = true;
    preparationCount.overrides.isHidden = true;

    const collectionObjectCount = new LiteralField(model, {
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
        model.strictGetRelationship('division').otherSideName = 'accessions';
      },
    ];
  },
  Loan(model) {
    const totalPreps = new LiteralField(model, {
      name: 'totalPreps',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    totalPreps.isHidden = true;
    totalPreps.overrides.isHidden = true;

    const totalItems = new LiteralField(model, {
      name: 'totalItems',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    totalItems.isHidden = true;
    totalItems.overrides.isHidden = true;

    const unresolvedPreps = new LiteralField(model, {
      name: 'unresolvedPreps',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    unresolvedPreps.isHidden = true;
    unresolvedPreps.overrides.isHidden = true;

    const unresolvedItems = new LiteralField(model, {
      name: 'unresolvedItems',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    unresolvedItems.isHidden = true;
    unresolvedItems.overrides.isHidden = true;

    const resolvedPreps = new LiteralField(model, {
      name: 'resolvedPreps',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    resolvedPreps.isHidden = true;
    resolvedPreps.overrides.isHidden = true;

    const resolvedItems = new LiteralField(model, {
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
  PrepType(model) {
    const preparations = new Relationship(model, {
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
  Preparation(model) {
    const isOnLoan = new LiteralField(model, {
      name: 'isOnLoan',
      required: false,
      readOnly: true,
      type: 'java.lang.Boolean',
      indexed: false,
      unique: false,
    });
    isOnLoan.isHidden = true;
    isOnLoan.overrides.isHidden = true;

    const actualCountAmt = new LiteralField(model, {
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
        const preptype = model.strictGetRelationship('preptype');
        preptype.otherSideName = 'preparations';
      },
    ];
  },
  Taxon(model) {
    const preferredTaxonOf = new Relationship(model, {
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
  AddressOfRecord(model) {
    const borrow = new Relationship(model, {
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
  Borrow: (model) => [
    [],
    [],
    (): void => {
      model.getRelationship('addressOfRecord')!.otherSideName = 'borrow';
    },
  ],
  SpecifyUser: (model) => [
    [
      new LiteralField(model, {
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
