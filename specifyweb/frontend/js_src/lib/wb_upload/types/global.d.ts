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