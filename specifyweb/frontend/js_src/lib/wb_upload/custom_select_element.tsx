"use strict";

const cache = require('./cache.tsx');
const icons = require('../icons.js');

class custom_select_element {

	private static readonly cache_bucket_name :string = 'select_elements';  // the name of the cache bucket to use


	// GENERATORS

	/* Generates HTML for a custom select element */
	public static get_element_html(
		{
			select_type = 'simple',
			select_name = '',
			select_label = '',
			select_table = '',
			select_groups_data = []
		} :custom_select_element_parameters,
		custom_select_type :custom_select_type,
		use_cached :boolean = false  // whether to use a cached custom select element HTML assuming it matches the parameters
	) :string /* HTML for a custom select element */ {

		// making a copy of payload with all options enabled
		const select_data_copy :custom_select_element_parameters = JSON.parse(JSON.stringify(arguments[0]));
		select_data_copy.select_groups_data.forEach(({select_options_data}, group_index) =>
			Object.keys(select_options_data).forEach(option_name =>
				select_data_copy.select_groups_data[group_index].select_options_data[parseInt(option_name)].is_enabled = false
			)
		);
		const cache_key = JSON.stringify([custom_select_type, select_data_copy]);

		if (cache_key && use_cached) {
			const data = cache.get(custom_select_element.cache_bucket_name, cache_key);
			if (data)
				return data;
		}

		let default_name = '0';
		let header = '';
		let preview = '';
		let first_row = '';
		let is_relationship_text = 'false';
		let groups_html = '';

		// find if there is any value checked
		let default_label = '0';
		let default_icon = '';
		let is_relationship = false;
		let table_name = '';
		outer_loop:
			for (const select_group_data of select_groups_data)
				for (const select_field_data of select_group_data.select_options_data)
					if (select_field_data.is_default) {
						default_label = select_field_data.option_name;
						default_name = select_field_data.option_value;
						is_relationship = select_field_data.is_relationship || false;
						table_name = select_field_data.table_name || '';
						break outer_loop;
					}

		if (custom_select_type === 'opened_list') {
			header = `
				<span class="custom_select_header">
					<span class="custom_select_header_icon">
						${custom_select_element.get_icon_html(true, true, select_table)}
					</span>
					<span class="custom_select_table_label">
						${select_label}
					</span>
				</span>`;

		}
		else {

			if (default_label !== '0')
				default_icon = custom_select_element.get_icon_html(is_relationship, true, table_name);

			is_relationship_text = is_relationship.toString();

			preview = `<span class="custom_select_input" tabindex="0">
							<span class="custom_select_input_icon">${default_icon}</span>
							<span class="custom_select_input_label">${default_label}</span>
						</span>`;

			if (custom_select_type === 'closed_list' && select_type !== 'to_many')
				first_row = custom_select_element.get_select_option_html({
					option_name: '',
					option_value: '0',
					is_enabled: true,
					is_relationship: false,
					is_default: default_label === '0',
					table_name: ''
				});

		}

		if (custom_select_type !== 'preview_list' && custom_select_type !== 'suggestion_list')
			groups_html = select_groups_data.map(custom_select_element.get_select_group_html).join('');

		let custom_select_options = '';
		if (first_row !== '' || groups_html !== '')
			custom_select_options = `<span class="custom_select_options">
				${first_row}
				${groups_html}
			</span>`;


		const result = `<span
				class="custom_select"
				title="${select_label}"
				data-name="${select_name}"
				data_value_is_relationship="${is_relationship_text}"
				data-value="${default_name}"
				data-previous_value="0"
				data-table="${select_table}"
				data-mapping_type="${select_type}"
				data-type="${custom_select_type}">
			${header}
			${preview}
			${custom_select_options}
		</span>`;

		if (cache_key)
			cache.set(custom_select_element.cache_bucket_name, cache_key, result);

		return result;

	};

	/* Generates HTML for a suggestion box */
	public static readonly get_suggested_mappings_element_html = (
		select_options_data :custom_select_element_option[]
	) :string /* HTML for a suggestion box */ =>
		`<span class="custom_select_suggestions">
			${custom_select_element.get_select_group_html({
			select_group_name: 'suggested_mappings',
			select_group_label: 'Suggested mappings:',
			select_options_data,
		})}
		</span>`;

