/*
*
* Collection of various helper methods used during the mapping process
*
* */

'use strict';

import { mapping_path_to_string } from './wbplanviewmodelhelper';
import { MappingPath }            from './components/wbplanviewmapper';

/*
* Get a friendly name from the field. (Converts Camel Case to human-readable name and fixes some errors)
* This method is only called if schema localization does not have a friendly name for this field
* */
export const get_friendly_name = (
	original_name: string,  // Original field name
): string /* Human friendly field name */ => {
	let name = original_name.replace(/[A-Z]/g, letter => ` ${letter}`);
	name = name.trim();
	name = name.charAt(0).toUpperCase() + name.slice(1);

	const regex = /(?<first>[A-Z]) (?<second>[ A-Z])/g;
	const subst = `$1$2`;
	name = name.replace(regex, subst);
	name = name.replace(regex, subst);

	name = name.replace('Dna', 'DNA');

	return name;
};

/* Finds the point at which the source array begins to have values different from the ones in the search array */
export function find_array_divergence_point<T>(
	source: T[],  // the source array to use in the comparison
	search: T[],  // the search array to use in the comparison
): number /*
* Returns 0 if search array is empty
* Returns -1 if source array is empty or source array is smaller than the search array
* Examples:
* 	If:
* 		source is ['Accession','Accession Agents','#1','Agent','First Name'] and
* 		search is []
* 	returns 0
* 	If:
* 		source is ['Accession','Accession Agents','#1','Agent','First Name'] and
* 		search is ['Accession','Accession Agents',]
* 	returns 2
* 	If
* 		source is ['Accession','Accession Agents','#1','Agent','First Name'] and
* 		search is ['Accession','Accession Agents','#1']
* 	returns 3
* */ {

	if (source === null || search === null)
		return -1;

	const source_length = source.length;
	const search_length = search.length;

	if (search_length === 0)
		return 0;

	if (source_length === 0 || source_length < search_length)
		return -1;

	Object.entries(source).forEach(([index, source_value]) => {
		const search_value = search[parseInt(index)];

		if (typeof search_value === 'undefined')
			return parseInt(index);

		if (source_value !== search_value)
			return -1;
	});

	return search_length - 1;

}

/*
* Takes an array of mappings with headers and returns the indexes of the duplicate headers (if three lines have the
* same mapping, the indexes of the second and the third lines are returned)
* */
export const find_duplicate_mappings = (
	array_of_mappings: MappingPath[],  // array of mappings as returned by mappings.get_array_of_mappings()
	focused_line: number | false,
): number[] => /*
* Array of duplicate indexes
* Example:
* 	if
* 		array_of_mappings is [
* 			['Accession','Accession Number','existing header,'Accession #;],
* 			['Catalog Number','existing header','cat num'],
* 			['Accession','Accession Number'],
* 		]
* 		has_headers is True
* 	then return [2]
* 	if
* 		array_of_mappings is [
* 			['Start Date'],
* 			['End Date'],
* 			['Start Date'],
* 			['Start Date'],
* 		]
* 		has_headers is False
* 	then return [2,3]
* */ {

	const duplicate_indexes: number[] = [];

	array_of_mappings.reduce((dictionary_of_mappings: string[], mapping_path, index) => {

		const string_mapping_path = mapping_path_to_string(mapping_path);

		if (dictionary_of_mappings.indexOf(string_mapping_path) === -1)
			dictionary_of_mappings.push(string_mapping_path);
		else
			duplicate_indexes.push(
				focused_line && focused_line === index ?
					dictionary_of_mappings.indexOf(string_mapping_path) :
					index,
			);

		return dictionary_of_mappings;

	}, []);

	return duplicate_indexes;

};