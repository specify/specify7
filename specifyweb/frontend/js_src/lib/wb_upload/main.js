"use strict";

const $ = require('jquery');
const mappings = require('./mappings.js');
const data_model = require('./data_model.js');
const upload_plan_converter = require('./upload_plan_converter.js');
const custom_select_element = require('./custom_select_element.js');

/*
* Parent class for `mappings`. Defines elements and manages it's constructors
* */
const main = {

	/*
	* Constructor that finds needed elements, and makes sure to call constructor_first_run once
	* */
	constructor(save_plan_function){

		return new Promise((resolve) => {

			// FINDING ELEMENTS
			mappings.container = document.getElementById('screen__mapping');

			// header
			mappings.wbplanview_header = document.getElementById('wbplanview_header');
			mappings.title__table_name = document.getElementById('title__table_name');
			mappings.button__change_table = document.getElementById('button__change_table');
			mappings.button__toggle_mapping_view = document.getElementById('button__toggle_mapping_view');

			// lists
			mappings.list__tables = document.getElementById('list__tables');
			mappings.mapping_view = document.getElementById('mapping_view');
			mappings.mapping_view_map_button = document.getElementById('wbplanview_mapping_view_map_button');
			mappings.list__mappings = document.getElementById('list__mappings');

			// control elements
			// mappings.add_mapping = document.getElementById('add_mapping');
			mappings.toggle_hidden_fields = document.getElementById('checkbox__toggle_hidden_fields');

			mappings.hide_hidden_fields = true;
			mappings.hide_mapping_view = false;
			mappings.headers = {};
			mappings.need_to_define_lines = true;
			mappings.need_to_run_auto_mapper = true;
			mappings.cached_mappings_line_data = {};
			mappings.lines = [];
			data_model.base_table_name = undefined;
			upload_plan_converter.get_mappings_tree = mappings.get_mappings_tree.bind(mappings);


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

			// mappings.add_mapping.addEventListener('click', () => {
			// 	mappings.add_new_mapping_line();
			// });

			mappings.toggle_hidden_fields.addEventListener('change', () => {
				if (mappings.container.classList.contains('hide_hidden_fields'))
					mappings.container.classList.remove('hide_hidden_fields');
				else
					mappings.container.classList.add('hide_hidden_fields');
			});

			// CONFIG

			const done_callback = ()=> {
				mappings.container.classList.add('loaded');
				this.constructor_has_run = true;
				resolve(mappings);
			};


			if (!this.constructor_has_run)
				main.constructor_first_run(done_callback, save_plan_function);
			else
				mappings.list__tables.innerHTML = data_model.html_tables;


			custom_select_element.set_event_listeners(mappings.container, mappings.custom_select_change_event);

			if (this.constructor_has_run)
				done_callback();
		});

	},

	/* Constructor that needs to be run only once (fetches data model, initializes other modules */
	constructor_first_run(done_callback, save_plan_function){

		data_model.view_payload = {

			// all required fields are not hidden, except for these, which are made not required
			required_fields_to_hide: [
				'timestampcreated',
				'collectionmemberid',
				'rankid',
				'defintion',
				'definitionitem',
				'ordernumber',
				'isprimary',
				'isaccepted',
				'treedef',
			],
			tables_to_hide: [
				'definition',
				'definitionitem',
				'geographytreedef',
				'geologictimeperiodtreedef',
				'treedef',
				...data_model.get_list_of_hierarchy_tables()
			],

			// forbid setting any of the tables that have these keywords as base tables
			table_keywords_to_exclude: [
				'Authorization',
				'Variant',
				'Attribute',
				'Property',
				'Item',
				'Definition',
				'Pnt',
				'Type',
			],

			required_fields_to_be_made_optional: {
				'agent': ['agenttype'],
				'determination': ['current'],
				'loadpreparation': ['isresolved'],
				'locality': ['srclatlongunit'],
			},

		}

		// fetch data model
		data_model.fetch_tables(() => {

			mappings.list__tables.innerHTML = data_model.html_tables;
			done_callback();

		});

		main.save_plan = save_plan_function;

	},

	/*
	* Validates the current mapping and shows error messages if needed
	* */
	validate(){

		const validation_results = data_model.show_required_missing_ranks(data_model.base_table_name, mappings.get_mappings_tree());

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
					text: 'Return to mapping headers', click: function(){
						$(this).dialog('close')
					},
				},
				{
					text: 'Save unfinished mapping', click: () => main.save_plan(undefined, true)
				}
			]
		});


		return validation_results;

	},

};

module.exports = main;