	/* Generates HTML for a group of options */
	public static get_select_group_html({
											select_group_name,
											select_group_label,
											select_options_data
										} :custom_select_element_options_group) :string /* HTML for a group of options */ {

		return `<span
					class="custom_select_group"
					data-group="${select_group_name}">
			<span class="custom_select_group_label">${select_group_label}</span>
			${select_options_data.map(custom_select_element.get_select_option_html).join('')}
		</span>`;

	};

	/* Generates HTML for a single option line */
	public static get_select_option_html({
											 option_name,
											 option_value,
											 is_enabled = true,
											 is_relationship = false,
											 is_default = false,
											 table_name = ''
										 } :custom_select_element_option) :string /* HTML for a single option line */ {

		const classes = ['custom_select_option'];

		if (!is_enabled && !is_relationship)  // don't disable relationships
			classes.push('custom_select_option_disabled');

		if (is_relationship)
			classes.push('custom_select_option_relationship');

		if (is_default)
			classes.push('custom_select_option_selected');


		return `<span
					class="${classes.join(' ')}"
					data-value="${option_value}"
					data-table_name="${table_name}"
					tabindex="0">
			<span class="custom_select_option_icon">${custom_select_element.get_icon_html(is_relationship, is_default, table_name)}</span>
			<span class="custom_select_option_label">${option_name}</span>
		</span>`;
	};

	/* Generates HTML for a table icon */
	public static get_icon_html(
		is_relationship :boolean,  // False only if icon is going to be used next to an option label and option is not a relationship
		//@ts-ignore
		is_default :boolean,  // True only if is_relationship is False and current option is a selected field
		table_name :string  // The name of the table to generate icon for
	) :string /* HTML for a table icon */ {
		if (!is_relationship || table_name === '')
			return '';

		const table_icon_src = icons.getIcon(table_name);
		if(table_icon_src === '/images/unknown.png'){
			const table_sub_name = table_name.substr(0, 2);
			const color_hue = ((table_sub_name[0].charCodeAt(0) + table_sub_name[1].charCodeAt(0)) - ('a'.charCodeAt(0) * 2)) * 7.2;
			const color = `hsl(${color_hue}, 70%, 50%)`;
			return `<span style="background-color:${color};" class="custom_select_option_icon_undefined">${table_sub_name.toUpperCase()}</span>`;
		}
		else
			return `<span style="background-image: url('${table_icon_src}')"></span>`;
	};


	// EVENT LISTENERS

	/*
	* Sets event listeners for the container
	* Responsible for closing open lists on focus loss, opening lists when input is clicked and triggering custom_select_option.change_selected_option()
	* */
	public static set_event_listeners(
		container :HTMLDivElement,  // the container that is going to house all of the custom select elements
		change_callback :(payload :custom_select_element_change_payload) => void,  // the function that would receive the change_payload returned by custom_select_element.change_selected_option() whenever there was an option value change
		suggestions_callback :(select_element :HTMLElement, custom_select_option :HTMLElement) => void  // the function that would receive {DOMElement} current_list and {DOMElement} selected_option whenever a list is opened
	) :void {
		container.addEventListener('click', e => {

			if (e.target === null)
				return;

			const el = e.target as HTMLElement;

			// close opened lists
			const lists = Object.values(container.getElementsByClassName('custom_select')) as HTMLElement[];
			const current_list = el.closest('.custom_select:not([data-type="preview_list"]):not([data-type="suggestion_list"])') as HTMLSpanElement;

			for (const list of lists)
				if (list !== current_list)  // dont close current list
					custom_select_element.close_list(list);

			if (current_list === null)
				return;


			// toggle list options
			if (el.closest('.custom_select_input') !== null) {
				if (current_list.classList.contains('custom_select_open'))
					custom_select_element.close_list(current_list);
				else {
					current_list.classList.add('custom_select_open');

					// scroll the list down to selected option
					const selected_option = custom_select_element.get_selected_options(current_list)[0];

					if (typeof selected_option !== "undefined") {
						const options_container = <HTMLElement>current_list.getElementsByClassName('custom_select_options')[0];

						if (  // scroll down if
							options_container.scrollTop === 0 &&  // the list is not already scrolled
							options_container.offsetHeight < selected_option.offsetTop + selected_option.offsetHeight  // and selected item is not visible
						)
							options_container.scrollTop = selected_option.offsetTop - selected_option.offsetHeight;

					}

					suggestions_callback(current_list, selected_option);
				}
			}

			// check if option was changed
			const custom_select_option = el.closest('.custom_select_option') as HTMLElement;
			if (custom_select_option !== null) {

				const change_payload = custom_select_element.change_selected_option(current_list, custom_select_option);
				custom_select_element.close_list(current_list);

				if (typeof change_payload === "object")
					change_callback(change_payload);

			}

		});
	};

