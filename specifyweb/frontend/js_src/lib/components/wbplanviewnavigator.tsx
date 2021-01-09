'use strict';

import * as cache from './wbplanviewcache';
import {value_is_reference_item, value_is_tree_rank, relationship_is_to_many, table_is_tree, format_tree_rank,get_name_from_tree_rank_name,get_max_to_many_value,format_reference_item} from './wbplanviewmodelhelper';
import data_model_storage from './wbplanviewmodel';


/* Navigates though the schema according to a specified mapping path and calls certain callbacks while doing that */
export function navigator<RETURN_STRUCTURE>({
	callbacks,
	recursive_payload = undefined,
	config: {
		use_cache = false,
		cache_name,
		base_table_name,
	},
} :navigator_parameters<RETURN_STRUCTURE>) :RETURN_STRUCTURE[] /* returns the value returned by callbacks.get_final_data(internal_state) */ {

	let table_name = '';
	let parent_table_name = '';
	let parent_table_relationship_name = '';
	let parent_path_element_name = '';

	if (typeof recursive_payload === 'undefined') {
		if (typeof base_table_name === 'undefined')
			throw new Error('Base table needs to be specified for navigator to be able to loop though schema');
		table_name = base_table_name;
	}
	else
		(
			{
				table_name,
				parent_table_name,
				parent_table_relationship_name,
				parent_path_element_name,
			} = recursive_payload
		);

	const callback_payload = {  // an object that is shared between navigator, navigator_instance and some callbacks
		table_name,
	};


	if (callbacks.iterate(callback_payload))
		navigator_instance<RETURN_STRUCTURE>({
			table_name,
			parent_table_name,
			parent_table_relationship_name,
			parent_path_element_name,
			use_cache,
			cache_name,
			callbacks,
			callback_payload,
		});


	const next_path_elements_data = callbacks.get_next_path_element(callback_payload);

	if (typeof next_path_elements_data === 'undefined')
		return callbacks.get_final_data(callback_payload);

	let {
		next_path_element_name,
		next_path_element,
		next_real_path_element_name,
	} = next_path_elements_data;

	let next_table_name = '';
	let next_parent_table_name = '';

	if (
		value_is_reference_item(next_path_element_name) ||
		value_is_tree_rank(next_path_element_name)
	) {
		next_table_name = table_name;
		next_parent_table_name = parent_table_name;
	}
	else if (typeof next_path_element !== 'undefined' && next_path_element.is_relationship) {
		next_table_name = next_path_element.table_name;
		next_parent_table_name = table_name;
	}


	let schema_navigator_results:RETURN_STRUCTURE[] = [];

	if (next_table_name !== '')
		schema_navigator_results = navigator(
				{
					callbacks,
					recursive_payload: {
						table_name: next_table_name,
						parent_table_name: next_parent_table_name,
						parent_table_relationship_name: next_real_path_element_name,
						parent_path_element_name: next_path_element_name,
					},
					config: {
						use_cache,
						cache_name,
					},
				},
			);

	if (schema_navigator_results.length === 0)
		return callbacks.get_final_data(callback_payload);
	else
		return schema_navigator_results;

}

/* Called by navigator if callback.iterate returned true */
function navigator_instance<RETURN_STRUCTURE>({
	table_name,
	parent_table_name = '',
	parent_table_relationship_name = '',
	parent_path_element_name = '',
	use_cache = false,
	cache_name = false,
	callbacks,
	callback_payload,
} :navigator_instance_parameters<RETURN_STRUCTURE>) :any /* the value returned by callbacks.get_instance_data(callback_payload) */ {


	let json_payload;

	if (cache_name !== false)
		json_payload = JSON.stringify(arguments[0]);

	if (use_cache && cache_name && json_payload) {
		const cached_data = cache.get(cache_name, json_payload);
		if (cached_data) {
			callback_payload.data = cached_data;
			return callbacks.commit_instance_data(callback_payload);
		}
	}

	callbacks.navigator_instance_pre(callback_payload);

	const parent_relationship_type =
		(
			typeof data_model_storage.tables[parent_table_name] !== 'undefined' &&
			typeof data_model_storage.tables[parent_table_name].fields[parent_table_relationship_name] !== 'undefined'
		) ? (
			data_model_storage.tables[parent_table_name].fields[parent_table_relationship_name] as data_model_relationship
		).type : '';
	const children_are_to_many_elements =
		relationship_is_to_many(parent_relationship_type) &&
		!value_is_reference_item(parent_path_element_name);

	const children_are_ranks =
		table_is_tree(table_name) &&
		!value_is_tree_rank(parent_path_element_name);

	callback_payload.parent_relationship_type = parent_relationship_type;
	callback_payload.parent_table_name = parent_table_name;

	if (children_are_to_many_elements)
		callbacks.handle_to_many_children(callback_payload);
	else if (children_are_ranks)
		callbacks.handle_tree_ranks(callback_payload);
	else
		callbacks.handle_simple_fields(callback_payload);


	const data = callbacks.get_instance_data(callback_payload);
	callback_payload.data = data;
	callbacks.commit_instance_data(callback_payload);

	if (cache_name !== false && json_payload)
		cache.set(cache_name, json_payload, data, {
			bucket_type: 'session_storage',
		});

	return data;

}


