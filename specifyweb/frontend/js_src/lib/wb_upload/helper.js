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

	// /*
	// * Trims headers and makes them distinct
	// * @param {array} headers_array - Array of strings
	// * @return {bool} false if no changes were made OR {array} of [old_header_name,new_header_name] strings
	// * */
	// fix_headers(headers_array){
	//
	// 	let changes_made = false;
	//
	// 	let new_headers = headers_array.reduce((result,header_name)=>{
	//
	// 			let new_header_name = header_name.trim();
	//
	// 			if(result.indexOf(new_header_name) !== -1){
	// 				let i=0;
	// 				while(result.indexOf(new_header_name + ' (' + i + ')') !== -1)
	// 					i++;
	// 				header_name = new_header_name + ' (' + i + ')'
	// 			}
	//
	// 			result.push([header_name,new_header_name]);
	//
	// 			if(header_name !== new_header_name)
	// 				changes_made = true;
	//
	// 			return result;
	//
	// 		},[]);
	//
	// 	if(changes_made)
	// 		return new_headers;
	// 	else
	// 		return false;
	//
	// },

};

module.exports = helper;