	/*
	* Callback for when list's option was clicked
	* */
	public static change_selected_option(
		target_list :HTMLSpanElement,  // the list that houses target_option
		target_option :HTMLSpanElement | String  // {HTMLSpanElement} the option or {string} the name of the option that was clicked
	) :custom_select_element_change_payload | undefined {

		// if target_option is option's name, find option element
		if (typeof target_option === 'string') {
			target_option = custom_select_element.find_option_by_name(target_list, target_option);
			if (target_option === null)
				return;
		}
		target_option = <HTMLElement>target_option;

		const custom_select_option_value = custom_select_element.get_option_value(target_option) as string;

		const group_element = target_option.parentElement;
		if (group_element !== null && group_element.classList.contains('custom_select_group') && group_element.getAttribute('data-group') === 'suggested_mappings')
			return {
				changed_list: target_list,
				selected_option: target_option,
				new_value: custom_select_option_value,
				list_type: 'suggested_mapping',
				previous_value: '',
				previous_previous_value: '',
				is_relationship: false,
				custom_select_type: '',
				list_table_name: '',
			};

		// ignore selected and disabled elements
		if (target_option.classList.contains('custom_select_option_selected') || target_option.classList.contains('custom_select_option_disabled')) {
			target_list.classList.add('custom_select_open');
			return;
		}

		// unselect all options
		for (const selected_line of Object.values(target_list.getElementsByClassName('custom_select_option_selected')))
			selected_line.classList.remove('custom_select_option_selected');

		// extract data about new option
		const custom_select_option_label_element :Element = target_option.getElementsByClassName('custom_select_option_label')[0];
		const custom_select_option_label = custom_select_option_label_element.textContent as string;

		let previous_list_value = custom_select_element.get_list_value(target_list) as string;
		const previous_previous_value = target_list.getAttribute('data-previous_value') as string;

		// don't change values if new value is 'add'
		const list_type = custom_select_element.get_list_mapping_type(target_list) as string;

		// don't do anything if value wasn't changed
		if (custom_select_option_value === previous_list_value)
			return;

		// update list data
		const is_relationship = target_option.classList.contains('custom_select_option_relationship');

		target_list.setAttribute('data_value_is_relationship', is_relationship.toString());
		target_list.setAttribute('data-value', custom_select_option_value);
		target_list.setAttribute('data-previous_value', previous_list_value);
		target_option.classList.add('custom_select_option_selected');


		// update custom_select_input
		const custom_select_inputs = Object.values(target_list.children).filter(element =>
			element.classList.contains('custom_select_input')
		);

		if (custom_select_inputs.length !== 0) {

			const custom_select_input = custom_select_inputs[0];
			const table_name = target_option.getAttribute('data-table_name') as string;

			const custom_select_input_icon :Element = custom_select_input.getElementsByClassName('custom_select_input_icon')[0];
			custom_select_input_icon.innerHTML = custom_select_element.get_icon_html(is_relationship, true, table_name);

			const custom_select_input_label = custom_select_input.getElementsByClassName('custom_select_input_label')[0] as HTMLElement;
			custom_select_input_label.innerText = custom_select_option_label;

		}


		const custom_select_type = target_list.getAttribute('data-type') as string;
		const list_table_name = custom_select_element.get_list_table_name(target_list) as string;
		return {
			changed_list: target_list,
			selected_option: target_option,
			new_value: custom_select_option_value,
			previous_value: previous_list_value,
			previous_previous_value,
			is_relationship,
			list_type,
			custom_select_type,
			list_table_name,
		};

	};

	/* Closes a list and removes its suggestion boxes */
	public static readonly close_list = (
		target_list :HTMLSpanElement  // a list to close
	) :void => {
		target_list.classList.remove('custom_select_open');
		const custom_select_suggestions = Object.values(target_list.getElementsByClassName('custom_select_suggestions'));
		for (const custom_select_suggestion of custom_select_suggestions)
			custom_select_suggestion.remove();
	};


	// HELPERS

