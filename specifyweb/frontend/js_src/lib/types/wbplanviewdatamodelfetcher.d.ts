type data_model_field_writable = data_model_non_relationship_writable | data_model_relationship_writable
type data_model_field = data_model_non_relationship | data_model_relationship

interface data_model_field_writable_primer {
	friendly_name :string,
	is_hidden :boolean,
	is_required :boolean,
	table_name? :string,
	type? :relationship_type,
	foreign_name? :string,
}

interface data_model_non_relationship_writable extends data_model_field_writable_primer {
	is_relationship :false,
}

interface data_model_relationship_writable extends data_model_field_writable_primer {
	is_relationship :true,
	table_name :string,
	type :relationship_type,
	foreign_name :string,
}

interface data_model_non_relationship extends Readonly<data_model_non_relationship_writable> {
}

interface data_model_relationship extends Readonly<data_model_relationship_writable> {
}

interface data_model_fields_writable extends WritableDictionary<data_model_field_writable>{
}

interface data_model_fields extends Readonly<data_model_fields_writable> {
}

interface data_model_table_writable {
	table_friendly_name :string,
	fields :data_model_fields_writable,
}

interface data_model_table extends Readonly<data_model_table_writable> {
}

interface data_model_tables_writable extends WritableDictionary<data_model_table_writable>{
}

interface data_model_tables {
	readonly [table_name :string] :data_model_table,
}

type table_ranks_inline = [table_name :string, table_ranks :table_ranks];

interface table_ranks_writable extends WritableDictionary<boolean>{  // whether rank is required
}

interface table_ranks extends Readonly<table_ranks_writable> {
}

interface data_model_ranks_writable {
	[table_name :string] :table_ranks
}

interface data_model_ranks extends Readonly<data_model_ranks_writable> {
}

interface fetching_parameters {
	readonly required_fields_to_hide :string[],
	readonly tables_to_hide :string[],
	readonly table_keywords_to_exclude :string[],
	readonly required_fields_to_be_made_optional :{[table_name :string] :string[]}
}

interface data_model_list_of_tables_writable extends WritableDictionary<string>{  // a dictionary like table_name==>table_friendly_name
}

interface data_model_list_of_tables extends Readonly<data_model_list_of_tables_writable>{  // a dictionary like table_name==>table_friendly_name
}

type data_model_fetcher_return = {
	readonly tables :data_model_tables,
	readonly list_of_base_tables :data_model_list_of_tables,
	readonly ranks :data_model_ranks,
}