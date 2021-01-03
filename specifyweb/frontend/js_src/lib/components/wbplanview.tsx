'use strict';

import React from 'react';
import '../../css/wbplanview.css';
import _ from 'underscore';
import navigation from '../navigation';
import upload_plan_converter from './upload_plan_converter';
import cache from './cache';
import schema from '../schema';
import fetch_data_model from './wbplanviewdatamodelfetcher';
import {assertExhaustive} from './statemanagement';
import WBPlanViewMapper, {
	get_lines_from_upload_plan,
	get_lines_from_headers,
	mapping_path_is_complete,
	get_mappings_tree,
} from './wbplanviewmapper';
import {ErrorBoundary} from './errorboundary';
import {ModalDialog, LoadingScreen} from './modaldialog';
import data_model_helper from './data_model_helper';
import data_model_storage from './data_model_storage';
import createContext from './contextcreator';
import {ListOfBaseTables} from './wbplanviewcomponents';

let schema_fetched_promise = fetch_data_model();

const [useHeaders, HeadersProvider] = createContext<string[]>('headers');
const [useUploadPlan, UploadPlanProvider] = createContext<falsy_upload_plan>('upload_plan');


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
</>;
const WBPlanViewHeaderRightNonMappingElements = (props :WBPlanViewHeaderPropsNonMapping) =>
	<>
		<button onClick={props.handleUseTemplate}>Use template</button>
		<button onClick={props.handleCancel}>Cancel</button>
	</>;
