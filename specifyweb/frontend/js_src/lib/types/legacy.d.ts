interface schema_model_table_field {
	readonly name: string,
	readonly getLocalizedName: () => string,
	readonly isRequired: boolean,
	readonly isHidden: () => number,
	readonly isRelationship: boolean
}

interface schema_model_table_relationship extends schema_model_table_field {
	readonly otherSideName: string,
	readonly type: relationship_type,
	readonly relatedModelName: string,
	readonly readOnly: boolean,
}

type specify_fetch = (filter: {filters: object}) => {
	fetch: (filter: {limit: number}) => jquery_promise<domain_tree_definition_item>
}

interface schema_model_table_data {
	readonly longName: string,
	readonly getLocalizedName: () => string
	readonly system: boolean,
	readonly fields: schema_model_table_field[]
	readonly LazyCollection: specify_fetch
}

interface schema_models<T> {
	readonly [model_name: string]: T
}

interface schema {
	readonly models: schema_models<schema_model_table_data>;
	readonly orgHierarchy: string[];
}

interface domain_tree_definition_item {
	readonly get: (field_name: string) => number | string,
	readonly rget: (field_name: string) => Promise<domain_tree_definition_item>,
}

interface domain_request extends Readonly<Record<string, any>> {
}

type specify_request = (param: domain_request) => jquery_promise<void>;

interface domain_tree_definition_items {
	readonly fetch: specify_request;
	readonly models: schema_models<domain_tree_definition_item>
}

interface domain_tree_definition {
	readonly rget: (field_name: string) => jquery_promise<domain_tree_definition_items>,
}

interface jquery_promise<T> {
	readonly done: (callback: ((t: T) => void)) => void,
}

interface domain {
	readonly getTreeDef: (table_name: string) => jquery_promise<domain_tree_definition>,
}