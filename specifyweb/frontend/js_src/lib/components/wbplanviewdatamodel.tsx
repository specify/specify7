'use strict';

const data_model_storage:data_model_storage = {

	// each of this can be modified to a single symbol or several symbols
	reference_symbol: '#',  // prefix for -to-many indexes (used behind the scenes & is shown to the user)
	tree_symbol: '$',  // prefix for tree ranks (used behind the scenes)
	path_join_symbol: '_',  // a symbol to use to join multiple mapping path elements together when need to represent mapping path as a string`Add new column` button

	tables:undefined!,
	list_of_base_tables:undefined!,
	ranks:undefined!,

};

export default data_model_storage;