	/* Adds a new option to an existing list at a specified position */
	public static add_option(
		list :HTMLSpanElement,  // the list that the option would be added to
		position :number,  // the position to add element at. If negative, starts from the back
		option_data :custom_select_element_option,  // option data. See custom_select_element.get_select_option_html() for data structure
		selected :boolean = false  // whether to trigger a custom_select_element.change_selected_option() event
	) :void {

		const new_option_line_html = custom_select_element.get_select_option_html(option_data);
		let new_option_line = document.createElement('span');

		const option_container = <HTMLElement>list.getElementsByClassName('custom_select_options')[0].getElementsByClassName('custom_select_group')[0];

		const options = option_container.children;

		if (position < -1)
			position = options.length + 1 + position;

		if (position >= options.length)
			option_container.appendChild(new_option_line);
		else
			option_container.insertBefore(new_option_line, options[position]);

		new_option_line.outerHTML = new_option_line_html;

		if (selected)
			custom_select_element.change_selected_option(list, options[position] as HTMLElement);

	};

	/* Enables all options in a list */
	public static enable_disabled_options(
		list :HTMLSpanElement  // the list that houses the options
	) :void {

		const options = list.getElementsByClassName('custom_select_option');

		for (const option of Object.values(options))
			option.classList.remove('custom_select_option_disabled');

	};


	public static readonly unselect_option = (
		list :HTMLSpanElement,  // the list that houses the option
		option :HTMLSpanElement  // the option to be unselected
	) :void => {
		option.classList.remove('custom_select_option_selected');
		list.setAttribute('data-previous_value', <string>list.getAttribute('data-value'));
		list.setAttribute('data-value', '0');
	};

	/* Enables or disables an option in a list */
	public static toggle_option(
		list :HTMLSpanElement,  // the list that houses the option
		option_name :string,  // the name of hte option that would be modified
		action :string  // 'enable'/'disable' - the action to perform on the option
	) :void {

		// don't do anything if seeking for the default option
		if (option_name === '0')
			return;

		const option = custom_select_element.find_option_by_name(list, option_name);

		// don't do anything if can't find the requested option
		if (typeof option === "undefined")
			return;

		if (action === 'enable')
			option.classList.remove('custom_select_option_disabled');

		// dont disable relationships
		else if (action === 'disable' && !option.classList.contains('custom_select_option_relationship'))
			option.classList.add('custom_select_option_disabled');

	};

	/* Find an option with a specified value */
	public static readonly find_option_by_name = (
		list :HTMLSpanElement,  // the list to search in
		option_name :string  // the value of the option to search for
	) :HTMLSpanElement =>
		(Object.values(list.getElementsByClassName('custom_select_option')) as HTMLElement[]).filter(option =>
			custom_select_element.get_option_value(option) === option_name
		)[0];

	/* Returns whether selected value in a list is a relationships */
	public static readonly element_is_relationship = (
		element :HTMLElement  // the list to check
	) :boolean /* whether selected value in a list is a relationships */ =>
		element.getAttribute('data_value_is_relationship') === 'true';


	// GETTERS

	/* Get all selected options in a list */
	public static readonly get_selected_options = (
		list :HTMLSpanElement  // the list to search in
	) :HTMLElement[] /* array of selected options */ =>
		Object.values(list.getElementsByClassName('custom_select_option_selected')) as HTMLElement[];

	/* Returns whether selection option is enabled */
	public static readonly is_selected_option_enabled = (
		list :HTMLElement  // the list to search in
	) :boolean /* True if no option is selected or selected option is not disabled */ => {

		const option = custom_select_element.get_selected_options(list)[0];

		if (typeof option === "undefined")
			return true;

		else
			return !option.classList.contains('custom_select_option_disabled');

	};

	/* Returns the value of the option */
	public static readonly get_option_value = (
		option_element :HTMLElement  // the option element
	) :string | null /* the value of the option */ =>
		option_element.getAttribute('data-value');

	/* Returns the value of the list */
	public static readonly get_list_value = (
		list_element :HTMLElement  // the list to check
	) :string | null /* the value of the list */ =>
		list_element.getAttribute('data-value');

	/* Returns the table a list represents */
	public static readonly get_list_table_name = (
		list_element :HTMLElement  // the list to check
	) :string | null /* the table a list represents */ =>
		list_element.getAttribute('data-table');

	/* Returns the mapping type of a list */
	public static readonly get_list_mapping_type = (
		list_element :HTMLElement  // the list to check
	) :string | null /* the mapping type of a list */ =>
		list_element.getAttribute('data-mapping_type');

}

export = custom_select_element;