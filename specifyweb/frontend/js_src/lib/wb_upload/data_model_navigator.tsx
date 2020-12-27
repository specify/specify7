"use strict";

const cache = require('./cache.tsx');
const data_model_helper = require('./data_model_helper.tsx');
const data_model_storage = require('./data_model_storage.tsx');


class data_model_navigator {

	public static get_mapped_fields: (mapping_path_filter :mapping_path, skip_empty? :boolean)=>mappings_tree;

	/* Navigates though the schema according to a specified mapping path and calls certain callbacks while doing that */
	public static navigator({
								callbacks,
								recursive_payload = undefined,
								internal_payload = {},
								config: {
									use_cache = false,
									cache_name,
									base_table_name,
								}
							} :navigator_parameters) :any /* returns the value returned by callbacks.get_final_data(internal_payload) */ {

		let table_name = '';
		let parent_table_name = '';
		let parent_table_relationship_name = '';
		let parent_path_element_name = '';

		if (typeof recursive_payload === "undefined") {
			if (typeof base_table_name === "undefined")
				throw new Error("Base table needs to be specified for navigator to be able to loop though schema");
			table_name = base_table_name;
		}
		else
			({
				table_name,
				parent_table_name,
				parent_table_relationship_name,
				parent_path_element_name,
			} = recursive_payload);

		const callback_payload = {  // an object that is shared between navigator, navigator_instance and some callbacks
			table_name,
		};


		if (callbacks.iterate(internal_payload))
			data_model_navigator.navigator_instance({
				table_name,
				internal_payload,
				parent_table_name,
				parent_table_relationship_name,
				parent_path_element_name,
				use_cache,
				cache_name,
				callbacks,
				callback_payload,
			});


		const next_path_elements_data = callbacks.get_next_path_element(internal_payload, callback_payload);

		if (typeof next_path_elements_data === "undefined")
			return callbacks.get_final_data(internal_payload);

		let {
			next_path_element_name,
			next_path_element,
			next_real_path_element_name,
		} = next_path_elements_data;

		let next_table_name = '';
		let next_parent_table_name = '';

		if (
			data_model_helper.value_is_reference_item(next_path_element_name) ||
			data_model_helper.value_is_tree_rank(next_path_element_name)
		) {
			next_table_name = table_name;
			next_parent_table_name = parent_table_name;
		}
		else if (typeof next_path_element !== "undefined" && next_path_element.is_relationship) {
			next_table_name = next_path_element.table_name;
			next_parent_table_name = table_name;
		}


		const schema_navigator_results = [];

		if (next_table_name !== '')
			schema_navigator_results.push(
				data_model_navigator.navigator(
					{
						callbacks,
						recursive_payload: {
							table_name: next_table_name,
							parent_table_name: next_parent_table_name,
							parent_table_relationship_name: next_real_path_element_name,
							parent_path_element_name: next_path_element_name,
						},
						internal_payload,
						config: {
							use_cache,
							cache_name,
						},
					}
				));

		if (schema_navigator_results.length === 0)
			return callbacks.get_final_data(internal_payload);
		if (schema_navigator_results.length === 1)
			return schema_navigator_results[0];
		else
			return schema_navigator_results;

	};

	/* Called by navigator if callback.iterate returned true */
	private static navigator_instance({
										 table_name,
										 internal_payload,
										 parent_table_name = '',
										 parent_table_relationship_name = '',
										 parent_path_element_name = '',
										 use_cache = false,
										 cache_name = false,
										 callbacks,
										 callback_payload,
									 } :navigator_instance_parameters) :any /* the value returned by callbacks.get_instance_data(internal_payload, callback_payload) */ {


		let json_payload;

		if (cache_name !== false)
			json_payload = JSON.stringify(arguments[0]);

		if (use_cache) {
			const cached_data = cache.get(cache_name, json_payload);
			if (cached_data) {
				callback_payload.data = cached_data;
				return callbacks.commit_instance_data(internal_payload, callback_payload);
			}
		}

		callbacks.navigator_instance_pre(internal_payload, callback_payload);

		const parent_relationship_type =
			(
				typeof data_model_storage.tables[parent_table_name] !== "undefined" &&
				typeof data_model_storage.tables[parent_table_name].fields[parent_table_relationship_name] !== "undefined"
			) ? (data_model_storage.tables[parent_table_name].fields[parent_table_relationship_name] as data_model_relationship).type : '';
		const children_are_to_many_elements =
			data_model_helper.relationship_is_to_many(parent_relationship_type) &&
			!data_model_helper.value_is_reference_item(parent_path_element_name);

		const children_are_ranks =
			data_model_helper.table_is_tree(table_name) &&
			!data_model_helper.value_is_tree_rank(parent_path_element_name);

		callback_payload.parent_relationship_type = parent_relationship_type;
		callback_payload.parent_table_name = parent_table_name;

		if (children_are_to_many_elements)
			callbacks.handle_to_many_children(internal_payload, callback_payload);
		else if (children_are_ranks)
			callbacks.handle_tree_ranks(internal_payload, callback_payload);
		else
			callbacks.handle_simple_fields(internal_payload, callback_payload);


		const data = callbacks.get_instance_data(internal_payload, callback_payload);
		callback_payload.data = data;
		callbacks.commit_instance_data(internal_payload, callback_payload);

		if (cache_name !== false)
			cache.set(cache_name, json_payload, data, {
				bucket_type: 'session_storage'
			});

		return data;

	};


