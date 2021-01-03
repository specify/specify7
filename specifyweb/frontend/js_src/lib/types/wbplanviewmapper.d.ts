type automapper_scope = Readonly<'automapper' | 'suggestion'>;
type mapping_path = string[];
type list_of_headers = string[];
type mapping_type = Readonly<'existing_header' | 'new_column' | 'new_static_column'>;
type relationship_type = Readonly<'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'>;

interface select_element_position {
	readonly line: number|'mapping_view',
	readonly index: number,
}

interface WBPlanViewMapperBaseProps {
	readonly mapping_is_templated :boolean,
	readonly show_hidden_fields :boolean,
	readonly show_mapping_view :boolean,
	readonly base_table_name :string,
	readonly new_header_id :number,  // the index that would be shown in the header name the next time the user presses `New Column`
	readonly lines :MappingLine[],
	readonly open_select_element? : select_element_position,
	readonly focused_line? : number,
	readonly mapping_view :mapping_path,
	readonly validation_results :mapping_path[],
}

interface WBPlanViewMapperProps extends WBPlanViewMapperBaseProps {
	readonly mapper_dispatch: (action:MappingActions)=>void,
	readonly handleSave: ()=>void,
	readonly handleFocus: (line_index:number)=>void,
	readonly handleMappingViewMap: ()=>void,
	readonly handleMappingViewChange: ()=>void,
	readonly handleAddNewHeader: ()=>void,
	readonly handleAddNewStaticHeader: ()=>void,
	readonly handleToggleHiddenFields: ()=>void,
}

interface MappingsControlPanelProps {
	show_hidden_fields: boolean,
}

interface FormatValidationResultsProps {
	validation_results: WBPlanViewMapperProps['validation_results'],
	handleSave: ()=>void
}

interface MappingViewProps {
	mapping_path: mapping_path,
	map_button_is_enabled:boolean,
	handleMapButtonClick: ()=>void
	handleMappingViewChange: handleCustomSelectElementChange,
	opened_list?: number
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