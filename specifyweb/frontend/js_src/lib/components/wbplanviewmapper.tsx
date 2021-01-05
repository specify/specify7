'use strict';

import tree_helpers from './tree_helpers';
import helper from './helper';
import {MappingLine, MappingPath} from './wbplanviewcomponents';
import data_model_helper from './data_model_helper';
import data_model_navigator from './data_model_navigator';
import automapper from './automapper';
import upload_plan_converter from './upload_plan_converter';
import React from 'react';

const max_suggestions_count :number = 3;  // the maximum number of suggestions to show in the suggestions box

const MappingsControlPanel = React.memo(({show_hidden_fields, onChange}:MappingsControlPanelProps)=>
	<div id="mappings_control_panel">
		<button>Add new column</button>
		<button>Add new static column</button>
		<label>
			<input type="checkbox" checked={show_hidden_fields} onChange={onChange}/>
			Reveal hidden fields
		</label>
	</div>
);


function FormatValidationResults(props:FormatValidationResultsProps){
	if (props.validation_results.length === 0)
		return null;

	return <div id="validation_results">
		<span>The following fields should be mapped before you are able to upload the dataset:</span>
		{props.validation_results.map(field_path =>
			<div className="wbplanview_mappings_line_elements">
				<MappingPath
					mappings_line_data={data_model_navigator.get_mapping_line_data_from_mapping_path({
						base_table_name: props.base_table_name,
						mapping_path: field_path,
						use_cached: true,
						generate_last_relationship_data: false,
						custom_select_type: 'preview_list',
						get_mapped_fields: props.get_mapped_fields,
					})}
				/>
			</div>,
		)}
		<span>Or you can <button onClick={props.handleSave}>Save Unfinished Mapping</button> and finish editing it later</span>
	</div>
}

export function get_lines_from_headers({
	headers = [],
	run_automapper,
	base_table_name = '',
}:get_lines_from_headers_params) :MappingLine[] {

	const lines = headers.map((header_name):MappingLine => (
		{
			mapping_path: ["0"],
			type: 'existing_header',
			name: header_name,
		}
	));

	if(!run_automapper || typeof base_table_name === "undefined")
		return lines;

	const automapper_results :automapper_results = (new automapper({
		headers: headers,
		base_table: base_table_name,
		scope: 'automapper',
		check_for_existing_mappings: false,
	})).map();

	return lines.map(line=>{
		const {name:header_name} = line;
		const automapper_mapping_paths = automapper_results[header_name];
		if(typeof automapper_mapping_paths !== "undefined")
			return {
				mapping_path: automapper_mapping_paths[0],
				type: 'existing_header',
				name: header_name,
			}
		else
			return line;
	});

}

export function get_lines_from_upload_plan(
	headers :list_of_headers = [],
	upload_plan :upload_plan,
) :get_lines_from_upload_plan {

	const lines = get_lines_from_headers({
		headers,
		run_automapper:false
	});
	const mappings_tree = upload_plan_converter.upload_plan_to_mappings_tree(headers, upload_plan);
	const array_of_mappings = tree_helpers.mappings_tree_to_array_of_mappings(mappings_tree);
	array_of_mappings.forEach(full_mapping_path => {
		const [mapping_path, mapping_type, header_name] = helper.deconstruct_mapping_path(full_mapping_path, true);
		const header_index = headers.indexOf(header_name);
		if (header_index !== -1)
			lines[header_index] = {
				mapping_path,
				type: mapping_type,
				name: header_name,
			};
	});

	return {
		base_table_name: upload_plan.baseTableName,
		lines,
	};

}

/* todo: REMOVE THIS? */
/* Returns array of mapping_paths */
const get_array_of_mappings = (
	lines: MappingLine[],
	include_headers :boolean = false,  // whether each mapping path should also have mapping type and header name at the end
	skip_empty :boolean = true,  // whether to skip incomplete mapping paths
) :mapping_path[] /* array of mapping paths */ =>
	lines.filter(({mapping_path})=>
		!skip_empty || mapping_path.length !== 0
	).map(({mapping_path, name, type})=>
		include_headers ?
			[...mapping_path,type,name] :
			[...mapping_path]
	);

