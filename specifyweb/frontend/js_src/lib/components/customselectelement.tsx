'use strict';

import icons from '../icons';
import React from 'react';

const Icon = React.memo(({
	is_relationship=false,
	table_name='',
} :CustomSelectElementIconProps) => {
	if (!is_relationship || table_name === '')
		return null;

	const table_icon_src = icons.getIcon(table_name);
	if (table_icon_src === '/images/unknown.png') {
		const table_sub_name = table_name.substr(0, 2);
		const color_hue = (
			(
				table_sub_name[0].charCodeAt(0) + table_sub_name[1].charCodeAt(0)
			) - (
			'a'.charCodeAt(0) * 2
			)
		) * 7.2;
		const color = `hsl(${color_hue}, 70%, 50%)`;
		return <span
			style={{backgroundColor: color}}
			className="custom_select_option_icon_undefined"
		>
			{table_sub_name.toUpperCase()}
		</span>;
	}
	else
		return <span style={{backgroundImage: `url('${table_icon_src}')`}}/>;
});

/* Generates a single option line */
const Option = React.memo(({
	option_name = '',
	is_enabled = true,
	is_relationship = false,
	is_default = false,
	table_name = '',
	handleClick
} :CustomSelectElementOptionProps) => {

	const classes = ['custom_select_option'];

	if (!is_enabled && !is_relationship)  // don't disable relationships
		classes.push('custom_select_option_disabled');

	if (is_relationship)
		classes.push('custom_select_option_relationship');

	if (is_default)
		classes.push('custom_select_option_selected');

	handleClick = (
		typeof handleClick !== "undefined" &&
		is_enabled &&
		is_default
	) ?
		(()=>handleClick!(option_name)) :
		undefined

	return <span
		className={classes.join(' ')}
		tabIndex={0}
		handleClick=handleClick
	>
		<span className="custom_select_option_icon">
			<Icon is_relationship={is_relationship} table_name={table_name}/>
		</span>
		<span className="custom_select_option_label">{option_name}</span>
	</span>;
});

/* Generates a group of options */
const OptionGroup = ({
	select_group_label,
	select_options_data,
} :CustomSelectElementOptionGroupProps) =>
	<span className="custom_select_group">
		<span className="custom_select_group_label">${select_group_label}</span>
		${select_options_data.map(selection_option_data =>
		<Option {...selection_option_data} />,
	)}
	</span>;

function handleOptionClick(handleChange:handleChange){

}

/* Generates a custom select element */
export function CustomSelectElement(
	{
		custom_select_type,
		custom_select_subtype = 'simple',
		custom_select_option_groups,
		select_label = '',
		default_option = {
			option_name: '0',
			table_name: '',
		},
		is_open,
		handleChange,
		handleOpen,
		handleClose,
	} :CustomSelectElementProps,
) {

	const option_is_clickable = custom_select_type !== 'preview_list' && custom_select_type !== 'suggestion_list';

	const handleClick = option_is_clickable ?
		handleOptionClick.bind(handleChange) :
		undefined

	let header = null;
	let preview = null;
	let first_row = null;
	if (custom_select_type === 'opened_list')
		header = <span className="custom_select_header">
			<span className="custom_select_header_icon">
				<Icon is_relationship={true} table_name={default_option.table_name}/>
			</span>
			<span className="custom_select_table_label">
				{select_label}
			</span>
		</span>;
	else {

		let default_icon = default_option.option_name !== '0' &&
			<Icon is_relationship={true} table_name={default_option.table_name}/>;

		preview = <span className="custom_select_input" tabIndex={0} onClick={
			option_is_clickable ?
				is_open ?
					handleClose :
					handleOpen :
				undefined
		}>
			<span className="custom_select_input_icon">{default_icon}</span>
			<span className="custom_select_input_label">{default_option.option_name}</span>
		</span>;

		first_row = is_open && custom_select_subtype!=='tree' &&
			<Option
				handleClick={handleClick}
				is_default={default_option.option_name === '0'}
			/>;

	}

	const groups = option_is_clickable &&
		custom_select_option_groups.map(select_group_data =>
			<OptionGroup
				handleClick={handleClick}
				{...select_group_data}
			/>,
		);

	const custom_select_options = (
		first_row !== null || groups !== null
		) &&
		<span className="custom_select_options">
			{first_row}
			{groups}
		</span>;


	return <span
		className="custom_select"
		title="{select_label}">
		{header}
		{preview}
		{custom_select_options}
	</span>;

}

/* Generates a suggestion box */
export const SuggestionBox = (
	select_options_data :CustomSelectElementOptionProps[],
) =>
	<span className="custom_select_suggestions">
		<OptionGroup
			select_group_label='Suggested mappings:'
			select_options_data={select_options_data}
		/>
	</span>;


// EVENT LISTENERS

/*
* Sets event listeners for the container
* Responsible for closing open lists on focus loss, opening lists when input is clicked and triggering custom_select_option.change_selected_option()
* */
function set_event_listeners(
	container :HTMLDivElement,  // the container that is going to house all of the custom select elements
	change_callback :(payload :custom_select_element_change_payload) => void,  // the function that would receive the change_payload returned by change_selected_option() whenever there was an option value change
	suggestions_callback :(select_element :HTMLElement, custom_select_option :HTMLElement) => void,  // the function that would receive {DOMElement} current_list and {DOMElement} selected_option whenever a list is opened
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
				close_list(list);

		if (current_list === null)
			return;


		// toggle list options
		if (el.closest('.custom_select_input') !== null) {
			if (current_list.classList.contains('custom_select_open'))
				close_list(current_list);
			else {
				current_list.classList.add('custom_select_open');

				// scroll the list down to selected option
				const selected_option = get_selected_options(current_list)[0];

				if (typeof selected_option !== 'undefined') {
					const options_container = current_list.getElementsByClassName('custom_select_options')[0] as HTMLElement;

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

			const change_payload = change_selected_option(current_list, custom_select_option);
			close_list(current_list);

			if (typeof change_payload === 'object')
				change_callback(change_payload);

		}

	});
}

/*
* Callback for when list's option was clicked
* */
function change_selected_option(
	target_list :HTMLSpanElement,  // the list that houses target_option
	target_option :HTMLSpanElement | String,  // {HTMLSpanElement} the option or {string} the name of the option that was clicked
) :custom_select_element_change_payload | undefined {

	// if target_option is option's name, find option element
	if (typeof target_option === 'string') {
		target_option = find_option_by_name(target_list, target_option);
		if (target_option === null)
			return;
	}
	target_option = target_option as HTMLElement;

	const custom_select_option_value = get_option_value(target_option) as string;

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

	let previous_list_value = get_list_value(target_list) as string;
	const previous_previous_value = target_list.getAttribute('data-previous_value') as string;

	// don't change values if new value is 'add'
	const list_type = get_list_mapping_type(target_list) as string;

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
		element.classList.contains('custom_select_input'),
	);

	if (custom_select_inputs.length !== 0) {

		const custom_select_input = custom_select_inputs[0];
		const table_name = target_option.getAttribute('data-table_name') as string;

		const custom_select_input_icon :Element = custom_select_input.getElementsByClassName('custom_select_input_icon')[0];
		custom_select_input_icon.innerHTML = get_icon_html(is_relationship, true, table_name);

		const custom_select_input_label = custom_select_input.getElementsByClassName('custom_select_input_label')[0] as HTMLElement;
		custom_select_input_label.innerText = custom_select_option_label;

	}


	const custom_select_type = target_list.getAttribute('data-type') as string;
	const list_table_name = get_list_table_name(target_list) as string;
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

}