// general definitions
interface MappingLine {
	readonly type: mapping_type,
	readonly name: string,
	readonly mapping_path: mapping_path,
}

interface specify_resource {
	readonly id :number;
	readonly get: (query:string)=>specify_resource|any,
	readonly rget: (query:string)=>jquery_promise<specify_resource|any>,
	readonly set: (query:string, value:any)=>void,
	readonly save: ()=>void,
}

type falsy_upload_plan = upload_plan | false;

interface upload_plan_template {
	dataset_name :string,
	upload_plan :string
}


//states
interface BaseProperties {
	readonly headers: string[],
	readonly upload_plan: falsy_upload_plan,
	readonly schema: data_model_fetcher_return,
}
interface BaseStateProperties extends BaseProperties {
	readonly type: WBPlanViewStates['type']
}

interface InitialLoadingState {
	readonly type: 'InitialLoadingState',
	readonly headers: string[],
	readonly upload_plan: falsy_upload_plan,
	readonly schema: data_model_fetcher_return,
}

interface LoadingState extends BaseStateProperties  {
	readonly type: 'LoadingState'
	readonly dispatch: WBPlanViewActions,
}

interface BaseTableSelectionState extends BaseStateProperties {
	readonly type: 'BaseTableSelectionState'
}

interface TemplateSelectionState extends BaseStateProperties  {
	readonly type: 'TemplateSelectionState'
	readonly templates: upload_plan_template[],
}

interface MappingState extends BaseStateProperties  {
	readonly type: 'MappingState',
	readonly mapping_is_templated: boolean,
	readonly show_hidden_fields: boolean,
	readonly show_mapping_view: boolean,
	readonly base_table_name: string,
	readonly lines: MappingLine[],
	readonly mapping_view: mapping_path,
	readonly validation_results: mapping_path[],
}

type WBPlanViewStates = InitialLoadingState | BaseTableSelectionState | LoadingState | TemplateSelectionState | MappingState;


//actions
interface HeadersLoadedAction {
	readonly type: 'HeadersLoadedAction',
	readonly headers: string[],
}

interface UploadPlanLoadedAction {
	readonly type: 'UploadPlanLoadedAction',
	readonly upload_plan: falsy_upload_plan,
}

interface SchemaLoadedAction {
	readonly type: 'SchemaLoadedAction',
	readonly schema: data_model_fetcher_return,
}

type InitialLoadingAction = HeadersLoadedAction | UploadPlanLoadedAction | SchemaLoadedAction;

interface SelectTableAction {
	readonly type: 'SelectTableAction',
	readonly table_name: string,
}

interface UseTemplateAction {
	readonly type: 'UseTemplateAction',
}

type BaseTableSelectionActions = SelectTableAction | UseTemplateAction;

interface LoadTemplateSelectionAction {
	readonly type: 'LoadTemplateSelectionAction',
}

interface CancelTemplateSelectionAction {
	readonly type: 'CancelTemplateSelectionAction',
}

type TemplateSelectionActions = LoadTemplateSelectionAction | CancelTemplateSelectionAction;

interface OpenMappingScreenAction {
	readonly type: 'OpenMappingScreenAction',
	readonly upload_plan: upload_plan,
}

interface SavePlanAction {
	readonly type: 'SavePlanAction',
}

interface TableChangeAction {
	readonly type: 'TableChangeAction'
}

interface ToggleMappingViewAction {
	readonly type: 'ToggleMappingViewAction'
}

interface ToggleMappingIsTemplatedAction {
	readonly type: 'ToggleMappingIsTemplatedAction'
}

interface ClearMappingAction {
	readonly type: 'ClearMappingAction'
}

interface ValidationAction {
	readonly type: 'ValidationAction'
}

interface SaveAction {
	readonly type: 'SaveAction'
}

type MappingActions = OpenMappingScreenAction | SavePlanAction | TableChangeAction | ToggleMappingViewAction | ToggleMappingIsTemplatedAction | ClearMappingAction | ValidationAction | SaveAction;

interface CancelMappingAction {
	readonly type: 'CancelMappingAction'
}

type WBPlanViewActions = InitialLoadingAction | BaseTableSelectionActions | TemplateSelectionActions | MappingActions | CancelMappingAction;


//header
interface WBPlanViewHeaderBaseProps {
	readonly title: string,
	readonly state_type: WBPlanViewStates['type'],
	readonly handleCancel: ()=>void,
}

interface WBPlanViewHeaderPropsMapping extends WBPlanViewHeaderBaseProps {
	readonly state_type: 'MappingState',
	readonly mapping_is_templated: boolean,
	readonly handleTableChange: ()=>void,
	readonly handleToggleMappingView: ()=>void,
	readonly handleToggleMappingIsTemplated: ()=>void,
	readonly handleClearMapping: ()=>void,
	readonly handleValidation: ()=>void,
	readonly handleSave: ()=>void,
}

interface WBPlanViewHeaderPropsNonMapping extends WBPlanViewHeaderBaseProps {
	readonly state_type: 'BaseTableSelectionState',
	readonly handleUseTemplate: ()=>void,
}

type WBPlanViewHeaderProps = WBPlanViewHeaderPropsNonMapping | WBPlanViewHeaderPropsMapping;


interface WBPlanViewProps {
	readonly wb:specify_resource,
	readonly wbtemplatePromise:jquery_promise<specify_resource>,
	readonly mappingIsTemplated:boolean,
	readonly handleUnload: ()=>void,
}

//render wrappers
type react_element = JSX.Element;
type react_elements = react_element|react_element[];
interface RenderWrapperProps {
	children: react_elements
}

interface HeaderWrapperProps {
	children:react_elements,
	header:react_element,
}