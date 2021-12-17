import type { IR } from './types';
import type { RelationshipType } from './components/wbplanviewmapper';
import schema from './schema';

export const dataModelFetcherVersion = '4';

export const knownRelationshipTypes: Set<string> = new Set([
  'one-to-one',
  'one-to-many',
  'many-to-one',
  'many-to-many',
]);

export const aliasRelationshipTypes: IR<RelationshipType> = {
  'zero-to-one': 'one-to-many',
};

export type TableConfigOverwrite =
  /*
   * Adds a table to the list of common base tables (shown on the base table
   *  selection screen even if "Show Advanced Tables" is not checked
   */
  | 'commonBaseTable'
  /*
   * Remove table from the list of base tables, but still make it available
   *  mappable through relationships
   */
  | 'hidden'
  /*
   * Remove the table, all of it's fields/relationships and all
   *  fields/relationships from any table to this table
   */
  | 'remove';

export type FieldConfigOverwrite =
  /*
   * Makes a required field optional
   */
  | 'optional'
  /*
   * Removes a field from the mapper
   */
  | 'remove'
  /*
   * Hides a field. If it was required, it is made optional
   */
  | 'hidden';

export const fetchingParameters: {
  readonly tableOverwrites: IR<TableConfigOverwrite>;
  readonly endsWithTableOverwrites: IR<TableConfigOverwrite>;
  readonly fieldOverwrites: IR<IR<FieldConfigOverwrite>>;
  readonly endsWithFieldOverwrites: IR<FieldConfigOverwrite>;
} = Object.freeze({
  tableOverwrites: {
    // All system tables are removed
    accession: 'commonBaseTable',
    agent: 'commonBaseTable',
    borrow: 'commonBaseTable',
    collectingevent: 'commonBaseTable',
    collectionobject: 'commonBaseTable',
    conservevent: 'commonBaseTable',
    container: 'commonBaseTable',
    deaccession: 'commonBaseTable',
    determination: 'commonBaseTable',
    dnasequence: 'commonBaseTable',
    exchangein: 'commonBaseTable',
    exchangeout: 'commonBaseTable',
    geography: 'commonBaseTable',
    gift: 'commonBaseTable',
    loan: 'commonBaseTable',
    locality: 'commonBaseTable',
    permit: 'commonBaseTable',
    preparation: 'commonBaseTable',
    storage: 'commonBaseTable',
    taxon: 'commonBaseTable',
    treatmentevent: 'commonBaseTable',
    definition: 'remove',
    collectingeventattr: 'remove',
    collectionobjectattr: 'remove',
    latlonpolygonpnt: 'remove',
    // Remove hierarchy tables
    ...Object.fromEntries(
      schema.orgHierarchy
        .filter((tableName) => tableName !== 'collectionobject')
        .map((tableName) => [tableName, 'remove'])
    ),
  },

  /*
   * Same as tableOverwrites, but matches with tableName.endsWith(key),
   *  instead of tableName===key
   */
  endsWithTableOverwrites: {
    authorization: 'hidden',
    variant: 'hidden',
    attribute: 'hidden',
    def: 'hidden',
    property: 'hidden',
    item: 'hidden',
  },

  /*
   * All required fields are unhidden, unless they are overwritten to "hidden".
   * readOnly relationships are removed.
   * Make sure that front-end only fields (defined in schemaextras.js) are
   *  removed too
   */
  fieldOverwrites: {
    // _common overwrites apply to all tables
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _common: {
      timestampcreated: 'hidden',
      timestampmodified: 'hidden',
      createdbyagent: 'hidden',
      modifiedbyagent: 'hidden',
      collectionmemberid: 'hidden',
      rankid: 'hidden',
      definition: 'hidden',
      definitionitem: 'hidden',
      ordernumber: 'hidden',
      isprimary: 'hidden',
      ishybrid: 'hidden',
      isaccepted: 'hidden',
      fullname: 'remove',
    },
    agent: {
      catalogerof: 'remove',
      agenttype: 'optional',
    },
    collectionobject: {
      currentdetermination: 'remove',
    },
    loan: {
      totalpreps: 'remove',
      unresolvedpreps: 'remove',
      unresolveditems: 'remove',
      resolvedpreps: 'remove',
      resolveditems: 'remove',
    },
    loanpreparation: {
      isresolved: 'optional',
    },
    locality: {
      srclatlongunit: 'optional',
    },
    preparation: {
      isonloan: 'remove',
    },
    preptype: {
      isloanable: 'remove',
    },
    token: {
      preferredtaxonof: 'remove',
    },
    geography: {
      fullname: 'remove',
    },
    determination: {
      preferredtaxon: 'remove',
      iscurrent: 'hidden',
    },
    taxon: {
      isaccepted: 'remove',
    },
  },

  /*
   * Same as fieldOverwrites, but matches with fieldName.endsWith(key),
   *  instead of fieldName===key.
   * endsWithFieldOverwrites are checked against fields in all tables.
   */
  endsWithFieldOverwrites: {
    precision: 'remove',
  },
});