/*
 *
 * Stores parsed data model and other useful objects for easy sharing
 * between the components of wbplanview
 *
 *
 */

'use strict';

import type { R } from './components/wbplanview';
import type {
  DataModelListOfTables,
  DataModelRanks,
  DataModelTables,
} from './wbplanviewmodelfetcher';

const dataModelStorage: {
  referenceSymbol: string;
  treeSymbol: string;
  pathJoinSymbol: string;
  tables: DataModelTables;
  listOfBaseTables: DataModelListOfTables;
  ranks: DataModelRanks;
  rootRanks: R<string>;
} = {
  // Each one of this can be modified to a single symbol or several symbols

  // Prefix for -to-many indexes (used behind the scenes & is shown to the user)
  referenceSymbol: '#',
  // Prefix for tree ranks (used behind the scenes)
  treeSymbol: '$',
  /*
   * A symbol to used to join multiple mapping path elements together when
   * need to represent mapping path as a string
   */
  pathJoinSymbol: '_',

  // Parsed tables and their fields
  tables: undefined!,
  // Tables that are available as base table
  listOfBaseTables: undefined!,
  // Dict of defined ranks for tree tables
  ranks: undefined!,
  // Root rank for each tree table
  rootRanks: undefined!,
};

export default dataModelStorage;
