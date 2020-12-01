"use strict";

const schema = require('../schema.js');
const domain = require('../domain.js');
const helper = require('./helper.ts');
const html_generator = require('./html_generator.ts');
const cache = require('./cache.ts');


interface navigator_parameters {
	readonly callbacks :object,
	readonly recursive_payload? :object | undefined
	readonly internal_payload? :object
	readonly config :{
		readonly use_cache? :boolean
		readonly cache_name :string
		readonly base_table_name :string
	}
}

interface navigator_instance_parameters {
	readonly table_name :string,
	readonly internal_payload :object,
	readonly parent_table_name? :string,
	readonly parent_table_relationship_name? :string,
	readonly parent_path_element_name? :string,
	readonly use_cache? :boolean
	readonly cache_name? :string | false
	readonly callbacks :object
	readonly callback_payload :object
}

/*
* Fetches data model with tree ranks and converts them to convenient format
* */
const data_model = {

	// each of this can be modified to a single symbol or several symbols
	reference_symbol: '#',  // prefix for -to-many indexes (used behind the scenes & is shown to the user)
	tree_symbol: '$',  // prefix for tree ranks (used behind the scenes)
	path_join_symbol: '_',  // a symbol to use to join multiple mapping path elements together when need to represent mapping path as a string

	new_header_id: 1,  // the index that would be shown in the header name the next time the user presses a `Add new column` button

	tables: {},
	html_tables: {},
	ranks: {},
	ranks_queue: {},  // the queue of ranks that still need to be fetched

	/* Fetches the data model */
	fetch_tables(
		done_callback :() => void  // Function that is called once data model is fetched. HTML list of tables and raw list of tables is passed as parameters
	) :void {

		if (typeof localStorage !== "undefined") {
			data_model.tables = cache.get('data_model', 'tables');
			data_model.html_tables = cache.get('data_model', 'html_tables');
			data_model.ranks = cache.get('data_model', 'ranks');
			if (data_model.tables && data_model.html_tables && data_model.ranks)
				return done_callback();
			else
				data_model.ranks = {};
		}

		const table_previews = {};

		data_model.tables = Object.values(schema.models).reduce((tables, table_data) => {

			const table_name = table_data['longName'].split('.').pop().toLowerCase();
			const table_friendly_name = table_data.getLocalizedName();

			let fields = {};
			let has_relationship_with_definition = false;
			let has_relationship_with_definition_item = false;

			if (
				table_data['system'] ||
				data_model.view_payload.tables_to_hide.indexOf(table_name) !== -1
			)
				return tables;

			for (const field of table_data['fields']) {

				let field_name = field['name'];
				let friendly_name = field.getLocalizedName();

				if (typeof friendly_name === "undefined")
					friendly_name = helper.get_friendly_name(field_name);

				field_name = field_name.toLowerCase();

				let is_required = field.isRequired;
				let is_hidden = field.isHidden() === 1;

				// required fields should not be hidden // unless they are present in this list
				if (data_model.view_payload.required_fields_to_hide.indexOf(field_name) !== -1) {
					is_required = false;
					is_hidden = true;
				}
				else if (is_hidden && is_required)
					is_hidden = false;

				if (
					typeof data_model.view_payload.required_fields_to_be_made_optional[table_name] !== "undefined" &&
					data_model.view_payload.required_fields_to_be_made_optional[table_name].includes(field_name)
				)
					is_required = false;

				const field_data = {
					friendly_name: friendly_name,
					is_hidden: is_hidden,
					is_required: is_required,
					is_relationship: field['isRelationship'],
				};

				if (field_data['is_relationship']) {

					let foreign_name = field['otherSideName'];
					if (typeof foreign_name !== "undefined")
						foreign_name = foreign_name.toLowerCase();

					const relationship_type = field['type'];
					const table_name = field['relatedModelName'].toLowerCase();

					if (field_name === 'definition') {
						has_relationship_with_definition = true;
						continue;
					}

					if (field_name === 'definitionitem') {
						has_relationship_with_definition_item = true;
						continue;
					}

					if (
						field['readOnly'] ||
						data_model.view_payload.tables_to_hide.indexOf(table_name) !== -1
					)
						continue;

					field_data['table_name'] = table_name;
					field_data['type'] = relationship_type;
					field_data['foreign_name'] = foreign_name;

				}

				fields[field_name] = field_data;

			}

			const ordered_fields = Object.fromEntries(Object.keys(fields).sort().map(field_name =>
				[field_name, fields[field_name]]
			));


			if (!data_model.view_payload.table_keywords_to_exclude.some(table_keyword_to_exclude => table_friendly_name.indexOf(table_keyword_to_exclude) !== -1))
				table_previews[table_name] = table_friendly_name;

			tables[table_name] = {
				table_friendly_name: table_friendly_name,
				fields: ordered_fields,
			};

			if (has_relationship_with_definition && has_relationship_with_definition_item)
				data_model.fetch_ranks(table_name, done_callback);

			return tables;

		}, {});


		for (const [table_name, table_data] of Object.entries(data_model.tables))  // remove relationships to system tables
			for (const [relationship_name, relationship_data] of Object.entries(table_data['fields']))
				if (relationship_data['is_relationship'] && typeof data_model.tables[relationship_data['table_name']] === "undefined")
					delete data_model.tables[table_name]['fields'][relationship_name];

		data_model.html_tables = html_generator.tables(table_previews);
		cache.set('data_model', 'html_tables', data_model.html_tables);
		cache.set('data_model', 'tables', data_model.tables);

		if (Object.keys(data_model.ranks_queue).length === 0)  // there aren't any trees
			done_callback();  // so there is no need to wait for ranks to finish fetching

	},

	/* Fetches ranks for a particular table */
	fetch_ranks(
		table_name :string,  // Official table name (from the data model)
		all_ranks_fetched_callback :() => void  // Function that is called once data model is fetched. HTML list of tables and raw list of tables is passed as parameters
	) :void {

		data_model.ranks_queue[table_name] = true;

		domain.getTreeDef(table_name).done(tree_definition => {
			tree_definition.rget('treedefitems').done(
				treeDefItems => {
					treeDefItems.fetch(<RequestInfo>{limit: 0}).done(() => {

						data_model.ranks[table_name] = Object.values(treeDefItems['models']).reduce((table_ranks, rank) => {

							const rank_id = rank.get('id');

							if (rank_id === 1)
								return table_ranks;

							const rank_name = rank.get('name');

							// TODO: add complex logic for figuring out if rank is required or not
							table_ranks[rank_name] = false;
							// table_ranks[rank_name] = rank.get('isenforced');

							return table_ranks;

						}, {});

						data_model.ranks_queue[table_name] = false;

						let still_waiting_for_ranks_to_fetch =
							Object.values(data_model.ranks_queue).find(
								is_waiting_for_rank_to_fetch => is_waiting_for_rank_to_fetch
							);

						// TODO: remove this to enable all fields for trees (once upload plan starts supporting that)
						data_model.tables[table_name]['fields'] = {'name': data_model.tables[table_name]['fields']['name']};

						if (!still_waiting_for_ranks_to_fetch) {  // the queue is empty and all ranks where fetched
							all_ranks_fetched_callback();
							cache.set('data_model', 'ranks', data_model.ranks);
						}

					});
				}
			);
		});

	},

	/* Returns a list of hierarchy tables */
	get_list_of_hierarchy_tables: () :string[] /* list of hierarchy tables */ =>
		schema.orgHierarchy.filter(
			table_name => table_name !== 'collectionobject'
		),

	/* Iterates over the mapping_tree to find required fields that are missing */
	show_required_missing_fields(
		table_name :string,  // Official name of the current base table (from data model)
		mapping_tree :object | boolean = false,  // Result of running mappings.get_mapping_tree() - an object with information about currently mapped fields
		previous_table_name :string = '',  // used internally in recursion. Previous table name
		path :string[] = [],  // used internally in recursion. Current mapping path
		results :string[][] = []  // used internally in recursion. Saves results
	) :string[][] /* array of mapping paths (array) */ {

		const table_data = data_model.tables[table_name];

		const list_of_mapped_fields = Object.keys(mapping_tree);

		// handle -to-many references
		if (data_model.value_is_reference_item(list_of_mapped_fields[0])) {
			for (const mapped_field_name of list_of_mapped_fields) {
				const local_path = [...path, mapped_field_name];
				data_model.show_required_missing_fields(table_name, mapping_tree[mapped_field_name], previous_table_name, local_path, results);
			}
			return results;
		}

		// handle trees
		else if (typeof data_model.ranks[table_name] !== "undefined") {

			const keys = Object.keys(data_model.ranks[table_name]);
			const last_path_element = path.slice(-1)[0];
			const last_path_element_is_a_rank = data_model.value_is_tree_rank(last_path_element);

			if (!last_path_element_is_a_rank)
				return keys.reduce((results, rank_name) => {
					const is_rank_required = data_model.ranks[table_name][rank_name];
					const complimented_rank_name = data_model.tree_symbol + rank_name;
					const local_path = [...path, complimented_rank_name];

					if (list_of_mapped_fields.indexOf(complimented_rank_name) !== -1)
						data_model.show_required_missing_fields(table_name, mapping_tree[complimented_rank_name], previous_table_name, local_path, results);
					else if (is_rank_required)
						results.push(local_path);

					return results;

				}, results);
		}

		// handle regular fields and relationships
		for (const [field_name, field_data] of Object.entries(table_data['fields'])) {

			const local_path = [...path, field_name];

			const is_mapped = list_of_mapped_fields.indexOf(field_name) !== -1;


			if (field_data['is_relationship']) {

				if (previous_table_name !== '') {

					let previous_relationship_name = local_path.slice(-2)[0];
					if (
						data_model.value_is_reference_item(previous_relationship_name) ||
						data_model.value_is_tree_rank(previous_relationship_name)
					)
						previous_relationship_name = local_path.slice(-3)[0];

					const parent_relationship_data = data_model.tables[previous_table_name]['fields'][previous_relationship_name];

					if (
						(  // disable circular relationships
							field_data['foreign_name'] === previous_relationship_name &&
							field_data['table_name'] === previous_table_name
						) ||
						(  // skip -to-many inside of -to-many
							data_model.relationship_is_to_many(parent_relationship_data['type']) &&
							data_model.relationship_is_to_many(field_data['type'])
						)
					)
						continue;

				}

				if (is_mapped)
					data_model.show_required_missing_fields(field_data['table_name'], mapping_tree[field_name], table_name, local_path, results);
				else if (field_data['is_required'])
					results.push(local_path);
			}
			else if (!is_mapped && field_data['is_required'])
				results.push(local_path);


		}

		return results;

	},

	/* Returns whether a table has tree ranks */
	table_is_tree: (
		/* string */ table_name
	) :boolean /* whether a table has tree ranks */ =>  // the name of the table to check
		typeof data_model.ranks[table_name] !== "undefined",

	/* Navigates though the schema according to a specified mapping path and calls certain callbacks while doing that */
	navigator({
				  callbacks,  // {object} described below
				  recursive_payload = undefined,  // {object|undefined} used internally to make navigator call itself multiple times
				  internal_payload = {},  // {object} payload that is shared between the callback functions only and is not modified by the navigator
				  config: {
					  use_cache = false,  // {boolean} whether to use cached values
					  cache_name,  // {string} the name of the cache bucket to use
					  base_table_name,  // {string} the name of the base table to use
				  }
			  } :navigator_parameters) :any /* returns the value returned by callbacks['get_final_data'](internal_payload) */ {


		/*
		*
		* Callbacks can be modified depending on the need to make navigator very versatile
		*
		* callbacks: {
		* 	iterate (internal_payload):
		* 		should return {boolean} specifying whether to run data_model.navigator_instance() for a particular mapping path part
		*
		* 	get_next_path_element (internal_payload, callback_payload):
		* 		should return undefined if there is no next path element
		* 		else, should return an {object}: {
		*	 		next_path_element_name, // {string} - the name of the next path element
		*			next_path_element,  // if the next path element is not a field nor a relationship, {undefined}. Else, {object} the information about a field from data_model.tables
		*			next_real_path_element_name,  // If next_path_element_name is not a field nor a relationships, {string} current path element name. Else next_path_element_name
		* 		}
		*
		*	get_final_data (internal_payload):
		* 		formats internal_payload and returns it. Would be used as a return value for the navigator
		*
		*	commit_instance_data (internal_payload, callback_payload):
		* 		commits callback_payload.data to internal_payload and returns committed data
		*
		*	navigator_instance_pre (internal_payload, callback_payload):
		* 		called inside of navigator_instance before it calls callbacks for tree ranks / reference items / simple fields
		*
		* 	handle_to_many_children (internal_payload, callback_payload):
		* 		handles to_many children
		*
		* 	handle_tree_ranks (internal_payload, callback_payload):
		* 		handles tree ranks children
		*
		* 	handle_simple_fields (internal_payload, callback_payload):
		* 		handles fields and relationships
		* }
		*
		* */


		let table_name = '';
		let parent_table_name = '';
		let parent_table_relationship_name = '';
		let parent_path_element_name = '';

		if (typeof recursive_payload === "undefined")
			table_name = base_table_name;
		else
			({
				table_name,
				parent_table_name,
				parent_table_relationship_name,
				parent_path_element_name,
			} = recursive_payload);

		const callback_payload = {  // an object that is shared between navigator, navigator_instance and some callbacks
			table_name: table_name,
		};


		if (callbacks['iterate'](internal_payload))
			data_model.navigator_instance({
				table_name: table_name,
				internal_payload: internal_payload,
				parent_table_name: parent_table_name,
				parent_table_relationship_name: parent_table_relationship_name,
				parent_path_element_name: parent_path_element_name,
				use_cache: use_cache,
				cache_name: cache_name,
				callbacks: callbacks,
				callback_payload: callback_payload,
			});


		const next_path_elements_data = callbacks['get_next_path_element'](internal_payload, callback_payload);

		if (typeof next_path_elements_data === "undefined")
			return callbacks['get_final_data'](internal_payload);

		let {
			next_path_element_name,
			next_path_element,
			next_real_path_element_name,
		} = next_path_elements_data;

		let next_table_name = '';
		let next_parent_table_name = '';

		if (
			data_model.value_is_reference_item(next_path_element_name) ||
			data_model.value_is_tree_rank(next_path_element_name)
		) {
			next_table_name = table_name;
			next_parent_table_name = parent_table_name;
		}
		else if (typeof next_path_element !== "undefined" && next_path_element['is_relationship']) {
			next_table_name = next_path_element['table_name'];
			next_parent_table_name = table_name;
		}


		const schema_navigator_results = [];

		if (next_table_name !== '')
			schema_navigator_results.push(
				data_model.navigator(
					{
						callbacks: callbacks,
						recursive_payload: {
							table_name: next_table_name,
							parent_table_name: next_parent_table_name,
							parent_table_relationship_name: next_real_path_element_name,
							parent_path_element_name: next_path_element_name,
						},
						internal_payload: internal_payload,
						config: {
							use_cache: use_cache,
							cache_name: cache_name,
						},
					}
				));

		if (schema_navigator_results.length === 0)
			return callbacks['get_final_data'](internal_payload);
		if (schema_navigator_results.length === 1)
			return schema_navigator_results[0];
		else
			return schema_navigator_results;

	},

	/* Called by navigator if callback.iterate returned true */
	navigator_instance({
						   table_name,  // {string} the name of the current table
						   internal_payload,  // {object} internal payload (described in navigator)
						   parent_table_name = '',  // {string} parent table name
						   parent_table_relationship_name = '',  // {string} next_real_path_element_name as returned by callbacks.get_next_path_element
						   parent_path_element_name = '',  // {string} next_path_element_name as returned by callbacks.get_next_path_element
						   use_cache = false,  // {boolean} whether to use cache
						   cache_name = false,  // {boolean} the name of the cache bucket to use
						   callbacks,  // {object} callbacks (described in navigator)
						   callback_payload,  // {object} callbacks payload (described in navigator)
					   } :navigator_instance_parameters) :any /* the value returned by callbacks['get_instance_data'](internal_payload, callback_payload) */ {


		let json_payload;

		if (cache_name !== false)
			json_payload = JSON.stringify(arguments[0]);

		if (use_cache) {
			const cached_data = cache.get(cache_name, json_payload);
			if (cached_data) {
				callback_payload.data = cached_data;
				return callbacks['commit_instance_data'](internal_payload, callback_payload);
			}
		}

		callbacks['navigator_instance_pre'](internal_payload, callback_payload);

		const parent_relationship_type =
			(
				typeof data_model.tables[parent_table_name] !== "undefined" &&
				typeof data_model.tables[parent_table_name]['fields'][parent_table_relationship_name] !== "undefined"
			) ? data_model.tables[parent_table_name]['fields'][parent_table_relationship_name]['type'] : '';
		const children_are_to_many_elements =
			data_model.relationship_is_to_many(parent_relationship_type) &&
			!data_model.value_is_reference_item(parent_path_element_name);

		const children_are_ranks =
			data_model.table_is_tree(table_name) &&
			!data_model.value_is_tree_rank(parent_path_element_name);

		callback_payload.parent_relationship_type = parent_relationship_type;
		callback_payload.parent_table_name = parent_table_name;

		if (children_are_to_many_elements)
			callbacks['handle_to_many_children'](internal_payload, callback_payload);
		else if (children_are_ranks)
			callbacks['handle_tree_ranks'](internal_payload, callback_payload);
		else
			callbacks['handle_simple_fields'](internal_payload, callback_payload);


		const data = callbacks['get_instance_data'](internal_payload, callback_payload);
		callback_payload.data = data;
		callbacks['commit_instance_data'](internal_payload, callback_payload);

		if (cache_name !== false)
			cache.set(cache_name, json_payload, data, {
				bucket_type: 'session_storage'
			});

		return data;

	},

	/* Returns whether relationship is a -to-many (e.x. one-to-many or many-to-many) */
	relationship_is_to_many: (
		relationship_type :string  // relationship_type
	) :boolean /* whether relationship is a -to-many */ =>
		relationship_type.indexOf('-to-many') !== -1,

	/* Returns whether a value is a -to-many reference item (e.x #1, #2, etc...) */
	value_is_reference_item: (
		value :string  // the value to use
	) :boolean /* whether a value is a -to-many reference item */ =>
		typeof value !== "undefined" &&
		value.substr(0, data_model.reference_symbol.length) === data_model.reference_symbol,

	/* Returns whether a value is a tree rank name (e.x $Kingdom, $Order) */
	value_is_tree_rank: (
		value :string  // the value to use
	) :boolean /* whether a value is a tree rank */ =>
		typeof value !== "undefined" &&
		value.substr(0, data_model.tree_symbol.length) === data_model.tree_symbol,

	/*
	* Returns index from a complete reference item value (e.x #1 => 1)
	* Opposite of format_reference_item
	* */
	get_index_from_reference_item_name: (
		value :string  // the value to use
	) :number /* index */ =>
		parseInt(value.substr(data_model.reference_symbol.length)),

	/*
	* Returns tree rank name from a complete tree rank name (e.x $Kingdom => Kingdom)
	* Opposite of format_tree_rank
	* */
	get_name_from_tree_rank_name: (
		value :string   // the value to use
	) :string /*tree rank name*/ =>
		value.substr(data_model.tree_symbol.length),

	/* Returns the max index in the list of reference item values */
	get_max_to_many_value: (
		values :string[]  // list of reference item values
	) :number /* max index. Returns 0 if there aren't any */ =>
		values.reduce((max, value) => {

			// skip `add` values and other possible NaN cases
			if (!data_model.value_is_reference_item(value))
				return max;

			const number = data_model.get_index_from_reference_item_name(value);

			if (number > max)
				return number;

			return max;

		}, 0),

	/*
	* Returns a complete reference item from an index (e.x 1 => #1)
	* Opposite of get_index_from_reference_item_name
	* */
	format_reference_item: (
		index :number  // the index to use
	) :string /* a complete reference item from an index */ =>
		data_model.reference_symbol + index,

	/*
	* Returns a complete tree rank name from a tree rank name (e.x Kingdom => $Kingdom)
	* Opposite of get_name_from_tree_rank_name
	* */
	format_tree_rank: (
		rank_name :string  // tree rank name to use
	) :string /* a complete tree rank name */ =>
		data_model.tree_symbol + rank_name[0].toUpperCase() + rank_name.slice(1).toLowerCase(),

};

module.exports = data_model;
