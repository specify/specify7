'use strict';

import tree_helpers from './tree_helpers';
import helper from './helper';
import {MappingLine, MappingPath} from './wbplanviewcomponents';
import data_model_helper from './data_model_helper';
import data_model_storage from './data_model_storage';
import data_model_navigator from './data_model_navigator';
import automapper from './automapper';
import {CustomSelectElement} from './customselectelement';
import upload_plan_converter from './upload_plan_converter';
import React from 'react';

const max_suggestions_count :number = 3;  // the maximum number of suggestions to show in the suggestions box

const MappingsControlPanel = React.memo(({show_hidden_fields}:MappingsControlPanelProps)=>
	<div id="mappings_control_panel">
		<button>Add new column</button>
		<button>Add new static column</button>
		<label>
			<input type="checkbox" checked={show_hidden_fields}/>
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
					mappings_line_data={
						data_model_navigator.get_mapping_line_data_from_mapping_path({
							mapping_path: field_path,
							use_cached: true,
							generate_last_relationship_data: false,
							custom_select_type: 'preview_list',
						})
					}
				/>
			</div>,
		)}
		<span>Or you can <button onClick={props.handleSave}>Save Unfinished Mapping</button> and finish editing it later</span>
	</div>
}

export function get_lines_from_headers(
	headers :list_of_headers = [],
	run_automapper:boolean = false,
	base_table_name:string = ''
) :MappingLine[] {

	const lines = headers.map((header_name):MappingLine => (
		{
			mapping_path: [],
			type: 'new_column',
			name: header_name,
		}
	));

	if(!run_automapper || typeof base_table_name === "undefined")
		return lines;

	const automapper_results :automapper_results = (new automapper({
		headers: headers,
		base_table: base_table_name,
		scope: 'automapper',
	})).map();

	return lines.map(line=>{
		const {name:header_name} = line;
		const automapper_mapping_path = automapper_results[header_name][0];
		if(typeof automapper_mapping_path !== "undefined")
			return {
				mapping_path: automapper_mapping_path,
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

	const lines = get_lines_from_headers(headers);
	const mappings_tree = upload_plan_converter.upload_plan_to_mappings_tree(upload_plan);
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
			mapping_path
	);

/* todo: REMOVE THIS? */
/* Returns a mappings tree */
export const get_mappings_tree = (
	lines: MappingLine[],
	include_headers :boolean = false,  // whether the last tree nodes of each branch should be mapping type and header name
	skip_empty :boolean = true,  // whether to include incomplete tree nodes
) :mappings_tree /* mappings tree */ =>
	tree_helpers.array_of_mappings_to_mappings_tree(
		get_array_of_mappings(lines, include_headers, skip_empty),
		include_headers,
	);

/* Get a mappings tree branch given a particular starting mapping path */
function get_mapped_fields(
	lines: MappingLine[],
	mapping_path_filter :mapping_path,  // a mapping path that would be used as a filter
	skip_empty :boolean = true,  // whether to skip incomplete mappings
) :mappings_tree{
	const mappings_tree = tree_helpers.traverse_tree(
		get_mappings_tree(lines, false, skip_empty),
		tree_helpers.array_to_tree([...mapping_path_filter]),
	);
	if(typeof mappings_tree === "undefined" || typeof mappings_tree === "string")
		return {};
	else
		return mappings_tree;
}

/* TODO: finish this */
/* Returns a mapping path for a particular line elements container */
function get_mapping_path({
	lines: MappingLine,
	mapping_path_filter = [],
	include_headers = false,
	exclude_unmapped = false,
	exclude_non_relationship_values = false,
} :get_mapping_path_parameters) :mapping_path {

	const elements = dom_helper.get_line_elements(line_elements_container);

	const mapping_path = [];
	let position = 0;

	const return_path = (path :mapping_path, element :HTMLElement) => {

		if (exclude_unmapped && path[path.length - 1] === '0')
			path = [];

		else if (path.length === 0)
			path = ['0'];


		if (exclude_non_relationship_values) {
			const is_relationship =
				typeof element === 'undefined' ||
				CustomSelectElement.element_is_relationship(element);

			if (!is_relationship)
				path.pop();
		}

		if (include_headers) {
			const line = line_elements_container.parentElement;
			const line_header_element = dom_helper.get_line_header_element(line);
			const header_name = dom_helper.get_line_header_name(line_header_element);
			const mapping_type = dom_helper.get_line_mapping_type(line_header_element);
			return [...path, mapping_type, header_name];
		}

		return path;
	};

	for (const element of elements) {

		const result_name = CustomSelectElement.get_list_value(element);

		if (result_name !== null)
			mapping_path.push(result_name);

		if (
			Array.isArray(mapping_path_filter) &&
			typeof mapping_path_filter[position] === 'string' &&
			result_name !== mapping_path_filter[position]
		)
			return return_path([], element);

		else if (
			(
				typeof mapping_path_filter === 'object' &&
				element === mapping_path_filter
			) ||
			result_name === '0'
		)
			return return_path(mapping_path, element);

		position++;

	}

	return return_path(mapping_path, elements[elements.length - 1]);

};


//TODO: detect incomplete line here
export const mapping_path_is_complete = (mapping_path:mapping_path)=>
	mapping_path.length !== 0;

// CHANGE CALLBACKS

/* Handles a change to the select element value */
function custom_select_change_event({
	changed_list,
	selected_option,
	new_value,
	is_relationship,
	list_type,
	custom_select_type,
	list_table_name,
} :custom_select_element_change_payload) :void {

	const line_elements_container = changed_list.parentElement;

	if (line_elements_container === null)
		throw new Error(`Couldn't fine a parent list for a suggestions box`);

	if (list_type === 'list_of_tables') {
		CustomSelectElement.unselect_option(changed_list, selected_option);
		wbplanviewmapper.set_table(new_value);
		return;
	}
	else if (list_type === 'suggested_mapping') {

		const mapping_line_data = data_model_navigator.get_mapping_line_data_from_mapping_path({
			mapping_path: new_value.split(data_model_storage.path_join_symbol),
		});

		line_elements_container.innerHTML = html_generator.mapping_path(mapping_line_data);

		return;

	}

	if (list_type === 'to_many') {

		// add new -to-many element
		if (new_value === 'add') {

			const previous_element = selected_option.previousElementSibling;
			let last_index = 0;

			if (previous_element === null)
				throw new Error(`Couldn't fine a previous sibling for selected option`);

			if (previous_element.classList.contains('custom_select_option')) {
				const last_index_string = CustomSelectElement.get_option_value(selected_option.previousElementSibling);
				last_index = data_model_helper.get_index_from_reference_item_name(last_index_string);
			}

			const new_index = last_index + 1;
			const new_option_name = data_model_helper.format_reference_item(new_index);

			const option_data = {
				option_name: new_option_name,
				option_value: new_option_name,
				is_enabled: true,
				is_relationship: true,
				is_default: false,
				table_name: list_table_name,
			};

			CustomSelectElement.add_option(changed_list, -2, option_data, true);

			wbplanviewmapper.changes_made = true;

		}

	}
	else {

		const remove_block_to_the_right =  // remove all elements to the right
			list_type === 'simple' ||  // if the list is not a `tree` and not a `to_many`
			new_value === '0';  // or if list's value is unset;
		if (remove_block_to_the_right && dom_helper.remove_elements_to_the_right(changed_list))
			wbplanviewmapper.changes_made = true;

	}

	const mapping_path = wbplanviewmapper.get_mapping_path({
		line_elements_container,
		mapping_path_filter: changed_list,
	});


	// add block to the right if there aren't any and selected field is a relationship
	if (!dom_helper.has_next_sibling(changed_list) && is_relationship) {
		wbplanviewmapper.changes_made = true;

		const new_line_element = document.createElement('span');
		line_elements_container.appendChild(new_line_element);

		const last_element_is_not_relationship = !CustomSelectElement.element_is_relationship(changed_list);
		const trimmed_mapping_path = [...mapping_path];
		if (last_element_is_not_relationship)
			trimmed_mapping_path.pop();

		const mapping_details = data_model_navigator.get_mapping_line_data_from_mapping_path({
			mapping_path: trimmed_mapping_path,
			iterate: false,
			use_cached: true,
		})[0];
		new_line_element.outerHTML = html_generator.mapping_element(mapping_details, custom_select_type, true);
	}

	wbplanviewmapper.deduplicate_mappings();
	mapping_path.pop();
	wbplanviewmapper.update_all_lines(mapping_path);

	if (
		custom_select_type === 'closed_list' &&
		line_elements_container.parentElement !== null
	)
		wbplanviewmapper.update_mapping_view(line_elements_container.parentElement);

};


// HELPERS

/* Unmap headers that have a duplicate mapping path */
function deduplicate_mappings() :void {

	const array_of_mappings = wbplanviewmapper.get_array_of_mappings(false, false);
	const duplicate_mapping_indexes = helper.find_duplicate_mappings(array_of_mappings, false);
	const lines = dom_helper.get_lines(wbplanviewmapper.list__mappings, true);

	let index = -1;
	for (const line of lines) {

		index++;

		if (duplicate_mapping_indexes.indexOf(index) === -1)
			continue;

		const line_elements = dom_helper.get_line_elements(line);
		const last_custom_select = line_elements.pop();

		CustomSelectElement.change_selected_option(last_custom_select, '0');

	}

};

/*
* Show automapper suggestion on top of an opened `closed_list`
* The automapper suggestions are shown only if the current box doesn't have a value selected
* */
const show_automapper_suggestions = (
	select_element :HTMLElement,  // target list
	custom_select_option :HTMLElement,  // the option that is currently selected
) =>
	new Promise((resolve) => {

		// don't show suggestions if picklist has non null value
		if (
			typeof custom_select_option !== 'undefined' &&
			CustomSelectElement.get_option_value(custom_select_option) !== '0'
		)
			return resolve('');

		const line_elements_container = select_element.parentElement;

		if (line_elements_container === null)
			throw new Error(`Can't find a parent of this picklist`);

		const mapping_path = wbplanviewmapper.get_mapping_path({
			line_elements_container,
			mapping_path_filter: select_element,
			include_headers: true,
		});

		const header = mapping_path.pop();
		const header_type = mapping_path.pop();

		if (header_type !== 'existing_header')
			return resolve('');

		mapping_path.pop();

		const mapping_line_data = data_model_navigator.get_mapping_line_data_from_mapping_path({
			mapping_path,
			iterate: false,
		});

		let path_offset = 0;
		const list_mapping_type = CustomSelectElement.get_list_mapping_type(select_element);
		if (list_mapping_type === 'to_many') {
			mapping_path.push('#1');
			path_offset = 1;
		}

		const all_automapper_results = Object.entries((new automapper({
			headers: [header],
			base_table: data_model_storage.base_table_name,
			starting_table: mapping_line_data[mapping_line_data.length - 1].table_name,
			path: mapping_path,
			path_offset,
			allow_multiple_mappings: true,
			check_for_existing_mappings: true,
			scope: 'suggestion',
		})).map({
			commit_to_cache: false,
		}) as automapper_results);

		if (all_automapper_results.length === 0)
			return resolve('');

		let automapper_results = all_automapper_results[0][1];

		if (automapper_results.length > max_suggestions_count)
			automapper_results = automapper_results.slice(0, 3);

		const select_options_data = automapper_results.map(automapper_result => {

			const mapping_line_data = data_model_navigator.get_mapping_line_data_from_mapping_path({
				mapping_path: automapper_result,
				use_cached: true,
			}).slice(mapping_path.length - path_offset);
			const mapping_path_html = html_generator.mapping_path(
				mapping_line_data,
				'suggestion_list',
				false,
			);

			return {
				option_name: mapping_path_html,
				option_value: automapper_result.join(data_model_storage.path_join_symbol),
			};
		});

		const suggested_mappings_html = CustomSelectElement.get_suggested_mappings_element_html(select_options_data);
		const span = document.createElement('span');
		select_element.insertBefore(span, select_element.children[0]);
		span.outerHTML = suggested_mappings_html;

		resolve('');

	}).then();

const MappingView = React.memo((props:MappingViewProps)=>
	<>
		<div id="mapping_view">
			<MappingPath
				mappings_line_data={
					data_model_navigator.get_mapping_line_data_from_mapping_path({
						mapping_path: props.mapping_path,
						use_cached: true,
						generate_last_relationship_data: false,
						custom_select_type: 'opened_list',
						handleChange: props.handleMappingViewChange,
						open_path_element_index: props.opened_list
					})
				}
			/>
		</div>
		<button
			disabled={!props.map_button_is_enabled}
			onClick={
				props.map_button_is_enabled ?
					props.handleMapButtonClick :
					undefined
			}
		>Map</button>
	</>
);

export default function(props:WBPlanViewMapperProps) {

	return <>
		{props.show_mapping_view &&
			<div id="mapping_view_parent">
				<div id="mapping_view_container">
					<FormatValidationResults validation_results={props.validation_results} handleSave={props.handleSave} />
					<MappingView
						mapping_path={props.mapping_view}
						map_button_is_enabled={
							mapping_path_is_complete(props.mapping_view) &&
							typeof props.focused_line !== "undefined"
						}
						handleMapButtonClick={props.handleMappingViewMap}
						handleMappingViewChange={props.handleMappingViewChange}
						opened_list={
							typeof props.open_select_element !== "undefined" && props.open_select_element.line === 'mapping_view' ?
								props.open_select_element.index :
								undefined
						}
					/>
				</div>
			</div>
		}

		<div id="list__mappings">{
			props.lines.map(({mapping_path,name,type},index)=>
				<MappingLine
					header_name={name}
					mapping_type={type}
					is_focused={index===props.focused_line}
					handleFocus={props.handleFocus.bind(null,index)}
					line_data={
						data_model_navigator.get_mapping_line_data_from_mapping_path({
							mapping_path: mapping_path,
							use_cached: true,
							generate_last_relationship_data: false,
							custom_select_type: 'closed_list',
							handleChange: props.handleChange,
							handleOpen: props.handleOpen,
							open_path_element_index:
								typeof props.open_select_element !== "undefined" && props.open_select_element.line === index ?
									props.open_select_element.index :
									undefined
						})
					}
				/>
			)
		}</div>

		<MappingsControlPanel show_hidden_fields={props.show_hidden_fields} />


	</>;

}