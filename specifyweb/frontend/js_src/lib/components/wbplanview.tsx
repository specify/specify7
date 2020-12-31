"use strict";

import React from "react";
import "../css/wbplanview.css";
import _ from 'underscore';
import navigation from '../navigation';
import mappings_main from '../wb_upload/main';
import upload_plan_converter from '../wb_upload/upload_plan_converter';
import cache from '../wb_upload/cache';
import schema from '../schema';
import data_model_fetcher from '../wb_upload/data_model_fetcher';
import {assertExhaustive} from './statemanagement';
import mappings from '../wb_upload/mappings';
import {ErrorBoundary} from './errorboundary';
import {ModalDialog, LoadingScreen} from './modaldialog';


const WBPlanViewHeaderLeftMappingElements = (props:WBPlanViewHeaderPropsMapping)=><>
	<button onClick={props.handleTableChange}>Change table</button>
	<button onClick={props.handleToggleMappingView}>Toggle Mapping View</button>
</>;
const WBPlanViewHeaderRightMappingElements = (props:WBPlanViewHeaderPropsMapping)=><>
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
const WBPlanViewHeaderRightNonMappingElements = (props:WBPlanViewHeaderPropsNonMapping)=>
	<>
		<button onClick={props.handleUseTemplate}>Use template</button>
		<button onClick={props.handleCancel}>Cancel</button>
	</>;
const WBPlanViewHeader = React.memo((props:WBPlanViewHeaderProps)=><div id="wbplanview_header">
		<div id="wbplanview_table_header">
			<span>{props.title}</span>
			{props.state_type==='MappingState' && WBPlanViewHeaderLeftMappingElements(props)}
		</div>
		<div id="wbplanview_mapping_header">
			{
				props.state_type==='MappingState' ?
					WBPlanViewHeaderRightMappingElements(props) :
					WBPlanViewHeaderRightNonMappingElements(props)
			}
		</div>
	</div>,
	(previous_props:WBPlanViewHeaderProps, new_props:WBPlanViewHeaderProps)=>
		previous_props.title === new_props.title &&
		previous_props.state_type === new_props.state_type
);


const initialWBPlanViewState:InitialLoadingState = {
	type: 'InitialLoadingState',
	headers: undefined!,
	upload_plan: undefined!,
	schema: undefined!,
};

const RenderWrapper = (props:RenderWrapperProps)=>
	<React.StrictMode>
		<ErrorBoundary>
			{props.children}
		</ErrorBoundary>
	</React.StrictMode>;

const HeaderWrapper = (props:HeaderWrapperProps)=>
	<RenderWrapper>
		{props.header}
		<div id="wbplanview_container">
			{props.children}
		</div>
	</RenderWrapper>;

