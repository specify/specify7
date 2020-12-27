/*
*
* Collection of various helper methods used during the mapping process
*
* */

"use strict";

const data_model_storage = require('./data_model_storage.tsx');

class helper {

	/*
	* Get a friendly name from the field. (Converts Camel Case to human readable name and fixes some errors)
	* This method is only called if schema localization does not have a friendly name for this field
	* */
	public static readonly get_friendly_name = (
		name :string  // Original field name
	) :string /* Human friendly field name */ => {
		name = name.replace(/[A-Z]/g, letter => ` ${letter}`);
		name = name.trim();
		name = name.charAt(0).toUpperCase() + name.slice(1);

		const regex = /([A-Z]) ([ A-Z])/g;
		const subst = `$1$2`;
		name = name.replace(regex, subst);
		name = name.replace(regex, subst);

		name = name.replace('Dna', 'DNA');

		return name;
	};

	/* Finds the point at which the source array begins to have values different from the ones in the search array */
	public static find_array_divergence_point<T>(
		source :T[],  // the source array to use in the comparison
		search :T[]  // the search array to use in the comparison
	) :divergence_point {

		if (source === null || search === null)
			return -1;

		const source_length = source.length;
		const search_length = search.length;

		if (search_length === 0)
			return 0;

		if (source_length === 0 || source_length < search_length)
			return -1;

		for (const [index, source_value] of Object.entries(source)) {

			const search_value = search[parseInt(index)];

			if (typeof search_value === "undefined")
				return parseInt(index);

			if (source_value !== search_value)
				return -1;

		}

		return search_length - 1;

	};

	/* Extract mapping type and header name / static column value from a mapping path */
	public static deconstruct_mapping_path(
		mapping_path :mapping_path,  // combined mapping path
		has_header :boolean = false,  // whether a mapping_path has mapping type and header name / static column value in it
		detect_unmapped :boolean = true  // whether detect that a mapping path is incomplete
	) :deconstructed_mapping_path {

		mapping_path = [...mapping_path];

		let header = '';
		let mapping_type = '';
		if (has_header) {
			header = mapping_path.pop() || '';
			mapping_type = mapping_path.pop() || '';
		}

		if (detect_unmapped && mapping_path[mapping_path.length - 1] === "0")
			mapping_path = [];

		return [mapping_path, mapping_type as mapping_type, header];

	};

	/* Takes array of mappings with headers and returns the indexes of the duplicate headers (if three lines have the same mapping, the indexes of the second and the third lines are returned) */
	public static find_duplicate_mappings(
		array_of_mappings :mapping_path[],  // array of mappings as returned by mappings.get_array_of_mappings()
		has_headers :boolean = false  // whether array of mappings contain mapping types and header names / static column values
	) :duplicate_mappings {

		const filtered_array_of_mappings = array_of_mappings.map(mapping_path => helper.deconstruct_mapping_path(mapping_path, has_headers)[0]);
		const string_array_of_mappings = filtered_array_of_mappings.map(mapping_path => mapping_path.join(data_model_storage.path_join_symbol));

		const duplicate_indexes :number[] = [];
		let index = -1;
		string_array_of_mappings.reduce((dictionary_of_mappings :string[], string_mapping_path :string) => {

			index++;

			if (string_mapping_path === '')
				return dictionary_of_mappings;

			if (dictionary_of_mappings.indexOf(string_mapping_path) === -1)
				dictionary_of_mappings.push(string_mapping_path);
			else
				duplicate_indexes.push(index);

			return dictionary_of_mappings;

		}, []);

		return duplicate_indexes;

	};

}

export = helper;