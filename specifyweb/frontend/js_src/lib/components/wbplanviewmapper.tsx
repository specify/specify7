'use strict';

import tree_helpers from './tree_helpers';
import helper from './helper';
import {MappingPath} from './wbplanviewcomponents';
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


/*
import {ModalDialog} from './modaldialog.js';

interface ValidationResultsDialogProps {
	show_save_button?: boolean,
}
<ValidationResultsDialog show_save_button={props.show_save_button} />
const ValidationResultsDialog = React.memo(({show_save_button}:ValidationResultsDialogProps)=>
	<ModalDialog
		properties={{
			title: 'Unmapped required fields detected',
			buttons: [
				{
					text: 'Return to mapping headers', click: function () :void {
						$(this).dialog('close');
					},
				},
				show_save_button ?
					{
						text: 'Save unfinished mapping',
						click: main.save_plan.bind(main,undefined, true)
					} :
					undefined
			]
		}}
	>
		Some required fields were not mapped yet. Do you want to continue editing or save changes and quit editing
	</ModalDialog>
);
*/

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
	</div>
}

export const get_lines_from_headers = (
	headers :list_of_headers = [],
) :MappingLine[] =>
	headers.map(header_name => (
		{
			mapping_path: [],
			type: 'new_column',
			name: header_name,
		}
	));

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
					})
				}
			/>
		</div>
		<button>Map</button>
	</>
);