export default function WBPlanView(props:WBPlanViewProps) {

	const reference = React.useRef({});
	const [state, setState] = React.useState<WBPlanViewStates>(initialWBPlanViewState);

	function go_back(){
        navigation.removeUnloadProtect(reference);
        navigation.go(`/workbench/${props.wb.id}/`);
        props.handleUnload();
    }
	function save_plan(ignore_validation=false) {
        if(!ignore_validation && typeof mappings_main.validate() !== "boolean")
            return;

        props.wb.set('ownerPermissionLevel',props.mappingIsTemplated?1:0);
        props.wbtemplatePromise.done(wbtemplate=>
            wbtemplate.set('remarks', upload_plan_converter.get_upload_plan())
        );
        props.wb.save();
        go_back();
    }
    function upload_plan_string_to_object(upload_plan_string:string):falsy_upload_plan {
		let upload_plan;

		try {
			upload_plan = JSON.parse(upload_plan_string);
		} catch (exception) {

			if(!(exception instanceof SyntaxError))//only catch JSON parse errors
				throw exception;

			upload_plan = false;

		}

		if(typeof upload_plan !== "object" || upload_plan === null || typeof upload_plan['baseTableName'] === "undefined")
			return false;
		else
			return upload_plan;
	}

	const dispatch = (action:WBPlanViewActions)=>{
		const mapping_state = state as MappingState;
		const base_state:BaseProperties = {
			upload_plan: state.upload_plan,
			headers: state.headers,
			schema: state.schema,
		}
		switch(action.type){

			//InitialLoadingState
			case 'HeadersLoadedAction':
				setState({
					...state,
					headers: action.headers
				});
				break;
			case 'UploadPlanLoadedAction':
				setState({
					...state,
					upload_plan: action.upload_plan
				});
				break;
			case 'SchemaLoadedAction':
				setState({
					...state,
					schema: action.schema
				});
				break;

			//BaseTableSelectionState
			case 'SelectTableAction':
				setState({
					...state,
					type: 'MappingState',
					mapping_is_templated: props.mappingIsTemplated,
					show_hidden_fields: cache.get('ui','show_hidden_fields'),
					show_mapping_view: cache.get('ui','show_mapping_view'),
					base_table_name: action.table_name,
					lines: mappings.get_lines_from_headers(state.headers),
					mapping_view: [],
					validation_results: [],
				});
				break;
			case 'UseTemplateAction':
				setState({
					type: 'LoadingState',
					...base_state,
					dispatch: {
						type: 'LoadTemplateSelectionAction'
					},
				});
				break;

			//TemplateSelectionState
			case 'LoadTemplateSelectionAction':
				Promise.resolve('').then(()=>{
					const wbs = new (schema as any).models.Workbench.LazyCollection({
						filters: { orderby: 'name', ownerpermissionlevel:1 }
					});
					wbs.fetch({ limit: 5000 }).done((wbs:any)=>
						Promise.all(
							wbs.models.map((wb:any)=>
								wb.rget('workbenchtemplate')
							)
						).then((wbts:any)=> {

							const templates :upload_plan_template[] = [];

							for (const wbt of wbts) {
								let upload_plan;
								try {
									upload_plan = JSON.parse(wbt.get('remarks') as string)
								} catch (e) {
									continue;
								}

								if (
									typeof upload_plan === "object" &&
									upload_plan !== null
								)
									templates.push({
										dataset_name: wbt.get('name') as string,
										upload_plan: upload_plan,
									});
							}

							setState({
								...base_state,
								type: 'TemplateSelectionState',
								templates: templates
							});
						})
					)
				});
				break;
			case 'CancelTemplateSelectionAction':
				setState({
					...base_state,
					type: 'BaseTableSelectionState',
				})
				break;

			//MappingState
			case 'OpenMappingScreenAction':
				const {
					base_table_name,
					lines
				} = mappings.get_lines_from_upload_plan(
					state.headers,
					mappings.get_lines_from_headers(state.headers),
					action.upload_plan
				);
				setState({
					...state,
					type: 'MappingState',
					mapping_is_templated: props.mappingIsTemplated,
					show_hidden_fields: cache.get('ui','show_hidden_fields'),
					show_mapping_view: cache.get('ui','show_mapping_view'),
					mapping_view: [],
					validation_results: [],
					base_table_name,
					lines,
				});
				break;

			case 'SavePlanAction':
				save_plan();
				break;

			case 'ToggleMappingViewAction':
				setState({
					...mapping_state,
					show_mapping_view: !mapping_state.show_mapping_view,
				});
				break;

			case 'ToggleMappingIsTemplatedAction':
				setState({
					...mapping_state,
					mapping_is_templated: !mapping_state.mapping_is_templated,
				});
				break;

			case 'ValidationAction':
				//TODO: validate
				break;

			case 'SaveAction':
				//TODO: save and exit
				break;

			case 'TableChangeAction':
				setState({
					...base_state,
					type: 'BaseTableSelectionState',
				});
				break;

			case 'ClearMappingAction':
				setState({
					...mapping_state,
					lines: [],
					validation_results: [],
				});
				break;

			//common
			case 'CancelMappingAction':
				go_back();
				break;

			default:
				assertExhaustive(action);
		}

		if(
			state.type==='InitialLoadingState' &&
			typeof state.upload_plan !== "undefined" &&
			typeof state.headers !== "undefined" &&
			typeof state.schema !== "undefined"
		){

			if(state.upload_plan === false){
				setState({
					...state,
					type: 'BaseTableSelectionState'
				});
			}
			else
				dispatch({
					type: 'OpenMappingScreenAction',
					upload_plan: state.upload_plan,
				})
		}
	};

	switch(state.type){
		case 'InitialLoadingState':
			if(
				typeof state.upload_plan === "undefined" ||
				typeof state.headers === "undefined"
			)
				props.wbtemplatePromise.done(wbtemplate => {
					dispatch({
						type: 'UploadPlanLoadedAction',
						upload_plan: upload_plan_string_to_object(wbtemplate.get('remarks'))
					});

					wbtemplate.rget('workbenchtemplatemappingitems').done(mappings => {
						const sorted = mappings.sortBy( (mapping: { get: (arg0: string) => any; }) => mapping.get('viewOrder'));
						const headers = _.invoke(sorted, 'get', 'caption');

						dispatch({
							type: 'HeadersLoadedAction',
							headers
						});

					});
				});
			if(typeof state.schema === "undefined")
				data_model_fetcher.fetch().then(schema=>
					dispatch({
						type: 'SchemaLoadedAction',
						schema: schema,
					})
				);
			return <RenderWrapper>
				<LoadingScreen />
			</RenderWrapper>;
		case 'LoadingState':
			Promise.resolve('').then(()=>
				dispatch(state.dispatch)
			);
			return <RenderWrapper>
				<LoadingScreen />
			</RenderWrapper>;
		case 'BaseTableSelectionState': /* TODO: finish this */
			return <HeaderWrapper
				header={
					<WBPlanViewHeader
						title='Select Base Table'
						state_type={state.type}
						handleCancel={()=>dispatch({type: 'CancelMappingAction'})}
						handleUseTemplate={()=>dispatch({type: 'UseTemplateAction'})}
					/>
				}>
				<h1>Qwerty</h1>
			</HeaderWrapper>
		case 'TemplateSelectionState':
			return <RenderWrapper>
				<ModalDialog properties={{title: "Select Template"}}>
					<>
						{
							state.templates.map(template=>(
								{
									...template,
									upload_plan: upload_plan_string_to_object(template.upload_plan)
								})
							).filter(({upload_plan})=>
								upload_plan !== false
							).map(({dataset_name, upload_plan}) =>
								<a
									key={dataset_name}
									href={`#${dataset_name}`}
									onClick={() =>dispatch({
									type: 'OpenMappingScreenAction',
									//@ts-ignore
									upload_plan
								})}>{dataset_name}</a>
							)
						}
					</>
				</ModalDialog>
			</RenderWrapper>
		case 'MappingState':
			return <HeaderWrapper
				header={
					<WBPlanViewHeader
						title={state.base_table_name}
						state_type={state.type}
						handleCancel={()=>dispatch({type: 'CancelMappingAction'})}
						handleTableChange={()=>dispatch({type: 'TableChangeAction'})}
						handleToggleMappingView={()=>dispatch({type: 'ToggleMappingViewAction'})}
						handleToggleMappingIsTemplated={()=>dispatch({type: 'ToggleMappingIsTemplatedAction'})}
						handleClearMapping={()=>dispatch({type: 'ClearMappingAction'})}
						handleValidation={()=>dispatch({type: 'ValidationAction'})}
						handleSave={()=>dispatch({type: 'SaveAction'})}
						mapping_is_templated={state.mapping_is_templated}
					/>
				}>
				<div id="mapping_view_parent">
					<div id="mapping_view_container">
						<div id="validation_results" />
						<div id="mapping_view" />
						<button>Map</button>
					</div>
				</div>

				<div id="list__mappings" />

				<div id="mappings_control_panel">

					<button>Add new column</button>
					<button>Add new static column</button>

					<label>
						<input type="checkbox" />
						Reveal hidden fields
					</label>

				</div>
			</HeaderWrapper>
		default:
			return assertExhaustive(state);
	}
}

