type mapping_tree_header = {
	[key in mapping_type] :string;
};

interface mapping_tree {
	[key :string] :mapping_tree | string | mapping_tree_header
}