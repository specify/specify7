const data_model_storage = require('./data_model_storage.ts');

/*
* Fetches data model with tree ranks and converts them to convenient format
* */
class data_model_helper {

	/* fetch fields for a table */
	private static readonly get_table_fields = (
		table_name :string,  // the name of the table to fetch the fields for
		filter__is_relationship :boolean | -1 = -1,  // whether fields are relationships
		filter__is_hidden :boolean | -1 = -1  // whether field is hidden
	) :[field_name :string, field_data :data_model_field][] =>
		Object.entries(data_model_storage.tables[table_name].fields).filter(([, {is_relationship, is_hidden}]) =>
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
		data_model_helper.get_table_fields(table_name, false, filter__is_hidden) as [relationship_name :string, relationship_data :data_model_non_relationship][];

	/* fetch relationships for a table */
	public static readonly get_table_relationships = (
		table_name :string,   // the name of the table to fetch relationships fields for,
		filter__is_hidden :boolean | -1 = -1  // whether field is hidden
	) =>
		data_model_helper.get_table_fields(table_name, true, filter__is_hidden) as [relationship_name :string, relationship_data :data_model_relationship][];

	/* Returns whether a table has tree ranks */
	public static readonly table_is_tree = (
		table_name :string
	) :boolean /* whether a table has tree ranks */ =>  // the name of the table to check
		typeof data_model_storage.ranks[table_name] !== "undefined";

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
		value.substr(0, data_model_storage.reference_symbol.length) === data_model_storage.reference_symbol;

	/* Returns whether a value is a tree rank name (e.x $Kingdom, $Order) */
	public static readonly value_is_tree_rank = (
		value :string  // the value to use
	) :boolean /* whether a value is a tree rank */ =>
		typeof value !== "undefined" &&
		value.substr(0, data_model_storage.tree_symbol.length) === data_model_storage.tree_symbol;

	/*
	* Returns index from a complete reference item value (e.x #1 => 1)
	* Opposite of format_reference_item
	* */
	public static readonly get_index_from_reference_item_name = (
		value :string  // the value to use
	) :number =>
		parseInt(value.substr(data_model_storage.reference_symbol.length));

	/*
	* Returns tree rank name from a complete tree rank name (e.x $Kingdom => Kingdom)
	* Opposite of format_tree_rank
	* */
	public static readonly get_name_from_tree_rank_name = (
		value :string   // the value to use
	) :string /*tree rank name*/ =>
		value.substr(data_model_storage.tree_symbol.length);

	/* Returns the max index in the list of reference item values */
	public static readonly get_max_to_many_value = (
		values :string[]  // list of reference item values
	) :number /* max index. Returns 0 if there aren't any */ =>
		values.reduce((max, value) => {

			// skip `add` values and other possible NaN cases
			if (!data_model_helper.value_is_reference_item(value))
				return max;

			const number = data_model_helper.get_index_from_reference_item_name(value);

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
		data_model_storage.reference_symbol + index;

	/*
	* Returns a complete tree rank name from a tree rank name (e.x Kingdom => $Kingdom)
	* Opposite of get_name_from_tree_rank_name
	* */
	public static readonly format_tree_rank = (
		rank_name :string  // tree rank name to use
	) :string /* a complete tree rank name */ =>
		data_model_storage.tree_symbol + rank_name[0].toUpperCase() + rank_name.slice(1).toLowerCase();

}

export = data_model_helper;