/*

add_new_column.addEventListener('click',
				mappings.add_new_mapping_line.bind(
					mappings,
					{
						header_data: {
							header_name: '',
							mapping_type: 'new_column'
						},
						blind_add_back: true,
						scroll_down: true,
					}
				)
			);

			add_new_static_column.addEventListener('click',
				mappings.add_new_mapping_line.bind(
					mappings,
					{
						header_data: {
							header_name: '',
							mapping_type: 'new_static_column'
						},
						blind_add_back: true,
						scroll_down: true,
					}
				)
			);

	/* Validates the current mapping and shows error messages if needed *!/
	public static validate() :boolean | string  /* true if everything is fine or {string} formatted validation error message *!/ {

		const validation_results = data_model_helper.show_required_missing_fields(data_model_storage.base_table_name, mappings.get_mappings_tree());
		const formatted_validation_results = mappings.format_validation_results(validation_results);

		if (formatted_validation_results === false)
			return true;

		const div = document.createElement('div');
		div.innerHTML = formatted_validation_results;

		$(div).dialog({
			modal: true,
			title: 'Unmapped required fields detected',
			close: function () :void {
				$(this).remove();
			},
			width: 500,
			buttons: [
				{
					text: 'Return to mapping headers', click: function () :void {
						$(this).dialog('close');
					},
				},
				{
					text: 'Save unfinished mapping',
					click: main.save_plan.bind(main,undefined, true)
				}
			]
		});


		return validation_results;

	};

* */