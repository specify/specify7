"use strict";

const $ = require('jquery');
const mappings = require('./mappings.js');
const auto_mapper = require('./auto_mapper.js');
const data_model_handler = require('./data_model_handler.js');
const upload_plan_converter = require('./upload_plan_converter.js');
const custom_select_element = require('./custom_select_element.js');

/*
* Parent class for `mappings`. Defines elements and manages it's constructors
* */
const main = {

	/* TODO:
		* replace all nextElementSibling, previousElementSibling, getAttribute with methods
		* replace mappings and etc with `this`
		* replace abbreviations with icons
		* remove console log messages
		* add comments
		* add method descriptions
		* enable `unsaved changes` confirmation message before exiting the page
		* reformat & refactor code
	*
	* */

	/*
	* Configuration module that set's default settings
	* */
	config(){

		mappings.reference_indicator = '> ';
		mappings.level_separator = '_';
		mappings.friendly_level_separator = ' > ';
		mappings.reference_symbol = '#';
		mappings.tree_symbol = '$';

	},

	/*
	* Constructor that finds needed elements, and makes sure to call constructor_first_run once
	* */
	constructor(save_plan_function){

		return new Promise((resolve) => {

			// FINDING ELEMENTS
			mappings.container = document.getElementById('screen__mapping');

			// header
			mappings.title__table_name = document.getElementById('title__table_name');
			mappings.wbplanview_table_header_content = document.getElementById('wbplanview_table_header_content');
			mappings.button__change_table = document.getElementById('button__change_table');
			mappings.button__toggle_mapping_view = document.getElementById('button__toggle_mapping_view');

			// lists
			mappings.list__tables = document.getElementById('list__tables');
			mappings.mapping_view = document.getElementById('mapping_view');
			mappings.mapping_view_map_button = document.getElementById('wbplanview_mapping_view_map_button');
			mappings.list__mappings = document.getElementById('list__mappings');

			// control elements
			mappings.add_mapping = document.getElementById('add_mapping');
			mappings.toggle_hidden_fields = document.getElementById('checkbox__toggle_hidden_fields');

			mappings.hide_hidden_fields = true;
			mappings.hide_mapping_view = false;
			mappings.headers = {};
			mappings.base_table_name = undefined;
			mappings.need_to_define_lines = true;
			mappings.need_to_run_auto_mapper = true;
			mappings.cached_mappings_line_data = {};

			mappings.auto_mapper_run = auto_mapper.map.bind(auto_mapper);
			mappings.upload_plan_to_mappings_tree = upload_plan_converter.upload_plan_to_mappings_tree.bind(upload_plan_converter);
			mappings.custom_select_element = custom_select_element;


			// SETTING EVENT LISTENERS
			mappings.button__change_table.addEventListener('click', mappings.reset_table.bind(mappings));

			mappings.button__toggle_mapping_view.addEventListener('click', () => {
				mappings.hide_mapping_view = !mappings.container.classList.contains('hide_mapping_view');
				if (mappings.hide_mapping_view)
					mappings.container.classList.add('hide_mapping_view');
				else {
					mappings.container.classList.remove('hide_mapping_view');
					mappings.update_mapping_view();
				}
			});

			mappings.list__mappings.addEventListener('click', event => {

				const el = event.target;

				const wbplanview_mappings_line_delete = el.closest('.wbplanview_mappings_line_delete');
				if (wbplanview_mappings_line_delete)
					mappings.clear_line(wbplanview_mappings_line_delete);

				const wbplanview_mappings_line = el.closest('.wbplanview_mappings_line');
				if (wbplanview_mappings_line)
					mappings.focus_line(wbplanview_mappings_line);

			});

			mappings.mapping_view_map_button.addEventListener('click', mappings.mapping_view_map_button_callback);

			mappings.list__tables.addEventListener('click', event => {
				if (event.target && event.target['classList'].contains('wbplanview_table')) {
					event.preventDefault();
					const table_record = event.target;
					const table_name = table_record.getAttribute('data-table_name');
					mappings.set_table(table_name);
				}
			});

			mappings.add_mapping.addEventListener('click', () => {//TODO: fix deprecated
				mappings.add_new_mapping_line();
			});

			mappings.toggle_hidden_fields.addEventListener('change', () => {
				if (mappings.container.classList.contains('hide_hidden_fields'))
					mappings.container.classList.remove('hide_hidden_fields');
				else
					mappings.container.classList.add('hide_hidden_fields');
			});

			// CONFIG

			if (!this.constructor_has_run)
				main.constructor_first_run(resolve, save_plan_function);
			else
				mappings.list__tables.innerHTML = mappings.data_model_html;


			custom_select_element.set_event_listeners(mappings.list__mappings.parentElement, mappings.custom_select_change_event);


			if (this.constructor_has_run)
				resolve(mappings);
		});

	},

	/* Constructor that needs to be run only once (fetches data model, initializes other modules */
	constructor_first_run(promise_resolve, save_plan_function){

		mappings.ranks = {};

		main.config();  // get configuration

		// INITIALIZATION

		// build list of tables to exclude
		mappings.tables_to_hide = [
			'definition',
			'definitionitem',
			'geographytreedef',
			'geologictimeperiodtreedef',
			'treedef'
		];
		mappings.tables_to_hide = [...mappings.tables_to_hide, ...data_model_handler.get_list_of_hierarchy_tables()];

		// all required fields are not hidden, except for these, which are made not required
		mappings.required_fields_to_hide = [
			'timestampcreated',
			'collectionmemberid',
			'rankid',
			'defintion',
			'definitionitem',
			'ordernumber',
			'isprimary',
			'isaccepted',
			'treedef',
		];

		// fetch data model
		data_model_handler.constructor(mappings.ranks, mappings.tables_to_hide, mappings.reference_symbol, mappings.tree_symbol, mappings.required_fields_to_hide);
		data_model_handler.fetch_tables((data_model_html, tables, ranks) => {

			mappings.data_model_html = data_model_html;  // cache list of tables to reuse in the future
			mappings.list__tables.innerHTML = data_model_html;

			mappings.new_header_id = 1;
			mappings.tables = tables;
			mappings.ranks = ranks;

			this.constructor_has_run = true;
			promise_resolve(mappings);


			// initialize dependencies
			upload_plan_converter.constructor(
				() => mappings.base_table_name,
				base_table_name => mappings.base_table_name = base_table_name,
				mappings.tree_symbol,
				mappings.reference_symbol,
				mappings.get_mappings_tree.bind(mappings),
				mappings.ranks,
				mappings.tables,
			);

			auto_mapper.constructor(data_model_handler);

		});
		mappings.data_model_handler = data_model_handler;

		mappings.get_html_generator().constructor(custom_select_element);

		custom_select_element.constructor('', '');//TODO: set proper table icons url

		main.save_plan = save_plan_function;

	},

	/* TODO update deprecated*/
	/*
	* Validates the current mapping and shows error messages if needed
	* */
	validate(){

		const validation_results = data_model_handler.show_required_missing_ranks(mappings.base_table_name, mappings.get_mappings_tree());

		if (validation_results.length === 0)
			return true;

		const div = document.createElement('div');
		div.innerHTML = mappings.format_validation_results(validation_results);

		let dialog = $(div).dialog({
			modal: true,
			title: 'Unmapped required fields detected',
			close: function(){
				$(this).remove();
				dialog = null;
			},
			width: document.documentElement.clientWidth * 0.8,
			buttons: [
				{
					text: 'Return to mapping headers', click: () => $(this).dialog('close')
				},
				{
					text: 'Save unfinished mapping', click: () => main.save_plan(undefined, true)
				}
			]
		});


		return validation_results;

	},

	render_lists(){
		custom_select_element.onload(mappings.list__mappings);
	}

};

module.exports = main;