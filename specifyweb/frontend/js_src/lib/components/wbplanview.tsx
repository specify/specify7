/*
*
* Workbench plan mapper
*
* */

'use strict';

import React from 'react';
import '../../css/wbplanview.css';
import _ from 'underscore';
import navigation from '../navigation';
import * as cache from './wbplanviewcache';
import schema from '../schema';
import fetch_data_model from './wbplanviewmodelfetcher';
import WBPlanViewMapper, {
	deduplicate_mappings,
	get_automapper_suggestions,
	get_lines_from_headers,
	get_lines_from_upload_plan,
	go_back,
	mapping_path_is_complete,
	mutate_mapping_path,
	save_plan,
	validate,
} from './wbplanviewmapper';
import ErrorBoundary from './errorboundary';
import {LoadingScreen, ModalDialog} from './modaldialog';
import data_model_storage from './wbplanviewmodel';
import {ListOfBaseTables} from './wbplanviewcomponents';
import {generate_dispatch, generate_reducer} from './statemanagement';

let schema_fetched_promise = fetch_data_model();

export function named_component<T>(component_function:T, component_name:string):T {
	// @ts-ignore
	component_function.displayName = component_name;
	return component_function;
}

const WBPlanViewHeaderLeftMappingElements = named_component(({
	handleTableChange,
	handleToggleMappingView
} :WBPlanViewHeaderPropsMapping) => <>
	<button onClick={handleTableChange}>Change table</button>
	<button onClick={handleToggleMappingView}>Toggle Mapping View</button>
</>,'WBPlanViewHeaderLeftMappingElements');

const WBPlanViewHeaderRightMappingElements = named_component(({
	mapping_is_templated,
	handleToggleMappingIsTemplated,
	handleClearMapping,
	handleValidation,
	handleSave,
	handleCancel
} :WBPlanViewHeaderPropsMapping) => <>
	<label>
		<input
			type="checkbox"
			checked={mapping_is_templated}
			onChange={handleToggleMappingIsTemplated}
		/>
		Use this mapping as a template
	</label>
	<button onClick={handleClearMapping}>Clear Mappings</button>
	<button onClick={handleValidation}>Validate</button>
	<button onClick={handleSave}>Save</button>
	<button onClick={handleCancel}>Cancel</button>
</>,'WBPlanViewHeaderRightMappingElements');
const WBPlanViewHeaderRightNonMappingElements = named_component(({
	handleUseTemplate,
	handleCancel
} :WBPlanViewHeaderPropsNonMapping) =>
	<>
		<button onClick={handleUseTemplate}>Use template</button>
		<button onClick={handleCancel}>Cancel</button>
	</>,'WBPlanViewHeaderRightNonMappingElements');
const WBPlanViewHeader = React.memo(named_component((props :WBPlanViewHeaderProps) => <div className="wbplanview_header">
		<div>
			<span>{props.title}</span>
			{props.state_type === 'MappingState' && WBPlanViewHeaderLeftMappingElements(props)}
		</div>
		<div>
			{
				props.state_type === 'MappingState' ?
					WBPlanViewHeaderRightMappingElements(props) :
					WBPlanViewHeaderRightNonMappingElements(props)
			}
		</div>
	</div>,'WBPlanViewHeader'),
	(previous_props :WBPlanViewHeaderProps, new_props :WBPlanViewHeaderProps) =>
		previous_props.title === new_props.title &&
		previous_props.mapping_is_templated === new_props.mapping_is_templated &&
		previous_props.state_type === new_props.state_type,
);

function upload_plan_string_to_object(upload_plan_string :string) :falsy_upload_plan {
	let upload_plan;

	try {
		upload_plan = JSON.parse(upload_plan_string);
	} catch (exception) {

		if (!(
			exception instanceof SyntaxError
		))//only catch JSON parse errors
			throw exception;

		upload_plan = false;

	}

	if (typeof upload_plan !== 'object' || upload_plan === null || typeof upload_plan['baseTableName'] === 'undefined')
		return false;
	else
		return upload_plan;
}

function getInitialWBPlanViewState(props:OpenMappingScreenAction):WBPlanViewStates {
	if (props.upload_plan === false) {
		return {
			type: 'LoadingState',
			dispatch_action: {
				type: 'OpenBaseTableSelectionAction'
			}
		};
	}
	else
		return{
			type: 'LoadingState',
			dispatch_action: {
				...props,
				type: 'OpenMappingScreenAction',
			}
		};
}

