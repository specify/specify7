// general definitions
interface MappingLine {
	readonly type: mapping_type,
	readonly name: string,
	readonly mapping_path: mapping_path,
}

interface specify_resource {
	readonly id: number;
	readonly get: (query: string) => specify_resource | any,
	readonly rget: (query: string) => jquery_promise<specify_resource | any>,
	readonly set: (query: string, value: any) => void,
	readonly save: () => void,
}

type falsy_upload_plan = upload_plan_structure | false;

interface upload_plan_template {
	dataset_name: string,
	upload_plan: upload_plan_structure
}


//states

interface LoadingStateBase<T extends string> extends State<T> {
	dispatch_action?: (action: WBPlanViewActions) => void,
}

type LoadTemplateSelectionState = LoadingStateBase<'LoadTemplateSelectionState'>

interface NavigateBackState extends State<'NavigateBackState'> {
	readonly wb: specify_resource,
}

type LoadingStates = LoadTemplateSelectionState | NavigateBackState

interface LoadingState extends State<'LoadingState'> {
	readonly loading_state?: LoadingStates,
	readonly dispatch_action?: WBPlanViewActions,
}

type BaseTableSelectionState = State<'BaseTableSelectionState'>

interface TemplateSelectionState extends State<'TemplateSelectionState'> {
	readonly templates: upload_plan_template[],
}

interface MappingState extends State<'MappingState'>, WBPlanViewMapperBaseProps {
	readonly automapper_suggestions_promise?: Promise<automapper_suggestion[]>,
}

type WBPlanViewStates =
	BaseTableSelectionState
	| LoadingState
	| TemplateSelectionState
	| MappingState;

type WBPlanViewStatesWithParams = WBPlanViewStates & {
	readonly dispatch: (action: WBPlanViewActions) => void,
	readonly props: WBPlanViewProps
}


//actions
interface OpenBaseTableSelectionAction extends Action<'OpenBaseTableSelectionAction'> {
	referrer?: WBPlanViewStates['type'],
}

interface SelectTableAction extends Action<'SelectTableAction'> {
	readonly table_name: string,
	readonly mapping_is_templated: boolean,
	readonly headers: string[]
}

interface UseTemplateAction extends Action<'UseTemplateAction'> {
	readonly dispatch: (action: WBPlanViewActions) => void,
}

type BaseTableSelectionActions =
	OpenBaseTableSelectionAction
	| SelectTableAction
	| UseTemplateAction;

type CancelTemplateSelectionAction = Action<'CancelTemplateSelectionAction'>

interface TemplatesLoadedAction extends Action<'TemplatesLoadedAction'> {
	readonly templates: upload_plan_template[],
}

type TemplateSelectionActions =
	TemplatesLoadedAction
	| CancelTemplateSelectionAction;

interface CancelMappingAction extends Action<'CancelMappingAction'>, publicWBPlanViewProps,partialWBPlanViewProps {
}

type CommonActions = CancelMappingAction;

interface OpenMappingScreenAction extends Action<'OpenMappingScreenAction'> {
	readonly mapping_is_templated: boolean,
	readonly headers: string[],
	readonly upload_plan: falsy_upload_plan,
}

interface SavePlanAction extends Action<'SavePlanAction'>, WBPlanViewWrapperProps,publicWBPlanViewProps {
	readonly ignore_validation?: boolean
}

type ToggleMappingViewAction = Action<'ToggleMappingViewAction'>

type ToggleMappingIsTemplatedAction = Action<'ToggleMappingIsTemplatedAction'>

type ToggleHiddenFieldsAction = Action<'ToggleHiddenFieldsAction'>

type ResetMappingsAction = Action<'ResetMappingsAction'>

type ValidationAction = Action<'ValidationAction'>

interface ClearMappingLineAction extends Action<'ClearMappingLineAction'> {
	readonly line: number,
}

interface FocusLineAction extends Action<'FocusLineAction'> {
	readonly line: number,
}

type MappingViewMapAction = Action<'MappingViewMapAction'>

