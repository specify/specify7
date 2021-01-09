/*
*
* Fetches Specify's data model with tree ranks, parses it and saves it to an object for and easier usage across wbplanview
*
* */

'use strict';

import schema from '../schema';
import domain from '../domain';

import {get_friendly_name} from './wbplanviewhelper';
import * as cache from './wbplanviewcache';

const fetching_parameters :fetching_parameters = {

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
		...schema.orgHierarchy.filter(table_name =>
			table_name !== 'collectionobject',
		),
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
		agent: ['agenttype'],
		determination: ['iscurrent'],
		loadpreparation: ['isresolved'],
		locality: ['srclatlongunit'],
	},

};

/* Fetches ranks for a particular table */
const fetch_ranks = (
	table_name :string,  // Official table name (from the data model)
) :Promise<table_ranks_inline> =>
	new Promise(resolve =>
		(
			domain as domain
		).getTreeDef(table_name).done(tree_definition =>
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

							}, {} as table_ranks_writable),
						]),
					),
			),
		),
	);

/* Fetches the data model */
export default () :Promise<data_model_fetcher_return> =>
	new Promise(resolve => {

		if (typeof localStorage !== 'undefined') {
			const tables = cache.get('data_model_fetcher', 'tables');
			const list_of_base_tables = cache.get('data_model_fetcher', 'list_of_base_tables');
			const ranks = cache.get('data_model_fetcher', 'ranks');

			if (tables && list_of_base_tables && ranks)
				return resolve({
					tables,
					list_of_base_tables,
					ranks,
				} as data_model_fetcher_return);
		}

		const list_of_base_tables :data_model_list_of_tables_writable = {};
		const fetch_ranks_queue :Promise<table_ranks_inline>[] = [];

		const tables = Object.values((
			schema as unknown as schema
		).models).reduce((tables, table_data) => {

			// @ts-ignore
			const table_name = table_data.longName.split('.').slice(-1)[0].toLowerCase();
			const table_friendly_name = table_data.getLocalizedName();

			const fields :data_model_fields_writable = {};
			let has_relationship_with_definition = false;
			let has_relationship_with_definition_item = false;

			if (
				table_data.system ||
				fetching_parameters.tables_to_hide.indexOf(table_name) !== -1
			)
				return tables;

			table_data.fields.some(field=>{

				let field_name = field.name;
				let friendly_name = field.getLocalizedName();

				if (typeof friendly_name === 'undefined')
					friendly_name = get_friendly_name(field_name);

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
					typeof fetching_parameters.required_fields_to_be_made_optional[table_name] !== 'undefined' &&
					fetching_parameters.required_fields_to_be_made_optional[table_name].includes(field_name)
				)
					is_required = false;

				//@ts-ignore
				let field_data :data_model_field_writable = {
					friendly_name,
					is_hidden,
					is_required,
					is_relationship: field.isRelationship,
				};

				if (field_data.is_relationship) {

					const relationship = field as schema_model_table_relationship;

					let foreign_name = relationship.otherSideName;
					if (typeof foreign_name !== 'undefined')
						foreign_name = foreign_name.toLowerCase();

					const relationship_type = relationship.type;
					const table_name = relationship.relatedModelName.toLowerCase();

					if (field_name === 'definition') {
						has_relationship_with_definition = true;
						return;
					}

					if (field_name === 'definitionitem') {
						has_relationship_with_definition_item = true;
						return;
					}

					if (
						relationship.readOnly ||
						fetching_parameters.tables_to_hide.indexOf(table_name) !== -1
					)
						return;

					field_data.table_name = table_name;
					field_data.type = relationship_type;
					field_data.foreign_name = foreign_name;

				}

				fields[field_name] = field_data;

			});

			const ordered_fields = Object.fromEntries(Object.keys(fields).sort().map(field_name =>
				[field_name, fields[field_name]],
			));


			if (!fetching_parameters.table_keywords_to_exclude.some(table_keyword_to_exclude => table_friendly_name.indexOf(table_keyword_to_exclude) !== -1))
				list_of_base_tables[table_name] = table_friendly_name;

			tables[table_name] = {
				table_friendly_name,
				fields: ordered_fields,
			};

			if (has_relationship_with_definition && has_relationship_with_definition_item)
				fetch_ranks_queue.push(fetch_ranks(table_name));

			return tables;

		}, {} as data_model_tables_writable);


		// remove relationships to system tables
		Object.entries(tables).forEach(([table_name, table_data]) =>
			(
				Object.entries(table_data.fields).filter(([, {is_relationship}]) =>
					is_relationship,
				) as [field_name :string, relationship_data :data_model_relationship][]
			).filter(([, {table_name: relationship_table_name}]) =>
				typeof tables[relationship_table_name] === 'undefined',
			).forEach(([relationship_name]) => {
				delete tables[table_name].fields[relationship_name];
			}),
		);


		cache.set('data_model_fetcher', 'list_of_base_tables', list_of_base_tables);
		cache.set('data_model_fetcher', 'tables', tables);


		Promise.all(fetch_ranks_queue).then(resolved => {

			const ranks :data_model_ranks = Object.fromEntries(resolved);

			// TODO: remove this to enable all fields for trees (once upload plan starts supporting that)
			resolved.forEach(([table_name]) =>
				tables[table_name].fields = {
					name: tables[table_name].fields['name'],
				},
			);

			cache.set('data_model_fetcher', 'ranks', ranks);
			resolve({
				tables: tables as data_model_tables,
				list_of_base_tables,
				ranks,
			});
		});

	});