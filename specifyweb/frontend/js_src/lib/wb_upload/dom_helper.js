"use strict";

/*
*
* Various helper methods for finding DOM elements and interacting with them
*
* */

const dom_helper = {


	//TABLES

	/*
	* Gets a name of the table the `radio` belongs to
	* @param {DOMElement} radio - Radio button
	* @return {string} Official table name (from data model)
	* */
	get_table_name: (radio) => {
		return radio.getAttribute('data-table');
	},


	//FIELDS

	/*
	* Get's control element for a field and gives it's tag name
	* Inverse of get_line_element
	* @param {DOMElement} parent - DIV or LABEL that is a parent to the element you are trying to find
	* @return [array] Returns [control_element, control_element_tag_name] where
	* 				  {DOMElement} control_element - Control Element
	* 				  {string} control_element_tag_name - select/input
	* */
	get_control_element: (parent) => {
		const parent_select = parent.getElementsByTagName('select')[0];

		if (typeof parent_select !== "undefined")
			return [parent_select, 'select'];

		const parent_input = parent.getElementsByTagName('input')[0];
		return [parent_input, 'input'];
	},

	/*
	* Get's line element from control element
	* Inverse of get_control_element
	* @param {DOMElement} control_element - SELECT or INPUT
	* @return {DOMElement} DIV or LABEL that is a parent of control element
	* */
	get_line_element: (control_element) => {

		const parent_element = control_element.parentElement;

		if (parent_element.classList.contains('line'))
			return parent_element.parentElement;

		return parent_element;

	},

	/*
	* Get's last line of a particular relationship
	* @param {DOMElement} line - DIV or LABEL Line where the search starts
	* @return {DOMElement} DIV or LABEL that is the last line of this relationship
	* */
	get_last_line: (line) => {

		while (true) {

			const previous_line = line;

			line = line.nextElementSibling;

			if (line.nextElementSibling === null || line.classList.contains('table_fields'))
				return previous_line;

		}

	},

	/*
	* Get's first line of a particular relationship
	* @param {DOMElement} line - DIV or LABEL Line where the search starts
	* @return {DOMElement} DIV or LABEL that is the first line of this relationship
	* */
	get_first_line: (line) => {

		while (true) {

			const next_line = line.previousElementSibling;

			if (next_line == null || line.classList.contains('table_fields'))
				return line;

			line = next_line;

		}

	},

	/*
	* Get official field name from <input type="radio"> for a field
	* @param {DOMElement} radio - <input type="radio"> for a field
	* @return {string} Official field name (from data model)
	* */
	get_field_name: (radio) => {
		return radio.getAttribute('data-field');
	},

	/*
	* Get's the text value of a label for a particular field
	* @param {DOMElement} label - <label> for a field
	* @return {string} Friendly name of a field
	* */
	get_friendly_field_name: (label) => {
		return label.getElementsByClassName('row_name')[0];
	},

	/*
	* Checks whether field is disabled
	* @param {DOMElement} - <input type="radio"> or <option> for a field or relationship
	* @return {bool} whether field is disabled
	* */
	is_field_disabled: (field) => {
		return field.getAttribute('disabled') !== null;
	},

	/*
	* Removes all <select> elements from the list of fields
	* @param {DOMElement} parent - shared parent for all <select> elements
	* */
	close_open_lists: (parent) => {
		const opened_lists = parent.getElementsByClassName('table_relationship');
		Object.values(opened_lists).forEach((list) => {
			parent.removeChild(list);
		});
	},


	//HEADERS

	/*
	* Get header name from <input type="radio"> for a header
	* @param {DOMElement} radio - <input type="radio"> for a header
	* @return {string} Header name
	* */
	get_header_name: (radio) => {
		return radio.getAttribute('data-header');
	},

	/*
	* Get mapping path <input type="radio"> for a header
	* @param {DOMElement} radio - <input type="radio"> for a header
	* @return {string} Header mapping path
	* Example return: accession_accessionagents_#1_agent_firstname
	* */
	get_mapping_path: (radio) => {
		return radio.getAttribute('data-path');
	},

	/*
	* Get the name of the relationship <select> belongs to
	* @param {DOMElement} select - <select> for a relationship
	* @return {string} Official relationship name (from data model)
	* */
	get_relationship_name: (select) => {
		return select.getAttribute('name');
	},

	/*
	* Get's control element for a header and gives it's tag name
	* @param {DOMElement} parent - LABEL that is a parent to the element you are trying to find
	* @return [array] Returns [control_element, control_element_tag_name] where
	* 				  {DOMElement} control_element - Control Element
	* 				  {string} control_element_tag_name - select/input
	* */
	get_header_control_element: (parent) => {

		const header_name = parent.getElementsByClassName('header')[0];

		if (typeof header_name === "undefined")
			return [parent.getElementsByTagName('textarea')[0], 'static'];

		return [header_name, 'header'];

	},

	/*
	* Get the text value of the label for a header
	* @param {DOMElement} label - <label> for a header
	* @return {string} Friendly name
	* Example return:
	* #1 First Name
	* OR
	* Kingdom Author
	* */
	get_mappping_friendly_name_element: (label) => {
		return label.getElementsByClassName('mapping')[0];
	},

	/*
	* Checks whether a particular header is mapped
	* @param {DOMElement} label - <label> of a header
	* @return {bool} Whether a header is mapped
	* */
	is_header_unmapped: (label) => {
		return label.getElementsByClassName('undefined').length !== 0;
	},

};

module.exports = dom_helper;