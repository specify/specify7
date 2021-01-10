/*
*
* Custom Select Element (picklist). Used by workbench mapper
*
* */

'use strict';

import icons               from '../icons';
import React               from 'react';
import { named_component } from './wbplanview';

const Icon = React.memo(named_component(({
	is_relationship = false,
	is_default = false,
	is_enabled = true,
	table_name = '',
	option_label = '0',
} :CustomSelectElementIconProps) => {

	const not_relationship = !is_relationship;

	if (option_label === '0')
		return <span className="custom_select_option_icon_undefined">&#8416;</span>;
	if (not_relationship && (
		is_default || !is_enabled
	))
		return <span className="custom_select_option_icon_selected">&#10003;</span>;
	else if (not_relationship || table_name === '')
		return null;

	const table_icon_src = icons.getIcon(table_name);
	if (table_icon_src !== '/images/unknown.png')
		return <span className="custom_select_option_icon_table"
					 style={{backgroundImage: `url('${table_icon_src}')`}} />;

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
		className="custom_select_option_icon_table_undefined"
	>
		{table_sub_name.toUpperCase()}
	</span>;
}, 'Icon'));

/* Generates a single option line */
const Option = React.memo(named_component(({
	option_label,
	is_enabled = true,
	is_relationship = false,
	is_default = false,
	table_name = '',
	handleClick,
} :CustomSelectElementOptionProps) => {

	const classes = ['custom_select_option'];

	if (!is_enabled && !is_relationship)  // don't disable relationships
		classes.push('custom_select_option_disabled');

	if (is_relationship)
		classes.push('custom_select_option_relationship');

	if (is_default)
		classes.push('custom_select_option_selected');

	return <span
		className={classes.join(' ')}
		tabIndex={0}
		onClick={handleClick}
	>
		<span className="custom_select_option_icon">
			<Icon
				option_label={option_label}
				is_relationship={is_relationship}
				is_default={is_default}
				is_enabled={is_enabled}
				table_name={table_name}
			/>
		</span>
		{option_label !== '0' && <span className="custom_select_option_label">{option_label}</span>}
		{is_relationship && <span className="custom_select_option_relationship">&#9654;</span>}
	</span>;
}, 'Option'));

/* Generates a group of options */
const OptionGroup = named_component(({
	select_group_name,
	select_group_label,
	select_options_data,
	handleClick,
} :CustomSelectElementOptionGroupProps) =>
	<span className={`custom_select_group custom_select_group_${select_group_name}`}>
		{
			typeof select_group_label !== 'undefined' &&
			<span className="custom_select_group_label">{select_group_label}</span>
		}
		{Object.entries(select_options_data).map(([option_name, selection_option_data]) => {
			return <Option
				key={option_name}
				handleClick={
					typeof handleClick === 'undefined' ?
						undefined :
						handleClick.bind(
							null,
							option_name,
							typeof selection_option_data.is_relationship !== 'undefined' &&
							selection_option_data.is_relationship,
						)
				}
				{...selection_option_data}
			/>;
		})}
	</span>, 'OptionGroup');

const ShadowListOfOptions = React.memo(named_component(({field_names} :ShadowListOfOptionsProps) =>
	<ul className="custom_select_element_shadow_list">{
		field_names.map((field_name, index) =>
			<li key={index}>{field_name}</li>,
		)
	}</ul>, 'ShadowListOfOptions'));

const intractable_select_types :custom_select_type[] = ['preview_list', 'suggestion_line_list'];
const select_types_with_headers :custom_select_type[] = ['opened_list', 'base_table_selection_list'];
const select_types_with_first_row :custom_select_type[] = ['closed_list', 'preview_list', 'suggestion_line_list'];

/* Generates a custom select element */
export function CustomSelectElement(
	{
		custom_select_type,
		custom_select_subtype = 'simple',
		custom_select_option_groups,
		select_label = '',
		default_option = {
			option_name: '0',
			option_label: '0',
			table_name: '',
			is_relationship: false,
		},
		is_open,
		table_name,
		// autoscroll=false,
		field_names,
		handleChange,
		handleOpen,
		handleClose,
		automapper_suggestions,
	} :CustomSelectElementProps,
) {

	// const list_of_options = React.useRef<HTMLElement>(null);

	const option_is_intractable = intractable_select_types.indexOf(custom_select_type) === -1;

	const handleClick = option_is_intractable && typeof handleChange === 'function' ?
		(new_value :string, is_relationship :boolean) =>
			new_value === default_option.option_name ?
				undefined :
				handleChange(new_value, is_relationship) :
		undefined;

	let header;
	let preview;
	let first_row;
	let options_shadow;
	if (select_types_with_headers.includes(custom_select_type) && select_label)
		header = <span className="custom_select_header">
			<span className="custom_select_header_icon">
				<Icon
					is_default={true}
					is_relationship={true}
					table_name={table_name}
					option_label={table_name}
				/>
			</span>
			<span className="custom_select_table_label">
				{select_label}
			</span>
		</span>;
	else if (select_types_with_first_row.includes(custom_select_type)) {

		let default_icon = <Icon
			is_default={true}
			is_relationship={default_option.is_relationship}
			table_name={default_option.table_name}
			option_label={default_option.option_label}
		/>;

		preview = <span className="custom_select_input" tabIndex={0} onClick={
			option_is_intractable ?
				is_open ?
					handleClose :
					handleOpen :
				undefined
		}>
			<span className="custom_select_input_icon">{default_icon}</span>
			<span className="custom_select_input_label">{
				default_option.option_label === '0' ?
					undefined :
					default_option.option_label
			}</span>
			{option_is_intractable && <span className="custom_select_input_dropdown">&#9660;</span>}
		</span>;

		const show_first_row = is_open &&
			option_is_intractable &&
			custom_select_subtype !== 'tree' &&
			default_option.option_name !== '0';

		first_row = show_first_row &&
			<Option
				handleClick={
					typeof handleClick === 'undefined' ?
						undefined :
						handleClick.bind(null, '0', false)
				}
				is_default={default_option.option_label === '0'}
			/>;

		options_shadow = !is_open && option_is_intractable && field_names &&
			<ShadowListOfOptions field_names={field_names} />;

	}

	const groups = is_open && option_is_intractable &&
		Object.entries(custom_select_option_groups!).filter(([_select_group_name, {select_options_data}]) =>
			Object.keys(select_options_data).length !== 0,
		).map(([select_group_name, select_group_data], index) =>
			<OptionGroup
				key={index}
				handleClick={handleClick}
				select_group_name={select_group_name}
				{...select_group_data}
			/>,
		);

	const custom_select_options = (
			first_row || groups
		) &&
		<span className="custom_select_options"/* ref={list_of_options}*/>
			{first_row}
			{groups}
		</span>;

	// React.useEffect(()=>{
	// 	if(// auto scroll down the option if
	// 		is_open &&  // it is open
	// 		option_is_clickable &&  // and it can be opened
	// 		autoscroll &&  // and was told to open it
	// 		list_of_options !== null &&  // and list of option exists
	// 		list_of_options.current !== null &&  // and dom is rendered
	// 		default_option.option_name!=='0' &&  // and list has a value
	// 		list_of_options.current.scrollTop === 0 &&  // and the list is not already scrolled
	// 		// and selected item is not visible
	// 		list_of_options.current.offsetHeight < selected_option.offsetTop + selected_option.offsetHeight
	// 	)
	// 		list_of_options.current.scrollTop = selected_option.offsetTop - selected_option.offsetHeight;
	// });


	return <span
		className={`custom_select custom_select_${custom_select_type}`}
		title={
			custom_select_type === 'opened_list' || custom_select_type === 'base_table_selection_list' ?
				undefined :
				select_label
		}>
		{automapper_suggestions}
		{header}
		{preview}
		{options_shadow}
		{custom_select_options}
	</span>;

}

/* Generates a suggestion box */
export const SuggestionBox = named_component(({
	select_options_data,
	handleAutomapperSuggestionSelection,
	...props
} :SuggestionBoxProps) =>
	<CustomSelectElement
		custom_select_type='suggestion_list'
		custom_select_subtype='simple'
		custom_select_option_groups={{
			'suggested_mappings': {
				select_group_label: 'Suggested mappings:',
				select_options_data,
			},
		}}
		is_open={true}
		handleChange={handleAutomapperSuggestionSelection}
		{...props}
	/>, 'SuggestionBox');