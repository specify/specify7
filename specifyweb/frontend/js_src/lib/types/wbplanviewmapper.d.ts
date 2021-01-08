type automapper_scope = Readonly<'automapper' | 'suggestion'>;
type mapping_path = string[];
type list_of_headers = string[];
type mapping_type = Readonly<'existing_header' | 'new_column' | 'new_static_column'>;
type relationship_type = Readonly<'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'>;

interface select_element_position {
	readonly line: number,
	readonly index: number,
}

interface open_select_element extends select_element_position {
	readonly autoscroll: boolean,
}

interface select_element_onchange_position {
	readonly line: number|'mapping_view',
	readonly index: number,
}

interface MappingLine {
	readonly type :mapping_type,
	readonly name :string,
	readonly mapping_path :mapping_path,
	readonly is_focused? : boolean,
}

interface WBPlanViewMapperBaseProps {
	readonly mapping_is_templated :boolean,
	readonly show_hidden_fields :boolean,
	readonly show_mapping_view :boolean,
	readonly base_table_name :string,
	readonly new_header_id :number,  // the index that would be shown in the header name the next time the user presses `New Column`
	readonly mapping_view :mapping_path,
	readonly validation_results :mapping_path[],
	readonly lines :MappingLine[],
	readonly open_select_element? : open_select_element,
	readonly focused_line? : number,
	readonly automapper_suggestions? : MappingElementProps[][]
}

interface WBPlanViewMapperProps extends WBPlanViewMapperBaseProps {
	readonly mapper_dispatch: (action:MappingActions)=>void,
	readonly handleSave: ()=>void,
	readonly handleFocus: (line_index:number)=>void,
	readonly handleMappingViewMap: ()=>void,
	readonly handleAddNewHeader: ()=>void,
	readonly handleAddNewStaticHeader: ()=>void,
	readonly handleToggleHiddenFields: ()=>void,
	readonly handleOpen: handleMappingOpen
	readonly handleClose: handleElementOpen
	readonly handleChange: handleMappingChange,
	readonly handleClearMapping: handleMappingLineOpen,
}

interface MappingsControlPanelProps {
	readonly show_hidden_fields: boolean,
	readonly onChange: ()=>void,
}

interface FormatValidationResultsProps {
	readonly base_table_name: string,
	readonly validation_results: WBPlanViewMapperProps['validation_results'],
	readonly handleSave: ()=>void
	readonly get_mapped_fields: get_mapped_fields_bind,
}

interface MappingViewProps {
	readonly base_table_name : string,
	readonly mapping_path: mapping_path,
	readonly map_button_is_enabled:boolean,
	readonly handleMapButtonClick: ()=>void
	readonly handleMappingViewChange: handleMappingLineChange,
	readonly get_mapped_fields: get_mapped_fields_bind,
	readonly automapper_suggestions?:MappingElementProps[][],
}

interface mutate_mapping_path_parameters extends Omit<ChangeSelectElementValueAction,'type'> {
	readonly lines: MappingLine[],
	readonly mapping_view: mapping_path,
}

type get_mapped_fields = (
	lines: MappingLine[],
	mapping_path_filter :mapping_path,  // a mapping path that would be used as a filter
	skip_empty? :boolean,  // whether to skip incomplete mappings
)=>mappings_tree;

type get_mapped_fields_bind = (
	mapping_path_filter :mapping_path,  // a mapping path that would be used as a filter
	skip_empty? :boolean,  // whether to skip incomplete mappings
)=>mappings_tree;

type get_mappings_tree = (
	lines: MappingLine[],
	include_headers? :boolean, // whether the last tree nodes of each branch should be mapping type and header name
	skip_empty? :boolean,  // whether to include incomplete tree nodes
)=>mappings_tree;

interface get_lines_from_headers_with_automapper_params {
	headers? :list_of_headers,
	run_automapper:true,
	base_table_name:string,
}

interface get_lines_from_headers_without_automapper_params {
	headers? :list_of_headers,
	run_automapper:false,
	base_table_name?:string,
}

type get_lines_from_headers_params = get_lines_from_headers_with_automapper_params | get_lines_from_headers_without_automapper_params;

interface get_automapper_suggestions_parameters extends select_element_position {
	readonly lines: MappingLine[],
	readonly base_table_name: string,
	readonly get_mapped_fields: get_mapped_fields_bind,
}

interface get_lines_from_upload_plan {
	readonly base_table_name :string,
	readonly lines :MappingLine[],
}