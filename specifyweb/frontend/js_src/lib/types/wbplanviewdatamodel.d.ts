interface data_model_storage {
	// each of this can be modified to a single symbol or several symbols
	reference_symbol :string;  // prefix for -to-many indexes (used behind the scenes & is shown to the user)
	tree_symbol :string;  // prefix for tree ranks (used behind the scenes)
	path_join_symbol :string;  // a symbol to use to join multiple mapping path elements together when need to represent mapping path as a string`Add new column` button

	tables: data_model_tables;
	list_of_base_tables: data_model_list_of_tables;
	ranks: data_model_ranks;
}