type AddNewHeaderAction = Action<'AddNewHeaderAction'>

type AddNewStaticHeaderAction = Action<'AddNewStaticHeaderAction'>

type AutoScrollFinishedAction = Action<'AutoScrollFinishedAction'>

interface OpenSelectElementAction extends Action<'OpenSelectElementAction'>, select_element_position {
}

type CloseSelectElementAction = Action<'CloseSelectElementAction'>

interface ChangeSelectElementValueAction extends Action<'ChangeSelectElementValueAction'>,
	select_element_onchange_position {
	readonly value: string,
	readonly is_relationship: boolean,
}

interface AutomapperSuggestionsLoadedAction extends Action<'AutomapperSuggestionsLoadedAction'> {
	readonly automapper_suggestions: automapper_suggestion[],
}

interface AutomapperSuggestionSelectedAction extends Action<'AutomapperSuggestionSelectedAction'> {
	readonly suggestion: string,
}

interface StaticHeaderChangeAction extends Action<'StaticHeaderChangeAction'> {
	readonly line: number,
	readonly event: React.ChangeEvent<HTMLTextAreaElement>,
}

type MappingActions =
	OpenMappingScreenAction
	| SavePlanAction
	| ToggleMappingViewAction
	| ToggleMappingIsTemplatedAction
	| ToggleHiddenFieldsAction
	| ResetMappingsAction
	| ValidationAction
	| ClearMappingLineAction
	| FocusLineAction
	| MappingViewMapAction
	| AddNewHeaderAction
	| AddNewStaticHeaderAction
	| AutoScrollFinishedAction
	| OpenSelectElementAction
	| CloseSelectElementAction
	| ChangeSelectElementValueAction
	| AutomapperSuggestionsLoadedAction
	| AutomapperSuggestionSelectedAction
	| StaticHeaderChangeAction;

type WBPlanViewActions =
	BaseTableSelectionActions
	| TemplateSelectionActions
	| CommonActions
	| MappingActions;


//header
interface WBPlanViewHeaderBaseProps {
	readonly title: string,
	readonly state_type: WBPlanViewStates['type'],
	readonly handleCancel: () => void,
	readonly mapping_is_templated?: boolean,
}

interface WBPlanViewHeaderPropsMapping extends WBPlanViewHeaderBaseProps {
	readonly state_type: 'MappingState',
	readonly mapping_is_templated: boolean,
	readonly handleTableChange: () => void,
	readonly handleToggleMappingView: () => void,
	readonly handleToggleMappingIsTemplated: () => void,
	readonly handleClearMapping: () => void,
	readonly handleValidation: () => void,
	readonly handleSave: () => void,
}

interface WBPlanViewHeaderPropsNonMapping extends WBPlanViewHeaderBaseProps {
	readonly state_type: 'BaseTableSelectionState',
	readonly handleUseTemplate: () => void,
}

type WBPlanViewHeaderProps =
	WBPlanViewHeaderPropsNonMapping
	| WBPlanViewHeaderPropsMapping;


interface WBPlanViewProps extends WBPlanViewWrapperProps,publicWBPlanViewProps {
	readonly upload_plan: falsy_upload_plan,
	readonly headers: string[],
}

interface partialWBPlanViewProps {
	readonly remove_unload_protect: () => void,
}

interface WBPlanViewWrapperProps extends partialWBPlanViewProps,publicWBPlanViewProps {
	wb_template_promise: jquery_promise<specify_resource>,
	mapping_is_templated: boolean,
}

interface publicWBPlanViewProps {
	wb: specify_resource,
}

interface WBPlanViewBackboneProps extends WBPlanViewWrapperProps, publicWBPlanViewProps,ReactBackboneExtendBaseProps {
	header: HTMLElement,
	handle_resize: () => void,
}

//render wrappers
interface HeaderWrapperProps {
	readonly children: react_elements,
	readonly header: JSX.Element,
	readonly state_name: WBPlanViewStates['type'],
	readonly handleClick?: handleElementOpen,
}