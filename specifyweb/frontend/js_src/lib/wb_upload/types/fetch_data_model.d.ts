interface data_model_field_writable {
	friendly_name :string,
	is_hidden :boolean,
	is_required :boolean,
	is_relationship :boolean,
	table_name? :string,
	type? :relationship_type,
	foreign_name? :string,
}

interface data_model_relationship_writable extends data_model_field_writable {
	is_relationship :true,
	table_name :string,
	type :relationship_type,
	foreign_name :string,
}

interface data_model_field extends data_model_field_writable {
	readonly friendly_name :string,
	readonly is_hidden :boolean,
	readonly is_required :boolean,
	readonly is_relationship :boolean,
	readonly table_name? :string,
	readonly type? :relationship_type,
	readonly foreign_name? :string,
}

interface data_model_relationship extends data_model_field {
	readonly is_relationship :true,
	readonly table_name :string,
	readonly type :relationship_type,
	readonly foreign_name :string,
}

interface data_model_fields_writable {
	[field_name :string] :(data_model_field | data_model_relationship)
}

interface data_model_fields extends data_model_fields_writable {
	readonly [field_name :string] :(data_model_field | data_model_relationship)
}

interface data_model_table_writable {
	table_friendly_name :string,
	fields :data_model_fields_writable,
}

interface data_model_table extends data_model_table_writable {
	readonly table_friendly_name :string,
	readonly fields :data_model_fields,
}

interface data_model_tables_writable {
	[table_name :string] :data_model_table_writable,
}

interface data_model_tables extends data_model_tables_writable {
	readonly [table_name :string] :data_model_table,
}

type table_ranks_inline = [table_name :string, table_ranks :table_ranks];

interface table_ranks_writable {
	[rank_name :string] :boolean  // whether rank is required
}

interface table_ranks extends table_ranks_writable {
	readonly [rank_name :string] :boolean  // whether rank is required
}

interface data_model_ranks_writable {
	[table_name :string] :table_ranks
}

interface data_model_ranks extends data_model_ranks_writable {
	readonly [table_name :string] :table_ranks
}

interface fetching_parameters {
	readonly required_fields_to_hide :string[],
	readonly tables_to_hide :string[],
	readonly table_keywords_to_exclude :string[],
	readonly required_fields_to_be_made_optional :{[table_name :string] :string}
}

interface schema_model_table_field {
	readonly name :string,
	readonly getLocalizedName :() => string,
	readonly isRequired :boolean,
	readonly isHidden :() => number,
	readonly isRelationship :boolean
}

interface schema_model_table_relationship extends schema_model_table_field {
	readonly otherSideName :string,
	readonly type :relationship_type,
	readonly relatedModelName :string,
	readonly readOnly :boolean,
}

interface schema_model_table_data {
	readonly longName :string,
	readonly getLocalizedName :() => string
	readonly system :boolean,
	readonly fields :schema_model_table_field[]
}

interface domain_tree_definition_item {
	readonly get :(field_name :string) => number | string,
}

interface domain_request {
	readonly [field_name :string] :any,
}

interface domain_tree_definition_items {
	readonly fetch :(param :domain_request) => jquery_promise<void>;
	readonly models :{[model_id :string] :domain_tree_definition_item}
}

interface domain_tree_definition {
	readonly rget :(field_name :string) => jquery_promise<domain_tree_definition_items>,
}

interface jquery_promise<T> {
	readonly done :(callback :((t :T) => void)) => void,
}

interface domain {
	readonly getTreeDef :(table_name :string) => jquery_promise<domain_tree_definition>,
}