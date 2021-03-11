/*
*
* Stores parsed data model and other useful objects for easy sharing
* between the components of wbplanview
*
* */

'use strict';

import {
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
  rootRanks: Record<string, string>
} = {

  // each one of this can be modified to a single symbol or several symbols

  // prefix for -to-many indexes (used behind the scenes & is shown to the user)
  referenceSymbol: '#',
  treeSymbol: '$',  // prefix for tree ranks (used behind the scenes)
  // a symbol to used to join multiple mapping path elements together when
  // need to represent mapping path as a string
  pathJoinSymbol: '_',

  tables: undefined!,  // parsed tables and their fields
  listOfBaseTables: undefined!,  // tables that are available as base table
  ranks: undefined!,  // dict of defined ranks for tree tables
  rootRanks: undefined!,  // root rank for each tree table

};

export default dataModelStorage;