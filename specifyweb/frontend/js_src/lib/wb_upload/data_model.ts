const cache = require('./cache.ts');


/*
* Fetches data model with tree ranks and converts them to convenient format
* */
class data_model {

	// each of this can be modified to a single symbol or several symbols
	public static readonly reference_symbol :string = '#';  // prefix for -to-many indexes (used behind the scenes & is shown to the user)
	public static readonly tree_symbol :string = '$';  // prefix for tree ranks (used behind the scenes)
	public static readonly path_join_symbol :string = '_';  // a symbol to use to join multiple mapping path elements together when need to represent mapping path as a string

	public static new_header_id :number = 1;  // the index that would be shown in the header name the next time the user presses a `Add new column` button

	public static tables :data_model_tables;
	public static html_tables :string;
	public static ranks :data_model_ranks;
	public static ranks_queue :{};  // the queue of ranks that still need to be fetched

	/* fetch fields for a table */
	private static readonly get_table_fields = (
		table_name :string,  // the name of the table to fetch the fields for
		filter__is_relationship :boolean | -1 = -1,  // whether fields are relationships
		filter__is_hidden :boolean | -1 = -1  // whether field is hidden
	) :[field_name :string, field_data :data_model_field][] =>
		Object.entries(data_model.tables[table_name].fields).filter(([, {is_relationship, is_hidden}]) =>
			(
				filter__is_relationship === -1 || is_relationship === filter__is_relationship
			) &&
			(
				filter__is_hidden === -1 || is_hidden === filter__is_hidden
			)
		);

	/* fetch fields for a table */
	public static readonly get_table_non_relationship_fields = (
		table_name :string,  // the name of the table to fetch the fields for
		filter__is_hidden :boolean | -1 = -1  // whether field is hidden
	) =>
		data_model.get_table_fields(table_name, false, filter__is_hidden) as [relationship_name :string, relationship_data :data_model_non_relationship][];

	/* fetch relationships for a table */
	public static readonly get_table_relationships = (
		table_name :string,   // the name of the table to fetch relationships fields for,
		filter__is_hidden :boolean | -1 = -1  // whether field is hidden
	) =>
		data_model.get_table_fields(table_name, true, filter__is_hidden) as [relationship_name :string, relationship_data :data_model_relationship][];

	/* Iterates over the mappings_tree to find required fields that are missing */
	public static show_required_missing_fields(
		table_name :string,  // Official name of the current base table (from data model)
		mappings_tree :mappings_tree | undefined = undefined,  // Result of running mappings.get_mappings_tree() - an object with information about currently mapped fields
		previous_table_name :string = '',  // used internally in recursion. Previous table name
		path :mapping_path = [],  // used internally in recursion. Current mapping path
		results :string[][] = []  // used internally in recursion. Saves results
	) :string[][] /* array of mapping paths (array) */ {

		const table_data = data_model.tables[table_name];

		if (typeof mappings_tree === "undefined")
			return results;

		const list_of_mapped_fields = Object.keys(mappings_tree);

		// handle -to-many references
		if (data_model.value_is_reference_item(list_of_mapped_fields[0])) {
			for (const mapped_field_name of list_of_mapped_fields) {
				const local_path = [...path, mapped_field_name];
				if (typeof mappings_tree[mapped_field_name] !== "undefined" && typeof mappings_tree[mapped_field_name] !== "string")
					data_model.show_required_missing_fields(table_name, <mappings_tree>mappings_tree[mapped_field_name], previous_table_name, local_path, results);
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
						data_model.show_required_missing_fields(table_name, mappings_tree[complimented_rank_name] as mappings_tree, previous_table_name, local_path, results);
					else if (is_rank_required)
						results.push(local_path);

					return results;

				}, results);
		}

		// handle regular fields and relationships
		for (const [field_name, field_data] of Object.entries(table_data.fields)) {

			const local_path = [...path, field_name];

			const is_mapped = list_of_mapped_fields.indexOf(field_name) !== -1;


			if (field_data.is_relationship) {


				if (previous_table_name !== '') {

					let previous_relationship_name = local_path.slice(-2)[0];
					if (
						data_model.value_is_reference_item(previous_relationship_name) ||
						data_model.value_is_tree_rank(previous_relationship_name)
					)
						previous_relationship_name = local_path.slice(-3)[0];

					const parent_relationship_data = data_model.tables[previous_table_name].fields[previous_relationship_name] as data_model_relationship;

					if (
						(  // disable circular relationships
							field_data.foreign_name === previous_relationship_name &&
							field_data.table_name === previous_table_name
						) ||
						(  // skip -to-many inside of -to-many
							data_model.relationship_is_to_many(parent_relationship_data.type) &&
							data_model.relationship_is_to_many(field_data.type)
						)
					)
						continue;

				}

				if (is_mapped)
					data_model.show_required_missing_fields(field_data.table_name, <mappings_tree>mappings_tree[field_name], table_name, local_path, results);
				else if (field_data.is_required)
					results.push(local_path);
			}
			else if (!is_mapped && field_data.is_required)
				results.push(local_path);


		}

