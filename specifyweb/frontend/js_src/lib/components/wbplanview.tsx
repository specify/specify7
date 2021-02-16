/*
*
* Workbench plan mapper
*
* */

'use strict';

import React                from 'react';
import '../../css/wbplanview.css';
import navigation           from '../navigation';
import * as cache           from '../wbplanviewcache';
import schema               from '../schema';
import fetch_data_model     from '../wbplanviewmodelfetcher';
import WBPlanViewMapper, {
	AutomapperSuggestion,
	deduplicate_mappings,
	get_automapper_suggestions,
	get_lines_from_headers,
	get_lines_from_upload_plan,
	go_back,
	MappingPath,
	mapping_path_is_complete,
	MappingType,
	mutate_mapping_path,
	save_plan,
	SelectElementPosition,
	validate,
	WBPlanViewMapperBaseProps, defaultMappingViewHeight, minMappingViewHeight,
} from './wbplanviewmapper';
import {
	LoadingScreen,
	ModalDialog,
}                           from './modaldialog';
import data_model_storage   from '../wbplanviewmodel';
import { ListOfBaseTables } from './wbplanviewcomponents';
import {
	Action,
	generate_dispatch,
	generate_reducer,
	State,
}                           from '../statemanagement';
import createBackboneView   from './reactbackboneextend';
import { JqueryPromise }    from '../legacy_types';
import {
	FalsyUploadPlan,
	upload_plan_string_to_object,
	UploadPlan,
}                           from '../wbplanviewconverter';


// general definitions
interface MappingLine {
	readonly type: MappingType,
	readonly name: string,
	readonly mapping_path: MappingPath,
}

export type Dataset = {
	id: number,
	name: string,
	columns: string[],
	uploadplan: UploadPlan | null,
	uploaderstatus: Record<string, unknown> | null,
	uploadresult: Record<string, unknown> | null,
}

export interface SpecifyResource {
	readonly id: number;
	readonly get: (query: string) => SpecifyResource | any,
	readonly rget: (query: string) =>
		JqueryPromise<SpecifyResource | any>,
	readonly set: (query: string, value: any) => void,
	readonly save: () => void,
}

interface UploadPlanTemplate {
	dataset_name: string,
	upload_plan: UploadPlan
}


//states

interface LoadingStateBase<T extends string> extends State<T> {
	dispatch_action?: (action: WBPlanViewActions) => void,
}

type LoadTemplateSelectionState =
	LoadingStateBase<'LoadTemplateSelectionState'>

interface NavigateBackState extends State<'NavigateBackState'> {
	readonly wb: SpecifyResource,
}

type LoadingStates =
	LoadTemplateSelectionState
	| NavigateBackState;

export interface LoadingState extends State<'LoadingState'> {
	readonly loading_state?: LoadingStates,
	readonly dispatch_action?: WBPlanViewActions,
}

interface BaseTableSelectionState extends State<'BaseTableSelectionState'> {
	readonly show_hidden_tables: boolean,
}

interface TemplateSelectionState extends State<'TemplateSelectionState'> {
	readonly templates: UploadPlanTemplate[],
}

export interface MappingState extends State<'MappingState'>,
	WBPlanViewMapperBaseProps {
	readonly automapper_suggestions_promise?:
		Promise<AutomapperSuggestion[]>,
	readonly changes_made: boolean,
	readonly mappings_are_validated: boolean,
}

type WBPlanViewStates =
	BaseTableSelectionState
	| LoadingState
	| TemplateSelectionState
	| MappingState;

type WBPlanViewStatesWithParams = WBPlanViewStates & {
	readonly dispatch: (action: WBPlanViewActions) => void,
	readonly props: WBPlanViewProps,
	readonly refObject: React.MutableRefObject<RefStates>,
	readonly refObjectDispatch: (action: RefActions) => void
}


//actions
interface OpenBaseTableSelectionAction
	extends Action<'OpenBaseTableSelectionAction'> {
	referrer?: WBPlanViewStates['type'],
}

interface SelectTableAction extends Action<'SelectTableAction'> {
	readonly table_name: string,
	readonly mapping_is_templated: boolean,
	readonly headers: string[]
}

type ToggleHiddenTablesAction = Action<'ToggleHiddenTablesAction'>

interface UseTemplateAction extends Action<'UseTemplateAction'> {
	readonly dispatch: (action: WBPlanViewActions) => void,
}

type BaseTableSelectionActions =
	OpenBaseTableSelectionAction
	| SelectTableAction
	| ToggleHiddenTablesAction
	| UseTemplateAction;

type CancelTemplateSelectionAction =
	Action<'CancelTemplateSelectionAction'>

interface TemplatesLoadedAction extends Action<'TemplatesLoadedAction'> {
	readonly templates: UploadPlanTemplate[],
}

type TemplateSelectionActions =
	TemplatesLoadedAction
	| CancelTemplateSelectionAction;

type CancelMappingAction =
	Action<'CancelMappingAction'>
	& PublicWBPlanViewProps
	& PartialWBPlanViewProps;

type CommonActions = CancelMappingAction;

