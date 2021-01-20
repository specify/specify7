/*
*
* Auto mapper than takes data model and header names and returns possible mappings
*
* */

'use strict';

import AutoMapperDefinitions, {
	Options,
	TableSynonym,
}                                      from './automapperdefinitions';
import data_model_storage              from './wbplanviewmodel';
import {
	value_is_tree_rank,
	format_tree_rank,
	value_is_reference_item,
	get_table_non_relationship_fields,
	get_name_from_tree_rank_name,
	get_table_relationships,
	relationship_is_to_many,
	format_reference_item,
	get_index_from_reference_item_name,
	mapping_path_to_string,
	is_circular_relationship,
	is_too_many_inside_of_too_many,
}                                      from './wbplanviewmodelhelper';
import * as cache                      from './wbplanviewcache';
import { find_array_divergence_point } from './wbplanviewhelper';
import { Action, generate_dispatch }   from './statemanagement';
import {
	AutomapperScope,
	ListOfHeaders,
	MappingPath,
	PathIsMappedBind,
	RelationshipType,
}                                      from './wbplanviewmapper';


type AutoMapperNode = 'shortcuts_and_table_synonyms' | 'synonyms_and_matches'

interface AutoMapperConstructorBaseParameters {
	readonly headers: ListOfHeaders,  // array of strings that represent headers
	readonly base_table: string,  // base table name
	// starting table name (if starting mapping_path provided, starting table would be different from base table)
	readonly starting_table?: string,
	readonly path?: MappingPath,  // starting mapping path
	// offset on a starting path. Used when the last element of mapping path is a reference index
	// E.x, if #1 is taken, it would try to change the index to #2
	readonly path_offset?: number,
	readonly allow_multiple_mappings?: boolean,  // whether to allow multiple mappings
	readonly scope?: AutomapperScope,  // scope to use for definitions. More info in json/auto_mapper_definitions.js
}

interface AutoMapperConstructorCheckExistingParameters extends AutoMapperConstructorBaseParameters {
	// whether to check if the field is already mapped (outside automapper, in the mapping tree)
	readonly check_for_existing_mappings: true,
	readonly path_is_mapped: PathIsMappedBind,
}

interface AutoMapperConstructorDontCheckExistingParameters extends AutoMapperConstructorBaseParameters {
	// whether to check if the field is already mapped (outside automapper, in the mapping tree)
	readonly check_for_existing_mappings: false,
	readonly path_is_mapped?: PathIsMappedBind,
}

type AutoMapperConstructorParameters =
	AutoMapperConstructorCheckExistingParameters
	| AutoMapperConstructorDontCheckExistingParameters

export type AutoMapperResults = Record<string, MappingPath[]>

interface FindMappingsParameters {
	readonly table_name: string,  // name of current table
	readonly path: MappingPath,  // current mapping path
	// parent table name. Empty if current table is a base table. Used to prevent circular relationships
	readonly parent_table_name?: string,
	// relationship type between parent table and current table. Empty if current table is a base table
	// Used to prevent mapping -to-many that are inside -to-many
	// (only while upload plan doesn't support such relationships)
	readonly parent_relationship_type?: undefined | RelationshipType,
}

interface AutoMapperResultsAddAction extends Action<'add'> {
	header_name: string,
	mapping_path: MappingPath,
}

type AutoMapperResultsActions = AutoMapperResultsAddAction;

interface AutoMapperHeadersToMapMapped extends Action<'mapped'> {
	header_name: string
}

type AutoMapperHeadersToMapActions = AutoMapperHeadersToMapMapped;

type AutoMapperSearchedTablesReset = Action<'reset'>

interface AutoMapperSearchedTablesAdd extends Action<'add'> {
	table_name: string,
}

type AutoMapperSearchedTablesActions = AutoMapperSearchedTablesAdd | AutoMapperSearchedTablesReset;

interface AutomapperFindMappingsQueueEnqueue extends Action<'enqueue'> {
	value: FindMappingsParameters,
	level: number,
}

