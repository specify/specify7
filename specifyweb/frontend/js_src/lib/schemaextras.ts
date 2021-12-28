import schema from './schemabase';
import { Field, Relationship } from './specifyfield';
import type SpecifyModel from './specifymodel';
import type { IR, RA } from './types';
import { defined } from './types';

function alwaysTrue(): true {
  return true;
}

const schemaExtras: IR<(model: SpecifyModel) => RA<Field | Relationship>> = {
  Agent(model) {
    const catalogerOf = new Relationship(model, {
      name: 'catalogerOf',
      required: false,
      type: 'one-to-many',
      otherSideName: 'Cataloger',
      relatedModelName: 'CollectionObject',
      dependent: false,
    });
    catalogerOf.isHidden = alwaysTrue;
    return [catalogerOf];
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
    collectionObjects.isHidden = alwaysTrue;
    return [collectionObjects];
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
    currentDetermination.isHidden = alwaysTrue;

    const collection = defined(model.getRelationship('collection'));
    collection.otherSideName = 'collectionObjects';

    const catalognumber = defined(model.getField('catalognumber'));
    catalognumber.getFormat = (): string | undefined =>
      schema.catalogNumFormatName ||
      Field.prototype.getFormat.call(catalognumber);

    return [currentDetermination];
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
    accessions.isHidden = alwaysTrue;
    return [accessions];
  },
  Accession(model) {
    const division = defined(model.getRelationship('division'));
    division.otherSideName = 'accessions';
    return [];
  },
  Loan(model) {
    const totalPreps = new Field(model, {
      name: 'totalPreps',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    totalPreps.isHidden = alwaysTrue;

    const totalItems = new Field(model, {
      name: 'totalItems',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    totalItems.isHidden = alwaysTrue;

    const unresolvedPreps = new Field(model, {
      name: 'unresolvedPreps',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    unresolvedPreps.isHidden = alwaysTrue;

    const unresolvedItems = new Field(model, {
      name: 'unresolvedItems',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    unresolvedItems.isHidden = alwaysTrue;

    const resolvedPreps = new Field(model, {
      name: 'resolvedPreps',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    resolvedPreps.isHidden = alwaysTrue;

    const resolvedItems = new Field(model, {
      name: 'resolvedItems',
      required: false,
      readOnly: true,
      type: 'java.lang.Integer',
      indexed: false,
      unique: false,
    });
    resolvedItems.isHidden = alwaysTrue;

    return [
      totalPreps,
      totalItems,
      unresolvedPreps,
      unresolvedItems,
      resolvedPreps,
      resolvedItems,
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
    preparations.isHidden = alwaysTrue;
    return [preparations];
  },
  Preparation(model) {
    const isOnLoan = new Field(model, {
      name: 'isOnLoan',
      required: false,
      readOnly: true,
      type: 'java.lang.Boolean',
      indexed: false,
      unique: false,
    });
    isOnLoan.isHidden = alwaysTrue;

    const preptype = defined(model.getRelationship('preptype'));
    preptype.otherSideName = 'preparations';

    return [isOnLoan];
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
    preferredTaxonOf.isHidden = alwaysTrue;

    const parentField = defined(model.getField('parent'));
    parentField.isRequired = true;

    const isAccepted = defined(model.getField('isaccepted'));
    isAccepted.readOnly = true;

    const acceptedTaxon = defined(model.getField('acceptedtaxon'));
    acceptedTaxon.readOnly = true;

    const fullName = defined(model.getField('fullname'));
    fullName.readOnly = true;

    return [preferredTaxonOf];
  },
  Geography(model) {
    const parentField = defined(model.getField('parent'));
    parentField.isRequired = true;

    const isAccepted = defined(model.getField('isaccepted'));
    isAccepted.readOnly = true;

    const acceptedGeography = defined(model.getField('acceptedgeography'));
    acceptedGeography.readOnly = true;

    const fullName = defined(model.getField('fullname'));
    fullName.readOnly = true;

    return [];
  },
  LithoStrat(model) {
    const parentField = defined(model.getField('parent'));
    parentField.isRequired = true;

    const isAccepted = defined(model.getField('isaccepted'));
    isAccepted.readOnly = true;

    const acceptedLithostrat = defined(model.getField('acceptedlithostrat'));
    acceptedLithostrat.readOnly = true;

    const fullName = defined(model.getField('fullname'));
    fullName.readOnly = true;

    return [];
  },
  GeologicTimePeriod(model) {
    const parentField = defined(model.getField('parent'));
    parentField.isRequired = true;

    const isAccepted = defined(model.getField('isaccepted'));
    isAccepted.readOnly = true;

    const acceptedGeologictimeperiod = defined(
      model.getField('acceptedgeologictimeperiod')
    );
    acceptedGeologictimeperiod.readOnly = true;

    const fullName = defined(model.getField('fullname'));
    fullName.readOnly = true;

    return [];
  },
  Storage(model) {
    const parentField = defined(model.getField('parent'));
    parentField.isRequired = true;

    const isAccepted = defined(model.getField('isaccepted'));
    isAccepted.readOnly = true;

    const acceptedStorage = defined(model.getField('acceptedstorage'));
    acceptedStorage.readOnly = true;

    const fullName = defined(model.getField('fullname'));
    fullName.readOnly = true;

    return [];
  },
};

export default schemaExtras;
