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

	},

};

module.exports = helper;