		return results;

	};

	/* Returns whether a table has tree ranks */
	public static readonly table_is_tree = (
		table_name :string
	) :boolean /* whether a table has tree ranks */ =>  // the name of the table to check
		typeof data_model.ranks[table_name] !== "undefined";

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
			data_model.value_is_reference_item(next_path_element_name) ||
			data_model.value_is_tree_rank(next_path_element_name)
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
			return callbacks.get_final_data(internal_payload);
		if (schema_navigator_results.length === 1)
			return schema_navigator_results[0];
		else
			return schema_navigator_results;

	};

	/* Called by navigator if callback.iterate returned true */
	public static navigator_instance({
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
				typeof data_model.tables[parent_table_name] !== "undefined" &&
				typeof data_model.tables[parent_table_name].fields[parent_table_relationship_name] !== "undefined"
			) ? (data_model.tables[parent_table_name].fields[parent_table_relationship_name] as data_model_relationship).type : '';
		const children_are_to_many_elements =
			data_model.relationship_is_to_many(parent_relationship_type) &&
			!data_model.value_is_reference_item(parent_path_element_name);

		const children_are_ranks =
			data_model.table_is_tree(table_name) &&
			!data_model.value_is_tree_rank(parent_path_element_name);

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

	/* Returns whether relationship is a -to-many (e.x. one-to-many or many-to-many) */
	public static readonly relationship_is_to_many = (
		relationship_type :relationship_type | undefined | ''
	) :boolean /* whether relationship is a -to-many */ =>
		typeof relationship_type !== "undefined" &&
		relationship_type.indexOf('-to-many') !== -1;

	/* Returns whether a value is a -to-many reference item (e.x #1, #2, etc...) */
	public static readonly value_is_reference_item = (
		value :string | undefined  // the value to use
	) :boolean /* whether a value is a -to-many reference item */ =>
		typeof value !== "undefined" &&
		value.substr(0, data_model.reference_symbol.length) === data_model.reference_symbol;

	/* Returns whether a value is a tree rank name (e.x $Kingdom, $Order) */
	public static readonly value_is_tree_rank = (
		value :string  // the value to use
	) :boolean /* whether a value is a tree rank */ =>
		typeof value !== "undefined" &&
		value.substr(0, data_model.tree_symbol.length) === data_model.tree_symbol;

	/*
	* Returns index from a complete reference item value (e.x #1 => 1)
	* Opposite of format_reference_item
	* */
	public static readonly get_index_from_reference_item_name = (
		value :string  // the value to use
	) :number =>
		parseInt(value.substr(data_model.reference_symbol.length));

	/*
	* Returns tree rank name from a complete tree rank name (e.x $Kingdom => Kingdom)
	* Opposite of format_tree_rank
	* */
	public static readonly get_name_from_tree_rank_name = (
		value :string   // the value to use
	) :string /*tree rank name*/ =>
		value.substr(data_model.tree_symbol.length);

	/* Returns the max index in the list of reference item values */
	public static readonly get_max_to_many_value = (
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

		}, 0);

	/*
	* Returns a complete reference item from an index (e.x 1 => #1)
	* Opposite of get_index_from_reference_item_name
	* */
	public static readonly format_reference_item = (
		index :number  // the index to use
	) :string /* a complete reference item from an index */ =>
		data_model.reference_symbol + index;

	/*
	* Returns a complete tree rank name from a tree rank name (e.x Kingdom => $Kingdom)
	* Opposite of get_name_from_tree_rank_name
	* */
	public static readonly format_tree_rank = (
		rank_name :string  // tree rank name to use
	) :string /* a complete tree rank name */ =>
		data_model.tree_symbol + rank_name[0].toUpperCase() + rank_name.slice(1).toLowerCase();

}

export = data_model;