interface OpenMappingScreenAction extends Action<'OpenMappingScreenAction'> {
	readonly mapping_is_templated: boolean,
	readonly headers: string[],
	readonly upload_plan: FalsyUploadPlan,
}

interface SavePlanAction extends Action<'SavePlanAction'>,
	WBPlanViewWrapperProps,
	PublicWBPlanViewProps {
	readonly ignore_validation?: boolean
}

type ToggleMappingViewAction = Action<'ToggleMappingViewAction'>

type ToggleMappingIsTemplatedAction =
	Action<'ToggleMappingIsTemplatedAction'>

type ToggleHiddenFieldsAction = Action<'ToggleHiddenFieldsAction'>

type ResetMappingsAction = Action<'ResetMappingsAction'>

type ValidationAction = Action<'ValidationAction'>

interface ClearMappingLineAction
	extends Action<'ClearMappingLineAction'> {
	readonly line: number,
}

interface FocusLineAction extends Action<'FocusLineAction'> {
	readonly line: number,
}

type MappingViewMapAction = Action<'MappingViewMapAction'>

type AddNewHeaderAction = Action<'AddNewHeaderAction'>

type AddNewStaticHeaderAction = Action<'AddNewStaticHeaderAction'>

type AutoScrollFinishedAction = Action<'AutoScrollFinishedAction'>

type OpenSelectElementAction =
	Action<'OpenSelectElementAction'>
	& SelectElementPosition

type CloseSelectElementAction = Action<'CloseSelectElementAction'>

export interface ChangeSelectElementValueAction
	extends Action<'ChangeSelectElementValueAction'> {
	readonly value: string,
	readonly is_relationship: boolean,
	readonly line: number | 'mapping_view',
	readonly index: number,
}

interface AutomapperSuggestionsLoadedAction
	extends Action<'AutomapperSuggestionsLoadedAction'> {
	readonly automapper_suggestions: AutomapperSuggestion[],
}

interface AutomapperSuggestionSelectedAction
	extends Action<'AutomapperSuggestionSelectedAction'> {
	readonly suggestion: string,
}

interface StaticHeaderChangeAction
	extends Action<'StaticHeaderChangeAction'> {
	readonly line: number,
	readonly event: React.ChangeEvent<HTMLTextAreaElement>,
}

interface ValidationResultClickAction
	extends Action<'ValidationResultClickAction'> {
	readonly mapping_path: MappingPath,
}

export type MappingActions =
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
	| StaticHeaderChangeAction
	| ValidationResultClickAction

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
	readonly show_mapping_view: boolean,
	readonly mappings_are_validated: boolean,
	readonly handleTableChange: () => void,
	readonly handleToggleMappingIsTemplated: () => void,
	readonly handleClearMapping: () => void,
	readonly handleValidation: () => void,
	readonly handleSave: () => void,
	readonly handleShowMappingView: () => void,
}

interface WBPlanViewHeaderPropsNonMapping extends WBPlanViewHeaderBaseProps {
	readonly state_type: 'BaseTableSelectionState',
	readonly handleUseTemplate: () => void,
	readonly onToggleHiddenTables: () => void
	readonly show_hidden_tables: boolean,
}

type WBPlanViewHeaderProps =
	WBPlanViewHeaderPropsNonMapping
	| WBPlanViewHeaderPropsMapping;


interface WBPlanViewProps extends WBPlanViewWrapperProps,
	PublicWBPlanViewProps {
	readonly upload_plan: FalsyUploadPlan,
	readonly headers: string[],
	readonly set_unload_protect: () => void,
}

interface PartialWBPlanViewProps {
	readonly remove_unload_protect: () => void,
}

export interface WBPlanViewWrapperProps extends PartialWBPlanViewProps,
	PublicWBPlanViewProps {
	mapping_is_templated: boolean,
	readonly set_unload_protect: () => void,
}

export interface PublicWBPlanViewProps {
	dataset: Dataset,
}

interface WBPlanViewBackboneProps extends WBPlanViewWrapperProps,
	PublicWBPlanViewProps {
	header: HTMLElement,
	handle_resize: () => void,
}


const schema_fetched_promise = fetch_data_model();


function WBPlanViewHeaderLeftNonMappingElements({
	show_hidden_tables,
	onToggleHiddenTables: handleToggleHiddenTables,
}: WBPlanViewHeaderPropsNonMapping): JSX.Element {
	return <label>
		<input
			type='checkbox'
			checked={show_hidden_tables}
			onChange={handleToggleHiddenTables}
		/>
		Show advanced tables
	</label>;
}

function WBPlanViewHeaderLeftMappingElements({
	handleTableChange,
}: WBPlanViewHeaderPropsMapping): JSX.Element {
	return <button onClick={handleTableChange}>Change table</button>;
}

