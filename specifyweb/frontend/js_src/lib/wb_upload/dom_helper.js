"use strict";

/*
*
* Various helper methods for finding DOM elements and interacting with them
*
* */

const dom_helper = {


	// TABLES

	/*
	* Gets a name of the table the `radio` belongs to
	* @param {DOMElement} link - Link with table name
	* @return {string} Official table name (from data model)
	* */
	get_table_name: link => link.getAttribute('data-table'),


	// FIELDS

	get_lines(container, return_line_elements=false){

		const lines = container.childNodes;

		return Object.values(()=>{
			if(return_line_elements)
				return lines.map(line=>dom_helper.get_line_elements_container(line));
			else
				return lines;
		});

	},

	get_line_elements_container(line_element){
		return line_element.getElementsByClassName('wbplanview_mappings_line_elements')[0];
	},

	get_line_elements(line_elements_container){
		return line_elements_container.childNodes;
	},

};

module.exports = dom_helper;