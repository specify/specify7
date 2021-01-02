type automapper_scope = Readonly<'automapper' | 'suggestion'>;
type mapping_path = string[];
type list_of_headers = string[];
type mapping_type = Readonly<'existing_header' | 'new_column' | 'new_static_column'>;
type relationship_type = Readonly<'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'>;


interface WBPlanViewMapperBaseProps {
	readonly mapping_is_templated :boolean,
	readonly show_hidden_fields :boolean,
	readonly show_mapping_view :boolean,
	readonly base_table_name :string,
	readonly new_header_id :number,  // the index that would be shown in the header name the next time the user presses `New Column`
	readonly lines :MappingLine[],
	readonly mapping_view :mapping_path,
	readonly validation_results :mapping_path[],
}

interface WBPlanViewMapperProps extends WBPlanViewMapperBaseProps, Omit<data_model_fetcher_return, 'list_of_base_tables'> {
	readonly mapper_dispatch: (action:MappingActions)=>void,
}

interface MappingsControlPanelProps {
	show_hidden_fields: boolean,
}

interface FormatValidationResultsProps {
	validation_results: WBPlanViewMapperProps['validation_results']
}

interface MappingViewProps {
	mapping_path: mapping_path
}



interface header_data {
	readonly mapping_type :mapping_type,
	header_name :string
}

interface add_new_mapping_line_parameters {
	readonly position? :number,  // position of the new line. If negative, start from the back
	readonly mapping_path? :mapping_path,  // mapping path to use for the new mapping line
	readonly header_data :header_data,  // {'mapping_type':<mapping_type>,{'header_name'}:<header_name>} where mapping_type is `existing_header`/`new_column`/`new_static_column` and header_name is the value of the static column or the name of the header
	readonly blind_add_back? :boolean,  // whether to add to the back without checking if the header already exists
	readonly line_attributes? :string[],  // array of classes to append to each line's classname
	readonly scroll_down? :boolean  // whether to scroll the list of mapping lines down to make the newly created line visible on the screen
	readonly update_all_lines? :boolean  // whether to update all lines
}

interface get_mapping_line_data_from_mapping_path_internal_payload {
	readonly mapping_path :mapping_path,
	readonly generate_last_relationship_data :boolean,
	readonly mapping_path_position :number,
	readonly iterate :boolean,
	readonly mapping_line_data :[],
	readonly custom_select_type:custom_select_type,
}

interface get_mapping_path_parameters {
	readonly line_elements_container :HTMLElement,  // line elements container
	readonly mapping_path_filter? :HTMLElement | mapping_path,  // {mixed} if is {array} mapping path and mapping path of this line does begin with mapping_path_filter, get_mapping_path would return ["0"]
	//													  if is {HTMLElement}, then stops when reaches a given element in a line_elements_container
	readonly include_headers? :boolean  // whether to include mapping type and header_name / static column value in the result
	readonly exclude_unmapped? :boolean,  // whether to replace incomplete mapping paths with ["0"]
	readonly exclude_non_relationship_values? :boolean,  // whether to exclude simple fields from the resulting path
}


interface MappingLine {
	readonly type :mapping_type,
	readonly name :string,
	readonly mapping_path :mapping_path,
	readonly is_focused? : boolean,
}


interface get_lines_from_upload_plan {
	readonly base_table_name :string,
	readonly lines :MappingLine[],
}