function WBPlanViewHeaderRightMappingElements({
	handleClearMapping,
	handleValidation,
	handleSave,
	handleCancel,
	handleShowMappingView,
	show_mapping_view,
	mappings_are_validated,
}: WBPlanViewHeaderPropsMapping): JSX.Element {
	return <>
		{
			!show_mapping_view &&
			<button
				onClick={handleShowMappingView}
			>Show mapping view</button>
		}
		<button onClick={handleClearMapping}>Clear Mappings</button>
		<button onClick={handleValidation}>
			Check mappings
			{
				mappings_are_validated &&
				<i style={{
					color: '#4f2',
					fontSize: '12px'
				}}>✓</i>
			}
		</button>
		<button onClick={handleSave}>Save</button>
		<button onClick={handleCancel}>Cancel</button>
	</>;
}

function WBPlanViewHeaderRightNonMappingElements({
	handleUseTemplate,
	handleCancel,
}: WBPlanViewHeaderPropsNonMapping): JSX.Element {
	return <>
		<button onClick={handleUseTemplate}>Use template</button>
		<button onClick={handleCancel}>Cancel</button>
	</>;
}

function WBPlanViewHeader(props: WBPlanViewHeaderProps): JSX.Element {
	return <div className={
		`wbplanview_header wbplanview_header_${props.state_type}`
	}>
		<div>
			<span>{props.title}</span>
			{
				props.state_type === 'MappingState' ?
					<WBPlanViewHeaderLeftMappingElements {...props} /> :
					<WBPlanViewHeaderLeftNonMappingElements {...props} />
			}
		</div>
		<div>
			{
				props.state_type === 'MappingState' ?
					<WBPlanViewHeaderRightMappingElements {...props} /> :
					<WBPlanViewHeaderRightNonMappingElements {...props} />
			}
		</div>
	</div>;
}


function getInitialWBPlanViewState(
	props: OpenMappingScreenAction,
): WBPlanViewStates {
	if (props.upload_plan === false) {
		return {
			type: 'LoadingState',
			dispatch_action: {
				type: 'OpenBaseTableSelectionAction',
			},
		};
	}
	else
		return {
			type: 'LoadingState',
			dispatch_action: {
				...props,
				type: 'OpenMappingScreenAction',
			},
		};
}

function HeaderWrapper(props: {
	readonly children: JSX.Element | JSX.Element[] | string,
	readonly header: JSX.Element,
	readonly state_name: WBPlanViewStates['type'],
	readonly handleClick?: () => void,
	readonly extraContainerProps?: Record<string, unknown>
}): JSX.Element {
	return <div className="wbplanview_event_listener" onClick={(event) =>
		(
			event.target as HTMLElement
		).closest('.custom_select_closed_list') === null && props.handleClick ?
			props.handleClick() :
			undefined
	}>
		{props.header}
		<div
			className={`wbplanview_container wbplanview_container_${props.state_name}`}
			{...props.extraContainerProps}
		>
			{props.children}
		</div>
	</div>;
}

function mapping_state(state: WBPlanViewStates): MappingState {
	if (state.type === 'MappingState')
		return state;
	else
		throw new Error('Dispatching this action requires the state to be of type `MappingState`');
}

const soft_resolve_non_mapping_state = (
	state: WBPlanViewStates,
): WBPlanViewStates | false =>
	state.type === 'MappingState' ?
		false :
		state;

const modify_line = (
	state: MappingState,
	line: number,
	mapping_line: Partial<MappingLine>,
): MappingLine[] => [
	...state.lines.slice(0, line),
	{
		...state.lines[line],
		...mapping_line,
	},
	...state.lines.slice(line + 1),
];