interface AutomapperFindMappingsQueueReset extends Action<'reset'> {
	initial_value?: FindMappingsParameters
}

interface AutomapperFindMappingsQueueInitializeLevel extends Action<'initialize_level'> {
	level: number
}

type AutomapperFindMappingsQueueActions =
	AutomapperFindMappingsQueueReset
	| AutomapperFindMappingsQueueInitializeLevel
	| AutomapperFindMappingsQueueEnqueue;


const match_base_rank_name = (  // find cases like `Phylum` and remap them to `Phylum > Name`
	friendly_name: string,
	striped_rank_name: string,
	stripped_header_name: string,
) =>
	friendly_name === 'name' &&
	striped_rank_name === stripped_header_name;

const match_rank_and_field_name = (  // find cases like `Kingdom Author`
	stripped_header_name: string,
	striped_rank_name: string,
	friendly_name: string,
	final_header_name: string,
	field_name: string,
) =>
	stripped_header_name === `${striped_rank_name} ${friendly_name}` ||
	final_header_name === `${striped_rank_name} ${field_name}`;

const is_field_in_dont_match = (table_name: string, last_path_part: string, scope: AutomapperScope) =>
	table_name !== '' &&
	AutoMapperDefinitions.dont_match[table_name]?.[last_path_part]?.indexOf(scope) !== -1;

const mapping_path_is_in_proposed_mappings = (
	allow_multiple_mappings: boolean,
	results: AutoMapperResults,
	local_path: MappingPath,
) =>
	!allow_multiple_mappings &&
	Object.values(results).some(mapping_paths =>
		mapping_paths.some(mapping_path =>
			mapping_path_to_string(local_path) === mapping_path_to_string(mapping_path),
		),
	);

const mapping_path_is_the_mappings_tree = (
	check_for_existing_mappings: boolean,
	local_path: MappingPath,
	path_is_mapped?: PathIsMappedBind,
) =>
	check_for_existing_mappings &&
	typeof path_is_mapped === 'function' &&
	path_is_mapped(local_path);


export default class Automapper {

	private readonly results: AutoMapperResults = {};
	private readonly scope: AutomapperScope = 'automapper';
	private readonly allow_multiple_mappings: boolean = false;
	private readonly check_for_existing_mappings: boolean = false;
	private readonly path_offset: number = 0;
	private readonly base_table: string = '';
	private readonly starting_table: string = '';
	private readonly starting_path: MappingPath = [];
	private readonly path_is_mapped?: PathIsMappedBind;
	private readonly headers_to_map: {
		readonly [original_header_name: string]: {  // a dictionary of headers that need to be mapped
			is_mapped: boolean,
			readonly lowercase_header_name: string,  // original_header_name.toLowerCase() and trimmed
			readonly stripped_header_name: string,  // lowercase_header_name but without numbers and special characters (a-z only)
			readonly final_header_name: string  // stripped_header_name but without any white space
		}
	} = {};

	private searched_tables: string[] = [];
	// used to enforce higher priority for closer mappings
	private find_mappings_queue: FindMappingsParameters[][] = [];

	// used to replace any white space characters with space
	private static readonly regex_replace_whitespace: RegExp = /\s+/g;
	// used to remove non letter characters
	private static readonly regex_remove_non_az: RegExp = /[^a-z\s]+/g;
	private static readonly depth: number = 6;  // how deep to go into the schema
	// the definitions for the comparison functions
	private static readonly comparisons: { [key in keyof Options]: any } = {
		regex: (header: string, regex: RegExp) => regex.exec(header),
		string: (header: string, string: string) => header === string,
		contains: (header: string, string: string) => header.indexOf(string) !== -1,
	};

