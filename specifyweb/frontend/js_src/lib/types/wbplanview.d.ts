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

interface LoadTemplateSelectionState extends State<'LoadTemplateSelectionState'>{
}

type LoadingStates = LoadTemplateSelectionState

interface LoadingState extends State<'LoadingState'> {
	readonly loading_state? :LoadingStates,
	readonly dispatch? :WBPlanViewActions,
}

interface BaseTableSelectionState extends State<'BaseTableSelectionState'> {
}

interface TemplateSelectionState extends State<'TemplateSelectionState'> {
	readonly templates :upload_plan_template[],
}

interface MappingState extends State<'MappingState'>, WBPlanViewMapperBaseProps {
}

type WBPlanViewStates =
	BaseTableSelectionState
	| LoadingState
	| TemplateSelectionState
	| MappingState;


//actions
interface OpenBaseTableSelectionAction extends Action<'OpenBaseTableSelectionAction'> {
}

interface SelectTableAction extends Action<'SelectTableAction'> {
	readonly table_name :string,
}

interface UseTemplateAction extends Action<'UseTemplateAction'> {
}

type BaseTableSelectionActions =
	OpenBaseTableSelectionAction
	| SelectTableAction
	| UseTemplateAction;

interface CancelTemplateSelectionAction extends Action<'CancelTemplateSelectionAction'> {
}

interface TemplatesLoadedAction extends Action<'TemplatesLoadedAction'> {
	readonly templates :upload_plan_template[],
}

type TemplateSelectionActions =
	TemplatesLoadedAction
	| CancelTemplateSelectionAction;

interface CancelMappingAction extends Action<'CancelMappingAction'> {
}

interface OpenMappingScreenAction extends Action<'OpenMappingScreenAction'> {
}

interface SavePlanAction extends Action<'SavePlanAction'> {
}

interface ToggleMappingViewAction extends Action<'ToggleMappingViewAction'> {
}

interface ToggleMappingIsTemplatedAction extends Action<'ToggleMappingIsTemplatedAction'> {
}

interface ResetMappingsAction extends Action<'ResetMappingsAction'> {
}

interface ValidationAction extends Action<'ValidationAction'> {
}

interface SaveAction extends Action<'SaveAction'> {
}

interface ClearMappingLineAction extends Action<'ClearMappingLineAction'> {
	line_index :number,
}

interface UpdateValidationResultsAction extends Action<'UpdateValidationResultsAction'> {
	validation_results :WBPlanViewMapperBaseProps['validation_results']
}

type MappingActions =
	OpenMappingScreenAction
	| SavePlanAction
	| ToggleMappingViewAction
	| ToggleMappingIsTemplatedAction
	| ResetMappingsAction
	| ValidationAction
	| SaveAction
	| ClearMappingLineAction
	| UpdateValidationResultsAction;

type WBPlanViewActions =
	BaseTableSelectionActions
	| TemplateSelectionActions
	| CancelMappingAction
	| MappingActions;


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

type WBPlanViewHeaderProps =
	WBPlanViewHeaderPropsNonMapping
	| WBPlanViewHeaderPropsMapping;


interface WBPlanViewProps extends publicWBPlanViewProps {
}

interface publicWBPlanViewProps {
	readonly wb :specify_resource,
	readonly wbtemplatePromise :jquery_promise<specify_resource>,
	readonly mappingIsTemplated :boolean,
	readonly handleUnload :() => void,
}

//render wrappers
interface HeaderWrapperProps {
	children :react_elements,
	header :react_element,
}