const reducer = generate_reducer<WBPlanViewStates, WBPlanViewActions>({

	//BaseTableSelectionState
	'OpenBaseTableSelectionAction': ({
		state,
		action,
	}) =>
		(
			!action.referrer || action.referrer === state.type
		) ?
			(
				{
					type: 'BaseTableSelectionState',
					show_hidden_tables:
						cache.get(
							'ui',
							'show_hidden_tables',
						),
				}
			) :
			state,
	'SelectTableAction': ({action}) => (
		{
			type: 'MappingState',
			mapping_is_templated: action.mapping_is_templated,
			show_hidden_fields:
				cache.get(
					'ui',
					'show_hidden_fields',
				),
			show_mapping_view:
				cache.get(
					'ui',
					'show_mapping_view',
					{
						default_value: true,
					},
				),
			base_table_name: action.table_name,
			new_header_id: 1,
			mapping_view: ['0'],
			mappings_are_validated: false,
			validation_results: [],
			lines: get_lines_from_headers({
				headers: action.headers,
				run_automapper: true,
				base_table_name: action.table_name,
			}),
			changes_made: false,
		}
	),
	'ToggleHiddenTablesAction': ({state}) => (
		{
			...state,
			show_hidden_tables: cache.set(
				'ui',
				'show_hidden_tables',
				'show_hidden_tables' in state ?
					!state.show_hidden_tables :
					false,
				{
					overwrite: true,
				},
			),
		}
	),
	'UseTemplateAction': ({action}) => (
		{
			type: 'LoadingState',
			loading_state: {
				type: 'LoadTemplateSelectionState',
				dispatch_action: action.dispatch,
			},
		}
	),

	//TemplateSelectionState
	'TemplatesLoadedAction': ({action}) => (
		{
			type: 'TemplateSelectionState',
			templates: action.templates,
		}
	),
	'CancelTemplateSelectionAction': () => (
		{
			type: 'BaseTableSelectionState',
			show_hidden_tables: cache.get(
				'ui',
				'show_hidden_tables',
			),
		}
	),

	//common
	'CancelMappingAction': ({
		state,
		action,
	}) =>
		void (
			go_back(action)
		) || state,

	//MappingState
	'OpenMappingScreenAction': ({
		state,
		action,
	}) => {
		if (action.upload_plan === false)
			throw new Error('Upload plan is not defined');

		const {
			base_table_name,
			lines,
		} = get_lines_from_upload_plan(
			action.headers,
			action.upload_plan,
		);
		const new_state: MappingState = {
			...state,
			type: 'MappingState',
			mapping_is_templated: action.mapping_is_templated,
			show_hidden_fields:
				cache.get(
					'ui',
					'show_hidden_fields',
				),
			show_mapping_view: cache.get(
				'ui',
				'show_mapping_view',
				{
					default_value: true,
				},
			),
			mappings_are_validated: false,
			mapping_view: ['0'],
			validation_results: [],
			new_header_id: 1,
			changes_made: false,
			base_table_name,
			lines,
		};

		if (new_state.lines.some(({mapping_path}) =>
			mapping_path.length === 0)
		)
			throw new Error('Mapping Path is invalid');
		return new_state;
	},
	'SavePlanAction': ({
		state,
		action,
	}) =>
		save_plan(action, mapping_state(state), action.ignore_validation),
	'ToggleMappingViewAction': ({state}) => (
		{
			...mapping_state(state),
			show_mapping_view: cache.set(
				'ui',
				'show_mapping_view',
				!mapping_state(state).show_mapping_view,
				{
					overwrite: true,
				}),
		}
	),
	'ToggleMappingIsTemplatedAction': ({state}) => (
		{
			...mapping_state(state),
			mapping_is_templated:
				!mapping_state(state).mapping_is_templated,
		}
	),
	'ValidationAction': ({state}) =>
		validate(mapping_state(state)),
	'ResetMappingsAction': ({state}) => (
		{
			...mapping_state(state),
			lines: mapping_state(state).lines.map(line => (
				{
					...line,
					mapping_path: ['0'],
				}
			)),
			changes_made: true,
			mappings_are_validated: false,
			validation_results: [],
		}
	),
	'ClearMappingLineAction': ({
		state,
		action,
	}) => (
		{
			...mapping_state(state),
			lines: modify_line(
				mapping_state(state),
				action.line,
				{
					mapping_path: ['0'],
				},
			),
			changes_made: true,
			mappings_are_validated: false,
		}
	),
	'FocusLineAction': ({
		state,
		action,
	}) => {
		if (action.line >= mapping_state(state).lines.length)
			throw new Error(`Tried to focus a line that doesn't exist`);

		const focused_line_mapping_path =
			mapping_state(state).lines[action.line].mapping_path;
		return {
			...mapping_state(state),
			focused_line: action.line,
			mapping_view:
				mapping_path_is_complete(focused_line_mapping_path) ?
					focused_line_mapping_path :
					mapping_state(state).mapping_view,
		};
	},
	'MappingViewMapAction': ({state}) => {
		const mapping_view_mapping_path =
			mapping_state(state).mapping_view;
		const focused_line = mapping_state(state).focused_line;
		if (
			!mapping_path_is_complete(mapping_view_mapping_path) ||
			typeof focused_line === 'undefined' ||
			focused_line >= mapping_state(state).lines.length
		)
			return state;

		return {
			...mapping_state(state),
			lines: [
				...mapping_state(state).lines.slice(0, focused_line),
				{
					...mapping_state(state).lines[focused_line],
					mapping_path: mapping_view_mapping_path,
				},
				...mapping_state(state).lines.slice(focused_line + 1),
			],
			changes_made: true,
			mappings_are_validated: false,
		};
	},
	'AddNewHeaderAction': ({state}) => (
		{
			...mapping_state(state),
			new_header_id: mapping_state(state).new_header_id + 1,
			lines: [
				...mapping_state(state).lines,
				{
					name: `New Header ${
						mapping_state(state).new_header_id
					}`,
					type: 'new_column',
					mapping_path: ['0'],
				},
			],
			autoscroll: true,
			changes_made: true,
			mappings_are_validated: false,
		}
	),
	'AddNewStaticHeaderAction': ({state}) => (
		{
			...mapping_state(state),
			lines: [
				...mapping_state(state).lines,
				{
					name: '',
					type: 'new_static_column',
					mapping_path: ['0'],
				},
			],
			autoscroll: true,
			changes_made: true,
			mappings_are_validated: false,
		}
	),
	'AutoScrollFinishedAction': ({state}) => (
		{
			...mapping_state(state),
			autoscroll: false,
		}
	),
	'ToggleHiddenFieldsAction': ({state}) => (
		{
			...mapping_state(state),
			show_hidden_fields: cache.set(
				'ui',
				'show_hidden_fields',
				!mapping_state(state).show_hidden_fields,
				{
					overwrite: true,
				}),
			reveal_hidden_fields_clicked: true,
		}
	),
	'OpenSelectElementAction': ({
		state,
		action,
	}) => (
		{
			...mapping_state(state),
			open_select_element: {
				line: action.line,
				index: action.index,
				autoscroll: false,
			},
			automapper_suggestions_promise:
				get_automapper_suggestions({
						lines: mapping_state(state).lines,
						line: action.line,
						index: action.index,
						base_table_name: mapping_state(state).base_table_name,
					},
				),
		}
	),
	'CloseSelectElementAction': ({state}) =>
		soft_resolve_non_mapping_state(state) || (
			{
				...mapping_state(state),
				open_select_element: undefined,
				automapper_suggestions_promise: undefined,
				automapper_suggestions: undefined,
			}
		),
	'ChangeSelectElementValueAction': ({
		state,
		action,
	}) => {
		const new_mapping_path =
			mutate_mapping_path({
					lines: mapping_state(state).lines,
					mapping_view: mapping_state(state).mapping_view,
					line: action.line,
					index: action.index,
					value: action.value,
					is_relationship: action.is_relationship,
				},
			);

		if (action.line === 'mapping_view')
			return {
				...mapping_state(state),
				mapping_view: new_mapping_path,
			};

		return {
			...mapping_state(state),
			lines: deduplicate_mappings(
				modify_line(
					mapping_state(state),
					action.line,
					{
						mapping_path: new_mapping_path,
					},
				),
				mapping_state(
					state,
				).open_select_element?.line ?? false,
			),
			open_select_element: undefined,
			automapper_suggestions_promise: undefined,
			automapper_suggestions: undefined,
			changes_made: true,
			mappings_are_validated: false,
		};
	},
	'AutomapperSuggestionsLoadedAction': ({
		state,
		action,
	}) => (
		{
			...mapping_state(state),
			automapper_suggestions: action.automapper_suggestions,
			automapper_suggestions_promise: undefined,
		}
	),
	'AutomapperSuggestionSelectedAction': ({
		state,
		action: {suggestion},
	}) => (
		{
			...mapping_state(state),
			lines: modify_line(
				mapping_state(state),
				mapping_state(state).open_select_element!.line,
				{
					mapping_path: mapping_state(state).automapper_suggestions![~~suggestion - 1].mapping_path,
				},
			),
			open_select_element: undefined,
			automapper_suggestions_promise: undefined,
			automapper_suggestions: undefined,
			changes_made: true,
			mappings_are_validated: false,
		}
	),
	'StaticHeaderChangeAction': ({
		state,
		action,
	}) => (
		{
			...mapping_state(state),
			lines: modify_line(
				mapping_state(state),
				action.line,
				{
					name: action.event.target.value,
				},
			),
		}
	),
	'ValidationResultClickAction': ({
		state,
		action: {mapping_path},
	}) => (
		{
			...mapping_state(state),
			mapping_view: mapping_path,
		}
	),
});

