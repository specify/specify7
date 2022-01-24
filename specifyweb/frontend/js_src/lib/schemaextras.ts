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
    const catalogerOf = new Relationship(
      model.name,
      model.localization.items.catalogerof ?? {},
      {
        name: 'catalogerOf',
        required: false,
        type: 'one-to-many',
        otherSideName: 'Cataloger',
        relatedModelName: 'CollectionObject',
        dependent: false,
      }
    );
    catalogerOf.isHidden = alwaysTrue;
    return [catalogerOf];
  },
  Collection(model) {
    const collectionObjects = new Relationship(
      model.name,
      model.localization.items.collectionobjects ?? {},
      {
        name: 'collectionObjects',
        required: false,
        type: 'one-to-many',
        otherSideName: 'Collection',
        relatedModelName: 'CollectionObject',
        dependent: false,
      }
    );
    collectionObjects.isHidden = alwaysTrue;
    return [collectionObjects];
  },
  CollectionObject(model) {
    const currentDetermination = new Relationship(
      model.name,
      model.localization.items.currentdetermination ?? {},
      {
        name: 'currentDetermination',
        required: false,
        type: 'one-to-one',
        otherSideName: 'CollectionObject',
        relatedModelName: 'Determination',
        readOnly: true,
        dependent: false,
      }
    );
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
    const accessions = new Relationship(
      model.name,
      model.localization.items.accessions ?? {},
      {
        name: 'accessions',
        required: false,
        type: 'one-to-many',
        otherSideName: 'Division',
        relatedModelName: 'Accession',
        dependent: false,
      }
    );
    accessions.isHidden = alwaysTrue;
    return [accessions];
  },
  Accession(model) {
    defined(model.getRelationship('division')).otherSideName = 'accessions';
    return [];
  },
  Loan(model) {
    const totalPreps = new Field(
      model.name,
      model.localization.items.totalpreps ?? {},
      {
        name: 'totalPreps',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }
    );
    totalPreps.isHidden = alwaysTrue;

    const totalItems = new Field(
      model.name,
      model.localization.items.totalitems ?? {},
      {
        name: 'totalItems',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }
    );
    totalItems.isHidden = alwaysTrue;

    const unresolvedPreps = new Field(
      model.name,
      model.localization.items.unresolvedpreps ?? {},
      {
        name: 'unresolvedPreps',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }
    );
    unresolvedPreps.isHidden = alwaysTrue;

    const unresolvedItems = new Field(
      model.name,
      model.localization.items.unresolveditems ?? {},
      {
        name: 'unresolvedItems',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }
    );
    unresolvedItems.isHidden = alwaysTrue;

    const resolvedPreps = new Field(
      model.name,
      model.localization.items.resolvedpreps ?? {},
      {
        name: 'resolvedPreps',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }
    );
    resolvedPreps.isHidden = alwaysTrue;

    const resolvedItems = new Field(
      model.name,
      model.localization.items.resolveditems ?? {},
      {
        name: 'resolvedItems',
        required: false,
        readOnly: true,
        type: 'java.lang.Integer',
        indexed: false,
        unique: false,
      }
    );
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
    const preparations = new Relationship(
      model.name,
      model.localization.items.preparations ?? {},
      {
        name: 'preparations',
        required: false,
        type: 'one-to-many',
        otherSideName: 'PrepType',
        relatedModelName: 'Preparation',
        dependent: false,
      }
    );
    preparations.isHidden = alwaysTrue;
    return [preparations];
  },
  Preparation(model) {
    const isOnLoan = new Field(
      model.name,
      model.localization.items.isonloan ?? {},
      {
        name: 'isOnLoan',
        required: false,
        readOnly: true,
        type: 'java.lang.Boolean',
        indexed: false,
        unique: false,
      }
    );
    isOnLoan.isHidden = alwaysTrue;

    const preptype = defined(model.getRelationship('preptype'));
    preptype.otherSideName = 'preparations';

    return [isOnLoan];
  },
  Taxon(model) {
    const preferredTaxonOf = new Relationship(
      model.name,
      model.localization.items.preferredtaxonof ?? {},
      {
        name: 'preferredTaxonOf',
        required: false,
        type: 'one-to-many',
        otherSideName: 'preferredTaxon',
        relatedModelName: 'Determination',
        dependent: false,
      }
    );
    preferredTaxonOf.isHidden = alwaysTrue;

    defined(model.getField('parent')).isRequired = true;
    defined(model.getField('isAccepted')).readOnly = true;
    defined(model.getField('acceptedTaxon')).readOnly = true;
    defined(model.getField('fullName')).readOnly = true;

    return [preferredTaxonOf];
  },
  Geography(model) {
    defined(model.getField('parent')).isRequired = true;
    defined(model.getField('isAccepted')).readOnly = true;
    defined(model.getField('acceptedGeography')).readOnly = true;
    defined(model.getField('fullName')).readOnly = true;
    return [];
  },
  LithoStrat(model) {
    defined(model.getField('parent')).isRequired = true;
    defined(model.getField('isAccepted')).readOnly = true;
    defined(model.getField('acceptedLithoStrat')).readOnly = true;
    defined(model.getField('fullName')).readOnly = true;
    return [];
  },
  GeologicTimePeriod(model) {
    defined(model.getField('parent')).isRequired = true;
    defined(model.getField('isAccepted')).readOnly = true;
    defined(model.getField('acceptedGeologictimeperiod')).readOnly = true;
    defined(model.getField('fullName')).readOnly = true;
    return [];
  },
  Storage(model) {
    defined(model.getField('parent')).isRequired = true;
    defined(model.getField('isAccepted')).readOnly = true;
    defined(model.getField('acceptedStorage')).readOnly = true;
    defined(model.getField('fullName')).readOnly = true;
    return [];
  },
};

export default schemaExtras;
