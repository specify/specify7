// general definitions
interface MappingLine {
	readonly type :mapping_type,
	readonly name :string,
	readonly mapping_path :mapping_path,
}

interface specify_resource {
	readonly id :number;
	readonly get :(query :string) => specify_resource | any,
	readonly rget :(query :string) => jquery_promise<specify_resource | any>,
	readonly set :(query :string, value :any) => void,
	readonly save :() => void,
}

type falsy_upload_plan = upload_plan | false;

interface upload_plan_template {
	dataset_name :string,
	upload_plan :string
}


//states
interface BaseProperties {
	readonly headers :string[],
	readonly upload_plan :falsy_upload_plan,
	readonly schema :data_model_fetcher_return,
}

interface BaseStateProperties extends BaseProperties {
}

interface InitialLoadingState extends State<'InitialLoadingState'> {
	readonly headers :string[],
	readonly upload_plan :falsy_upload_plan,
	readonly schema :data_model_fetcher_return,
}

interface LoadingState extends BaseStateProperties, State<'LoadingState'> {
	readonly dispatch :WBPlanViewActions,
}

interface BaseTableSelectionState extends BaseStateProperties, State<'BaseTableSelectionState'> {
}

interface TemplateSelectionState extends BaseStateProperties, State<'TemplateSelectionState'> {
	readonly templates :upload_plan_template[],
}

interface MappingState extends BaseStateProperties, State<'MappingState'> {
	readonly mapping_is_templated :boolean,
	readonly show_hidden_fields :boolean,
	readonly show_mapping_view :boolean,
	readonly base_table_name :string,
	readonly lines :MappingLine[],
	readonly mapping_view :mapping_path,
	readonly validation_results :mapping_path[],
}

type WBPlanViewStates =
	InitialLoadingState
	| BaseTableSelectionState
	| LoadingState
	| TemplateSelectionState
	| MappingState;


//actions
interface HeadersLoadedAction extends Action<'HeadersLoadedAction'> {
	readonly headers :string[],
}

interface UploadPlanLoadedAction extends Action<'UploadPlanLoadedAction'> {
	readonly upload_plan :falsy_upload_plan,
}

interface SchemaLoadedAction extends Action<'SchemaLoadedAction'> {
	readonly schema :data_model_fetcher_return,
}

type InitialLoadingAction = HeadersLoadedAction | UploadPlanLoadedAction | SchemaLoadedAction;

interface SelectTableAction extends Action<'SelectTableAction'> {
	readonly table_name :string,
}

interface UseTemplateAction extends Action<'UseTemplateAction'> {
}

type BaseTableSelectionActions = SelectTableAction | UseTemplateAction;

interface LoadTemplateSelectionAction extends Action<'LoadTemplateSelectionAction'> {
}

interface CancelTemplateSelectionAction extends Action<'CancelTemplateSelectionAction'> {
}

type TemplateSelectionActions = LoadTemplateSelectionAction | CancelTemplateSelectionAction;

interface OpenMappingScreenAction extends Action<'OpenMappingScreenAction'> {
	readonly upload_plan :upload_plan,
}

interface SavePlanAction extends Action<'SavePlanAction'> {
}

interface TableChangeAction extends Action<'TableChangeAction'> {
}

interface ToggleMappingViewAction extends Action<'ToggleMappingViewAction'> {
}

interface ToggleMappingIsTemplatedAction extends Action<'ToggleMappingIsTemplatedAction'> {
}

interface ClearMappingAction extends Action<'ClearMappingAction'> {
}

interface ValidationAction extends Action<'ValidationAction'> {
}

interface SaveAction extends Action<'SaveAction'> {
}

type MappingActions =
	OpenMappingScreenAction
	| SavePlanAction
	| TableChangeAction
	| ToggleMappingViewAction
	| ToggleMappingIsTemplatedAction
	| ClearMappingAction
	| ValidationAction
	| SaveAction;

interface CancelMappingAction extends Action<'CancelMappingAction'> {
}

type WBPlanViewActions =
	InitialLoadingAction
	| BaseTableSelectionActions
	| TemplateSelectionActions
	| MappingActions
	| CancelMappingAction;


//header
interface WBPlanViewHeaderBaseProps {
	readonly title :string,
	readonly state_type :WBPlanViewStates['type'],
	readonly handleCancel :() => void,
}

interface WBPlanViewHeaderPropsMapping extends WBPlanViewHeaderBaseProps {
	readonly state_type :'MappingState',
	readonly mapping_is_templated :boolean,
	readonly handleTableChange :() => void,
	readonly handleToggleMappingView :() => void,
	readonly handleToggleMappingIsTemplated :() => void,
	readonly handleClearMapping :() => void,
	readonly handleValidation :() => void,
	readonly handleSave :() => void,
}

interface WBPlanViewHeaderPropsNonMapping extends WBPlanViewHeaderBaseProps {
	readonly state_type :'BaseTableSelectionState',
	readonly handleUseTemplate :() => void,
}

type WBPlanViewHeaderProps = WBPlanViewHeaderPropsNonMapping | WBPlanViewHeaderPropsMapping;


interface WBPlanViewProps {
	readonly wb :specify_resource,
	readonly wbtemplatePromise :jquery_promise<specify_resource>,
	readonly mappingIsTemplated :boolean,
	readonly handleUnload :() => void,
}

//render wrappers
type react_element = JSX.Element;
type react_elements = react_element | react_element[];

interface RenderWrapperProps {
	children :react_elements
}

interface HeaderWrapperProps {
	children :react_elements,
	header :react_element,
}