const loading_state_dispatch = generate_dispatch<LoadingStates>({
	'LoadTemplateSelectionState': state => {

		if (typeof state.dispatch_action !== 'function')
			throw new Error('Dispatch function was not provided');

		const wbs = new (
			schema as any
		).models.Workbench.LazyCollection({
			filters: {orderby: 'name', ownerpermissionlevel: 1},
		});
		wbs.fetch({limit: 5000}).done(() =>
			Promise.all(
				wbs.models.map((wb: any) =>
					wb.rget('workbenchtemplate'),
				),
			).then((workbench_templates: any) =>
				state.dispatch_action!({
					type: 'TemplatesLoadedAction',
					templates: workbench_templates.map((wbt: any) => [
						upload_plan_string_to_object(
							wbt.get('remarks') as string,
						),
						wbt.get('name') as string,
					]).filter(([upload_plan]: [FalsyUploadPlan]) =>
						upload_plan !== false,
					).map(([
						upload_plan,
						dataset_name,
					]: [UploadPlan, string]) => (
						{
							dataset_name: dataset_name,
							upload_plan: upload_plan,
						}
					)),
				}),
			).catch(error => {
				throw error;
			}),
		);
	},
	'NavigateBackState': state =>  // need to make the `Loading`
		// dialog
		// appear before the `Leave Page?` dialog
		setTimeout(() =>
			navigation.go(`/workbench/${state.wb.id}/`), 10,
		),
});

