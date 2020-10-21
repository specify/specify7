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

	},

	/*
	* Fetches data model.
	* @param {function} done_callback - Function that is called once data model is fetched. HTML list of tables and raw list of tables is passed as parameters
	* */
	fetch_tables(done_callback){

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

					if (field_name === 'definition')
						has_relationship_with_definition = true;

					if (field_name === 'definitionitem')
						has_relationship_with_definition_item = true;

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

						if (!still_waiting_for_ranks_to_fetch)  // the queue is empty and all ranks where fetched
							all_ranks_fetched_callback(data_model_handler.data_model_html, data_model_handler.tables);

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

			if (keys.indexOf(path.slice(-1)[0]) === -1)  // last path element is a rank
				return keys.reduce((results, rank_name) => {
					const is_rank_required = data_model_handler.ranks[table_name][rank_name];
					const local_path = [...path, data_model_handler.tree_symbol + rank_name];

					if (list_of_mapped_fields.indexOf(rank_name) !== -1)
						data_model_handler.show_required_missing_ranks(table_name, mapping_tree[rank_name], previous_table_name, local_path, results);
					else if (is_rank_required)
						results.push(local_path);

					return results;

				}, results);
		}

		// handle regular relationships
		for (const [field_name, field_data] of Object.entries(table_data['fields'])) {

			const local_path = [...path, field_name];

			if (field_data['is_relationship']) {

				if (previous_table_name !== '') {

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
							parent_relationship_data['table_name'] === table_name
						) ||
						(  // skip -to-many inside of -to-many
							parent_relationship_data['type'].indexOf('-to-many') !== -1 ||
							field_data['type'].indexOf('-to-many') !== -1
						)
					)
						continue;
				}

				if (list_of_mapped_fields.indexOf(field_name) !== -1)
					data_model_handler.show_required_missing_ranks(field_data['table_name'], mapping_tree[field_name], table_name, local_path, results);
				else if (field_data['is_required'])
					results.push(local_path);
			} else if (field_data['is_required'] && list_of_mapped_fields.indexOf(field_name) === -1)
				results.push(local_path);

		}

		return results;

	},

	is_table_a_tree(table_name){
		return typeof data_model_handler.ranks[table_name] !== "undefined";
	}

};

module.exports = data_model_handler;