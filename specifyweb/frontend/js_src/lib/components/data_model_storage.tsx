'use strict';

class data_model_storage {

	// each of this can be modified to a single symbol or several symbols
	public static readonly reference_symbol :string = '#';  // prefix for -to-many indexes (used behind the scenes & is shown to the user)
	public static readonly tree_symbol :string = '$';  // prefix for tree ranks (used behind the scenes)
	public static readonly path_join_symbol :string = '_';  // a symbol to use to join multiple mapping path elements together when need to represent mapping path as a string`Add new column` button

	public static tables: data_model_tables;
	public static list_of_base_tables: data_model_list_of_tables;
	public static ranks: data_model_ranks;

}

export = data_model_storage;