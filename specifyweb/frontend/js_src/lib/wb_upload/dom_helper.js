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

		const lines = Object.values(container.children).reduce((lines,line)=>{
			if(line.innerHTML !== '')
				lines.push(line);
			return lines;
		},[]);

		if(return_line_elements)
			return lines.map(line=>dom_helper.get_line_elements_container(line));
		else
			return lines;

	},

	get_line_elements_container(element){
		if(element.tagName==='DIV')
			return element.getElementsByClassName('wbplanview_mappings_line_elements')[0];
		else
			return element.parentElement;

	},

	get_line_elements(line_elements_container){
		return Object.values(line_elements_container.children);
	},

	get_line_header_select(line_elements_container){
		const line_elements = dom_helper.get_line_elements(line_elements_container);
		for(const line_element of line_elements)
			if(line_element.getAttribute('data-type')==='headers')
				return line_element;
		return undefined;
	}

};

module.exports = dom_helper;