	private dispatch: {
		results: (action: AutoMapperResultsActions) => void,
		headers_to_map: (action: AutoMapperHeadersToMapActions) => void,
		searched_tables: (action: AutoMapperSearchedTablesActions) => void,
		find_mappings_queue: (action: AutomapperFindMappingsQueueActions) => void
	} = {
		results: generate_dispatch<AutoMapperResultsActions>({
			'add': ({header_name, mapping_path}) => {
				this.results[header_name] ??= [];

				if (mapping_path.length === 0)
					throw new Error('Invalid mapping path suggested by automapper');

				this.results[header_name].push(mapping_path);
			},
		}),
		headers_to_map: generate_dispatch<AutoMapperHeadersToMapActions>({
			'mapped': ({header_name}) => {
				if (!this.allow_multiple_mappings)
					this.headers_to_map[header_name].is_mapped = true;
			},
		}),
		searched_tables: generate_dispatch<AutoMapperSearchedTablesActions>({
			'add': ({table_name}) => {
				this.searched_tables.push(table_name);
			},
			'reset': () => {
				this.searched_tables = [];
			},
		}),
		find_mappings_queue: generate_dispatch<AutomapperFindMappingsQueueActions>({
			'reset': ({initial_value}) => {
				typeof initial_value === 'undefined' ?
					this.find_mappings_queue = [] :
					this.find_mappings_queue = [[
						initial_value,
					]];
			},
			'initialize_level': ({level}) => {
				this.find_mappings_queue[level] ??= [];
			},
			'enqueue': ({level, value}) => {
				this.find_mappings_queue[level].push(value);
			},
		}),
	};

	constructor({
		headers: raw_headers,
		base_table,
		starting_table = base_table,
		path = [],
		path_offset = 0,
		allow_multiple_mappings = false,
		scope = 'automapper',
		check_for_existing_mappings = false,
		path_is_mapped,
	}: AutoMapperConstructorParameters) {
		// strip extra characters to increase mapping success
		this.headers_to_map = Object.fromEntries(raw_headers.map(original_name => {

			const lowercase_name = original_name.toLowerCase().replace(Automapper.regex_replace_whitespace, ' ').trim();
			const stripped_name = lowercase_name.replace(Automapper.regex_remove_non_az, '');
			const final_name = stripped_name.split(' ').join('');

			return [original_name, {
				is_mapped: false,
				lowercase_header_name: lowercase_name,
				stripped_header_name: stripped_name,
				final_header_name: final_name,
			}];

		}));

		this.results = {};
		this.scope = scope;
		this.allow_multiple_mappings = allow_multiple_mappings;
		this.check_for_existing_mappings = check_for_existing_mappings;
		this.path_offset = path.length - path_offset;
		this.base_table = base_table;
		this.starting_table = starting_table;
		this.starting_path = path;
		this.path_is_mapped = path_is_mapped;
	}


	/* Method that would be used by external classes to match headers to possible mappings */
	public map({
		use_cache = true,
		commit_to_cache = true,
	}: {
		readonly use_cache?: boolean,  // whether to use cached values
		readonly commit_to_cache?: boolean,  // whether to commit result to cache for future references
	} = {}): AutoMapperResults {

		if (Object.keys(this.headers_to_map).length === 0)
			return {};


		const cache_name = JSON.stringify([
			this.headers_to_map,
			this.base_table,
			this.starting_table,
			this.starting_path,
			this.path_offset,
			this.scope,
		]);

		if (use_cache && commit_to_cache) {
			const cached_data = cache.get('automapper', cache_name);
			if (cached_data)
				return cached_data;
		}

		// do 2 passes over the schema
		this.find_mappings_driver('shortcuts_and_table_synonyms');
		this.find_mappings_driver('synonyms_and_matches');


		if (commit_to_cache)
			cache.set('automapper', cache_name, this.results);

		return this.results;

	}

