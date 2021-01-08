'use strict';

import React from 'react';
import '../../css/wbplanview.css';
import _ from 'underscore';
import navigation from '../navigation';
import {mappings_tree_to_upload_plan} from './wbplanviewconverter';
import * as cache from './wbplanviewcache';
import schema from '../schema';
import fetch_data_model from './wbplanviewmodelfetcher';
import WBPlanViewMapper, {
	get_lines_from_upload_plan,
	get_lines_from_headers,
	mapping_path_is_complete,
	get_mappings_tree,
	mutate_mapping_path,
	deduplicate_mappings,
	get_automapper_suggestions,
	get_mapped_fields,
} from './wbplanviewmapper';
import ErrorBoundary from './errorboundary';
import {ModalDialog, LoadingScreen} from './modaldialog';
import {show_required_missing_fields} from './wbplanviewmodelhelper';
import data_model_storage from './wbplanviewmodel';
import {ListOfBaseTables} from './wbplanviewcomponents';
import {generate_dispatch, generate_reducer} from './statemanagement';

let schema_fetched_promise = fetch_data_model();

const WBPlanViewHeaderLeftMappingElements = (props :WBPlanViewHeaderPropsMapping) => <>
	<button onClick={props.handleTableChange}>Change table</button>
	<button onClick={props.handleToggleMappingView}>Toggle Mapping View</button>
</>;
const WBPlanViewHeaderRightMappingElements = (props :WBPlanViewHeaderPropsMapping) => <>
	<label>
		<input
			type="checkbox"
			checked={props.mapping_is_templated}
			onChange={props.handleToggleMappingIsTemplated}
		/>
		Use this mapping as a template
	</label>
	<button onClick={props.handleClearMapping}>Clear Mappings</button>
	<button onClick={props.handleValidation}>Validate</button>
	<button onClick={props.handleSave}>Save</button>
	<button onClick={props.handleCancel}>Cancel</button>
</>;
const WBPlanViewHeaderRightNonMappingElements = (props :WBPlanViewHeaderPropsNonMapping) =>
	<>
		<button onClick={props.handleUseTemplate}>Use template</button>
		<button onClick={props.handleCancel}>Cancel</button>
	</>;