const state_reducer = generate_reducer<JSX.Element,
	WBPlanViewStatesWithParams>({
	'LoadingState': ({action: state}) => {
		if (typeof state.loading_state !== 'undefined')
			Promise.resolve('').then(() =>
				loading_state_dispatch(state.loading_state!),
			).catch(error => {
				throw error;
			});
		if (typeof state.dispatch_action !== 'undefined')
			state.dispatch(state.dispatch_action);
		return <LoadingScreen />;
	},
	'BaseTableSelectionState': ({
		action: state,
	}) => <HeaderWrapper
		state_name={state.type}
		header={
			<WBPlanViewHeader
				title='Select Base Table'
				state_type={state.type}
				handleCancel={() => state.dispatch({
					type: 'CancelMappingAction',
					dataset: state.props.dataset,
					remove_unload_protect: state.props.remove_unload_protect,
				})}
				show_hidden_tables={state.show_hidden_tables}
				onToggleHiddenTables={() => state.dispatch({
					type: 'ToggleHiddenTablesAction',
				})}
				handleUseTemplate={() => state.dispatch({
					type: 'UseTemplateAction',
					dispatch: state.dispatch,
				})}
			/>
		}>
		<ListOfBaseTables
			list_of_tables={data_model_storage.list_of_base_tables}
			show_hidden_tables={state.show_hidden_tables}
			handleChange={(
				(table_name: string) => state.dispatch({
					type: 'SelectTableAction',
					table_name,
					mapping_is_templated: state.props.mapping_is_templated,
					headers: state.props.headers,
				})
			)}
		/>
	</HeaderWrapper>,
	'TemplateSelectionState': ({action: state}) =>
		<ModalDialog
			properties={{title: 'Select Template'}}
			onCloseCallback={() => state.dispatch({
				type: 'OpenBaseTableSelectionAction',
				referrer: state.type,
			})}
		>{
			state.templates.map(({dataset_name}, index) =>
				<a key={index} onClick={() =>
					state.dispatch({
						type: 'OpenMappingScreenAction',
						upload_plan: state.templates[index].upload_plan,
						mapping_is_templated: state.props.mapping_is_templated,
						headers: state.props.headers,
					})
				}>{dataset_name}</a>,
			)
		}</ModalDialog>,
	'MappingState': ({action: state}) => {
		const refObject = getRefMappingState(
			state.refObject,
			state,
		);

		if(typeof refObject.current.mapping_view_height === 'undefined')
			refObject.current.mapping_view_height = cache.get(
				'ui',
				'mapping_view_height',
				{
					default_value: defaultMappingViewHeight,
				}
			);

		const handleSave = (ignore_validation: boolean) =>
			state.dispatch({
					type: 'SavePlanAction',
					dataset: state.props.dataset,
					remove_unload_protect: state.props.remove_unload_protect,
					set_unload_protect: state.props.set_unload_protect,
					mapping_is_templated: state.mapping_is_templated,
					ignore_validation,
				},
			);
		const handleClose = () => state.dispatch({
			type: 'CloseSelectElementAction',
		});
		return <HeaderWrapper
			state_name={state.type}
			header={
				<WBPlanViewHeader
					title={
						data_model_storage.tables[
							state.base_table_name
							].table_friendly_name
					}
					state_type={state.type}
					mappings_are_validated={state.mappings_are_validated}
					mapping_is_templated={state.mapping_is_templated}
					show_mapping_view={state.show_mapping_view}
					handleCancel={() => state.dispatch({
						type: 'CancelMappingAction',
						dataset: state.props.dataset,
						remove_unload_protect: state.props.remove_unload_protect,
					})}
					handleTableChange={() => state.dispatch({
						type: 'OpenBaseTableSelectionAction',
					})}
					handleClearMapping={() => state.dispatch({
						type: 'ResetMappingsAction',
					})}
					handleValidation={() => state.dispatch({
						type: 'ValidationAction',
					})}
					handleSave={() => handleSave(false)}
					handleToggleMappingIsTemplated={() =>
						state.dispatch({
							type: 'ToggleMappingIsTemplatedAction',
						})
					}
					handleShowMappingView={() =>
						state.dispatch({
							type: 'ToggleMappingViewAction',
						})
					}
				/>
			}
			handleClick={handleClose}
		>
			<WBPlanViewMapper
				mapping_is_templated={state.mapping_is_templated}
				show_hidden_fields={state.show_hidden_fields}
				show_mapping_view={state.show_mapping_view}
				base_table_name={state.base_table_name}
				new_header_id={state.new_header_id}
				lines={state.lines}
				mapping_view={state.mapping_view}
				validation_results={state.validation_results}
				mapper_dispatch={state.dispatch}
				open_select_element={state.open_select_element}
				automapper_suggestions={state.automapper_suggestions}
				focused_line={state.focused_line}
				autoscroll={state.autoscroll}
				refObject={refObject}
				handleSave={() => handleSave(true)}
				handleToggleHiddenFields={() =>
					state.dispatch({type: 'ToggleHiddenFieldsAction'})
				}
				handleFocus={(line: number) =>
					state.dispatch({
						type: 'FocusLineAction',
						line,
					})}
				handleMappingViewMap={() =>
					state.dispatch({type: 'MappingViewMapAction'})
				}
				handleAddNewHeader={() =>
					state.dispatch({type: 'AddNewHeaderAction'})
				}
				handleAddNewStaticHeader={() =>
					state.dispatch({type: 'AddNewStaticHeaderAction'})
				}
				handleAddNewColumn={() =>
					state.dispatch({type: 'AddNewHeaderAction'})
				}
				handleAddNewStaticColumn={() =>
					state.dispatch({type: 'AddNewStaticHeaderAction'})
				}
				handleAutoScrollFinish={() =>
					state.dispatch({type: 'AutoScrollFinishedAction'})
				}
				handleOpen={(line: number, index: number) =>
					state.dispatch({
						type: 'OpenSelectElementAction',
						line,
						index,
					})
				}
				handleClose={handleClose}
				handleChange={(
					line: 'mapping_view' | number,
					index: number,
					value: string,
					is_relationship: boolean,
				) => state.dispatch({
					type: 'ChangeSelectElementValueAction',
					line,
					index,
					value,
					is_relationship,
				})}
				handleClearMapping={(line: number) =>
					state.dispatch({
						type: 'ClearMappingLineAction',
						line,
					})
				}
				handleStaticHeaderChange={(
					line: number,
					event: React.ChangeEvent<HTMLTextAreaElement>,
				) => state.dispatch({
					type: 'StaticHeaderChangeAction',
					line,
					event,
				})}
				handleAutomapperSuggestionSelection={(suggestion: string) =>
					state.dispatch({
						type: 'AutomapperSuggestionSelectedAction',
						suggestion,
					})
				}
				handleValidationResultClick={(mapping_path: MappingPath) =>
					state.dispatch({
						type: 'ValidationResultClickAction',
						mapping_path,
					})
				}
				handleToggleMappingIsTemplated={() =>
					state.dispatch({
						type: 'ToggleMappingIsTemplatedAction',
					})
				}
				handleToggleMappingView={() =>
					state.dispatch({type: 'ToggleMappingViewAction'})
				}
				handleMappingViewResize={(height) =>
					state.refObjectDispatch({
						type: 'MappingViewResizeAction',
						height
					})
				}
			/>
		</HeaderWrapper>;
	},
});