	/*
	* Makes sure that `find_mappings` runs over the schema in correct order since mappings with a shorter mapping
	* path are given higher priority
	* */
	private find_mappings_driver(
		mode: AutoMapperNode,
	): void {

		const path_matches_starting_path = (path: MappingPath, level: string) =>
			!this.starting_path[parseInt(level) - 1] ??
			find_array_divergence_point(path, this.starting_path.slice(0, parseInt(level))) !== -1;

		this.dispatch.searched_tables({type: 'reset'});
		this.dispatch.find_mappings_queue({
			type: 'reset',
			initial_value: mode === 'synonyms_and_matches' ?
				{
					table_name: this.starting_table,
					path: this.starting_path,
					parent_table_name: '',
				} :
				{
					table_name: this.base_table,
					path: [],
					parent_table_name: '',
				},
		});

		let queue_data;
		do {

			queue_data = Object.entries(this.find_mappings_queue);
			this.dispatch.find_mappings_queue({
				type: 'reset',
			});

			queue_data.forEach(([level, mappings_data]) =>  // go through each level of the queue in order
				mappings_data.filter(payload =>
					mode !== 'shortcuts_and_table_synonyms' ||
					level === '0' ||
					path_matches_starting_path(payload.path, level),
				).forEach(payload =>
					this.find_mappings(payload, mode),
				),
			);

		} while (queue_data.length !== 0);

	}

	/* Compares definitions to unmapped headers and makes a mapping if matched */
	private handle_definition_comparison = (
		path: MappingPath,  // initial mapping path
		comparisons: Options,
		// function that returns the next path part to use in a new mapping (on success)
		get_new_path_part: () => MappingPath,
	) =>
		this.get_unmapped_headers().forEach(([header_key, {lowercase_header_name}]) =>
			Object.entries(Automapper.comparisons).filter(([comparison_key]) =>  // loop over defined comparisons
				comparison_key in comparisons,
			).some(([comparison_key, comparison_function]) =>
				//@ts-ignore
				// loop over each value of a comparison
				Object.values(comparisons[comparison_key] as RegExp[] | string[]).some(comparison_value =>

					comparison_function(lowercase_header_name, comparison_value) &&
					this.make_mapping(
						path,
						get_new_path_part().map(path_part =>
							value_is_tree_rank(path_part) ?
								path_part :
								path_part.toLowerCase(),
						),
						header_key,
					),
				),
			));

	private get_unmapped_headers = () =>
		Object.entries(this.headers_to_map).filter(([, {is_mapped}]) =>  // loop over unmapped headers
			!is_mapped,
		);

	/*
	* Goes over `shortcuts` and `synonyms` in AutomapperDefinitions.tsx and tries to find matches
	* Calls handle_definition_comparison to make comparison
	* */
	private find_mappings_in_definitions({
		path,
		table_name,
		field_name,
		mode,
		is_tree_rank = false,
	}: {
		readonly path: MappingPath,  // current mapping path
		readonly table_name: string,  // the table to search in
		readonly field_name: string,  // the field to search in
		readonly mode: AutoMapperNode,
		readonly is_tree_rank?: boolean,  // whether to format field_name as a tree rank name
	}): void {

		if (mode === 'shortcuts_and_table_synonyms' && field_name !== '')
			return;

		if (mode === 'shortcuts_and_table_synonyms') {

			const table_definition_data = AutoMapperDefinitions.shortcuts[table_name];

			table_definition_data?.[this.scope]?.forEach(shortcut_data => {
				const comparisons = shortcut_data.headers;
				const get_new_path_part = () =>
					shortcut_data.mapping_path;
				this.handle_definition_comparison(path, comparisons, get_new_path_part);
			});
		}
		else if (mode === 'synonyms_and_matches') {

			const table_definition_data = AutoMapperDefinitions.synonyms[table_name];

			const comparisons = table_definition_data?.[field_name]?.[this.scope]?.headers;
			const get_new_path_part = () =>
				is_tree_rank ?
					[format_tree_rank(field_name), 'name'] :
					[field_name];
			comparisons && this.handle_definition_comparison(path, comparisons, get_new_path_part);
		}

	}

