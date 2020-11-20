"use strict";

/*
*
* Various helper methods for finding DOM elements and interacting with them
*
* */

const dom_helper = {


	// FIELDS

	/*
	* Get all lines or line element containers in a container of lines
	* @param {DOMElement} container - a container for all of the lines
	* @param {bool} return_line_elements - whether to return line elements or line element container elements
	* @return {array} list of line elements or line element container elements depending on return_line_elements
	* */
	get_lines(container, return_line_elements = false){

		const lines = Object.values(container.children);

		if (return_line_elements)
			return lines.map(line => dom_helper.get_line_elements_container(line));
		else
			return lines;

	},

	/*
	* Returns a line elements container
	* @param {DOMElement} element - either a line element or a custom select element
	* @return {DOMElement} line elements container
	* */
	get_line_elements_container(element){
		if (element.tagName === 'DIV')
			return element.getElementsByClassName('wbplanview_mappings_line_elements')[0];
		else
			return element.parentElement;

	},

	/*
	* Get children of line elements container
	* @param {DOMElement} line_elements_container - an elements whose children would be returned
	* @return {array} list of line_elements_container children
	* */
	get_line_elements: line_elements_container =>
		Object.values(line_elements_container.children),

	/*
	* Get header element from the line element
	* @param {DOMElement} line - the line element
	* @return {DOMElement} header element
	* */
	get_line_header_element: line =>
		line.getElementsByClassName('wbplanview_mappings_line_header')[0],

	/*
	* Get header name (for headers) or textarea value (for static headers)
	* @param {DOMElement} wbplanview_mappings_line_header - header element
	* @return header name (for headers) or textarea value (for static headers)
	* */
	get_line_header_name: wbplanview_mappings_line_header => {
		if (wbplanview_mappings_line_header.children.length === 0)
			return wbplanview_mappings_line_header.innerText;
		else  // get textarea's value (for static fields)
			return wbplanview_mappings_line_header.children[0].value;
	},

	/*
	* Get the mapping type for a line (`existing_header`/`new_column`/`new_static_column`)
	* @param {DOMElement} wbplanview_mappings_line_header - header element
	* @return the mapping type for a line
	* */
	get_line_mapping_type: wbplanview_mappings_line_header =>
		wbplanview_mappings_line_header.getAttribute('data-mapping_type'),


	// MISC

	/*
	* Returns whether an element has a next element sibling
	* @param {DOMElement} element - an element to test
	* @return {bool} whether the next element sibling exists
	* */
	has_next_sibling: element =>
		element.nextElementSibling !== null,

	/*
	* Remove all elements to the right of a specified element
	* @param {DOMElement} element - the element whose siblings to the right would be removed
	* @return {bool} whether any elements were removed
	* */
	remove_elements_to_the_right(element){

		let changes_made = dom_helper.has_next_sibling(element);

		while (dom_helper.has_next_sibling(element))
			element.nextElementSibling.remove();

		return changes_made;

	}

};

module.exports = dom_helper;