type RefUndefinedState = State<'RefUndefinedState'>;

export interface RefMappingState extends State<'RefMappingState'> {
	unload_protect_is_set: boolean,
	mapping_view_height: number,
	mapping_view_height_change_timeout: NodeJS.Timeout
}

type RefStatesBase = RefUndefinedState | RefMappingState;
// make all properties optional, except for `type`
type RefStates = Partial<RefStatesBase> & State<RefStatesBase['type']>;

const refInitialState: RefUndefinedState = {
	type: 'RefUndefinedState',
};

const refStatesMapper = {
	'MappingState': 'RefMappingState',
} as const;
const flippedRefStatesMapper = Object.fromEntries(
	Object.entries(refStatesMapper).map(([k, v]) =>
		[v, k],
	),
);

type RefChangeStateAction = Action<'RefChangeStateAction'>;
type RefSetUnloadProtectAction = Action<'RefSetUnloadProtectAction'>;
type RefUnsetUnloadProtectAction = Action<'RefUnsetUnloadProtectAction'>;

interface MappingViewResizeAction
	extends Action<'MappingViewResizeAction'> {
	height: number;
}

type RefActions =
	RefChangeStateAction
	| RefSetUnloadProtectAction
	| RefUnsetUnloadProtectAction
	| MappingViewResizeAction;

type RefActionsWithPayload = RefActions & {
	payload: {
		refObject: React.MutableRefObject<RefStates>,
		state: WBPlanViewStates,
		stateDispatch: (action: WBPlanViewActions) => void,
		props: WBPlanViewProps,
	}
};

const refWrongStateMessage = 'Tried to change the refObject while in a' +
	' wrong state';

function getRefMappingState(
	refObject: React.MutableRefObject<RefStates>,
	state: WBPlanViewStates,
	quiet = false,
): React.MutableRefObject<RefMappingState> {
	if (state.type !== flippedRefStatesMapper[refObject.current.type])
		if (quiet)
			console.error(refWrongStateMessage);
		else
			throw Error(refWrongStateMessage);
	return refObject as React.MutableRefObject<RefMappingState>;
}

const ref_object_dispatch = generate_dispatch<RefActionsWithPayload>({
	'RefChangeStateAction': ({
		payload: {
			refObject,
			state,
		},
	}) => {
		refObject.current = {
			type: refStatesMapper[
				state.type as keyof typeof refStatesMapper
				] ?? 'RefUndefinedState',
		};
	},
	'RefSetUnloadProtectAction': ({
		payload: {
			refObject,
			props,
			state,
		},
	}) => {
		props.remove_unload_protect();
		getRefMappingState(
			refObject,
			state,
		).current.unload_protect_is_set = false;
	},
	'RefUnsetUnloadProtectAction': ({
		payload: {
			refObject,
			props,
			state,
		},
	}) => {
		props.remove_unload_protect();
		getRefMappingState(
			refObject,
			state,
		).current.unload_protect_is_set = false;
	},
	'MappingViewResizeAction': ({
		height: initialHeight,
		payload: {
			refObject,
			state,
			stateDispatch
		},
	}) => {
		const refMappingObject = getRefMappingState(
			refObject,
			state,
		);

		if (refMappingObject.current.mapping_view_height_change_timeout)
			clearTimeout(
				refMappingObject.current.mapping_view_height_change_timeout,
			);

		let height = initialHeight;
		if(initialHeight === minMappingViewHeight) {
			height += 1;
			stateDispatch({
				type: 'ToggleMappingViewAction',
			});
		}

		refMappingObject.current.mapping_view_height = height;
		refMappingObject.current.mapping_view_height_change_timeout =
			setTimeout(
				() =>
					cache.set(
						'ui',
						'mapping_view_height',
						height,
						{
							overwrite: true,
						},
					),
				150,
			);
	}
});


