interface upload_plan_node extends Record<string, string | boolean | upload_plan_node> {
}

interface upload_plan_to_mappings_tree {
	base_table_name :string,
	mappings_tree :mappings_tree,
}

interface upload_plan_processing_functions {
	wbcols :([key, value] :[string, string]) => [key :string, value :object],
	static :([key, value] :[string, string]) => [key :string, value :object],
	toOne :([key, value] :[string, upload_plan_uploadTable_toOne]) => [key :string, value :object],
	toMany :([key, value] :[string, object]) => [key :string, value :object],
}