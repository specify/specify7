"use strict";

/*
*
* Collection of various helper methods used during the mapping process
*
* */
const helper = {

	/*
	* Get a friendly name from the field. (Converts Camel Case to human readable name and fixes some errors)
	* This method is only called if schema localization does not have a friendly name for this field
	* @param {string} name - Original field name
	* @return {string} Human friendly field name
	* */
	get_friendly_name(name){
		name = name.replace(/[A-Z]/g, letter => ` ${letter}`);
		name = name.trim();
		name = name.charAt(0).toUpperCase() + name.slice(1);

		const regex = /([A-Z]) ([ A-Z])/g;
		const subst = `$1$2`;
		name = name.replace(regex, subst);
		name = name.replace(regex, subst);

		name = name.replace('Dna', 'DNA');

		return name;
	},

	/*
	* Finds the point at which the source array begins to have values different from the ones in the search array
	* @param {array} source - the source array to use in the comparison
	* @param {array} search - the search array to use in the comparison
	* @return {int} divergence point
	* 				Returns 0 if search array is empty
	* 				Returns -1 if source array is empty or source array is smaller than the search array
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
	*
	* */
	find_array_divergence_point(source, search){

		//source : Accession > Accession Agents > #1 > Agent > First Name
		//search : []
		//search : Accession > Accession Agents > #1

		if (source === null || search === null)
			return null;

		const source_length = source.length;
		const search_length = search.length;

		if (search_length === 0)
			return 0;

		if (source_length === 0 || source_length < search_length)
			return -1;

		for (const [index, source_value] of source.entries()) {

			const search_value = search[index];

			if (typeof search_value === "undefined")
				return index;

			if (source_value !== search_value)
				return -1;

		}

		return search_length - 1;

	},

	/*
	* Extract mapping type and header name / static column value from a mapping path
	* @param {array} mapping_path - combined mapping path
	* @param {bool} has_header - whether a mapping_path has mapping type and header name / static column value in it
	* @param {detect_unmapped} - whether detect that a mapping path is incomplete
	* @return [mapping_path, mapping_type, header]. If mapping path is incomplete and detect_unmapped is true mapping_path is []
	* Example:
	* 	if
	* 		mapping_path is ['Accession','Accession Agents','#1','Agent','First Name','existing_header','Agent 1 First Name']
	* 		has_header is True
	* 		detect_unmapped is True
	* 	then return [
	* 		['Accession','Accession Agents','#1','Agent','First Name'],
	* 		'existing_header',
	* 		'Agent 1 First Name'
	* 	]
	*
	* 	if
	* 		mapping_path is ['Accession','Accession Agents','#1','Agent','0','existing_header','Agent 1 First Name']
	* 		has_header is True
	* 		detect_unmapped is True
	* 	then return [
	* 		[],
	* 		'existing_header',
	* 		'Agent 1 First Name'
	* 	]
	* 	if
	* 		mapping_path is ['Accession','Accession Agents','#1','Agent','First Name']
	* 		has_header is False
	* 		detect_unmapped is False
	* 	then return [
	* 		['Accession','Accession Agents','#1','Agent','First Name'],
	* 	]
	*
	* */
	deconstruct_mapping_path(mapping_path, has_header = false, detect_unmapped = true){

		mapping_path = [...mapping_path];

		let header;
		let mapping_type;
		if (has_header) {
			header = mapping_path.pop();
			mapping_type = mapping_path.pop();
		}

		if (detect_unmapped && mapping_path[mapping_path.length - 1] === "0")
			mapping_path = [];

		return [mapping_path, mapping_type, header];

	},

	/*
	* Takes array of mappings with headers and returns the indexes of the duplicate headers (if three lines have the same mapping, the indexes of the second and the third lines are returned)
	* @param {array} array_of_mappings - array of mappings as returned by mappings.get_array_of_mappings()
	* @return {array} array of duplicate indexes
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
	* */
	find_duplicate_mappings(array_of_mappings, has_headers=false){

		const filtered_array_of_mappings = array_of_mappings.map(mapping_path => helper.deconstruct_mapping_path(mapping_path, has_headers)[0]);
		const string_array_of_mappings = filtered_array_of_mappings.map(mapping_path => mapping_path.join());

		const duplicate_indexes = [];
		let index = -1;
		string_array_of_mappings.reduce((dictionary_of_mappings, string_mapping_path) => {

			index++;

			if (string_mapping_path === '')
				return dictionary_of_mappings;

			if (typeof dictionary_of_mappings[string_mapping_path] === "undefined")
				dictionary_of_mappings[string_mapping_path] = 1;
			else
				duplicate_indexes.push(index);

			return dictionary_of_mappings;

		}, {});

		return duplicate_indexes;

	},

};

module.exports = helper;