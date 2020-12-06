const schema = require('../schema.js');
const domain = require('../domain.js');

const html_generator = require('./html_generator.ts');
const helper = require('./helper.ts');
const cache = require('./cache.ts');


/*
* Fetches data model with tree ranks
* */

class data_model_fetcher {

	/* Fetches the data model */
	public static fetch(
		fetching_parameters :fetching_parameters,
		done_callback :(tables :data_model_tables, html_tables :string, ranks :data_model_ranks) => void  // Function that is called once data model is fetched. HTML list of tables and raw list of tables is passed as parameters
	) :void {

		if (typeof localStorage !== "undefined") {
			const tables = cache.get('data_model_fetcher', 'tables');
			const html_tables = cache.get('data_model_fetcher', 'html_tables');
			const ranks = cache.get('data_model_fetcher', 'ranks');

			if (tables && html_tables && ranks)
				return done_callback(tables, html_tables, ranks);
		}

		const table_previews :{[table_name :string] :string} = {};
		const fetch_ranks_queue :Promise<table_ranks_inline>[] = [];

		const tables = (Object.values(schema.models) as schema_model_table_data[]).reduce((tables, table_data) => {


			// @ts-ignore
			const table_name = table_data.longName.split('.').pop().toLowerCase();
			const table_friendly_name = table_data.getLocalizedName();

			const fields :data_model_fields_writable = {};
			let has_relationship_with_definition = false;
			let has_relationship_with_definition_item = false;

			if (
				table_data.system ||
				fetching_parameters.tables_to_hide.indexOf(table_name) !== -1
			)
				return tables;

			for (const field of table_data.fields) {

				let field_name = field.name;
				let friendly_name = field.getLocalizedName();

				if (typeof friendly_name === "undefined")
					friendly_name = helper.get_friendly_name(field_name);

				field_name = field_name.toLowerCase();

				let is_required = field.isRequired;
				let is_hidden = field.isHidden() === 1;

				// required fields should not be hidden // unless they are present in this list
				if (fetching_parameters.required_fields_to_hide.indexOf(field_name) !== -1) {
					is_required = false;
					is_hidden = true;
				}
				else if (is_hidden && is_required)
					is_hidden = false;

				if (
					typeof fetching_parameters.required_fields_to_be_made_optional[table_name] !== "undefined" &&
					fetching_parameters.required_fields_to_be_made_optional[table_name].includes(field_name)
				)
					is_required = false;

				//@ts-ignore
				let field_data :data_model_field_writable = {
					friendly_name: friendly_name,
					is_hidden: is_hidden,
					is_required: is_required,
					is_relationship: field.isRelationship,
				};

				if (field_data.is_relationship) {

					const relationship = <schema_model_table_relationship>field;

					let foreign_name = relationship.otherSideName;
					if (typeof foreign_name !== "undefined")
						foreign_name = foreign_name.toLowerCase();

					const relationship_type = relationship.type;
					const table_name = relationship.relatedModelName.toLowerCase();

					if (field_name === 'definition') {
						has_relationship_with_definition = true;
						continue;
					}

					if (field_name === 'definitionitem') {
						has_relationship_with_definition_item = true;
						continue;
					}

					if (
						relationship.readOnly ||
						fetching_parameters.tables_to_hide.indexOf(table_name) !== -1
					)
						continue;

					field_data.table_name = table_name;
					field_data.type = relationship_type;
					field_data.foreign_name = foreign_name;

				}

				fields[field_name] = field_data;

			}

			const ordered_fields = Object.fromEntries(Object.keys(fields).sort().map(field_name =>
				[field_name, fields[field_name]]
			));


			if (!fetching_parameters.table_keywords_to_exclude.some(table_keyword_to_exclude => table_friendly_name.indexOf(table_keyword_to_exclude) !== -1))
				table_previews[table_name] = table_friendly_name;

			tables[table_name] = {
				table_friendly_name: table_friendly_name,
				fields: <{[field_name :string] :data_model_non_relationship | data_model_relationship}>ordered_fields,
			};

			if (has_relationship_with_definition && has_relationship_with_definition_item)
				fetch_ranks_queue.push(data_model_fetcher.fetch_ranks(table_name));

			return tables;

		}, {} as data_model_tables_writable);


		// remove relationships to system tables
		Object.entries(tables).map(([table_name, table_data]) =>
			(
				<[relationship_name :string, relationship_data :data_model_relationship][]>
					Object.entries(table_data.fields).filter(([, {is_relationship}]) =>
						is_relationship
					)
			).filter(([, {table_name: relationship_table_name}]) =>
				typeof tables[relationship_table_name] === "undefined"
			).map(([relationship_name,]) => {
				delete tables[table_name].fields[relationship_name];
			})
		);


		const html_tables = html_generator.tables(table_previews);
		cache.set('data_model_fetcher', 'html_tables', html_tables);
		cache.set('data_model_fetcher', 'tables', tables);


		Promise.all(fetch_ranks_queue).then(resolved => {

			const ranks :data_model_ranks = Object.fromEntries(resolved);

			// TODO: remove this to enable all fields for trees (once upload plan starts supporting that)
			resolved.map(([table_name]) =>
				tables[table_name].fields = {'name':tables[table_name].fields['name']}
			);

			cache.set('data_model_fetcher', 'ranks', ranks);
			done_callback(tables as data_model_tables, html_tables, ranks);  // so there is no need to wait for ranks to finish fetching
		});

	};

	/* Fetches ranks for a particular table */
	private static readonly fetch_ranks = (
		table_name :string,  // Official table name (from the data model)
	) :Promise<table_ranks_inline> =>
		new Promise((resolve) =>
			(domain as domain).getTreeDef(table_name).done(tree_definition =>
				tree_definition.rget('treedefitems').done(
					treeDefItems =>
						treeDefItems.fetch({limit: 0}).done(() =>
							resolve([
								table_name,
								Object.values(treeDefItems.models).reduce((table_ranks, rank) => {

									const rank_id = rank.get('id');

									if (rank_id === 1)
										return table_ranks;

									const rank_name = rank.get('name');

									// TODO: add complex logic for figuring out if rank is required or not
									table_ranks[rank_name] = false;
									// table_ranks[rank_name] = rank.get('isenforced');

									return table_ranks;

								}, <table_ranks_writable>{})
							])
						)
				)
			)
		);

	/* Returns a list of hierarchy tables */
	public static readonly get_list_of_hierarchy_tables = () :string[] /* list of hierarchy tables */ =>
		schema.orgHierarchy.filter(
			(
				table_name :string
			) => table_name !== 'collectionobject'
		);
}

export = data_model_fetcher;