const $ = require('jquery');

const mappings = require('./mappings.ts');
const fetch_data_model = require('./fetch_data_model.ts');
const data_model = require('./data_model.ts');
const upload_plan_converter = require('./upload_plan_converter.ts');
const custom_select_element = require('./custom_select_element.ts');
const cache = require('./cache.ts');
const auto_mapper = require('./auto_mapper.ts');

/*
* Parent class for `mappings`. Defines elements and manages it's constructors
* */
class main {

	private static constructor_has_run :boolean = false;
	private static save_plan :(event :object | undefined, ignore_validation :boolean) => void;

	/* Constructor that finds the needed elements, and makes sure to call constructor_first_run once */
	public static initialize(
		save_plan_function :(event :object | undefined, ignore_validation :boolean) => void  // the function to call to save changes to the upload plan
	) :Promise<object> /* a promise that resolves to a mappings object */ {

		main.save_plan = save_plan_function;

		return new Promise((resolve) => {


			// FINDING ELEMENTS
			mappings.container = document.getElementById('screen__mapping');

			const loaded = main.loading_screen();

			// header
			mappings.wbplanview_header = document.getElementById('wbplanview_header');
			mappings.title__table_name = document.getElementById('title__table_name');
			mappings.button__change_table = document.getElementById('button__change_table');
			mappings.button__toggle_mapping_view = document.getElementById('button__toggle_mapping_view');

			// lists
			mappings.list__tables = document.getElementById('list__tables');
			mappings.mapping_view = document.getElementById('mapping_view');
			mappings.mapping_view_map_button = document.getElementById('wbplanview_mapping_view_map_button');
			mappings.validation_results = document.getElementById('validation_results');
			mappings.list__mappings = document.getElementById('list__mappings');

			// control elements
			const add_new_column = document.getElementById('add_new_column') as HTMLElement;
			const add_new_static_column = document.getElementById('add_new_static_column') as HTMLElement;
			mappings.toggle_hidden_fields = document.getElementById('checkbox__toggle_hidden_fields');

			mappings.hide_hidden_fields = true;
			mappings.hide_mapping_view = false;
			mappings.need_to_define_lines = true;
			mappings.need_to_run_auto_mapper = true;
			mappings.lines = [];
			data_model.headers = [];
			data_model.base_table_name = undefined;
			upload_plan_converter.get_mappings_tree = mappings.get_mappings_tree.bind(mappings);


			// SETTING EVENT LISTENERS
			mappings.button__change_table.addEventListener('click', mappings.reset_table.bind(mappings));

			mappings.button__toggle_mapping_view.addEventListener('click', () => {
				mappings.hide_mapping_view = !mappings.container.classList.contains('hide_mapping_view');
				cache.set('ui', 'hide_mapping_view', mappings.hide_mapping_view, {
					overwrite: true,
				});
				if (mappings.hide_mapping_view)
					mappings.container.classList.add('hide_mapping_view');
				else {
					mappings.container.classList.remove('hide_mapping_view');
					mappings.update_mapping_view();
				}
			});

			mappings.list__mappings.addEventListener('click', (event :{target :HTMLElement}) => {

				const el = event.target;

				const wbplanview_mappings_line_delete = el.closest('.wbplanview_mappings_line_delete');
				if (wbplanview_mappings_line_delete)
					mappings.clear_line(wbplanview_mappings_line_delete);

				const wbplanview_mappings_line = el.closest('.wbplanview_mappings_line');
				if (wbplanview_mappings_line)
					mappings.focus_line(wbplanview_mappings_line);

			});

			mappings.mapping_view_map_button.addEventListener('click', mappings.mapping_view_map_button_callback);

			add_new_column.addEventListener('click', () => {
				mappings.add_new_mapping_line({
					header_data: {
						header_name: '',
						mapping_type: 'new_column'
					},
					blind_add_back: true,
					scroll_down: true,
				});
			});

			add_new_static_column.addEventListener('click', () => {
				mappings.add_new_mapping_line({
					header_data: {
						header_name: '',
						mapping_type: 'new_static_column'
					},
					blind_add_back: true,
					scroll_down: true,
				});
			});

			mappings.toggle_hidden_fields.addEventListener('change', () => {

				const hide_hidden_fields = !mappings.container.classList.contains('hide_hidden_fields');

				cache.set('ui', 'hide_hidden_fields', hide_hidden_fields, {
					overwrite: true,
				});

				if (!hide_hidden_fields)
					mappings.container.classList.remove('hide_hidden_fields');
				else
					mappings.container.classList.add('hide_hidden_fields');
			});

			// CONFIG

			if (cache.get('ui', 'hide_hidden_fields'))
				mappings.container.classList.add('hide_hidden_fields');
			else
				mappings.toggle_hidden_fields.checked = true;

			if (cache.get('ui', 'hide_mapping_view'))
				mappings.container.classList.add('hide_mapping_view');

			const done_callback = () => {
				main.constructor_has_run = true;
				loaded();
				resolve(mappings);
			};


			if (!main.constructor_has_run)
				main.constructor_first_run(done_callback);
			else
				mappings.list__tables.innerHTML = data_model.html_tables;


			custom_select_element.set_event_listeners(
				mappings.container,
				mappings.custom_select_change_event,
				mappings.show_automapper_suggestions
			);

			if (main.constructor_has_run)
				done_callback();

		});
	};