	/* Searches for `table_synonym` that matches the current table and the current mapping path */
	private find_table_synonyms(
		table_name: string,  // the table to search for
		path: string[],  // current mapping path
		mode: AutoMapperNode,
	): string[] /* table synonyms */ {

		const table_synonyms = AutoMapperDefinitions.table_synonyms[table_name];

		if (
			mode !== 'shortcuts_and_table_synonyms' ||
			typeof table_synonyms === 'undefined'
		)
			return [];

		// filter out -to-many references from the path for matching
		const filtered_path = path.reduce((filtered_path: MappingPath, path_part: string) => {

			if (!value_is_reference_item(path_part))
				filtered_path.push(path_part);

			return filtered_path;

		}, []);

		const filtered_path_string = mapping_path_to_string(filtered_path);
		const filtered_path_with_base_table_string = mapping_path_to_string([
			this.base_table,
			...filtered_path,
		]);

		return table_synonyms.reduce((table_synonyms: string[], table_synonym: TableSynonym) => {

			const mapping_path_string = mapping_path_to_string(table_synonym.mapping_path_filter);

			if (
				filtered_path_string.endsWith(mapping_path_string) ||
				filtered_path_with_base_table_string === mapping_path_string
			)
				table_synonyms.push(...table_synonym.synonyms);

			return table_synonyms;

		}, []);

	}

	private readonly find_formatted_header_field_synonyms = (
		table_name: string,  // the table to search in
		field_name: string,  // the field to search in
	): string[] /* field synonyms */ =>
		AutoMapperDefinitions.synonyms[table_name][field_name][this.scope]?.headers.formatted_header_field_synonym || [];

	private readonly table_was_iterated = (mode: AutoMapperNode, new_depth_level: number, target_table_name: string) =>
		mode === 'synonyms_and_matches' &&
		(
			this.searched_tables.indexOf(target_table_name) !== -1 ||
			this.find_mappings_queue[new_depth_level].map(({table_name}) =>
				table_name,
			).some(table_name =>
				table_name === target_table_name,
			)
		);

