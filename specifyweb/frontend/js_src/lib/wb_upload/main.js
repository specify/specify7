"use strict";

const mappings = require('./mappings.js');
const auto_mapper = require('./auto_mapper.js');
const data_model_handler = require('./data_model_handler.js');
const upload_plan_converter = require('./upload_plan_converter.js');

/*
* Parent class for `mappings`. Defines elements and manages it's constructors
* */
const main = {

	/*
	* Configuration module that set's default settings
	* */
	config: ()=>{

		mappings.reference_indicator = '> ';
		mappings.level_separator = '_';
		mappings.friendly_level_separator = ' > ';
		mappings.reference_symbol = '#';
		mappings.tree_symbol = '$';

	},

	/*
	* Constructor that finds needed elements, and makes sure to call constructor_first_run once
	* */
	constructor: () => {

		//FINDING ELEMENTS

		// column data model
		mappings.title__table_name = document.getElementById('title__table_name');
		mappings.button__change_table = document.getElementById('button__change_table');
		mappings.list__tables = document.getElementById('list__tables');
		mappings.list__data_model = document.getElementById('list__data_model');
		mappings.lines = mappings.list__data_model.getElementsByTagName('input');


		// column controls
		mappings.button__map = document.getElementById('button__map');
		mappings.button__delete = document.getElementById('button__delete');


		// column headers
		mappings.list__headers = document.getElementById('list__headers');
		mappings.button__new_field = document.getElementById('button__new_field');
		mappings.control_line__new_header = document.getElementById('control_line__new_header');
		mappings.control_line__new_static_header = document.getElementById('control_line__new_static_header');
		mappings.headers = mappings.list__headers.getElementsByTagName('input');

		// control elements
		main.validation_results = document.getElementById('validation_results');
		main.validation_results_message = document.getElementById('validation_results_message');
		main.close_validation_results = document.getElementById('close_validation_results');

		mappings.hide_hidden_fields = true;
		mappings.need_to_run_auto_mapper = true;
		mappings.raw_headers = [];
		mappings.base_table_name = undefined;
		mappings.selected_field = undefined;

		mappings.auto_mapper_run = auto_mapper.map;
		mappings.upload_plan_to_mappings_tree = upload_plan_converter.upload_plan_to_mappings_tree;

		//setting event listeners

		main.close_validation_results.addEventListener('click',()=>{
			main.validation_results.style.display='none';
		})

		mappings.button__change_table.addEventListener('click', mappings.reset_table);

		mappings.button__map.addEventListener('click', mappings.map_field_callback);
		mappings.button__delete.addEventListener('click', mappings.unmap_field_callback);

		mappings.control_line__new_header.addEventListener('change', mappings.change_selected_header);
		mappings.control_line__new_static_header.addEventListener('change', mappings.change_selected_header);

		document.getElementById('checkbox__toggle_hidden_fields').addEventListener('change', () => {
			mappings.hide_hidden_fields = !mappings.hide_hidden_fields;
			mappings.update_all_fields();
		});

		mappings.list__data_model.addEventListener('change', (event) => {
			if (event.target && event.target.classList.contains('radio__field'))
				mappings.change_selected_field(event);
			else if (event.target && event.target.tagName === 'SELECT')
				mappings.change_option_field(event);
		});

		mappings.list__data_model.addEventListener('focus', (event) => {
			if (event.target && event.target.tagName === 'SELECT')
				mappings.change_option_field(event);
		});

		mappings.list__headers.addEventListener('change', (event) => {
			if (event.target && event.target['classList'].contains('radio__header'))
				mappings.change_selected_header(event);
			else if (event.target && event.target['tagName'] === 'TEXTAREA')
				mappings.changes_made = true;
		});

		mappings.list__tables.addEventListener('change', (event) => {
			if (event.target && event.target['classList'].contains('radio__table'))
				mappings.set_table(event);
		});

		//CONFIG

		if(!main.constructor_has_run)
			main.constructor_first_run();
		else
			mappings.list__tables.innerHTML = mappings.data_model_html;


		return mappings.set_headers;

	},

	/* Constructor that needs to be run only once (fetches data model, initializes other modules */
	constructor_first_run: () => {

		mappings.ranks = {};

		main.config();//get configuration

		//INITIALIZATION

		//build list of tables to exclude
		mappings.tables_to_hide = [
			'definition',
			'definitionitem',
			'geographytreedef',
			'geologictimeperiodtreedef',
			'treedef'
		];
		mappings.tables_to_hide = [...mappings.tables_to_hide, ...data_model_handler.get_list_of_hierarchy_tables()];

		//all required fields are not hidden, except for these, which are made not required
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

		//fetch data model
		data_model_handler.constructor(mappings.ranks, mappings.tables_to_hide, mappings.reference_symbol, mappings.tree_symbol, mappings.required_fields_to_hide);
		data_model_handler.fetch_tables((data_model_html, tables) => {

			mappings.data_model_html = data_model_html;
			mappings.list__tables.innerHTML = data_model_html;

			auto_mapper.constructor(tables, mappings.ranks, mappings.reference_symbol, mappings.tree_symbol);

			mappings.new_header_id = 1;
			mappings.tables = tables;

			main.constructor_has_run = true;


			//initialize dependencies
			upload_plan_converter.constructor(
				() => {
					return mappings.base_table_name;
				},
				(base_table_name) => {
					mappings.base_table_name = base_table_name;
				},
				mappings.tree_symbol,
				mappings.reference_symbol,
				mappings.get_mappings_tree,
				mappings.ranks,
				mappings.tables,
			);

		});


		//stopping accidental page reload
		window.addEventListener('beforeunload', function (e) {//stops page from reloading if there is mapping in progress
			if (typeof mappings.list__tables_scroll_postion !== "undefined") {
				e.preventDefault();
				e.returnValue = 'Are you sure you want to discard creating mapping for this dataset?';//this message won't be displayed in most browsers
			} else
				delete e['returnValue'];
		});

	},

	/*
	* Validates the current mapping and shows error messages if needed
	* */
	validate: ()=>{

		const validation_results = data_model_handler.show_required_missing_ranks(mappings.base_table_name,mappings.get_mappings_tree());

		if(validation_results.length===0)
			return true;

		const field_locations = [];

		validation_results.map(field_path => field_locations.push(mappings.get_friendly_field_path(field_path).join(mappings.friendly_level_separator)));

		const validation_message = 'Please make sure to map the following required fields before proceeding:<br>'+field_locations.join('<br>');

		main.validation_results.style.display = '';
		main.validation_results_message.innerHTML = validation_message;

		return validation_results;

	},

};

module.exports = main;