const HeaderWrapper = named_component((props :HeaderWrapperProps) =>
	<div className="wbplanview_event_listener" onClick={(event) =>
		(event.target as HTMLElement).closest('.custom_select_closed_list') === null && props.handleClick ?
			props.handleClick() :
			undefined
	}>
		{props.header}
		<div className={`wbplanview_container wbplanview_container_${props.state_name}`}>
			{props.children}
		</div>
	</div>,'HeaderWrapper');

function mapping_state(state:WBPlanViewStates):MappingState {
	if(state.type !== 'MappingState')
		throw new Error('Dispatching this action requires the state to be of type `MappingState`');
	else
		return state;
}

const soft_resolve_non_mapping_state = (state:WBPlanViewStates):WBPlanViewStates|false =>
	state.type !== 'MappingState' ?
		state :
		false

const modify_line = (state:MappingState, line:number, mapping_line:Partial<MappingLine>):MappingLine[]=>[
	...state.lines.slice(0, line),
	{
		...state.lines[line],
		...mapping_line
	},
	...state.lines.slice(line + 1),
]

const reducer = generate_reducer<WBPlanViewStates,WBPlanViewActions>({

	//BaseTableSelectionState
	'OpenBaseTableSelectionAction': (state,action)=>
		(!action.referrer || action.referrer===state.type) ?
			({
				type: 'BaseTableSelectionState'
			}) :
			state,
	'SelectTableAction': (_state,action)=>({
		type: 'MappingState',
		mapping_is_templated: action.mapping_is_templated,
		show_hidden_fields: cache.get('ui', 'show_hidden_fields'),
		show_mapping_view: cache.get('ui', 'show_mapping_view'),
		base_table_name: action.table_name,
		new_header_id: 1,
		mapping_view: ["0"],
		validation_results: [],
		lines: get_lines_from_headers({
			headers:action.headers,
			run_automapper:true,
			base_table_name:action.table_name,
		}),
	}),
	'UseTemplateAction': (_state,action)=>({
		type: 'LoadingState',
		loading_state: {
			type: 'LoadTemplateSelectionState',
			dispatch_action: action.dispatch,
		},
	}),

	//TemplateSelectionState
	'TemplatesLoadedAction': (_state,action)=>({
		type: 'TemplateSelectionState',
		templates: action.templates,
	}),
	'CancelTemplateSelectionAction': ()=>({
		type: 'BaseTableSelectionState',
	}),

	//common
	'CancelMappingAction': (_state,action)=>
		go_back(action),

	//MappingState
	'OpenMappingScreenAction': (state,action)=> {
		if (action.upload_plan === false)
			throw new Error('Upload plan is not defined');

		const {
			base_table_name,
			lines,
		} = get_lines_from_upload_plan(
			action.headers,
			action.upload_plan,
		);
		const new_state :MappingState = {
			...state,
			type: 'MappingState',
			mapping_is_templated: action.mapping_is_templated,
			show_hidden_fields: cache.get('ui', 'show_hidden_fields'),
			show_mapping_view: cache.get('ui', 'show_mapping_view'),
			mapping_view: ["0"],
			validation_results: [],
			new_header_id: 1,
			base_table_name,
			lines,
		};

		if (new_state.lines.some(({mapping_path}) => mapping_path.length === 0))
			throw new Error('Mapping Path is invalid');
		return new_state;
	},
	'SavePlanAction': (state,action)=>
		save_plan(action, mapping_state(state),action.ignore_validation),
	'ToggleMappingViewAction': state=>({
		...mapping_state(state),
		show_mapping_view: cache.set('ui', 'show_mapping_view', !mapping_state(state).show_mapping_view),
	}),
	'ToggleMappingIsTemplatedAction': state=>({
		...mapping_state(state),
		mapping_is_templated: !mapping_state(state).mapping_is_templated,
	}),
	'ValidationAction': state=>
		validate(mapping_state(state)),
	'ResetMappingsAction': state=>({
			...mapping_state(state),
			lines: mapping_state(state).lines.map(line=>({
				...line,
				mapping_path: ["0"],
			})),
			validation_results: [],
	}),
	'ClearMappingLineAction': (state,action)=>({
		...mapping_state(state),
		lines: modify_line(mapping_state(state),action.line,{
			mapping_path: ["0"],
		}),
	}),
	'FocusLineAction': (state,action)=> {
		if (action.line >= mapping_state(state).lines.length)
			throw new Error('Tried to focus a line that doesn\'t exist');

		const focused_line_mapping_path = mapping_state(state).lines[action.line].mapping_path;
		return {
			...mapping_state(state),
			focused_line: action.line,
			mapping_view: mapping_path_is_complete(focused_line_mapping_path) ?
				focused_line_mapping_path :
				mapping_state(state).mapping_view,
		}
	},
	'MappingViewMapAction': state=>{
		const mapping_view_mapping_path = mapping_state(state).mapping_view;
		const focused_line = mapping_state(state).focused_line;
		if(
			!mapping_path_is_complete(mapping_view_mapping_path) ||
			typeof focused_line === "undefined" ||
			focused_line! >= mapping_state(state).lines.length
		)
			return state;

		return {
			...mapping_state(state),
			lines: [
				...mapping_state(state).lines.slice(0,focused_line),
				{
					...mapping_state(state).lines[focused_line],
					mapping_path: mapping_view_mapping_path,
				},
				...mapping_state(state).lines.slice(focused_line+1),
			]
		};
	},
	'AddNewHeaderAction': (state)=>({
		...mapping_state(state),
		new_header_id: mapping_state(state).new_header_id+1,
		lines: [
			...mapping_state(state).lines,
			{
				name: `New Header ${mapping_state(state).new_header_id}`,
				type: 'new_column',
				mapping_path: ["0"],
			}
		],
		autoscroll: true,
	}),
	'AddNewStaticHeaderAction': state=>({
		...mapping_state(state),
		lines: [
			...mapping_state(state).lines,
			{
				name: '',
				type: 'new_static_column',
				mapping_path: ["0"],
			}
		],
		autoscroll: true,
	}),
	'AutoScrollFinishedAction': state=>({
		...mapping_state(state),
		autoscroll: false,
	}),
	'ToggleHiddenFieldsAction': state=>({
		...mapping_state(state),
		show_hidden_fields: cache.set('ui', 'show_hidden_fields', !mapping_state(state).show_hidden_fields),
	}),
	'OpenSelectElementAction': (state,action)=>({
		...mapping_state(state),
		open_select_element: {
			line: action.line,
			index: action.index,
			autoscroll: false,
		},
		automapper_suggestions_promise: get_automapper_suggestions({
			lines: mapping_state(state).lines,
			line: action.line,
			index: action.index,
			base_table_name: mapping_state(state).base_table_name,
		})
	}),
	'CloseSelectElementAction': state=>
		soft_resolve_non_mapping_state(state) || ({
			...mapping_state(state),
			open_select_element: undefined,
			automapper_suggestions_promise: undefined,
			automapper_suggestions: undefined,
		}),
	'ChangeSelectElementValueAction': (state,action)=> {
		const new_mapping_path = mutate_mapping_path({
			lines: mapping_state(state).lines,
			mapping_view: mapping_state(state).mapping_view,
			line: action.line,
			index: action.index,
			value: action.value,
			is_relationship: action.is_relationship,
		});

		if (action.line === 'mapping_view')
			return {
				...mapping_state(state),
				mapping_view: new_mapping_path
			}

		return {
			...mapping_state(state),
			lines: deduplicate_mappings(
				modify_line(mapping_state(state), action.line,{
					mapping_path: new_mapping_path,
				}),
				typeof mapping_state(state).open_select_element !== "undefined" && mapping_state(state).open_select_element!.line
			),
			open_select_element: undefined,
			automapper_suggestions_promise: undefined,
			automapper_suggestions: undefined,
		}
	},
	'AutomapperSuggestionsLoadedAction': (state,action)=>({
		...mapping_state(state),
		automapper_suggestions: action.automapper_suggestions,
		automapper_suggestions_promise: undefined,
	}),
	'AutomapperSuggestionSelectedAction': (state, {suggestion})=>({
		...mapping_state(state),
		lines: modify_line(mapping_state(state), mapping_state(state).open_select_element!.line, {
			mapping_path: [
				...mapping_state(state).lines[mapping_state(state).open_select_element!.line].mapping_path.slice(0,mapping_state(state).open_select_element!.index),
				...mapping_state(state).automapper_suggestions![parseInt(suggestion)-1].mapping_path
			]
		}),
		open_select_element: undefined,
		automapper_suggestions_promise: undefined,
		automapper_suggestions: undefined,
	}),
	'StaticHeaderChangeAction': (state,action)=>({
		...mapping_state(state),
		lines: modify_line(mapping_state(state), action.line,{
			name: action.event.target.value
		}),
	}),
});