	/*
	* Used internally to loop though each field of a particular table and try to match them to unmapped headers
	* This method iterates over the same table only once if in `synonyms_and_matches` mode.
	* */
	private find_mappings(
		{
			table_name,
			path = [],
			parent_table_name = '',
			parent_relationship_type,
		}: FindMappingsParameters,
		mode: AutoMapperNode,
	): void {


		if (mode === 'synonyms_and_matches') {
			if (
				// don't iterate over the same table again when in `synonyms_and_matches` mode
				this.searched_tables.indexOf(table_name) !== -1 ||
				path.length > Automapper.depth  // don't go beyond the depth limit
			)
				return;

			this.dispatch.searched_tables({
				type: 'add',
				table_name,
			});
		}


		const table_data = data_model_storage.tables[table_name];
		const ranks_data = data_model_storage.ranks[table_name];
		const fields = get_table_non_relationship_fields(table_name, false);
		const table_friendly_name = table_data.table_friendly_name.toLowerCase();

		if (typeof ranks_data !== 'undefined') {

			let ranks = Object.keys(ranks_data);
			const push_rank_to_path = path.length <= 0 || !value_is_tree_rank(path[path.length - 1]);

			if (!push_rank_to_path)
				ranks = [get_name_from_tree_rank_name(path[path.length - 1])];

			const find_mappings_in_definitions_payload = {
				path,
				table_name,
				field_name: '',
				mode,
				is_tree_rank: true,
			};

			this.find_mappings_in_definitions(find_mappings_in_definitions_payload);

			ranks.some(rank_name => {
				const striped_rank_name = rank_name.toLowerCase();
				const final_rank_name = format_tree_rank(rank_name);

				find_mappings_in_definitions_payload.field_name = striped_rank_name;

				this.find_mappings_in_definitions(find_mappings_in_definitions_payload);

				if (mode !== 'synonyms_and_matches')
					return;

				fields.map(([field_name, field_data]) => [
					field_data.friendly_name.toLowerCase(),
					field_name,
				]).forEach(([friendly_name, field_name]) =>
					this.get_unmapped_headers().some(([header_name, {
							stripped_header_name,
							final_header_name,
						}]) =>
						(
							match_base_rank_name(
								friendly_name,
								striped_rank_name,
								stripped_header_name,
							) ||
							match_rank_and_field_name(
								stripped_header_name,
								striped_rank_name,
								friendly_name,
								final_header_name,
								field_name,
							)
						) && // don't search for further mappings for this field if we can only map a single header to this field
						this.make_mapping(
							path,
							push_rank_to_path ?
								[final_rank_name, field_name] :
								[field_name],
							header_name,
							table_name,
						),
					),
				);
			});

			return;
		}

		const table_synonyms = this.find_table_synonyms(table_name, path, mode);
		const table_names = [...new Set(
			table_synonyms.length === 0 ?
				[table_name, table_friendly_name] :
				table_synonyms,
		)];

		const find_mappings_in_definitions_payload = {
			path,
			table_name,
			field_name: '',
			mode,
		};

		this.find_mappings_in_definitions(find_mappings_in_definitions_payload);

		fields.some(([field_name, field_data]) => {

			// search in definitions
			find_mappings_in_definitions_payload.field_name = field_name;
			this.find_mappings_in_definitions(find_mappings_in_definitions_payload);

			if (mode !== 'synonyms_and_matches') {
				if (table_synonyms.length === 0)
					return;
				else {  // run though synonyms and matches if table has `table_synonyms` even if not in `synonyms_and_matches` mode
					find_mappings_in_definitions_payload.mode = 'synonyms_and_matches';
					this.find_mappings_in_definitions(find_mappings_in_definitions_payload);
					find_mappings_in_definitions_payload.mode = mode;
				}
			}


			const friendly_name = field_data.friendly_name.toLowerCase();
			const field_names = [...new Set([
				...this.find_formatted_header_field_synonyms(table_name, field_name),
				friendly_name,
				field_name,
			])];

			let to_many_reference_number;
			this.get_unmapped_headers().some(([header_name, {
					lowercase_header_name,
					stripped_header_name,
					final_header_name,
				}]) =>

				!(
					to_many_reference_number = false
				) &&
				(
					// compare each field's schema name and friendly schema name to headers
					field_names.some(field_name =>
						[lowercase_header_name, stripped_header_name, final_header_name].indexOf(field_name) !== -1,
					) ||

					table_names.some(table_synonym =>  // loop through table names and table synonyms

						field_names.some(field_synonym =>  // loop through field names and field synonyms

							stripped_header_name === `${field_synonym} ${table_synonym}` ||

							stripped_header_name.startsWith(table_synonym) &&
							(
								stripped_header_name === `${table_synonym} ${field_synonym}` ||
								[  // try extracting -to-many reference number
									new RegExp(`${table_synonym} (?<index>\\d+) ${field_synonym}`),
									new RegExp(`${table_synonym} ${field_synonym} (?<index>\\d+)`),
								].some(regular_expression => {

									const match = lowercase_header_name.match(regular_expression);

									if (match === null || typeof match[1] === 'undefined')
										return false;

									to_many_reference_number = parseInt(match[1]);
									return true;

								})
							),
						),
					)
				) &&
				this.make_mapping(
					path,
					[field_name],
					header_name,
					table_name,
					to_many_reference_number,
				),
			);

		});


		get_table_relationships(table_name, false).some((
			[
				relationship_key,
				relationship_data,
			],
		) => {

			const local_path = [...path, relationship_key];

			if (relationship_is_to_many(relationship_data.type))
				local_path.push(format_reference_item(1));

			const new_depth_level = local_path.length;

			if (new_depth_level > Automapper.depth)
				return;

			this.dispatch.find_mappings_queue({
				type: 'initialize_level',
				level: new_depth_level,
			});

			const {foreign_name} = relationship_data;

			let current_mapping_path_part = path[path.length - 1];
			if (value_is_reference_item(current_mapping_path_part) || value_is_tree_rank(current_mapping_path_part))
				current_mapping_path_part = path[path.length - 2];

			if (
				// don't iterate over the same tables again
				this.table_was_iterated(mode, new_depth_level, relationship_data.table_name) ||
				(
					mode !== 'synonyms_and_matches' &&
					is_circular_relationship({  // skip circular relationships
						target_table_name: relationship_data.table_name,
						parent_table_name,
						foreign_name,
						relationship_key,
						current_mapping_path_part,
						table_name,
					})
				) ||
				// skip -to-many inside -to-many  // TODO: remove this once upload plan is ready
				is_too_many_inside_of_too_many(relationship_data.type, parent_relationship_type)
			)
				return;

			this.dispatch.find_mappings_queue({
				type: 'enqueue',
				level: new_depth_level,
				value: {
					table_name: relationship_data.table_name,
					path: local_path,
					parent_table_name: table_name,
					parent_relationship_type: relationship_data.type,
				},
			});

		});

	}

