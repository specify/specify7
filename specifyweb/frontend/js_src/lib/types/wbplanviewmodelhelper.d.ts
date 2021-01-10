interface is_circular_relationship_forwards_props {
	table_name?: string,
	relationship_key?: string,
	current_mapping_path_part?: string,
}

interface is_circular_relationship_backwards_props {
	foreign_name?: string,
	parent_table_name?: string,
	relationship_key?: string,
}

interface is_circular_relationship_props {
	target_table_name?: string,
	parent_table_name?: string,
	foreign_name?: string,
	relationship_key?: string,
	current_mapping_path_part?: string,
	table_name?: string,
}