/*
*
* Stores parsed data model and other useful objects for easy sharing between the components of wbplanview
*
* */

'use strict';

import {
	DataModelListOfTables,
	DataModelRanks,
	DataModelTables
} from './wbplanviewmodelfetcher';

const data_model_storage: {
	reference_symbol: string;
	tree_symbol: string;
	path_join_symbol: string;
	tables: DataModelTables;
	list_of_base_tables: DataModelListOfTables;
	ranks: DataModelRanks;
	root_ranks: Record<string,string>
} = {

	// each one of this can be modified to a single symbol or several symbols

	// prefix for -to-many indexes (used behind the scenes & is shown to the user)
	reference_symbol: '#',
	tree_symbol: '$',  // prefix for tree ranks (used behind the scenes)
	// a symbol to used to join multiple mapping path elements together when
	// need to represent mapping path as a string
	path_join_symbol: '_',

	tables: undefined!,  // parsed tables and their fields
	list_of_base_tables: undefined!,  // tables that are available as base table
	ranks: undefined!,  // dict of defined ranks for tree tables
	root_ranks: undefined!,  // root rank for each tree table

};

export default data_model_storage;