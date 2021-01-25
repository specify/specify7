/*
*
* Stores parsed data model and other useful objects for easy sharing between the components of wbplanview
*
* */

'use strict';

import { DataModelListOfTables, DataModelRanks, DataModelTables } from './wbplanviewmodelfetcher';

const data_model_storage: {
	reference_symbol: string;
	tree_symbol: string;
	path_join_symbol: string;
	tables: DataModelTables;
	list_of_base_tables: DataModelListOfTables;
	ranks: DataModelRanks;
} = {

	// each this can be modified to a single symbol or several symbols
	reference_symbol: '#',  // prefix for -to-many indexes (used behind the scenes & is shown to the user)
	tree_symbol: '$',  // prefix for tree ranks (used behind the scenes)
	// a symbol to used to join multiple mapping path elements together when need to represent mapping path as a string
	path_join_symbol: '_',

	tables: undefined!,
	list_of_base_tables: undefined!,
	ranks: undefined!,

};

export default data_model_storage;