	/* Constructor that needs to be run only once (fetches data model, initializes other modules */
	private static constructor_first_run(
		done_callback :() => void,  // the callback to call for when the constructor is finished
	) :void {

		fetch_data_model.fetch(
			{

				// all required fields are not hidden, except for these, which are made not required
				required_fields_to_hide: [
					'timestampcreated',
					'timestampmodified',
					'createdbyagent',
					'modifiedbyagent',
					'collectionmemberid',
					'rankid',
					'defintion',
					'definitionitem',
					'ordernumber',
					'isprimary',
					'isaccepted',
					'isloanable',
					'treedef',
				],
				tables_to_hide: [
					'definition',
					'definitionitem',
					'geographytreedef',
					'geologictimeperiodtreedef',
					'treedef',
					...fetch_data_model.get_list_of_hierarchy_tables()
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
					'determination': ['iscurrent'],
					'loadpreparation': ['isresolved'],
					'locality': ['srclatlongunit'],
				},

			},
			(tables :data_model_tables, html_tables :string, ranks :data_model_ranks) => {

				data_model.tables = tables;
				data_model.html_tables = html_tables;
				data_model.ranks = ranks;

				mappings.list__tables.innerHTML = html_tables;
				done_callback();
			}
		);

		auto_mapper.get_mapped_fields = mappings.get_mapped_fields.bind(mappings);
		mappings.loading_screen = main.loading_screen;

	};

	/* Validates the current mapping and shows error messages if needed */
	public static validate() :boolean | string  /* true if everything is fine or {string} formatted validation error message */ {

		const validation_results = data_model.show_required_missing_fields(data_model.base_table_name, mappings.get_mappings_tree());
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
					click: () => main.save_plan(undefined, true)
				}
			]
		});


		return validation_results;

	};

	/* Shows a loading screen a returns a callback that removes the loading screen */
	public static loading_screen() :() => void /* callback that removes a loading screen */ {

		mappings.container.classList.remove('loaded');

		const dialog = $('<div><div class="progress-bar"></div></div>').dialog({
			title: 'Loading',
			modal: true,
			// @ts-ignore
			open: function (event :any, ui :{dialog :object}) :void {
				$('.ui-dialog-titlebar-close', ui.dialog).hide();
			},
			close: function () :void {
				$(this).remove();
			}
		});
		$('.progress-bar', dialog).progressbar({value: false});

		return () => {
			mappings.container.classList.add('loaded');
			dialog.dialog('close');
		};

	};

}

export = main;