export default function(props:WBPlanViewMapperProps) {

	return <>
		{props.show_mapping_view &&
			<div id="mapping_view_parent">
				<div id="mapping_view_container">
					<FormatValidationResults validation_results={props.validation_results} />
					<MappingView mapping_path={props.mapping_view} />
				</div>
				<MappingsControlPanel show_hidden_fields={props.show_hidden_fields} />
			</div>
		}

		<div id="list__mappings"/>


	</>;

	// SETTERS

	/* Sets a lit of headers */
	function set_headers(
		headers :list_of_headers = [],
		upload_plan :upload_plan | false = false,  // upload plan as an object or {bool} false for none
		headers_defined :boolean = true,  // whether CSV file had headers in the first line
	) :void {

		// remove all existing lines
		wbplanviewmapper.list__mappings.innerHTML = '';


		tree_helpers.raw_headers = headers;
		data_model_storage.headers = headers;

		wbplanviewmapper.need_to_run_auto_mapper = headers_defined && upload_plan === false;
		wbplanviewmapper.new_header_id = 0;

		if (typeof upload_plan === 'object' && typeof upload_plan.baseTableName !== 'undefined') {

			const {baseTableName: base_table_name} = upload_plan;

			const mappings_tree = upload_plan_converter.upload_plan_to_mappings_tree(upload_plan);
			const array_of_mappings = tree_helpers.mappings_tree_to_array_of_mappings(mappings_tree);

			const defined_headers = [];
			for (const mapping_path of array_of_mappings) {
				const [mapping_type, header_name] = helper.deconstruct_mapping_path(mapping_path, true).slice(-2);
				if (mapping_type === 'existing_header')
					defined_headers.push(header_name);
			}

			wbplanviewmapper.set_table(base_table_name, defined_headers).then(
				wbplanviewmapper.implement_array_of_mappings.bind(wbplanviewmapper, array_of_mappings),
			);
		}
		else
			wbplanviewmapper.need_to_define_lines = true;


	};

	/* Resets the currently mapped fields and presents the option to chose base table again */
	function reset_table() :void {

		if (typeof data_model_storage.base_table_name === 'undefined')
			return;

		wbplanviewmapper.container.classList.remove('table_selected');
		wbplanviewmapper.title__table_name.innerText = '';

		wbplanviewmapper.list__mappings.innerHTML = '';

		data_model_storage.base_table_name = undefined;

		navigation.removeUnloadProtect(wbplanviewmapper);

		wbplanviewmapper.need_to_define_lines = true;
		wbplanviewmapper.need_to_run_auto_mapper = true;

	};


	// FUNCTIONS

	/* Implements array of mappings */
	function implement_array_of_mappings(
		array_of_mappings :mapping_path[],  // array of mapping_path's (with mapping types and header names / static column values)
	) :void {

		if (array_of_mappings.length === 0)
			return;

		Object.values(array_of_mappings).map(mapping_path => {
			const [parsed_mapping_path, mapping_type, header_name] = helper.deconstruct_mapping_path(mapping_path, true);
			const header_data = {
				mapping_type,
				header_name,
			};
			wbplanviewmapper.add_new_mapping_line({
				mapping_path: parsed_mapping_path,
				header_data,
				update_all_lines: false,
			});
		});

		wbplanviewmapper.changes_made = true;
		wbplanviewmapper.update_all_lines();

	};

	/* Adds new mapping line */
	function add_new_mapping_line({
		position = -1,
		mapping_path = [],
		header_data,
		blind_add_back = false,
		line_attributes = [],
		scroll_down = false,
		update_all_lines = true,
	} :add_new_mapping_line_parameters) :void {

		const lines = dom_helper.get_lines(wbplanviewmapper.list__mappings);

		const line_data = data_model_navigator.get_mapping_line_data_from_mapping_path({
			mapping_path,
			use_cached: true,
		});

		if (header_data.mapping_type === 'new_column' && header_data.header_name === '') {
			wbplanviewmapper.new_header_id++;
			header_data.header_name = `New Column ${wbplanviewmapper.new_header_id}`;
		}

		const mapping_line_data = {
			line_data,
			header_data,
			line_attributes,
		};

		let new_mapping_line;

		if (blind_add_back) {
			new_mapping_line = document.createElement('div');
			wbplanviewmapper.list__mappings.appendChild(new_mapping_line);
		}
		else {
			// before adding a header, check if it is already present
			const {header_name} = header_data;
			const header_index = data_model_storage.headers.indexOf(header_name);
			new_mapping_line = lines[header_index];

			// find position for the new header
			if (typeof new_mapping_line === 'undefined') {

				new_mapping_line = document.createElement('div');

				let final_position = position;
				if (position < -1)
					final_position = lines.length + 1 + position;

				if (final_position >= lines.length)
					wbplanviewmapper.list__mappings.appendChild(new_mapping_line);
				else
					wbplanviewmapper.list__mappings.insertBefore(new_mapping_line, lines[final_position]);

			}
		}

		if (  // scroll down if told to and new line is not visible
			scroll_down &&
			wbplanviewmapper.list__mappings.offsetHeight < new_mapping_line.offsetTop + new_mapping_line.offsetHeight
		)
			wbplanviewmapper.list__mappings.scrollTop = new_mapping_line.offsetTop - new_mapping_line.offsetHeight;

		new_mapping_line.outerHTML = html_generator.mapping_line(mapping_line_data, true);

		if (update_all_lines)
			wbplanviewmapper.update_all_lines(mapping_path);

	};


	// GETTERS

	/* Returns array of mapping_paths */
	function get_array_of_mappings(
		include_headers :boolean = false,  // whether each mapping path should also have mapping type and header name at the end
		skip_empty :boolean = true,  // whether to skip incomplete mapping paths
	) :mapping_path[] /* array of mapping paths */ {

		if (!include_headers && !wbplanviewmapper.changes_made) {
			wbplanviewmapper.changes_made = false;
			return wbplanviewmapper.mapped_fields;
		}

		let index_shift = 1;
		if (include_headers)
			index_shift += 2;

		const line_elements_containers = dom_helper.get_lines(wbplanviewmapper.list__mappings, true) as HTMLElement[];

		const results = wbplanviewmapper.mapped_fields = line_elements_containers.reduce((mapped_fields, line_elements_container) => {

			const mapping_path = wbplanviewmapper.get_mapping_path({
				line_elements_container,
				include_headers,
			});

			const is_finished = mapping_path[mapping_path.length - index_shift] !== '0';

			if (!is_finished && !skip_empty)
				mapping_path.pop();

			if (is_finished || !skip_empty)
				mapped_fields.push(mapping_path);

			return mapped_fields;
		}, [] as mapping_path[]);

		if (skip_empty)
			return results;
		else  // @ts-ignore
			return Array.from(new Set(results.map(JSON.stringify))).map(JSON.parse);  // make results distinct

	};

	/* Returns a mappings tree */
	public static get_mappings_tree(
		include_headers :boolean = false,  // whether the last tree nodes of each branch should be mapping type and header name
		skip_empty :boolean = true,  // whether to include incomplete tree nodes
	) :mappings_tree /* mappings tree */ {
		if (!include_headers && !wbplanviewmapper.changes_made)
			return wbplanviewmapper.mappings_tree;

		return wbplanviewmapper.mappings_tree = tree_helpers.array_of_mappings_to_mappings_tree(
			wbplanviewmapper.get_array_of_mappings(include_headers, skip_empty),
			include_headers,
		);
	};

	/* Get a mappings tree branch given a particular starting mapping path */
	const get_mapped_fields = (
		mapping_path_filter :mapping_path,  // a mapping path that would be used as a filter
		skip_empty :boolean = true,  // whether to skip incomplete mappings
	) :mappings_tree =>
		tree_helpers.traverse_tree(
			wbplanviewmapper.get_mappings_tree(false, skip_empty),
			tree_helpers.array_to_tree([...mapping_path_filter]),
		);

	/* Returns a mapping path for a particular line elements container */
	function get_mapping_path({
		line_elements_container,
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

	/* Unmap a particular header */
	public static clear_line(
		wbplanview_mappings_line_delete :HTMLElement,  // the `Delete` button that belongs to a particular line
	) :void {

		const line = wbplanview_mappings_line_delete.closest('.wbplanview_mappings_line') as HTMLElement;

		const base_table_fields = data_model_navigator.get_mapping_line_data_from_mapping_path({
			mapping_path: [],
			use_cached: true,
		});

		const line_elements_container = dom_helper.get_line_elements_container(line);
		const mapping_path = wbplanviewmapper.get_mapping_path({
			line_elements_container,
			exclude_unmapped: true,
		});
		line_elements_container.innerHTML = html_generator.mapping_path(base_table_fields, 'closed_list', true);

		wbplanviewmapper.changes_made = true;
		wbplanviewmapper.update_all_lines(mapping_path);

	};

	/* The callback for when the `Map` button on the mapping view is pressed */
	function mapping_view_map_button_callback() :void {

		// find selected line
		const lines = dom_helper.get_lines(wbplanviewmapper.list__mappings);
		let selected_line;

		for (const line of lines)
			if (line.classList.contains('wbplanview_mappings_line_focused')) {
				selected_line = line;
				break;
			}


		// don't do anything if no line is selected
		if (typeof selected_line === 'undefined')
			return;


		// don't map the last node if it is already mapped
		// e.g convert `Accession > Accession Number` to `Accession`  if `Accession Number` is a field and is mapped
		const is_mapped = !CustomSelectElement.is_selected_option_enabled(
			wbplanviewmapper.mapping_view.childNodes[wbplanviewmapper.mapping_view.childNodes.length - 1] as HTMLElement,
		);

		// implement the mapping path on the selected field
		const mapping_path = wbplanviewmapper.get_mapping_path({
			line_elements_container: wbplanviewmapper.mapping_view,
		});

		if (is_mapped)
			mapping_path.pop();

		const mapping_line_data = data_model_navigator.get_mapping_line_data_from_mapping_path({
			mapping_path,
			use_cached: true,
		});
		const select_line_elements_container = dom_helper.get_line_elements_container(selected_line);

		const previous_mapping_path = wbplanviewmapper.get_mapping_path({
			line_elements_container: select_line_elements_container,
			include_headers: false,
			exclude_unmapped: true,
			exclude_non_relationship_values: true,
		});

		select_line_elements_container.innerHTML = html_generator.mapping_path(mapping_line_data, 'closed_list', true);

		wbplanviewmapper.update_all_lines([mapping_path, previous_mapping_path]);

	};


	// HELPERS

	/* Adds a focus outline to a given line */
	public static focus_line(
		line :HTMLElement,  // the line to be focused
	) :void {

		const lines = dom_helper.get_lines(wbplanviewmapper.list__mappings) as HTMLElement[];

		// don't do anything if selected line is already focused
		const selected_lines = lines.filter(mapping_line =>
			mapping_line.classList.contains('wbplanview_mappings_line_focused'),
		);
		if (selected_lines.length === 1 && selected_lines[0] === line)
			return;

		// deselect all lines
		for (const mapping_line of selected_lines)
			if (mapping_line !== line)
				mapping_line.classList.remove('wbplanview_mappings_line_focused');


		// select the current line
		line.classList.add('wbplanview_mappings_line_focused');

		// don't update the mapping view if it is hidden
		if (wbplanviewmapper.hide_mapping_view)
			return;

		wbplanviewmapper.update_mapping_view(line);

	};

	/* Update the mapping view with the mapping path from a given line */
	const update_mapping_view = (
		line :HTMLElement | false = false,  // the line to be used as a source for mapping path
		use_cached :boolean = false,  // whether to use a cached version of the mapping view
	) :void => {

		if (typeof line === 'boolean')
			line = dom_helper.get_lines(wbplanviewmapper.list__mappings).filter((mapping_line :HTMLElement) => mapping_line.classList.contains('wbplanview_mappings_line_focused'))[0];

		let mapping_path :mapping_path = [];
		if (typeof line !== 'undefined') {  // get mapping path
			const line_elements_container = dom_helper.get_line_elements_container(line);
			mapping_path = wbplanviewmapper.get_mapping_path({
				line_elements_container,
			});
		}

		// if line is mapped, update the mapping view
		if (mapping_path[mapping_path.length - 1] !== '0') {
			const mapping_line_data = data_model_navigator.get_mapping_line_data_from_mapping_path({
				mapping_path,
			});
			wbplanviewmapper.mapping_view.innerHTML = html_generator.mapping_view(mapping_line_data, use_cached);
		}

	};

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

}