const WBPlanViewHeader = React.memo((props :WBPlanViewHeaderProps) => <div id="wbplanview_header">
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
	</div>,
	(previous_props :WBPlanViewHeaderProps, new_props :WBPlanViewHeaderProps) =>
		previous_props.title === new_props.title &&
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

const HeaderWrapper = (props :HeaderWrapperProps) =>
	<>
		{props.header}
		<div id="wbplanview_container" className={props.state_name}>
			{props.children}
		</div>
	</>;

function go_back(props :partialWBPlanViewProps):LoadingState {
	navigation.go(`/workbench/${props.wb.id}/`);
	props.handleUnload();
	return {
		type: 'LoadingState',
	}
}

function save_plan(props :publicWBPlanViewProps, state:MappingState, ignore_validation = false) {
	const validation_results_state = validate(state);
	if (!ignore_validation && validation_results_state.validation_results.length !== 0)
		return validation_results_state;

	props.wb.set('ownerPermissionLevel', props.mappingIsTemplated ? 1 : 0);
	props.wbtemplatePromise.done(wbtemplate =>
		wbtemplate.set('remarks', mappings_tree_to_upload_plan(state.base_table_name, get_mappings_tree.bind(null,state.lines))),
	);
	props.wb.save();
	return go_back(props);
}

/* Validates the current mapping and shows error messages if needed */
function validate(state:MappingState):MappingState {

	if (state.type !== 'MappingState')
		throw new Error('Validation can only be done from the Mapper State');

	return {
		...state,
		type: 'MappingState',
		show_mapping_view:  // Show mapping view panel if there were validation errors
			state.show_mapping_view ||
			Object.values(state.validation_results).length !== 0,
		validation_results: show_required_missing_fields(
			state.base_table_name,
			get_mappings_tree(state.lines),
		),
	};

}

const mapping_state = (state:WBPlanViewStates):MappingState=>{
	if(state.type !== 'MappingState')
		throw new Error('Dispatching this action requires the state to be of type `MappingState`');
	else
		return state;
};

const reducer = generate_reducer<WBPlanViewStates,WBPlanViewActions>({

	//BaseTableSelectionState
	'OpenBaseTableSelectionAction': ()=>({
		type: 'BaseTableSelectionState'
	}),
	'SelectTableAction': (_state,action)=>({
		type: 'MappingState',
		mapping_is_templated: action.mappingIsTemplated,
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
	'UseTemplateAction': ()=>({
		type: 'LoadingState',
		loading_state: {
			type: 'LoadTemplateSelectionState',
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
			mapping_is_templated: action.mappingIsTemplated,
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
		save_plan(action, mapping_state(state),typeof action.ignore_validation !== "undefined"),
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
			lines: [],
			validation_results: [],
	}),
	'ClearMappingLineAction': (state,action)=>({
		...mapping_state(state),
		lines: [
			...mapping_state(state).lines.slice(0, action.line_index),
			...mapping_state(state).lines.slice(action.line_index + 1),
		],
	}),
	'FocusLineAction': (state,action)=> {
		if (action.line_index > mapping_state(state).lines.length)
			throw new Error('Tried to focus a line that doesn\'t exist');

		const focused_line_mapping_path = mapping_state(state).lines[action.line_index].mapping_path;
		return {
			...mapping_state(state),
			focused_line: action.line_index,
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
		]
	}),
	'AddNewStaticHeaderAction': (state)=>({
		...mapping_state(state),
		lines: [
			...mapping_state(state).lines,
			{
				name: '',
				type: 'new_static_column',
				mapping_path: ["0"],
			}
		]
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
		},
		automapper_suggestions_promise: get_automapper_suggestions({
			lines: mapping_state(state).lines,
			line: action.line,
			index: action.index,
			base_table_name: mapping_state(state).base_table_name,
			get_mapped_fields: get_mapped_fields.bind(null,mapping_state(state).lines),
		})
	}),
	'CloseSelectElementAction': state=>({
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
		});

		if (action.line === 'mapping_view')
			return {
				...mapping_state(state),
				mapping_view: new_mapping_path
			}

		return {
			...mapping_state(state),
			lines: deduplicate_mappings([
				...mapping_state(state).lines.slice(0, action.line),
				{
					...mapping_state(state).lines[action.line],
					mapping_path: new_mapping_path,
				},
				...mapping_state(state).lines.slice(action.line + 1),
			])
		}
	},
	'AutomapperSuggestionsLoadedAction': (state,action)=>({
		...mapping_state(state),
		automapper_suggestions: action.automapper_suggestions,
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
			).then((wbts :any) => {

				const templates :upload_plan_template[] = [];

				for (const wbt of wbts) {
					let upload_plan;
					try {
						upload_plan = JSON.parse(wbt.get('remarks') as string);
					} catch (e) {
						continue;
					}

					if (
						typeof upload_plan === 'object' &&
						upload_plan !== null
					)
						templates.push({
							dataset_name: wbt.get('name') as string,
							upload_plan: upload_plan,
						});
				}

				state.dispatch_action!({
					type: 'TemplatesLoadedAction',
					templates: templates,
				});
			}),
		);
	}
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
				handleCancel={() => state.dispatch({type: 'CancelMappingAction', wb:state.props.wb, handleUnload:state.props.handleUnload})}
				handleUseTemplate={() => state.dispatch({type: 'UseTemplateAction'})}
			/>
		}>
		<ListOfBaseTables
			list_of_tables={data_model_storage.list_of_base_tables}
			handleChange={((table_name: string) => state.dispatch({type:'SelectTableAction', table_name, mappingIsTemplated:state.props.mappingIsTemplated, headers:state.props.headers}))}
		/>
	</HeaderWrapper>,
	'TemplateSelectionState': (_,state) =>
		<ModalDialog
			properties={{title: 'Select Template'}}
			onCloseCallback={()=>state.dispatch({
				type:'OpenBaseTableSelectionAction',
			})}
		>{

			state.templates.map(template => (
					{
						...template,
						upload_plan: upload_plan_string_to_object(template.upload_plan),
					}
				),
			).filter(({upload_plan}) =>
				upload_plan !== false,
			).map(({dataset_name, upload_plan}) =>
				<a
					key={dataset_name}
					href={`#${dataset_name}`}
					onClick={() => state.dispatch({
						type: 'OpenMappingScreenAction',
						upload_plan,
						mappingIsTemplated: state.props.mappingIsTemplated,
						headers: state.props.headers
					})}>{dataset_name}</a>,
			)

		}</ModalDialog>,
	'MappingState': (_,state) =>{
		if(typeof state.automapper_suggestions_promise !== "undefined")
			state.automapper_suggestions_promise.then(mapping_element_props=>
				state.dispatch({
					type: 'AutomapperSuggestionsLoadedAction',
					automapper_suggestions: mapping_element_props,
				})
			);
		const handleSave = () => state.dispatch({type: 'SavePlanAction',wb:state.props.wb, handleUnload:state.props.handleUnload, wbtemplatePromise:state.props.wbtemplatePromise, mappingIsTemplated:state.props.mappingIsTemplated})
		return <HeaderWrapper
			state_name={state.type}
			header={
				<WBPlanViewHeader
					title={data_model_storage.tables[state.base_table_name].table_friendly_name}
					state_type={state.type}
					handleCancel={() => state.dispatch({type: 'CancelMappingAction',wb:state.props.wb, handleUnload:state.props.handleUnload})}
					handleTableChange={() => state.dispatch({type: 'OpenBaseTableSelectionAction'})}
					handleToggleMappingView={() => state.dispatch({type: 'ToggleMappingViewAction'})}
					handleToggleMappingIsTemplated={() => state.dispatch({type: 'ToggleMappingIsTemplatedAction'})}
					handleClearMapping={() => state.dispatch({type: 'ResetMappingsAction'})}
					handleValidation={() => state.dispatch({type: 'ValidationAction'})}
					handleSave={handleSave}
					mapping_is_templated={state.mapping_is_templated}
				/>
			}>
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
				handleSave={handleSave}
				handleFocus={(line_index:number)=>state.dispatch({type:'FocusLineAction', line_index:line_index})}
				handleMappingViewMap={()=>state.dispatch({type:'MappingViewMapAction'})}
				handleAddNewHeader={()=>state.dispatch({type:'AddNewHeaderAction'})}
				handleAddNewStaticHeader={()=>state.dispatch({type:'AddNewStaticHeaderAction'})}
				handleToggleHiddenFields={()=>state.dispatch({type:'ToggleHiddenFieldsAction'})}
				handleOpen={(line:number, index:number)=>state.dispatch({type:'OpenSelectElementAction', line, index})}
				handleClose={(line:number, index:number)=>state.dispatch({type:'CloseSelectElementAction', line, index})}
				handleChange={(line:'mapping_view'|number, index:number, value:string)=>state.dispatch({type:'ChangeSelectElementValueAction', line, index, value})}
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
			mappingIsTemplated:props.mappingIsTemplated
		} as OpenMappingScreenAction,
		getInitialWBPlanViewState
	);

	return state_reducer(<i />,{
		...state,
		props,
		dispatch
	});

}

export default function(props:publicWBPlanViewProps):react_element {

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
}