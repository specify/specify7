"use strict";

const schema = require('../schema.js');
const domain = require('../domain.js');
const helper = require('./helper.js');
const html_generator = require('./html_generator.js');
const cache = require('./cache.js');


/*
* Fetches data model with tree ranks and converts them to convenient format
* */
const data_model = {

	reference_symbol: '#',
	tree_symbol: '$',
	path_join_symbol: '_',
	new_header_id: 1,

	ranks_queue: {},

	/*
	* Fetches data model.
	* @param {function} done_callback - Function that is called once data model is fetched. HTML list of tables and raw list of tables is passed as parameters
	* */
	fetch_tables(done_callback){

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

		if (Object.keys(this.ranks_queue).length === 0)  // there aren't any trees
			done_callback();  // so there is no need to wait for ranks to finish fetching

	},

	/*
	* Fetches ranks for a particular table
	* @param {string} table_name - Official table name (from data model)
	* @param {function} all_ranks_fetched_callback - Function that is called once data model is fetched. HTML list of tables and raw list of tables is passed as parameters
	* */
	fetch_ranks(table_name, all_ranks_fetched_callback){

		this.ranks_queue[table_name] = true;

		domain.getTreeDef(table_name).done(tree_definition => {
			tree_definition.rget('treedefitems').done(
				treeDefItems => {
					treeDefItems.fetch({limit: 0}).done(() => {

						data_model.ranks[table_name] = Object.values(treeDefItems['models']).reduce((table_ranks, rank) => {

							const rank_id = rank.get('id');

							if (rank_id === 1)
								return table_ranks;

							const rank_name = rank.get('name');

							//TODO: add complex logic for figuring out if rank is required or not
							table_ranks[rank_name] = false;
							// table_ranks[rank_name] = rank.get('isenforced');

							return table_ranks;

						}, {});

						this.ranks_queue[table_name] = false;

						let still_waiting_for_ranks_to_fetch =
							Object.values(this.ranks_queue).find(
								is_waiting_for_rank_to_fetch => is_waiting_for_rank_to_fetch
							);

						//TODO: remove this to enable all fields for trees (once upload plan starts supporting that)
						this.tables[table_name]['fields'] = {'name': this.tables[table_name]['fields']['name']};

						if (!still_waiting_for_ranks_to_fetch) {  // the queue is empty and all ranks where fetched
							all_ranks_fetched_callback();
							cache.set('data_model', 'ranks', data_model.ranks);
						}

					});
				}
			);
		});

	},

	/*
	* Returns a list of hierarchy tables
	* @result {array} list of hierarchy tables
	* */
	get_list_of_hierarchy_tables(){
		return schema.orgHierarchy.filter(
			table_name => table_name !== 'collectionobject'
		);
	},

	/*
	* Iterates over the mapping_tree to find required fields that are missing
	* @param {string} table_name - Official name of the current base table (from data model)
	* @param {object} mapping_tree - Result of running mappings.get_mapping_tree() - an object with information about currently mapped fields
	* @returns {array} Returns array of mapping paths (array).
	* */
	show_required_missing_fields(table_name, mapping_tree = false, previous_table_name = '', path = [], results = []){

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
							parent_relationship_data['type'].indexOf('-to-many') !== -1 &&
							field_data['type'].indexOf('-to-many') !== -1
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

	table_is_tree(table_name){
		return typeof data_model.ranks[table_name] !== "undefined";
	},

	navigator(payload){

		let {
			callbacks,
			recursive_payload = undefined,
			internal_payload = {},
			config: {
				use_cache = false,
				cache_name,
				base_table_name,
			}
		} = payload;


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

		const callback_payload = {
			table_name: table_name,
		};


		if (callbacks.iterate(internal_payload))
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

	navigator_instance(payload){

		const {
			table_name,
			internal_payload,
			parent_table_name = '',
			parent_table_relationship_name = '',
			parent_path_element_name = '',
			use_cache = false,
			cache_name = false,
			callbacks,
			callback_payload,
		} = payload;


		let json_payload;

		if (cache_name !== false)
			json_payload = JSON.stringify(payload);

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

	relationship_is_to_many: relationship_type =>
		relationship_type.indexOf('-to-many') !== -1,

	value_is_reference_item: value =>
		typeof value !== "undefined" &&
		value.substr(0, data_model.reference_symbol.length) === data_model.reference_symbol,

	value_is_tree_rank: value =>
		typeof value !== "undefined" &&
		value.substr(0, data_model.tree_symbol.length) === data_model.tree_symbol,

	get_index_from_reference_item_name: value =>
		parseInt(value.substr(data_model.reference_symbol.length)),

	get_name_from_tree_rank_name: value =>
		value.substr(data_model.tree_symbol.length),

	get_max_to_many_value: values =>
		values.reduce((max, value) => {

			//skip `add` values and other possible NaN cases
			if (!data_model.value_is_reference_item(value))
				return max;

			const number = data_model.get_index_from_reference_item_name(value);

			if (number > max)
				return number;

			return max;

		}, 0),

	format_reference_item: rank_name =>
		data_model.reference_symbol + rank_name,

	format_tree_rank: rank_name =>
		data_model.tree_symbol + rank_name,

};

module.exports = data_model;