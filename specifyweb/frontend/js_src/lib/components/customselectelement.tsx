'use strict';

import icons from '../icons';
import React from 'react';

const Icon = React.memo(({
	is_relationship = false,
	is_default = false,
	is_enabled = true,
	table_name = '',
	option_label = '0'
} :CustomSelectElementIconProps) => {

	if(option_label==='0')
		return <span className="custom_select_option_icon_undefined">&#8416;</span>
	if(!is_relationship && (is_default || !is_enabled))
		return <span className="custom_select_option_icon_selected">&#10003;</span>
	else if(!is_relationship || table_name === '')
		return null;

	const table_icon_src = icons.getIcon(table_name);
	if (table_icon_src !== '/images/unknown.png')
		return <span className="custom_select_option_icon_table" style={{backgroundImage: `url('${table_icon_src}')`}}/>

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
});

/* Generates a single option line */
const Option = React.memo(({
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
});

/* Generates a group of options */
const OptionGroup = ({
	select_group_label,
	select_options_data,
	handleClick,
} :CustomSelectElementOptionGroupProps) =>
	<span className="custom_select_group">
		{
			typeof select_group_label !== "undefined" &&
			<span className="custom_select_group_label">{select_group_label}</span>
		}
		{Object.entries(select_options_data).map(([option_name, selection_option_data]) => {
			return <Option
				key={option_name}
				handleClick={
					typeof handleClick !== "undefined" ?
						handleClick.bind(null, option_name) :
						undefined
				}
				{...selection_option_data}
			/>;
		})}
	</span>;

const ShadowListOfOptions = React.memo(({field_names}:ShadowListOfOptionsProps)=>
	<ul className="custom_select_element_shadow_list">{
		field_names.map((field_name, index) =>
			<li key={index}>{field_name}</li>
		)
	}</ul>
);

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
		// autoscroll=false,
		field_names,
		handleChange,
		handleOpen,
		handleClose,
		automapper_suggestions,
	} :CustomSelectElementProps,
) {

	// const list_of_options = React.useRef<HTMLElement>(null);

	const option_is_clickable = custom_select_type !== 'preview_list' && custom_select_type !== 'suggestion_list';

	const handleClick = option_is_clickable && typeof handleChange !== "undefined" ?
		(new_value :string) =>
			new_value !== default_option.option_name ?
				handleChange(new_value) :
				undefined :
		undefined;

	let header;
	let preview;
	let first_row;
	let options_shadow;
	if (custom_select_type === 'opened_list')
		header = select_label !== '' &&
			<span className="custom_select_header">
				<span className="custom_select_header_icon">
					<Icon
						is_default={true}
						is_relationship={true}
						table_name={default_option.table_name}
						option_label={default_option.option_label}
					/>
				</span>
				<span className="custom_select_table_label">
					{select_label}
				</span>
			</span>;
	else {

		let default_icon = <Icon
			is_default={true}
			is_relationship={default_option.is_relationship}
			table_name={default_option.table_name}
			option_label={default_option.option_label}
		/>;

		preview = <span className="custom_select_input" tabIndex={0} onClick={
			option_is_clickable ?
				is_open ?
					handleClose :
					handleOpen :
				undefined
		}>
			<span className="custom_select_input_icon">{default_icon}</span>
			<span className="custom_select_input_label">{default_option.option_label}</span>
			{option_is_clickable && <span className="custom_select_input_dropdown">&#9660;</span>}
		</span>;

		first_row = is_open && custom_select_subtype !== 'tree' && default_option.option_name!=='0' &&
			<Option
				handleClick={
					typeof handleClick === 'undefined' ?
						undefined :
						handleClick.bind(null, '0')
				}
				is_default={default_option.option_label === '0'}
			/>;

		options_shadow = !is_open && option_is_clickable && field_names &&
			<ShadowListOfOptions field_names={field_names} />

	}

	const groups = is_open && option_is_clickable &&
		custom_select_option_groups!.filter(({select_options_data}) =>
			Object.keys(select_options_data).length !== 0,
		).map((select_group_data,index) =>
			<OptionGroup
				key={index}
				handleClick={handleClick}
				{...select_group_data}
				select_group_label={
					custom_select_type === 'opened_list' ?
						undefined :
						select_group_data.select_group_label
				}
			/>,
		);

	const custom_select_options = (first_row || groups) &&
		<span className="custom_select_options"/* ref={list_of_options}*/>
			{first_row}
			{groups}
		</span>;

	// React.useEffect(()=>{
	// 	if( // auto scroll down the option if
	// 		is_open &&  // it is open
	// 		option_is_clickable &&  // and it can be opened
	// 		autoscroll &&  // and was told to open it
	// 		list_of_options !== null &&  // and list of option exists
	// 		list_of_options.current !== null &&  // and dom is rendered
	// 		default_option.option_name!=='0' &&  // and list has a value
	// 		list_of_options.current.scrollTop === 0 &&  // and the list is not already scrolled
	// 		list_of_options.current.offsetHeight < selected_option.offsetTop + selected_option.offsetHeight  // and selected item is not visible
	// 	)
	// 		list_of_options.current.scrollTop = selected_option.offsetTop - selected_option.offsetHeight;
	// });


	return <span
		className={`custom_select custom_select_${custom_select_type}`}
		title={custom_select_type!=='opened_list' ? select_label : undefined}>
		{automapper_suggestions}
		{header}
		{preview}
		{options_shadow}
		{custom_select_options}
	</span>;

}

/* Generates a suggestion box */
export const SuggestionBox = (
	select_options_data :CustomSelectElementOptions,
) =>
	<span className="custom_select_suggestions">
		<OptionGroup
			select_group_label='Suggested mappings:'
			select_options_data={select_options_data}
		/>
	</span>;