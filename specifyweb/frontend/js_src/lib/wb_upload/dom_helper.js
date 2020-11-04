"use strict";

/*
*
* Various helper methods for finding DOM elements and interacting with them
*
* */

const cache = require('./cache.js');

const dom_helper = {


	// FIELDS

	get_lines(container, return_line_elements=false, use_cache = true){

		const cache_name = 'lines_' + return_line_elements.toString();

		if(use_cache === undefined){  // flush cache
			cache.set('dom',cache_name,false);
			cache.set('dom','lines_' + (!return_line_elements).toString(),false);
			return;
		}

		if(use_cache){
			const lines = cache.get('dom', cache_name);
			if(lines)
				return lines;
		}

		// const lines = Object.values(container.children).reduce((lines,line)=>{
		// 	if(line.innerHTML !== '')
		// 		lines.push(line);
		// 	return lines;
		// },[]);

		const lines = container.children;
		let result;

		if(return_line_elements)
			result = lines.map(line=>dom_helper.get_line_elements_container(line));
		else
			result = lines;

		cache.set('dom',cache_name,result,{
			'storage_type': 'session_storage',
		});

		return result;

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

	get_line_header(line){

		const wbplanview_mappings_line_header = line.getElementsByClassName('wbplanview_mappings_line_header')[0];

		return wbplanview_mappings_line_header.innerText;

	},


	// MISC

	has_next_sibling: element =>
		element.nextElementSibling !== null,

	remove_elements_to_the_right(element){

		let changes_made = dom_helper.has_next_sibling(element);

		while (dom_helper.has_next_sibling(element))
			element.nextElementSibling.remove();

		return changes_made;

	}

};

module.exports = dom_helper;