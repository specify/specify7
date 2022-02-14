/**
 * Configuration for what schema tables and fields are accessible in the WB
 *
 * @remarks
 * Replaces the need for Sp6 Workbench Schema
 *
 * @module
 */

import { schema } from './schema';
import type { IR } from './types';

export type TableConfigOverwrite =
  /*
   * Adds a table to the list of common base tables (shown on the base table
   *  selection screen even if "Show Advanced Tables" is not checked
   */
  | 'commonBaseTable'
  /*
   * Remove table from the list of base tables, but still make it available
   *  through relationships
   */
  | 'hidden'
  /*
   * Remove the table, all of it's fields/relationships and all
   *  fields/relationships from any table to this table
   */
  | 'remove';

export type FieldConfigOverwrite =
  // Makes a required field optional
  | 'optional'
  // Removes a field from the mapper (but not from Query Builder)
  | 'readOnly'
  // Removes a field from the mapper and Query Builder
  | 'remove'
  // Hides a field. If it was required, it is made optional
  | 'hidden';

export const fetchingParameters: {
  readonly tableOverwrites: IR<TableConfigOverwrite>;
  readonly endsWithTableOverwrites: IR<TableConfigOverwrite>;
  readonly fieldOverwrites: IR<IR<FieldConfigOverwrite>>;
  readonly endsWithFieldOverwrites: IR<FieldConfigOverwrite>;
} = Object.freeze({
  tableOverwrites: {
    /*
     * In addition to tables listed below, all tables marked as `system` or
     * hidden by schema config are removed
     */
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
    def: 'remove',
    item: 'remove',
    property: 'hidden',
  },

  /*
   * All required fields are unhidden, unless they are overwritten to "hidden".
   * ReadOnly relationships are removed.
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
      fullname: 'readOnly',
    },
    agent: {
      catalogerof: 'readOnly',
      agenttype: 'optional',
    },
    collectionobject: {
      currentdetermination: 'readOnly',
    },
    loanpreparation: {
      isresolved: 'optional',
    },
    locality: {
      srclatlongunit: 'optional',
    },
    preptype: {
      isloanable: 'readOnly',
    },
    determination: {
      preferredtaxon: 'readOnly',
      iscurrent: 'hidden',
    },
    taxon: {
      isaccepted: 'readOnly',
    },
  },

  /*
   * Same as fieldOverwrites, but matches with fieldName.endsWith(key),
   *  instead of fieldName===key.
   * endsWithFieldOverwrites are checked against fields in all tables.
   */
  endsWithFieldOverwrites: {
    precision: 'readOnly',
  },
});