	/* Returns a mapping line data from mapping path */
	public static get_mapping_line_data_from_mapping_path({
															   mapping_path = [],
															   iterate = true,
															   use_cached = false,
															   generate_last_relationship_data = true,
														   } :get_mapping_line_data_from_mapping_path_parameters) :mapping_element_parameters[] {

		const internal_payload :get_mapping_line_data_from_mapping_path_internal_payload = {
			mapping_path,
			generate_last_relationship_data,
			mapping_path_position: -1,
			iterate,
			mapping_line_data: [],
		};

		const callbacks :navigator_callbacks = {

			iterate: (internal_payload) =>
				(
					internal_payload.iterate ||
					internal_payload.mapping_path.length === 0 ||
					internal_payload.mapping_path_position + 1 === internal_payload.mapping_path.length
				) && (
					internal_payload.generate_last_relationship_data ||
					internal_payload.mapping_path_position + 1 !== internal_payload.mapping_path.length
				),

			get_next_path_element(internal_payload, {table_name}) {

				if (internal_payload.mapping_path_position === -2)
					internal_payload.mapping_path_position = internal_payload.mapping_path.length - 1;

				internal_payload.mapping_path_position++;

				let next_path_element_name = internal_payload.mapping_path[internal_payload.mapping_path_position];

				if (typeof next_path_element_name == "undefined")
					return undefined;

				const formatted_tree_rank_name = data_model_helper.format_tree_rank(next_path_element_name);
				const tree_rank_name = data_model_helper.get_name_from_tree_rank_name(formatted_tree_rank_name);
				if (data_model_helper.table_is_tree(table_name) && typeof data_model_storage.ranks[table_name][tree_rank_name] !== "undefined")
					next_path_element_name = internal_payload.mapping_path[internal_payload.mapping_path_position] = formatted_tree_rank_name;

				let next_real_path_element_name;
				if (data_model_helper.value_is_tree_rank(next_path_element_name) || data_model_helper.value_is_reference_item(next_path_element_name))
					next_real_path_element_name = internal_payload.mapping_path[internal_payload.mapping_path_position - 1];
				else
					next_real_path_element_name = next_path_element_name;

				return {
					next_path_element_name,
					next_path_element: data_model_storage.tables[table_name].fields[next_path_element_name],
					next_real_path_element_name,
				};

			},

			navigator_instance_pre(internal_payload, {table_name}) :void {

				internal_payload.mapping_element_type = 'simple';

				const local_mapping_path = internal_payload.mapping_path.slice(0, internal_payload.mapping_path_position + 1);

				internal_payload.next_mapping_path_element = internal_payload.mapping_path[internal_payload.mapping_path_position + 1];

				if (typeof internal_payload.next_mapping_path_element === "undefined")
					internal_payload.default_value = "0";
				else {
					const formatted_tree_rank_name = data_model_helper.format_tree_rank(internal_payload.next_mapping_path_element);
					const tree_rank_name = data_model_helper.get_name_from_tree_rank_name(formatted_tree_rank_name);
					if (data_model_helper.table_is_tree(table_name) && typeof data_model_storage.ranks[table_name][tree_rank_name] !== "undefined")
						internal_payload.next_mapping_path_element = internal_payload.mapping_path[internal_payload.mapping_path_position] = formatted_tree_rank_name;

					internal_payload.default_value = internal_payload.next_mapping_path_element;

				}

				internal_payload.current_mapping_path_part = internal_payload.mapping_path[internal_payload.mapping_path_position];
				internal_payload.result_fields = {};
				internal_payload.mapped_fields = Object.keys(data_model_navigator.get_mapped_fields(local_mapping_path));
			},

			handle_to_many_children(internal_payload, {table_name}) :void {

				internal_payload.mapping_element_type = 'to_many';

				if (typeof internal_payload.next_mapping_path_element !== "undefined")
					internal_payload.mapped_fields.push(internal_payload.next_mapping_path_element);

				const max_mapped_element_number = data_model_helper.get_max_to_many_value(internal_payload.mapped_fields);

				for (let i = 1; i <= max_mapped_element_number; i++) {
					const mapped_object_name = data_model_helper.format_reference_item(i);

					internal_payload.result_fields[mapped_object_name] = {
						field_friendly_name: mapped_object_name,
						is_enabled: true,
						is_required: false,
						is_hidden: false,
						is_relationship: true,
						is_default: mapped_object_name === internal_payload.default_value,
						table_name,
					};
				}
				internal_payload.result_fields.add = {
					field_friendly_name: 'Add',
					is_enabled: true,
					is_required: false,
					is_hidden: false,
					is_relationship: true,
					is_default: false,
					table_name,
				};

			},

			handle_tree_ranks(internal_payload, {table_name}) :void {

				internal_payload.mapping_element_type = 'tree';

				const table_ranks = data_model_storage.ranks[table_name];
				for (const [rank_name, is_required] of Object.entries(table_ranks)) {
					const formatted_rank_name = data_model_helper.format_tree_rank(rank_name);
					internal_payload.result_fields[formatted_rank_name] = {
						field_friendly_name: rank_name,
						is_enabled: true,
						is_required,
						is_hidden: false,
						is_relationship: true,
						is_default: formatted_rank_name === internal_payload.default_value,
						table_name,
					};
				}

			},

			handle_simple_fields(
				internal_payload,
				{
					table_name,
					parent_table_name,
					parent_relationship_type,
				}
			) :void {

				for (
					const [
						field_name, {
							is_relationship,
							type: relationship_type,
							is_hidden,
							is_required,
							foreign_name,
							friendly_name,
							table_name: field_table_name
						}
					] of Object.entries(data_model_storage.tables[table_name].fields as data_model_fields_writable)) {

					if (
						is_relationship &&
						(  // skip circular relationships
							field_table_name === parent_table_name &&
							(
								(
									typeof foreign_name !== "undefined" &&
									typeof parent_table_name !== "undefined" &&
									typeof data_model_storage.tables[parent_table_name].fields[foreign_name] !== "undefined" &&
									data_model_storage.tables[parent_table_name].fields[foreign_name].foreign_name === field_name
								) ||
								(
									data_model_storage.tables[table_name].fields[field_name].foreign_name === internal_payload.current_mapping_path_part
								)
							)
						) ||
						(  // skip -to-many inside of -to-many  // TODO: remove this once upload plan is ready
							data_model_helper.relationship_is_to_many(relationship_type) &&
							data_model_helper.relationship_is_to_many(parent_relationship_type)
						)
					)
						continue;


					const is_enabled =  // disable field
						internal_payload.mapped_fields.indexOf(field_name) === -1 ||  // if it is mapped
						is_relationship;  // or is a relationship


					const is_default = field_name === internal_payload.default_value;

					internal_payload.result_fields[field_name] = {
						field_friendly_name: friendly_name,
						is_enabled,
						is_required,
						is_hidden,
						is_default,
						is_relationship,
						table_name: field_table_name,
					};


				}

			},

			get_instance_data: (internal_payload, {table_name} :navigator_callback_payload) => ({
				mapping_element_type: internal_payload.mapping_element_type,
				name: internal_payload.current_mapping_path_part,
				friendly_name: data_model_storage.tables[table_name].table_friendly_name,
				table_name,
				fields_data: internal_payload.result_fields,
			}),

			commit_instance_data(internal_payload, callback_payload :navigator_callback_payload) {
				internal_payload.mapping_line_data.push(callback_payload.data);
				return callback_payload.data;
			},

			get_final_data: (internal_payload) =>
				internal_payload.mapping_line_data,
		};

		return data_model_navigator.navigator({
			callbacks,
			internal_payload,
			config: {
				use_cache: use_cached,
				cache_name: 'mapping_line_data',
				base_table_name: data_model_storage.base_table_name,
			}
		});

	};

}

export = data_model_navigator;