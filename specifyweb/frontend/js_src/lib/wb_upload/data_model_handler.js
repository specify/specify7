"use strict";

const schema = require('../schema.js');
const domain = require('../domain.js');
const helper = require('./helper.js');
const html_generator = require('./html_generator.js');


/*
* Fetches data model with tree ranks and converts them to convenient format
* */
const data_model_handler = {

	ranks_queue: {},

	/*
	* Constructor that get's the references to needed variables from `mappings`. It is called from mappings.constructor
	* @param {object} ranks - Internal object for storing what ranks are available for particular tables and which ranks are required
	* @param {array} tables_to_hide - Array of tables that should not be fetched. Also, removes relationships to these tables
	* @param {string} reference_symbol - String that is used as an indicator of references
	* @param {string} tree_symbol - String that is used as an indicator of trees
	* @param {array} required_fields_to_hide - Array of strings that represent official names of fields and relationships that are required and hidden and should remain hidden (required fields can't be hidden otherwise)
	* */
	constructor(ranks, tables_to_hide, reference_symbol, tree_symbol, required_fields_to_hide){

		data_model_handler.ranks = ranks;
		data_model_handler.tables_to_hide = tables_to_hide;
		data_model_handler.reference_symbol = reference_symbol;
		data_model_handler.tree_symbol = tree_symbol;
		data_model_handler.required_fields_to_hide = required_fields_to_hide;
		data_model_handler.cache = {};

	},

	/*
	* Fetches data model.
	* @param {function} done_callback - Function that is called once data model is fetched. HTML list of tables and raw list of tables is passed as parameters
	* */
	fetch_tables(done_callback){

		if(typeof localStorage !== "undefined"){
			const tables = localStorage.getItem('specify7_wbplanview_data_model_tables');
			const data_model_html = localStorage.getItem('specify7_wbplanview_data_model_html_tables');
			const ranks = localStorage.getItem('specify7_wbplanview_data_model_ranks');
			if(
				tables !== null &&
				data_model_html !== null &&
				ranks !== null
			){
				data_model_handler.tables = JSON.parse(tables);
				data_model_handler.data_model_html = data_model_html;
				data_model_handler.ranks = JSON.parse(ranks);
				done_callback(data_model_handler.data_model_html, data_model_handler.tables);
				return;
			}
		}

		let data_model_html = '';

		const tables = Object.values(schema.models).reduce((tables, table_data) => {

			const table_name = table_data['longName'].split('.').pop().toLowerCase();
			const table_friendly_name = table_data.getLocalizedName();

			let fields = {};
			let has_relationship_with_definition = false;
			let has_relationship_with_definition_item = false;

			if (
				table_data['system'] ||
				data_model_handler.tables_to_hide.indexOf(table_name) !== -1
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

				if (is_hidden)  // required fields should not be hidden
					if (data_model_handler.required_fields_to_hide.indexOf(field_name) !== -1)  // unless they are present in this list
						is_required = false;
					else if (is_required)
						is_hidden = false;

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

					if (field_name === 'definition'){
						has_relationship_with_definition = true;
						continue;
					}

					if (field_name === 'definitionitem') {
						has_relationship_with_definition_item = true;
						continue;
					}

					if (
						field['readOnly'] ||
						data_model_handler.tables_to_hide.indexOf(table_name) !== -1
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


			tables[table_name] = {
				table_friendly_name: table_friendly_name,
				fields: ordered_fields,
			};

			data_model_html += html_generator.table(table_name, table_friendly_name);


			if (has_relationship_with_definition && has_relationship_with_definition_item)
				data_model_handler.fetch_ranks(table_name, done_callback);

			return tables;

		}, {});


		for (const [table_name, table_data] of Object.entries(tables))  // remove relationships to system tables
			for (const [relationship_name, relationship_data] of Object.entries(table_data['fields']))
				if (relationship_data['is_relationship'] && typeof tables[relationship_data['table_name']] === "undefined")
					delete tables[table_name]['fields'][relationship_name];


		data_model_handler.tables = tables;
		data_model_handler.data_model_html = data_model_html;

		if(typeof localStorage !== "undefined"){
			localStorage.setItem('specify7_wbplanview_data_model_tables', JSON.stringify(data_model_handler.tables));
			localStorage.setItem('specify7_wbplanview_data_model_html_tables', JSON.stringify(data_model_handler.data_model_html));
		}

		if (Object.keys(this.ranks_queue).length === 0)  // there aren't any trees
			done_callback(data_model_html, tables);  // so there is no need to wait for ranks to finish fetching

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

						data_model_handler.ranks[table_name] = Object.values(treeDefItems['models']).reduce((table_ranks, rank) => {

							const rank_id = rank.get('id');

							if (rank_id === 1)
								return table_ranks;

							const rank_name = rank.get('name');
							table_ranks[rank_name] = rank.get('isenforced');

							return table_ranks;

						}, {});

						this.ranks_queue[table_name] = false;

						let still_waiting_for_ranks_to_fetch =
							Object.values(this.ranks_queue).find(
								is_waiting_for_rank_to_fetch => is_waiting_for_rank_to_fetch
							);

						//TODO: remove this to enable all fields for trees (once upload plan starts supporting that)
						this.tables[table_name]['fields'] = {'name':this.tables[table_name]['fields']['name']};

						if (!still_waiting_for_ranks_to_fetch) {  // the queue is empty and all ranks where fetched
							all_ranks_fetched_callback(data_model_handler.data_model_html, data_model_handler.tables);
							if(typeof localStorage !== "undefined")
								localStorage.setItem('specify7_wbplanview_data_model_ranks', JSON.stringify(data_model_handler.ranks));
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
	show_required_missing_ranks(table_name, mapping_tree = false, previous_table_name = '', path = [], results = []){

		const table_data = data_model_handler.tables[table_name];

		const list_of_mapped_fields = Object.keys(mapping_tree);

		// handle -to-many references
		if (list_of_mapped_fields[0].substr(0, data_model_handler.reference_symbol.length) === data_model_handler.reference_symbol) {
			for (const mapped_field_name of list_of_mapped_fields) {
				const local_path = [...path, mapped_field_name];
				data_model_handler.show_required_missing_ranks(table_name, mapping_tree[mapped_field_name], previous_table_name, local_path, results);
			}
			return results;
		}

		// handle trees
		else if (typeof data_model_handler.ranks[table_name] !== "undefined") {

			const keys = Object.keys(data_model_handler.ranks[table_name]);
			const last_path_element = path.slice(-1)[0];
			const last_path_element_is_a_rank = last_path_element.substr(0,data_model_handler.tree_symbol.length)===data_model_handler.tree_symbol;

			if (!last_path_element_is_a_rank)
				return keys.reduce((results, rank_name) => {
					const is_rank_required = data_model_handler.ranks[table_name][rank_name];
					const complimented_rank_name = data_model_handler.tree_symbol + rank_name;
					const local_path = [...path, complimented_rank_name];

					if (list_of_mapped_fields.indexOf(complimented_rank_name) !== -1)
						data_model_handler.show_required_missing_ranks(table_name, mapping_tree[complimented_rank_name], previous_table_name, local_path, results);
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

				if(previous_table_name !== ''){

					let previous_relationship_name = local_path.slice(-2)[0];
					if (
						previous_relationship_name.substr(0, data_model_handler.reference_symbol.length) === data_model_handler.reference_symbol ||
						previous_relationship_name.substr(0, data_model_handler.tree_symbol.length) === data_model_handler.tree_symbol
					)
						previous_relationship_name = local_path.slice(-3)[0];

					const parent_relationship_data = data_model_handler.tables[previous_table_name]['fields'][previous_relationship_name];

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

				if(is_mapped)
					data_model_handler.show_required_missing_ranks(field_data['table_name'], mapping_tree[field_name], table_name, local_path, results);
				else if (field_data['is_required'])
					results.push(local_path);
			}

			else if (!is_mapped && field_data['is_required'])
				results.push(local_path);


		}

		return results;

	},

	is_table_a_tree(table_name){
		return typeof data_model_handler.ranks[table_name] !== "undefined";
	},

	schema_navigator(payload){

		let {
			callbacks,
			recursive_payload=undefined,
			internal_payload={},
			config : {
				use_cache = false,
				cache_name,
			}
		} = payload


		let table_name = '';
		let parent_table_name = '';
		let parent_table_relationship_name = '';

		if (typeof recursive_payload === "undefined")
			table_name = callbacks['get_base_table'](internal_payload);
		else
			({
				table_name,
				parent_table_name,
				parent_table_relationship_name,
			} = recursive_payload);

		const callback_payload = {
			table_name: table_name,
		}


		if (callbacks.iterate(internal_payload))
			data_model_handler.schema_navigator_instance({
				table_name: table_name,
				internal_payload : internal_payload,
				parent_table_name: parent_table_name,
				parent_table_relationship_name: parent_table_relationship_name,
				use_cache: use_cache,
				cache_name: cache_name,
				callbacks: callbacks,
				callback_payload: callback_payload,
			});


		const next_path_element_data = callbacks['get_next_path_element'](internal_payload, callback_payload);

		if(typeof next_path_element_data === "undefined")
			return callbacks['get_final_data'](internal_payload);

		const {
			next_path_element_name,
			next_path_element,
		} = next_path_element_data;

		let next_table_name = '';
		let next_parent_table_name = '';

		if (
			data_model_handler.value_is_reference_item(next_path_element_name) ||
			data_model_handler.value_is_tree_rank(next_path_element_name)
		) {
			next_table_name = table_name;
			next_parent_table_name = parent_table_name;
		} else if (typeof next_path_element !== "undefined" && next_path_element['is_relationship']) {
			next_table_name = next_path_element['table_name'];
			next_parent_table_name = table_name;
		}

		if (next_table_name !== '')
			return data_model_handler.schema_navigator(
		{
					callbacks: callbacks,
					recursive_payload: {
						table_name: next_table_name,
						parent_table_name: next_parent_table_name,
						parent_table_relationship_name: next_path_element_name,
					},
					internal_payload: internal_payload,
					config: {
						use_cache: use_cache,
						cache_name: cache_name,
					},
				}
			);

		return callbacks['get_final_data'](internal_payload);

	},

	schema_navigator_instance(payload){

		const {
			table_name,
			internal_payload,
			parent_table_name = '',
			parent_table_relationship_name = '',
			use_cache: use_cache = false,
			cache_name: cache_name = false,
			callbacks,
			callback_payload,
		} = payload;


		let json_payload;

		if(cache_name !== false)
			json_payload = JSON.stringify(payload);

		if (use_cache){

			if(typeof data_model_handler.cache[cache_name] === "undefined")
				data_model_handler.cache[cache_name] = {};

			const cache = data_model_handler.cache[cache_name][json_payload];
			if(typeof cache !== "undefined"){
				callback_payload.data = cache;
				return callbacks['commit_instance_data'](internal_payload, callback_payload);
			}
		}

		callbacks['navigator_instance_pre'](internal_payload, callback_payload);

		const parent_relationship_type =
			(
				typeof data_model_handler.tables[parent_table_name] !== "undefined" &&
				typeof data_model_handler.tables[parent_table_name]['fields'][parent_table_relationship_name] !== "undefined"
			) ? data_model_handler.tables[parent_table_name]['fields'][parent_table_relationship_name]['type'] : '';
		const children_are_to_many_elements =
			data_model_handler.relationship_is_to_many(parent_relationship_type)
			!data_model_handler.value_is_reference_item(parent_table_relationship_name);

		const children_are_ranks =
			data_model_handler.is_table_a_tree(table_name) &&
			!data_model_handler.value_is_tree_rank(parent_table_relationship_name);

		callback_payload.parent_relationship_type = parent_relationship_type;
		callback_payload.parent_table_name = parent_table_name;

		if (children_are_to_many_elements)
			callbacks['handle_to_many_children'](internal_payload, callback_payload)
		else if (children_are_ranks)
			callbacks['handle_tree_ranks'](internal_payload, callback_payload)
		else
			callbacks['handle_simple_fields'](internal_payload, callback_payload);


		const data = callbacks['get_instance_data'](internal_payload, callback_payload);
		callback_payload.data = data;
		callbacks['commit_instance_data'](internal_payload, callback_payload);

		if(cache_name !== false)
			data_model_handler.cache[cache_name][json_payload] = data;

		return data;

	},

	relationship_is_to_many: relationship_type =>
		relationship_type.indexOf('-to-many') !== -1,

	value_is_reference_item: value =>
		value.substr(0, data_model_handler.reference_symbol.length) === data_model_handler.reference_symbol,

	value_is_tree_rank: value =>
		value.substr(0, data_model_handler.tree_symbol.length) === data_model_handler.tree_symbol,

	get_index_from_reference_item_name: value =>
		parseInt(value.substr(data_model_handler.reference_symbol.length)),

	get_name_from_tree_rank_name(value){
		return value.substr(data_model_handler.tree_symbol.length);
	},

	get_max_to_many_value(values){
		return values.reduce((max, value) => {

			//skip `add` values and other possible NaN cases
			if (!data_model_handler.value_is_reference_item(value))
				return max;

			const number = data_model_handler.get_index_from_reference_item_name(value);

			if (number > max)
				return number;

			return max;

		}, 0);
	},

};

module.exports = data_model_handler;