const loading_state_dispatch = generate_dispatch<LoadingStates>({
	'LoadTemplateSelectionState': state => {

		if(typeof state.dispatch_action !== "function")
			throw new Error('Dispatch function was not provided');

		const wbs = new (
			schema as any
		).models.Workbench.LazyCollection({
			filters: {orderby: 'name', ownerpermissionlevel: 1},
		});
		wbs.fetch({limit: 5000}).done(() =>
			Promise.all(
				wbs.models.map((wb :any) =>
					wb.rget('workbenchtemplate'),
				),
			).then((wbts :any) =>
				state.dispatch_action!({
					type: 'TemplatesLoadedAction',
					templates: wbts.map((wbt:any)=>[
						upload_plan_string_to_object(wbt.get('remarks') as string),
						wbt.get('name') as string
					]).filter(([upload_plan]:[falsy_upload_plan])=>
						upload_plan!==false
					).map(([upload_plan, dataset_name]:[upload_plan_structure, string])=>({
						dataset_name: dataset_name,
						upload_plan: upload_plan,
					})),
				})
			),
		);
	},
	'NavigateBackState': state=>
		setTimeout(()=>navigation.go(`/workbench/${state.wb.id}/`),10),  // need to make the `Loading` dialog appear before the `Leave Page?` dialog
});