function WBPlanView(props: WBPlanViewProps) {

	const [state, dispatch] = React.useReducer(
		reducer,
		{
			upload_plan: props.upload_plan,
			headers: props.headers,
			mapping_is_templated: props.mapping_is_templated,
		} as OpenMappingScreenAction,
		getInitialWBPlanViewState,
	);

	// `refObject` is like `state`, but does not cause re-render on change
	const refObject = React.useRef<RefStates>(refInitialState);
	const refObjectDispatch = (action: RefActions) =>
		ref_object_dispatch({
			...action,
			payload: {
				refObject,
				state,
				props,
				stateDispatch: dispatch,
			},
		});

	// reset refObject on state change
	if (
		refObject.current.type !== (
			// @ts-ignore
			refStatesMapper[state.type] ?? 'RefUndefinedState'
		)
	)
		refObjectDispatch({
			type: 'RefChangeStateAction',
		});

	// set/unset unload protect
	React.useEffect(() => {
		const changes_made = 'changes_made' in state ?
			state.changes_made :
			false;

		if (
			state.type === 'LoadingState' ||
			refObject.current.type !== 'RefMappingState'
		)
			return;

		if (refObject.current.unload_protect_is_set && !changes_made)
			refObjectDispatch({
				type: 'RefUnsetUnloadProtectAction',
			});
		else if (!refObject.current.unload_protect_is_set && changes_made)
			refObjectDispatch({
				type: 'RefSetUnloadProtectAction',
			});

	}, [
		'changes_made' in state ?
			state.changes_made :
			false,
	]);

	// wait for automapper suggestions to fetch
	React.useEffect(() => {

		if (!(
			'automapper_suggestions_promise' in state
		))
			return;

		state.automapper_suggestions_promise?.then(automapper_suggestions =>
			dispatch({
				type: 'AutomapperSuggestionsLoadedAction',
				automapper_suggestions: automapper_suggestions,
			}),
		).catch(console.error);

	}, [
		'automapper_suggestions_promise' in state ?
			state.automapper_suggestions_promise :
			undefined,
	]);

	return state_reducer(<i />, {
		...state,
		props,
		dispatch,
		refObject: refObject,
		refObjectDispatch,
	});

}

function WBPlanViewWrapper(props: WBPlanViewWrapperProps): JSX.Element {

	const [schema_loaded, setSchemaLoaded] =
		React.useState<boolean>(
			typeof data_model_storage.tables !== 'undefined',
		);

	React.useEffect(() => {
		if (schema_loaded)
			return;

		schema_fetched_promise.then(() =>
			setSchemaLoaded(true),
		).catch(error => {
			throw error;
		});

	}, [schema_loaded]);

	const upload_plan = props.dataset.uploadplan ?
		props.dataset.uploadplan :
		false;
	return (
		schema_loaded ?
			<WBPlanView {...props} upload_plan={upload_plan}
						headers={props.dataset.columns} />
			: <LoadingScreen />
	);
}


const set_unload_protect = (self: WBPlanViewBackboneProps) =>
	navigation.addUnloadProtect(
		self,
		'This mapping has not been saved.',
	);

const remove_unload_protect = (self: WBPlanViewBackboneProps) =>
	navigation.removeUnloadProtect(self);

export default createBackboneView<PublicWBPlanViewProps,
	WBPlanViewBackboneProps,
	WBPlanViewWrapperProps>
({
	module_name: 'WBPlanView',
	title: (self)=>
		self.dataset.name,
	class_name: 'wb-plan-view',
	initialize(
		self,
		{dataset},
	) {
		self.dataset = dataset;
		self.mapping_is_templated = false;
		const header = document.getElementById('site-header');
		if (header === null)
			throw new Error(`Can't find site's header`);
		self.header = header;
		self.handle_resize = () =>
			self.el.style.setProperty(
				'--menu_size',
				`${Math.ceil(self.header.clientHeight)}px`,
			);
	},
	render_pre(self) {
		self.el.classList.add('wbplanview');
	},
	render_post(self) {
		self.handle_resize();
		window.addEventListener('resize', self.handle_resize);
	},
	remove(self) {
		window.removeEventListener('resize', self.handle_resize);
		remove_unload_protect(self);
	},
	Component: WBPlanViewWrapper,
	get_component_props: self => (
		{
			dataset: self.dataset,
			remove_unload_protect:
				remove_unload_protect.bind(null, self),
			set_unload_protect:
				set_unload_protect.bind(null, self),
			mapping_is_templated: self.mapping_is_templated,
		}
	),
});