/* Returns a mappings tree */
export const get_mappings_tree:get_mappings_tree = (
	lines,
	include_headers :boolean = false,
	skip_empty :boolean = true
) :mappings_tree /* mappings tree */ =>
	tree_helpers.array_of_mappings_to_mappings_tree(
		get_array_of_mappings(lines, include_headers, skip_empty),
		include_headers,
	);

/* Get a mappings tree branch given a particular starting mapping path */
export const get_mapped_fields:get_mapped_fields = (
	lines,
	mapping_path_filter,
	skip_empty=true
) :mappings_tree => {
	const mappings_tree = tree_helpers.traverse_tree(
		get_mappings_tree(lines, false, skip_empty),
		tree_helpers.array_to_tree([...mapping_path_filter]),
	);
	if(typeof mappings_tree === "undefined" || typeof mappings_tree === "string" || mappings_tree === false)
		return {};
	else
		return mappings_tree;
}

export const mapping_path_is_complete = (mapping_path:mapping_path)=>
	mapping_path[mapping_path.length-1]!=='0';

/* Unmap headers that have a duplicate mapping path */
export function deduplicate_mappings(
	lines: MappingLine[],
) :MappingLine[] {

	const array_of_mappings = get_array_of_mappings(lines,false, false);
	const duplicate_mapping_indexes = helper.find_duplicate_mappings(array_of_mappings, false);

	return lines.map((line,index)=>
		duplicate_mapping_indexes.indexOf(index) === -1 ?
			line :
			{
				...line,
				mapping_path: line.mapping_path.slice(0,-1)
			}
	);

}

/*
* Show automapper suggestion on top of an opened `closed_list`
* The automapper suggestions are shown only if the current box doesn't have a value selected
* */
export const get_automapper_suggestions = ({
	lines,
	line,
	index,
	base_table_name,
	get_mapped_fields
}:get_automapper_suggestions_parameters):Promise<MappingElementProps[][]> =>
	new Promise((resolve) => {

		const local_mapping_path = [...lines[line].mapping_path];

		if(  // don't show suggestions
			(  // if opened picklist has a value selected
				local_mapping_path.length-1!==index ||
				mapping_path_is_complete(local_mapping_path)
			) ||  // or if header is a new column / new static column
			lines[line].type !== 'existing_header'
		)
			return resolve([]);

		const mapping_line_data = data_model_navigator.get_mapping_line_data_from_mapping_path({
			base_table_name,
			mapping_path:local_mapping_path,
			iterate: false,
			custom_select_type: 'suggestion_list',
			get_mapped_fields: get_mapped_fields,
		});

		let path_offset = 0;
		if (data_model_helper.value_is_tree_rank(local_mapping_path[local_mapping_path.length-1])) {
			local_mapping_path.push('#1');
			path_offset = 1;
		}

		const all_automapper_results = Object.entries((new automapper({
			headers: [lines[line].name],
			base_table: base_table_name,
			starting_table: mapping_line_data[mapping_line_data.length - 1].table_name,
			path: local_mapping_path,
			path_offset,
			allow_multiple_mappings: true,
			check_for_existing_mappings: true,
			scope: 'suggestion',
			get_mapped_fields: get_mapped_fields,
		})).map({
			commit_to_cache: false,
		}));

		if (all_automapper_results.length === 0)
			return resolve([]);

		let automapper_results = all_automapper_results[0][1];

		if (automapper_results.length > max_suggestions_count)
			automapper_results = automapper_results.slice(0, 3);

		resolve(automapper_results.map(automapper_result =>
			data_model_navigator.get_mapping_line_data_from_mapping_path({
				base_table_name,
				mapping_path: automapper_result,
				use_cached: true,
				custom_select_type: 'suggestion_list',
				get_mapped_fields: get_mapped_fields,
				//TODO: add handleClick here to handle suggestion being selected
			}).slice(local_mapping_path.length - path_offset)
		));

	});

