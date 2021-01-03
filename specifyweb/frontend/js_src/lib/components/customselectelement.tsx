'use strict';

import icons from '../icons';
import React from 'react';

const Icon = React.memo(({
	is_relationship = false,
	table_name = '',
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
			<Icon is_relationship={is_relationship} table_name={table_name}/>
		</span>
		<span className="custom_select_option_label">{option_label}</span>
	</span>;
});

/* Generates a group of options */
const OptionGroup = ({
	select_group_label,
	select_options_data,
} :CustomSelectElementOptionGroupProps) =>
	<span className="custom_select_group">
		{
			typeof select_group_label !== "undefined" &&
			<span className="custom_select_group_label">{select_group_label}</span>
		}
		{Object.entries(select_options_data).map(([option_name, selection_option_data]) => {
			let {handleClick, ...partial_selection_option_data} = selection_option_data;
			if (typeof handleClick !== 'undefined')
				handleClick = handleClick.bind(null, option_name);
			return <Option
				key={option_name}
				handleClick={handleClick}
				{...partial_selection_option_data}
			/>;
		})}
	</span>;

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
		},
		is_open,
		handleChange,
		handleOpen,
		handleClose,
		automapper_suggestions,
	} :CustomSelectElementProps,
) {

	const option_is_clickable = custom_select_type !== 'preview_list' && custom_select_type !== 'suggestion_list';

	const handleClick = option_is_clickable ?
		(new_value :string) =>
			new_value !== default_option.option_name ?
				handleChange :
				undefined :
		undefined;

	let header = null;
	let preview = null;
	let first_row = null;
	if (custom_select_type === 'opened_list')
		header = select_label !== '' &&
			<span className="custom_select_header">
				<span className="custom_select_header_icon">
					<Icon is_relationship={true} table_name={default_option.table_name}/>
				</span>
				<span className="custom_select_table_label">
					{select_label}
				</span>
			</span>;
	else {

		let default_icon = default_option.option_label !== '0' &&
			<Icon is_relationship={true} table_name={default_option.table_name}/>;

		preview = <span className="custom_select_input" tabIndex={0} onClick={
			option_is_clickable ?
				is_open ?
					handleClose :
					handleOpen :
				undefined
		}>
			<span className="custom_select_input_icon">{default_icon}</span>
			<span className="custom_select_input_label">{default_option.option_label}</span>
		</span>;

		first_row = is_open && custom_select_subtype !== 'tree' &&
			<Option
				handleClick={
					typeof handleClick === 'undefined' ?
						undefined :
						handleClick.bind(null, '0')
				}
				is_default={default_option.option_label === '0'}
			/>;

	}

	const groups = is_open && option_is_clickable &&
		custom_select_option_groups!.filter(({select_options_data}) =>
			Object.keys(select_options_data).length !== 0,
		).map(select_group_data =>
			<OptionGroup
				key={select_group_data.select_group_label}
				handleClick={handleClick}
				{...select_group_data}
				select_group_label={
					custom_select_type === 'opened_list' ?
						undefined :
						select_group_data.select_group_label
				}
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
		title={custom_select_type!=='opened_list' ? select_label : undefined}>
		{automapper_suggestions}
		{header}
		{preview}
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