const WBPlanViewHeader = React.memo((props :WBPlanViewHeaderProps) => <div id="wbplanview_header">
		<div id="wbplanview_table_header">
			<span>{props.title}</span>
			{props.state_type === 'MappingState' && WBPlanViewHeaderLeftMappingElements(props)}
		</div>
		<div id="wbplanview_mapping_header">
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

const getInitialWBPlanViewState = (upload_plan:falsy_upload_plan):WBPlanViewStates => {
	if (upload_plan === false) {
		return {
			type: 'LoadingState',
			dispatch: {
				type: 'OpenBaseTableSelectionAction'
			}
		};
	}
	else
		return{
			type: 'LoadingState',
			dispatch: {
				type: 'OpenMappingScreenAction'
			}
		};
}

const HeaderWrapper = (props :HeaderWrapperProps) =>
	<>
		{props.header}
		<div id="wbplanview_container">
			{props.children}
		</div>
	</>;

function go_back(props :WBPlanViewProps):LoadingState {
	navigation.go(`/workbench/${props.wb.id}/`);
	props.handleUnload();
	return {
		type: 'LoadingState',
	}
}

function save_plan(props :WBPlanViewProps, state:MappingState, ignore_validation = false) {
	const validation_results_state = validate(state);
	if (!ignore_validation && validation_results_state.validation_results.length !== 0)
		return validation_results_state;

	props.wb.set('ownerPermissionLevel', props.mappingIsTemplated ? 1 : 0);
	props.wbtemplatePromise.done(wbtemplate =>
		wbtemplate.set('remarks', upload_plan_converter.get_upload_plan()),
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
		validation_results: data_model_helper.show_required_missing_fields(
			state.base_table_name,
			get_mappings_tree(state.lines),
		),
	};

}

const reducer = (props :WBPlanViewProps, state:WBPlanViewStates, action :WBPlanViewActions):WBPlanViewStates => {

	const headers = useHeaders();
	const upload_plan = useUploadPlan();
	const mapping_state = ():MappingState=>{
		if(state.type !== 'MappingState')
			throw new Error(`${action.type} can only be dispatched from 'MappingState'`);
		else
			return state;
	};

	switch (action.type) {

		//BaseTableSelectionState
		case 'OpenBaseTableSelectionAction':
			return {
				type: 'BaseTableSelectionState'
			}

		case 'SelectTableAction':
			return {
				...state,
				type: 'MappingState',
				mapping_is_templated: props.mappingIsTemplated,
				show_hidden_fields: cache.get('ui', 'show_hidden_fields'),
				show_mapping_view: cache.get('ui', 'show_mapping_view'),
				base_table_name: action.table_name,
				lines: get_lines_from_headers(headers,true),
				mapping_view: [],
				validation_results: [],
				new_header_id: 1,
			};
		case 'UseTemplateAction':
			return {
				type: 'LoadingState',
				loading_state: {
					type: 'LoadTemplateSelectionState',
				},
			};

		//TemplateSelectionState
		case 'TemplatesLoadedAction':
			return {
				type: 'TemplateSelectionState',
				templates: action.templates,
			}
		case 'CancelTemplateSelectionAction':
			return {
				type: 'BaseTableSelectionState',
			};

		//common
		case 'CancelMappingAction':
			return go_back(props);

		//mapping state
		case 'OpenMappingScreenAction':
			if(upload_plan === false)
				throw new Error('Upload plan is not defined');

			const {
				base_table_name,
				lines,
			} = get_lines_from_upload_plan(
				headers,
				upload_plan,
			);
			return {
				...state,
				type: 'MappingState',
				mapping_is_templated: props.mappingIsTemplated,
				show_hidden_fields: cache.get('ui', 'show_hidden_fields'),
				show_mapping_view: cache.get('ui', 'show_mapping_view'),
				mapping_view: [],
				validation_results: [],
				new_header_id: 1,
				base_table_name,
				lines,
			};

		case 'SavePlanAction':
			return save_plan(props, mapping_state(),typeof action.ignore_validation !== "undefined");

		case 'ToggleMappingViewAction':
			return {
				...mapping_state(),
				show_mapping_view: !mapping_state().show_mapping_view,
			};

		case 'ToggleMappingIsTemplatedAction':
			return {
				...mapping_state(),
				mapping_is_templated: !mapping_state().mapping_is_templated,
			};

		case 'ValidationAction':
			return validate(mapping_state());

		case 'ResetMappingsAction':
			return {
				...mapping_state(),
				lines: [],
				validation_results: [],
			};

		case 'ClearMappingLineAction':
			return {
				...mapping_state(),
				lines: [
					...mapping_state().lines.slice(0, action.line_index),
					...mapping_state().lines.slice(action.line_index + 1),
				],
			};

		case 'FocusLineAction':

			if(action.line_index > mapping_state().lines.length)
				throw new Error('Tried to focus a line that doesn\'t exist');

			const focused_line_mapping_path = mapping_state().lines[action.line_index].mapping_path;
			return {
				...mapping_state(),
				focused_line: action.line_index,
				mapping_view: mapping_path_is_complete(focused_line_mapping_path) ?
					focused_line_mapping_path :
					mapping_state().mapping_view,
			}

		case 'MappingViewMapAction':
			const mapping_view_mapping_path = mapping_state().mapping_view;
			const focused_line = mapping_state().focused_line;
			if(
				!mapping_path_is_complete(mapping_view_mapping_path) ||
				typeof focused_line === "undefined" ||
				focused_line! >= mapping_state().lines.length
			)
				return state;

			return {
				...mapping_state(),
				lines: [
					...mapping_state().lines.slice(0,focused_line),
					{
						...mapping_state().lines[focused_line],
						mapping_path: mapping_view_mapping_path,
					},
					...mapping_state().lines.slice(focused_line+1),
				]
			};

		case 'MappingViewChangeAction':
			//TODO: finish this

		case 'AddNewHeaderAction':
			return {
				...mapping_state(),
				new_header_id: mapping_state().new_header_id+1,
				lines: [
					...mapping_state().lines,
					{
						name: `New Header ${mapping_state().new_header_id}`,
						type: 'new_column',
						mapping_path: [],
					}
				]
			}

		case 'AddNewStaticHeaderAction':
			return {
				...mapping_state(),
				lines: [
					...mapping_state().lines,
					{
						name: ``,
						type: 'new_static_column',
						mapping_path: [],
					}
				]
			}

		case 'ToggleHiddenFieldsAction':
			return {
				...mapping_state(),
				show_hidden_fields: !mapping_state().show_hidden_fields,
			}

		default:
			assertExhaustive(action);
	}
};

function WBPlanView(props :WBPlanViewProps) {

	const upload_plan = useUploadPlan();

	const [state, dispatch]:[WBPlanViewStates,(action:WBPlanViewActions)=>void] = React.useReducer(reducer.bind(null,props), upload_plan, getInitialWBPlanViewState);
	const mapper_dispatch = (action :MappingActions)=>
		dispatch(action);

	switch (state.type) {
		case 'LoadingState':
			if(typeof state.loading_state !== "undefined")
				Promise.resolve('').then(() =>{
					switch(state.loading_state!.type){
						case 'LoadTemplateSelectionState':
							Promise.resolve('').then(() => {
								const wbs = new (
									schema as any
								).models.Workbench.LazyCollection({
									filters: {orderby: 'name', ownerpermissionlevel: 1},
								});
								wbs.fetch({limit: 5000}).done((wbs :any) =>
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

										dispatch({
											type: 'TemplatesLoadedAction',
											templates: templates,
										});
									}),
								);
							});
							break;
						default:
							assertExhaustive(state.loading_state as never);//TODO: remove this
					}
				});
			if (typeof state.dispatch !== "undefined")
				dispatch(state.dispatch);
			return <LoadingScreen/>;
		case 'BaseTableSelectionState':
			return <HeaderWrapper
				header={
					<WBPlanViewHeader
						title='Select Base Table'
						state_type={state.type}
						handleCancel={() => dispatch({type: 'CancelMappingAction'})}
						handleUseTemplate={() => dispatch({type: 'UseTemplateAction'})}
					/>
				}>
				<ListOfBaseTables
					list_of_tables={data_model_storage.list_of_base_tables}
					handleChange={((table_name: string) => dispatch({type:'SelectTableAction', table_name:table_name}))}
				/>
			</HeaderWrapper>;
		case 'TemplateSelectionState':
			return <ModalDialog properties={{title: 'Select Template'}}>{

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
						onClick={() => mapper_dispatch({
							type: 'OpenMappingScreenAction',
							//@ts-ignore
							upload_plan,
						})}>{dataset_name}</a>,
				)

			}</ModalDialog>;
		case 'MappingState':
			return <HeaderWrapper
				header={
					<WBPlanViewHeader
						title={data_model_storage.tables[state.base_table_name].table_friendly_name}
						state_type={state.type}
						handleCancel={() => dispatch({type: 'CancelMappingAction'})}
						handleTableChange={() => dispatch({type: 'OpenBaseTableSelectionAction'})}
						handleToggleMappingView={() => mapper_dispatch({type: 'ToggleMappingViewAction'})}
						handleToggleMappingIsTemplated={() => mapper_dispatch({type: 'ToggleMappingIsTemplatedAction'})}
						handleClearMapping={() => mapper_dispatch({type: 'ResetMappingsAction'})}
						handleValidation={() => mapper_dispatch({type: 'ValidationAction'})}
						handleSave={() => mapper_dispatch({type: 'SavePlanAction'})}
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
					mapper_dispatch={mapper_dispatch}
					handleSave={()=>mapper_dispatch({type:'SavePlanAction', ignore_validation:true})}
					handleFocus={(line_index:number)=>mapper_dispatch({type:'FocusLineAction', line_index:line_index})}
					handleMappingViewMap={()=>mapper_dispatch({type:'MappingViewMapAction'})}
					handleMappingViewChange={()=>mapper_dispatch({type:'MappingViewChangeAction'})}
					handleAddNewHeader={()=>mapper_dispatch({type:'AddNewHeaderAction'})}
					handleAddNewStaticHeader={()=>mapper_dispatch({type:'AddNewStaticHeaderAction'})}
					handleToggleHiddenFields={()=>mapper_dispatch({type:'ToggleHiddenFieldsAction'})}
				/>
			</HeaderWrapper>;
		default:
			return assertExhaustive(state);
	}
}

export default function(props:publicWBPlanViewProps){

	const [schema_loaded,setSchemaLoaded] = React.useState<boolean>(false);
	const [upload_plan,setUploadPlan] = React.useState<falsy_upload_plan>();
	const [headers,setHeaders] = React.useState<string[]>();

	if(typeof data_model_storage.tables === "undefined")
		schema_fetched_promise.then(schema=>{
			data_model_storage.tables = schema.tables;
			data_model_storage.list_of_base_tables = schema.list_of_base_tables;
			data_model_storage.ranks = schema.ranks;
			setSchemaLoaded(true);
		});

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
			<HeadersProvider value={headers}>
				<UploadPlanProvider value={upload_plan}>
					<WBPlanView
						{...props}
					/>
				</UploadPlanProvider>
			</HeadersProvider>
		}</ErrorBoundary>
	</React.StrictMode>;
}