const state_reducer = generate_reducer<JSX.Element,WBPlanViewStatesWithParams>({
	'LoadingState': (_,state) => {
		if(typeof state.loading_state !== "undefined")
			Promise.resolve('').then(() =>
				loading_state_dispatch(state.loading_state!)
			);
		if (typeof state.dispatch_action !== "undefined")
			state.dispatch(state.dispatch_action);
		return <LoadingScreen/>;
	},
	'BaseTableSelectionState': (_,state) => <HeaderWrapper
		state_name={state.type}
		header={
			<WBPlanViewHeader
				title='Select Base Table'
				state_type={state.type}
				handleCancel={() => state.dispatch({type: 'CancelMappingAction', wb:state.props.wb, removeUnloadProtect:state.props.removeUnloadProtect})}
				handleUseTemplate={() => state.dispatch({type: 'UseTemplateAction', dispatch:state.dispatch })}
			/>
		}>
		<ListOfBaseTables
			list_of_tables={data_model_storage.list_of_base_tables}
			handleChange={((table_name: string) => state.dispatch({type:'SelectTableAction', table_name, mapping_is_templated:state.props.mapping_is_templated, headers:state.props.headers}))}
		/>
	</HeaderWrapper>,
	'TemplateSelectionState': (_,state) =>
		<ModalDialog
			properties={{title: 'Select Template'}}
			onCloseCallback={()=>state.dispatch({
				type:'OpenBaseTableSelectionAction',
				referrer: state.type
			})}
			eventListenersEffect={(dialog)=>{
				// jQuery modifies DOM, which stops React's event listeners from firing
				// if we need event listeners on elements inside the modal, we need to use use old school addEventListener

				const click_callback = (event:Event)=>{

					if(!event.target)
						return;
					const target = event.target as HTMLElement;
					const a = target.closest('a');
					if(!a || !a.parentNode)
						return;

					const index = Array.prototype.indexOf.call(a.parentNode.childNodes, a);
					const upload_plan = state.templates[index].upload_plan;
					state.dispatch({
						type: 'OpenMappingScreenAction',
						upload_plan,
						mapping_is_templated: state.props.mapping_is_templated,
						headers: state.props.headers
					});
				}

				dialog.addEventListener('click',click_callback);
				return ()=>dialog.removeEventListener('click',click_callback);
			}}
		>{
			state.templates.map(({dataset_name},index) =>
				<a key={index}>{dataset_name}</a>,
			)
		}</ModalDialog>,
	'MappingState': (_,state) =>{
		if(typeof state.automapper_suggestions_promise !== "undefined")
			state.automapper_suggestions_promise.then(automapper_suggestions=>
				state.dispatch({
					type: 'AutomapperSuggestionsLoadedAction',
					automapper_suggestions: automapper_suggestions,
				})
			);
		const handleSave = (ignore_validation:boolean) => state.dispatch({type: 'SavePlanAction',wb:state.props.wb, removeUnloadProtect:state.props.removeUnloadProtect, wbtemplatePromise:state.props.wbtemplatePromise, mapping_is_templated:state.mapping_is_templated, ignore_validation})
		const handleClose = () =>state.dispatch({type:'CloseSelectElementAction'})
		return <HeaderWrapper
			state_name={state.type}
			header={
				<WBPlanViewHeader
					title={data_model_storage.tables[state.base_table_name].table_friendly_name}
					state_type={state.type}
					handleCancel={() => state.dispatch({type: 'CancelMappingAction',wb:state.props.wb, removeUnloadProtect:state.props.removeUnloadProtect})}
					handleTableChange={() => state.dispatch({type: 'OpenBaseTableSelectionAction'})}
					handleToggleMappingView={() => state.dispatch({type: 'ToggleMappingViewAction'})}
					handleToggleMappingIsTemplated={() => state.dispatch({type: 'ToggleMappingIsTemplatedAction'})}
					handleClearMapping={() => state.dispatch({type: 'ResetMappingsAction'})}
					handleValidation={() => state.dispatch({type: 'ValidationAction'})}
					handleSave={()=>handleSave(false)}
					mapping_is_templated={state.mapping_is_templated}
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
				handleSave={()=>handleSave(true)}
				handleFocus={(line:number)=>state.dispatch({type:'FocusLineAction', line})}
				handleMappingViewMap={()=>state.dispatch({type:'MappingViewMapAction'})}
				handleAddNewHeader={()=>state.dispatch({type:'AddNewHeaderAction'})}
				handleAddNewStaticHeader={()=>state.dispatch({type:'AddNewStaticHeaderAction'})}
				handleToggleHiddenFields={()=>state.dispatch({type:'ToggleHiddenFieldsAction'})}
				handleAddNewColumn={()=>state.dispatch({type:'AddNewHeaderAction'})}
				handleAddNewStaticColumn={()=>state.dispatch({type:'AddNewStaticHeaderAction'})}
				handleAutoScrollFinish={()=>state.dispatch({type:'AutoScrollFinishedAction'})}
				handleOpen={(line:number, index:number)=>state.dispatch({type:'OpenSelectElementAction', line, index})}
				handleClose={handleClose}
				handleChange={(line:'mapping_view'|number, index:number, value:string, is_relationship: boolean)=>state.dispatch({type:'ChangeSelectElementValueAction', line, index, value, is_relationship})}
				handleClearMapping={(line:number)=>state.dispatch({type:'ClearMappingLineAction', line})}
				handleStaticHeaderChange={(line:number, event:React.ChangeEvent<HTMLTextAreaElement>)=>state.dispatch({type:'StaticHeaderChangeAction', line, event})}
				handleAutomapperSuggestionSelection={(suggestion:string)=>state.dispatch({type: 'AutomapperSuggestionSelectedAction', suggestion})}
			/>
		</HeaderWrapper>;
	}
});

function WBPlanView(props :WBPlanViewProps) {

	const [state, dispatch]:[WBPlanViewStates,(action:WBPlanViewActions)=>void] = React.useReducer(
		reducer,
		{
			upload_plan: props.upload_plan,
			headers:props.headers,
			mapping_is_templated:props.mapping_is_templated
		} as OpenMappingScreenAction,
		getInitialWBPlanViewState
	);

	return state_reducer(<i />,{
		...state,
		props,
		dispatch
	});

}

export default named_component((props:publicWBPlanViewProps):react_element=>{

	const [schema_loaded,setSchemaLoaded] = React.useState<boolean>(typeof data_model_storage.tables !== "undefined");
	const [upload_plan,setUploadPlan] = React.useState<falsy_upload_plan>();
	const [headers,setHeaders] = React.useState<string[]>();

	if(!schema_loaded)
		schema_fetched_promise.then(schema=>{
			data_model_storage.tables = schema.tables;
			data_model_storage.list_of_base_tables = schema.list_of_base_tables;
			data_model_storage.ranks = schema.ranks;
			setSchemaLoaded(true);
		});

	if(typeof upload_plan === "undefined")
		props.wbtemplatePromise.done(wbtemplate => {
			setUploadPlan(upload_plan_string_to_object(wbtemplate.get('remarks')));
			wbtemplate.rget('workbenchtemplatemappingitems').done(mappings =>
				setHeaders(
					_.invoke(
						mappings.sortBy((mapping :{get :(arg0 :string) => any;}) =>
							mapping.get('viewOrder')
						),
						'get',
						'caption'
					)
				)
			);
		});

	return <React.StrictMode>
		<ErrorBoundary>{
			(
				typeof upload_plan === "undefined" ||
				typeof headers === "undefined" ||
				!schema_loaded
			) &&
			<LoadingScreen/> ||
			<WBPlanView
				{...props}
				upload_plan={upload_plan!}
				headers={headers!}
			/>
		}</ErrorBoundary>
	</React.StrictMode>;
},'WBPlanViewWrapper');