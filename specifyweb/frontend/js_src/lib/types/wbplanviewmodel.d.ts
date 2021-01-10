interface data_model_storage {
	// each this can be modified to a single symbol or several symbols
	reference_symbol: string;  // prefix for -to-many indexes (used behind the scenes & is shown to the user)
	tree_symbol: string;  // prefix for tree ranks (used behind the scenes)
	// a symbol to used to join multiple mapping path elements together when need to represent mapping path as a string
	path_join_symbol: string;

	tables: data_model_tables;
	list_of_base_tables: data_model_list_of_tables;
	ranks: data_model_ranks;
}