/*
* Get data required to build a mapping line from a source mapping path and other options
* */
export function get_mapping_line_data_from_mapping_path({
	base_table_name,
	mapping_path = ["0"],
	open_select_element,
	iterate = true,
	use_cached = false,
	generate_last_relationship_data = true,
	custom_select_type,
	handleChange = ()=>{},
	handleOpen = ()=>{},
	handleClose = ()=>{},
	get_mapped_fields,
	automapper_suggestions,
	show_hidden_fields=true,
} :get_mapping_line_data_from_mapping_path_parameters) :MappingElementProps[] {

	use_cached=false;

	if(mapping_path.length === 0)
		throw new Error('Mapping Path is invalid');

	const internal_state :get_mapping_line_data_from_mapping_path_internal_state = {
		mapping_path_position: -1,
		mapping_line_data: [],
		custom_select_type,
		mapped_fields: [],
		result_fields: {},
		is_open: false,
	};

	const callbacks :navigator_callbacks<MappingElementProps> = {

		iterate: () =>
			(
				iterate ||
				mapping_path.length === 0 ||
				internal_state.mapping_path_position + 1 === mapping_path.length
			) && (
				generate_last_relationship_data ||
				internal_state.mapping_path_position + 1 !== mapping_path.length
			),

		get_next_path_element({table_name}) {

			if (internal_state.mapping_path_position === -2)
				internal_state.mapping_path_position = mapping_path.length - 1;

			internal_state.mapping_path_position++;

			let next_path_element_name = mapping_path[internal_state.mapping_path_position];

			if (typeof next_path_element_name == 'undefined')
				return undefined;

			const formatted_tree_rank_name = format_tree_rank(next_path_element_name);
			const tree_rank_name = get_name_from_tree_rank_name(formatted_tree_rank_name);
			if (table_is_tree(table_name) && typeof data_model_storage.ranks[table_name][tree_rank_name] !== 'undefined')
				next_path_element_name = mapping_path[internal_state.mapping_path_position] = formatted_tree_rank_name;

			let next_real_path_element_name;
			if (value_is_tree_rank(next_path_element_name) || value_is_reference_item(next_path_element_name))
				next_real_path_element_name = mapping_path[internal_state.mapping_path_position - 1];
			else
				next_real_path_element_name = next_path_element_name;

			return {
				next_path_element_name,
				next_path_element: data_model_storage.tables[table_name].fields[next_path_element_name],
				next_real_path_element_name,
			};

		},

		navigator_instance_pre({table_name}) {

			internal_state.is_open =
				(
					typeof open_select_element !== "undefined" &&
					open_select_element.index === internal_state.mapping_path_position+1
				) ||
				['opened_list','suggestion_list'].indexOf(internal_state.custom_select_type) !== -1

			internal_state.custom_select_subtype = 'simple';

			const local_mapping_path = mapping_path.slice(0, internal_state.mapping_path_position + 1);

			internal_state.next_mapping_path_element = mapping_path[internal_state.mapping_path_position + 1];

			if (typeof internal_state.next_mapping_path_element === 'undefined')
				internal_state.default_value = '0';
			else {
				const formatted_tree_rank_name = format_tree_rank(internal_state.next_mapping_path_element);
				const tree_rank_name = get_name_from_tree_rank_name(formatted_tree_rank_name);
				if (table_is_tree(table_name) && typeof data_model_storage.ranks[table_name][tree_rank_name] !== 'undefined')
					internal_state.next_mapping_path_element = mapping_path[internal_state.mapping_path_position] = formatted_tree_rank_name;

				internal_state.default_value = internal_state.next_mapping_path_element;

			}

			internal_state.current_mapping_path_part = mapping_path[internal_state.mapping_path_position];
			internal_state.result_fields = {};
			internal_state.mapped_fields = Object.keys(get_mapped_fields(local_mapping_path));
		},

		handle_to_many_children({table_name}) {

			internal_state.custom_select_subtype = 'to_many';

			if (typeof internal_state.next_mapping_path_element !== 'undefined')
				internal_state.mapped_fields.push(internal_state.next_mapping_path_element);

			const max_mapped_element_number = get_max_to_many_value(internal_state.mapped_fields);

			for (let i = 1; i <= max_mapped_element_number; i++) {
				const mapped_object_name = format_reference_item(i);

				internal_state.result_fields[mapped_object_name] = {
					field_friendly_name: mapped_object_name,
					is_enabled: true,
					is_required: false,
					is_hidden: false,
					is_relationship: true,
					is_default: mapped_object_name === internal_state.default_value,
					table_name,
				};
			}
			internal_state.result_fields.add = {
				field_friendly_name: 'Add',
				is_enabled: true,
				is_required: false,
				is_hidden: false,
				is_relationship: true,
				is_default: false,
				table_name,
			};

		},

		handle_tree_ranks({table_name}) {

			internal_state.custom_select_subtype = 'tree';
			const table_ranks = data_model_storage.ranks[table_name] as table_ranks;

			internal_state.result_fields = Object.fromEntries(
				Object.entries(table_ranks).map(([rank_name, is_required])=>[
					format_tree_rank(rank_name),
					{
						field_friendly_name: rank_name,
						is_enabled: true,
						is_required,
						is_hidden: false,
						is_relationship: true,
						is_default: format_tree_rank(rank_name) === internal_state.default_value,
						table_name,
					}
				])
			);

		},

		handle_simple_fields: ({
			table_name,
			parent_table_name,
			parent_relationship_type,
		}) =>
			internal_state.result_fields = Object.fromEntries(
				Object.entries(data_model_storage.tables[table_name].fields as data_model_fields_writable).filter((
					[
						field_name,
						{
							is_relationship,
							type: relationship_type,
							is_hidden,
							foreign_name,
							table_name: field_table_name
						}
					]
				)=>
					(
						!is_relationship ||
						(  // skip circular relationships
							field_table_name !== parent_table_name ||
							(
								(
									typeof foreign_name === 'undefined' ||
									typeof parent_table_name === 'undefined' ||
									typeof data_model_storage.tables[parent_table_name].fields[foreign_name] === 'undefined' ||
									data_model_storage.tables[parent_table_name].fields[foreign_name].foreign_name !== field_name
								) &&
								data_model_storage.tables[table_name].fields[field_name].foreign_name === internal_state.current_mapping_path_part
							)
						)
					) &&
					(
						(  // skip -to-many inside of -to-many  // TODO: remove this once upload plan is ready
							!relationship_is_to_many(relationship_type) ||
							!relationship_is_to_many(parent_relationship_type)
						) &&
						(  // skip hidden fields when user decided to hide them
							show_hidden_fields ||
							!is_hidden ||
							field_name === internal_state.default_value // show a default field, even if it is hidden
						)
					)
				).map((
					[
						field_name,
						{
							is_relationship,
							is_hidden,
							is_required,
							friendly_name,
							table_name: field_table_name
						}
					]
				)=>[
					field_name,
					{
						field_friendly_name: friendly_name,
						is_enabled:  // disable field
							internal_state.mapped_fields.indexOf(field_name) === -1 ||  // if it is mapped
							is_relationship,  // or is a relationship,
						is_required,
						is_hidden,
						is_default: field_name === internal_state.default_value,
						is_relationship,
						table_name: field_table_name,
					}
				])
			),

		get_instance_data: ({table_name}) => {
			const base_structure = {
				custom_select_type: internal_state.custom_select_type,
				custom_select_subtype: internal_state.custom_select_subtype,
				select_label: data_model_storage.tables[table_name].table_friendly_name,
				fields_data: internal_state.result_fields,
				table_name,
			};

			if(internal_state.is_open === true)
				return {
					...base_structure,
					handleChange: handleChange.bind(null,internal_state.mapping_path_position+1),
					handleClose: handleClose.bind(null,internal_state.mapping_path_position+1),
					automapper_suggestions,
					autoscroll: typeof open_select_element !== "undefined" && open_select_element.autoscroll,
					is_open: true,
				};
			else
				return {
					...base_structure,
					handleOpen: handleOpen.bind(null,internal_state.mapping_path_position+1),
					is_open: false,
				};

		},

		commit_instance_data({data}) {
			internal_state.mapping_line_data.push(data);
			return data;
		},

		get_final_data: () =>
			internal_state.mapping_line_data,
	};

	return navigator<MappingElementProps>({
		callbacks,
		config: {
			use_cache: use_cached,
			cache_name: 'mapping_line_data',
			base_table_name: base_table_name,
		},
	});

}