const MappingView = React.memo((props:MappingViewProps)=>
	<>
		<div id="mapping_view">
			<MappingPath
				mappings_line_data={data_model_navigator.get_mapping_line_data_from_mapping_path({
					base_table_name: props.base_table_name,
					mapping_path: props.mapping_path,
					use_cached: true,
					generate_last_relationship_data: false,
					custom_select_type: 'opened_list',
					handleChange: props.handleMappingViewChange,
					get_mapped_fields: props.get_mapped_fields,
				})}
			/>
		</div>
		<button
			id="wbplanview_mapping_view_map_button"
			disabled={!props.map_button_is_enabled}
			onClick={
				props.map_button_is_enabled ?
					props.handleMapButtonClick :
					undefined
			}
		>
			Map
			<span className="wbplanview_mapping_view_map_button_arrow">&#8594;</span>
		</button>
	</>
);

export function mutate_mapping_path({
	lines,
	mapping_view,
	line,
	index,
	value,
}:mutate_mapping_path_parameters):mapping_path {

	let mapping_path = [...(line==='mapping_view' ?
		mapping_view :
		lines[line].mapping_path
	)];

	if(data_model_helper.value_is_tree_rank(value) || data_model_helper.value_is_reference_item(value))
		mapping_path[index] = value;
	else
		mapping_path = [...mapping_path.slice(0,index),value];

	return mapping_path;

}

//TODO: detect click outside of the CustomSelectElement and close it in that case
//TODO: remember list scroll position and scroll down
//TODO: scroll list down when adding new column / new static column

export default function(props:WBPlanViewMapperProps) {
	const get_mapped_fields_bind = get_mapped_fields.bind(null,props.lines);

	return <>
		{props.show_mapping_view &&
			<div id="mapping_view_parent">
				<div id="mapping_view_container">
					<FormatValidationResults
						base_table_name={props.base_table_name}
						validation_results={props.validation_results}
						handleSave={props.handleSave}
						get_mapped_fields={get_mapped_fields_bind}
					/>
					<MappingView
						base_table_name={props.base_table_name}
						mapping_path={props.mapping_view}
						map_button_is_enabled={
							mapping_path_is_complete(props.mapping_view) &&
							typeof props.focused_line !== "undefined"
						}
						handleMapButtonClick={props.handleMappingViewMap}
						handleMappingViewChange={props.handleChange.bind(null, 'mapping_view')}
						get_mapped_fields={get_mapped_fields_bind}
						automapper_suggestions={props.automapper_suggestions}
					/>
				</div>
			</div>
		}

		<div id="list__mappings">{
			props.lines.map(({mapping_path,name,type},index)=>
				<MappingLine
					key={index}
					header_name={name}
					mapping_type={type}
					is_focused={index===props.focused_line}
					handleFocus={props.handleFocus.bind(null,index)}
					line_data={
						data_model_navigator.get_mapping_line_data_from_mapping_path({
							base_table_name: props.base_table_name,
							mapping_path: mapping_path,
							use_cached: true,
							generate_last_relationship_data: false,
							custom_select_type: 'closed_list',
							handleChange: props.handleChange.bind(null,index),
							handleOpen: props.handleOpen.bind(null, index),
							handleClose: props.handleClose.bind(null, index),
							get_mapped_fields: get_mapped_fields_bind,
							open_path_element_index:
								typeof props.open_select_element !== "undefined" && props.open_select_element.line === index ?
									props.open_select_element.index :
									undefined,
							automapper_suggestions: props.automapper_suggestions
						})
					}
				/>
			)
		}</div>

		<MappingsControlPanel
			show_hidden_fields={props.show_hidden_fields}
			onChange={props.handleToggleHiddenFields}
		/>
	</>;

}