	/*
	* Used to check if the table's field is already mapped and if not, makes a new mapping
	* Also, handles -to-many relationships by creating new objects
	* */
	private make_mapping(
		// Mapping path from base table to this table. Should be an empty array if this is base table
		path: string[],
		new_path_parts: MappingPath,  // Elements that should be pushed into `path`
		header_name: string,  // The name of the header that should be mapped
		table_name = '',  // Current table name (used to identify `don't map` conditions)
		// if of type {int} -
		// implants given to_many_reference_number into the mapping path into the first reference item starting from the right
		// if of type {boolean} and is False -
		// don't do anything
		to_many_reference_number: number | false = false,
	): boolean /* false if we can map another mapping to this header.
	Most of the time means that the mapping was not made
	(Mapping fails if field is inside a -to-one relationship or direct child of base table and is already mapped).
	Can also depend on this.allow_multiple_mappings */ {

		let local_path: MappingPath = [...path, ...new_path_parts];
		const last_path_part = local_path[local_path.length - 1];

		if (
			// if this fields is designated as unmappable in the current source
			is_field_in_dont_match(table_name, last_path_part, this.scope) ||
			(  // if a starting path was given and proposed mapping is outside the path
				this.starting_path.length !== 0 &&
				find_array_divergence_point(local_path, this.starting_path.slice(0, local_path.length)) === -1
			)
		)
			return false;

		// if exact -to-many index was found, insert it into the path
		let changes_made: string | boolean = false;
		if (to_many_reference_number !== false)
			local_path = local_path.reverse().map(local_path_part =>
				value_is_reference_item(local_path_part) && changes_made !== false ?
					(
						changes_made = format_reference_item(to_many_reference_number)
					) :
					local_path_part,
			).reverse();

		// check if this path is already mapped and if it is, increment the reference number to make path unique
		while (// go over mapped headers to see if this path was already mapped
			// go over mappings proposed by automapper
		mapping_path_is_in_proposed_mappings(this.allow_multiple_mappings, this.results, local_path) ||
		// go over mappings that are already in the mappings tree
		mapping_path_is_the_mappings_tree(this.check_for_existing_mappings, local_path, this.path_is_mapped)
			) {
			if (// increment the last reference number in the mapping path if it has a reference number in it
				!Object.entries(local_path).reverse().some(([local_path_index, local_path_part], index) =>
					local_path.length - index > this.path_offset && value_is_reference_item(local_path_part) &&
					(
						local_path[parseInt(local_path_index)] = format_reference_item(
							get_index_from_reference_item_name(local_path_part) + 1,
						)
					),
				)
			)
				return false;
		}


		// remove header from the list of unmapped headers
		this.dispatch.headers_to_map({
			type: 'mapped',
			header_name,
		});

		// save result
		this.dispatch.results({
			type: 'add',
			header_name,
			mapping_path: local_path,
		});


		const path_contains_to_many_references = path.some(value_is_reference_item);
		return !path_contains_to_many_references && !this.allow_multiple_mappings;

	}
}