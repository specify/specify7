"use strict";


const cache = require('./cache.js');

const custom_select_element = {

	// TODO: set proper table icons URL
	table_icons_base_path: '',
	table_icons_extension: '',
	cache_bucket_name: 'select_elements',  // the name of the cache bucket to use


	// GENERATORS

	/*
	* Generates HTML for a custom select element
	* @return {string} HTML for a custom select element
	* */
	get_element_html(
		/* object */ select_data,  // custom select element parameters. Described in the method definition
		/* string */ custom_select_type, // the type of the select element
		// 										  		  Available types:
		// 													- opened_list - used in the mapping view - list without an `input` box but with always opened list of options and a table name on top
		// 													- closed_list - used on mapping line - list with an `input` box and a list of options that can be opened
		// 													- preview_list - used in the mapping validation results - list with an `input` box but with no list of options
		// 													- suggestion_list - used on the suggestion lines - list with an `input` box but with no list of options
		//
		/* boolean */ use_cached = false  // whether to use a cached custom select element HTML assuming it matches the parameters
	){

		const {
			/* string */ select_type = 'simple',  // the type of select element. Can be either `simple` (for fields and relationships), `to_many` (for reference items) or `tree` (for tree ranks)
			/* string */ select_name = '',  // the name of the element. used when constructing a mapping path. NOTE: the first element of the line does not have a name as its name is inherited from the base table
			/* string */ select_label = '',  // the label to sue for the element
			/* string */ select_table = '', // the name of the table that was used
			/* array */ select_groups_data = []  // list of option group objects. See custom_select_element.get_select_group_html() for more info
		} = select_data;


		//making a copy of payload with all options enabled
		const select_data_copy = JSON.parse(JSON.stringify(select_data));
		for (const [group_name, group_data] of Object.entries(select_data_copy['select_groups_data']))
			for (const option_name of Object.keys(group_data['select_options_data']))
				select_data_copy['select_groups_data'][group_name]['select_options_data'][option_name]['is_enabled'] = false;
		const cache_key = JSON.stringify([custom_select_type, select_data_copy]);

		if (cache_key && use_cached) {
			const data = cache.get(custom_select_element.cache_bucket_name, cache_key);
			if (data)
				return data;
		}

		let default_name = 0;
		let header = '';
		let preview = '';
		let first_row = '';
		let is_relationship_text = 'false';
		let groups_html = '';

		//find if there is any value checked
		let default_label = 0;
		let default_icon = '';
		let is_relationship = false;
		let table_name = '';
		outer_loop:
			for (const select_group_data of select_groups_data)
				for (const select_field_data of select_group_data['select_options_data'])
					if (select_field_data.is_default) {
						({
							option_name: default_label,
							option_value: default_name,
							is_relationship,
							table_name
						} = select_field_data);
						break outer_loop;
					}

		if (custom_select_type === 'opened_list') {
			header = `
				<span class="custom_select_header">
					<span class="custom_select_header_icon">
						` + custom_select_element.get_icon_html(true, true, select_table) + `
					</span>
					<span class="custom_select_table_label">
						` + select_label + `
					</span>
				</span>`;

		}
		else {

			if (default_label !== 0)
				default_icon = custom_select_element.get_icon_html(is_relationship, true, table_name);

			is_relationship_text = is_relationship.toString();

			preview = `<span class="custom_select_input" tabindex="0">
							<span class="custom_select_input_icon">` + default_icon + `</span>
							<span class="custom_select_input_label">` + default_label + `</span>
						</span>`;

			if (custom_select_type === 'closed_list' && select_type !== 'to_many')
				first_row = custom_select_element.get_select_option_html({
																			 option_name: '',
																			 option_value: '0',
																			 is_enabled: true,
																			 is_relationship: false,
																			 is_default: default_label === 0,
																			 table_name: ''
																		 });

		}

		if (custom_select_type !== 'preview_list' && custom_select_type !== 'suggestion_list')
			groups_html = select_groups_data.map(
				select_group_data => custom_select_element.get_select_group_html(select_group_data)
			).join('');

		let custom_select_options = '';
		if (first_row !== '' || groups_html !== '')
			custom_select_options = `<span class="custom_select_options">` +
				first_row +
				groups_html + `
			</span>`;


		const result = `<span
				class="custom_select"
				title="` + select_label + `"
				data-name="` + select_name + `"
				data_value_is_relationship="` + is_relationship_text + `"
				data-value="` + default_name + `"
				data-previous_value="0"
				data-table="` + select_table + `"
				data-mapping_type="` + select_type + `"
				data-type="` + custom_select_type + `">
			` + header + `
			` + preview + `
			` + custom_select_options + `
		</span>`;

		if (cache_key)
			cache.set(custom_select_element.cache_bucket_name, cache_key, result);

		return result;

	},

	/*
	* Generates HTML for a suggestion box
	* @return {string} HTML for a suggestion box
	* */
	get_suggested_mappings_element_html: (
		/* object */ select_options_data  // list of options. See custom_select_html.get_select_option_html() for option data structure
	) =>
		`<span class="custom_select_suggestions">` +
		custom_select_element.get_select_group_html({
														select_group_name: 'suggested_mappings',
														select_group_label: 'Suggested mappings:',
														select_options_data: select_options_data,
													}) +
		`</span>`,

	/*
	* Generates HTML for a group of options
	* @return {string} HTML for a group of options
	* */
	get_select_group_html(
		/* object */ select_group_data  // information about the group. See more in the method definition
	){

		const {
			/* string */ select_group_name,  // group name (used in css and js)
			/* string */ select_group_label,  // group label (shown to the user)
			/* array */ select_options_data  // list of options data. See custom_select_element.get_select_option_html() for the data structure
		} = select_group_data;

		return `<span
					class="custom_select_group"
					data-group="` + select_group_name + `">
			<span class="custom_select_group_label">` + select_group_label + `</span>
			` + (select_options_data.map(select_option_data => custom_select_element.get_select_option_html(select_option_data)).join('')) + `
		</span>`;

	},

	/*
	* Generates HTML for a single option line
	* @return {string} HTML for a single option line
	* */
	get_select_option_html(
		/* object */ select_option_data // information about the option. See method definition for more information
	){

		const {
			/* string */ option_name,  // the name of the option. Would be used as a label (visible to the user)
			/* string */ option_value, // the value of the option. Would be used to construct a mapping path
			/* boolean */ is_enabled = true, // True if option can be selected. False if option can not be selected because it was already selected
			/* boolean */ is_relationship = false, // whether the option is a relationship (False for fields, true for relationships, tree ranks and reference items)
			/* boolean */ is_default = false, // whether the option is currently selected
			/* string */ table_name = ''  // the name of the table this option represents
		} = select_option_data;

		const classes = ['custom_select_option'];

		if (!is_enabled && !is_relationship) //don't disable relationships
			classes.push('custom_select_option_disabled');

		if (is_relationship)
			classes.push('custom_select_option_relationship');

		if (is_default)
			classes.push('custom_select_option_selected');


		return `<span
					class="` + (classes.join(' ')) + `"
					data-value="` + option_value + `"
					data-table_name="` + table_name + `"
					tabindex="0">
			<span class="custom_select_option_icon">` + custom_select_element.get_icon_html(is_relationship, is_default, table_name) + `</span>
			<span class="custom_select_option_label">` + option_name + `</span>
		</span>`;
	},

	/*
	* Generates HTML for a table icon
	* @return {string} HTML for a table icon
	* */
	get_icon_html(
		/* boolean */ is_relationship,  // False only if icon is going to be used next to an option label and option is not a relationship
		/* boolean */ is_default,  // True only if is_relationship is False and current option is a selected field
		/* string */ table_name  // The name of the table to generate icon for
	){
		if (is_relationship && table_name !== '') {
			//TODO: enable table icons once ready
			//`<img src="${custom_select_element.table_icons_base_path + table_name + custom_select_element.table_icons_extension}" alt="${table_name}">`


			const table_sub_name = table_name.substr(0, 2);
			const color_hue = ((table_sub_name[0].charCodeAt(0) + table_sub_name[1].charCodeAt(0)) - ('a'.charCodeAt(0) * 2)) * 7.2;
			const color = 'hsl(' + color_hue + ', 100%, 50%)';
			return `<span style="color:${color}">${table_sub_name.toUpperCase()}</span>`;
		}
		else
			return '';
	},


	// EVENT LISTENERS

	/*
	* Sets event listeners for the container
	* Responsible for closing open lists on focus loss, opening lists when input is clicked and triggering custom_select_option.change_selected_option()
	* */
	set_event_listeners(
		/* DOMElement */ container,  // the container that is going to house all of the custom select elements
		/* function */ change_callback,  // the function that would receive the change_payload returned by custom_select_element.change_selected_option() whenever there was an option value change
		/* function */ suggestions_callback  // the function that would receive {DOMElement} current_list and {DOMElement} selected_option whenever a list is opened
	){
		container.addEventListener('click', e => {

			const el = e.target;

			//close opened lists
			const lists = container.getElementsByClassName('custom_select');
			const current_list = el.closest('.custom_select:not([data-type="preview_list"]):not([data-type="suggestion_list"])');

			for (const list of lists)
				if (list !== current_list)  //dont close current list
					custom_select_element.close_list(list);

			if (current_list === null)
				return;


			//toggle list options
			if (el.closest('.custom_select_input') !== null) {
				if (current_list.classList.contains('custom_select_open'))
					custom_select_element.close_list(current_list);
				else {
					current_list.classList.add('custom_select_open');

					// scroll the list down to selected option
					const selected_option = custom_select_element.get_selected_options(current_list)[0];

					if (typeof selected_option !== "undefined") {
						const options_container = current_list.getElementsByClassName('custom_select_options')[0];

						if (  // scroll down if
							options_container.scrollTop === 0 && // the list is not already scrolled
							options_container.offsetHeight < selected_option.offsetTop + selected_option.offsetHeight // and selected item is not visible
						)
							options_container.scrollTop = selected_option.offsetTop - selected_option.offsetHeight;

					}

					suggestions_callback(current_list, selected_option);
				}
			}

			//check if option was changed
			const custom_select_option = el.closest('.custom_select_option');
			if (custom_select_option !== null) {

				const change_payload = custom_select_element.change_selected_option(current_list, custom_select_option);
				custom_select_element.close_list(current_list);

				if (typeof change_payload === "object")
					change_callback(change_payload);

			}

		});
	},

	/*
	* Callback for when list's option was clicked
	* @return {mixed} - if value not changed or option not found or option is disabled:
	* 						return undefined
	* 					else if clicked on suggested mapping line:
	* 						return {
	*							changed_list: target_list,
	*							selected_option: target_option,
	*							new_value: custom_select_option_value,
	*							list_type: 'suggested_mapping',
	*							previous_value: '',
	*							previous_previous_value: '',
	*							is_relationship: '',
	*							custom_select_type: '',
	*							list_table_name: '',
	*						}
	* 					else:
	* 						{
	*							changed_list: target_list,
	*							selected_option: target_option,
	*							new_value: custom_select_option_value,
	*							previous_value: previous_list_value,
	*							previous_previous_value: previous_previous_value,
	*							is_relationship: is_relationship,
	*							list_type: list_type,
	*							custom_select_type: custom_select_type,
	*							list_table_name: list_table_name,
	*						}
	* */
	change_selected_option(
		/* DOMElement */ target_list,  // the list that houses target_option
		/* mixed */ target_option  // {DOMElement} the option or {string} the name of the option that was clicked
	){

		//if target_option is option's name, find option element
		if (typeof target_option === 'string') {
			target_option = custom_select_element.find_option_by_name(target_list, target_option);
			if (target_option === null)
				return;
		}

		const custom_select_option_value = custom_select_element.get_option_value(target_option);

		const group_element = target_option.parentElement;
		if (group_element.classList.contains('custom_select_group') && group_element.getAttribute('data-group') === 'suggested_mappings')
			return {
				changed_list: target_list,
				selected_option: target_option,
				new_value: custom_select_option_value,
				list_type: 'suggested_mapping',
				previous_value: '',
				previous_previous_value: '',
				is_relationship: '',
				custom_select_type: '',
				list_table_name: '',
			};

		//ignore selected and disabled elements
		if (target_option.classList.contains('custom_select_option_selected') || target_option.classList.contains('custom_select_option_disabled')) {
			target_list.classList.add('custom_select_open');
			return;
		}

		//unselect all options
		for (const selected_line of target_list.querySelectorAll('.custom_select_option_selected'))
			selected_line.classList.remove('custom_select_option_selected');

		//extract data about new option
		const custom_select_option_label_element = target_option.getElementsByClassName('custom_select_option_label')[0];
		const custom_select_option_label = custom_select_option_label_element.textContent;

		let previous_list_value = custom_select_element.get_list_value(target_list);
		const previous_previous_value = target_list.getAttribute('data-previous_value');

		//don't change values if new value is 'add'
		const list_type = custom_select_element.get_list_mapping_type(target_list);

		//don't do anything if value wasn't changed
		if (custom_select_option_value === previous_list_value)
			return;

		//update list data
		const is_relationship = target_option.classList.contains('custom_select_option_relationship');

		target_list.setAttribute('data_value_is_relationship', is_relationship.toString());
		target_list.setAttribute('data-value', custom_select_option_value);
		target_list.setAttribute('data-previous_value', previous_list_value);
		target_option.classList.add('custom_select_option_selected');


		//update custom_select_input
		const custom_select_inputs = Object.values(target_list.children).filter(element =>
																					element.classList.contains('custom_select_input')
		);

		if (custom_select_inputs.length !== 0) {

			const custom_select_input = custom_select_inputs[0];
			const table_name = target_option.getAttribute('data-table_name');

			const custom_select_input_icon = custom_select_input.getElementsByClassName('custom_select_input_icon')[0];
			custom_select_input_icon.innerHTML = custom_select_element.get_icon_html(is_relationship, true, table_name);

			const custom_select_input_label = custom_select_input.getElementsByClassName('custom_select_input_label')[0];
			custom_select_input_label.innerText = custom_select_option_label;

		}


		const custom_select_type = target_list.getAttribute('data-type');
		const list_table_name = custom_select_element.get_list_table_name(target_list);
		return {
			changed_list: target_list,
			selected_option: target_option,
			new_value: custom_select_option_value,
			previous_value: previous_list_value,
			previous_previous_value: previous_previous_value,
			is_relationship: is_relationship,
			list_type: list_type,
			custom_select_type: custom_select_type,
			list_table_name: list_table_name,
		};

	},

	/*
	* Closes a list and removes its suggestion boxes
	* */
	close_list: (
		/* DOMElement */ target_list  // a list to close
	) => {
		target_list.classList.remove('custom_select_open');
		const custom_select_suggestions = target_list.getElementsByClassName('custom_select_suggestions');
		for (const custom_select_suggestion of custom_select_suggestions)
			custom_select_suggestion.remove();
	},


	// HELPERS

	/*
	* Adds a new option to an existing list at a specified position
	* */
	add_option(
		/* DOMElement */ list,  // the list that the option would be added to
		/* int */ position,  // the position to add element at. If negative, starts from the back
		/* object */ option_data,  // option data. See custom_select_element.get_select_option_html() for data structure
		/* boolean */ selected = false  // whether to trigger a custom_select_element.change_selected_option() event
	){

		const new_option_line_html = custom_select_element.get_select_option_html(option_data);
		let new_option_line = document.createElement('span');

		const option_container = list.getElementsByClassName('custom_select_options')[0].getElementsByClassName('custom_select_group')[0];

		const options = option_container.children;

		if (position < -1)
			position = options.length + 1 + position;

		if (position >= options.length)
			option_container.appendChild(new_option_line);
		else
			option_container.insertBefore(new_option_line, options[position]);

		new_option_line.outerHTML = new_option_line_html;
		new_option_line = options[position];

		if (selected)
			custom_select_element.change_selected_option(list, new_option_line);

	},

	/*
	* Enables all options in a list
	* */
	enable_disabled_options(
		/* DOMElement */ list  // the list that houses the options
	){

		const options = list.getElementsByClassName('custom_select_option');

		for (const option of options)
			option.classList.remove('custom_select_option_disabled');

	},

	/*
	* Enables or disables an option in a list
	* */
	toggle_option(
		/* DOMElement */ list,  // the list that houses the option
		/* string */ option_name,  // the name of hte option that would be modified
		/* string */ action  // 'enable'/'disable' - the action to perform on the option
	){

		//don't do anything if seeking for the default option
		if (option_name === '0')
			return;

		const option = custom_select_element.find_option_by_name(list, option_name);

		//don't do anything if can't find the requested option
		if (typeof option === "undefined")
			return;

		if (action === 'enable')
			option.classList.remove('custom_select_option_disabled');

		//dont disable relationships
		else if (action === 'disable' && !option.classList.contains('custom_select_option_relationship'))
			option.classList.add('custom_select_option_disabled');

	},

	/*
	* Find an option with a specified value
	* */
	find_option_by_name: (
		/* {DOMElement}*/ list, // the list to search in
		/* string */ option_name // the value of the option to search for
	) =>
		Object.values(list.getElementsByClassName('custom_select_option')).filter(option =>
																					  custom_select_element.get_option_value(option) === option_name
		)[0],

	/*
	* Returns whether selected value in a list is a relationships
	* @return {boolean} whether selected value in a list is a relationships
	* */
	element_is_relationship:
	/* DOMElement */ element =>  // the list to check
		element.getAttribute('data_value_is_relationship') === 'true',


	// GETTERS

	/*
	* Get all selected options in a list
	* @return {array} - array of selected options
	* */
	get_selected_options:
	/* DOMElement */ list =>  // the list to search in
		list.getElementsByClassName('custom_select_option_selected'),

	/*
	* Returns whether selection option is enabled
	* @return {boolean} - True if no option is selected or selected option is not disabled
	* */
	is_selected_option_enabled(
		/* DOMElement */list  // the list to search in
	){

		const option = custom_select_element.get_selected_options(list)[0];


		if (typeof option === "undefined")
			return true;

		else
			return !option.classList.contains('custom_select_option_disabled');

	},

	/*
	* Returns the value of the option
	* @return the value of the option
	* */
	get_option_value:
	/* DOMElement */ option_element => // the option element
		option_element.getAttribute('data-value'),

	/*
	* Returns the value of the list
	* @return the value of the list
	* */
	get_list_value:
	/* DOMElement */ list_element =>  // the list to check
		list_element.getAttribute('data-value'),

	/*
	* Returns the table a list represents
	* @return the table a list represents
	* */
	get_list_table_name:
	/* DOMElement */list_element =>  // the list to check
		list_element.getAttribute('data-table'),

	/*
	* Returns the mapping type of a list
	* @return the mapping type of a list
	* */
	get_list_mapping_type:
	/* DOMElement */list_element =>  // the list to check
		list_element.getAttribute('data-mapping_type'),

};

module.exports = custom_select_element;