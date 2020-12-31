/*
*
* Generate HTML for various control elements created during mapping process
*
* */

'use strict';

import React from 'react';
import {CustomSelectElement} from './customselectelement';

/* Generates a list of tables */
export const ListOfBaseTables = React.memo(({
		list_of_tables,
	} :ListOfBaseTablesProps) =>
		<MappingElement
			select_label='Select a base table:'
			fields_data={
				Object.fromEntries(Object.entries(list_of_tables).map(([table_name, table_label]) =>
					[
						table_name,
						{
							field_friendly_name: table_label,
							table_name,
							is_relationship: true,
						},
					],
				))
			}
			custom_select_type='opened_list'
			custom_select_subtype='simple'
		/>,
);

/* Generates a mapping line */
export const MappingLine = ({
	line_data,
	header_data: {
		mapping_type,
		header_name,
	},
	line_attributes = [],
} :MappingLineProps) =>
	<div className={`wbplanview_mappings_line ${line_attributes.join(' ')}`}>
		<div className="wbplanview_mappings_line_controls">
			<button className="wbplanview_mappings_line_delete" title="Clear mapping">
				<img src="../../../static/img/discard.svg" alt="Clear mapping"/>
			</button>
		</div>
		<div className="wbplanview_mappings_line_header">
			{mapping_type === 'new_static_column' && <StaticHeader default_value={header_name}/> || header_name}
		</div>
		<div className="wbplanview_mappings_line_elements">
			<MappingPath mappings_line_data={line_data}/>
		</div>
	</div>;

/* Generates a mapping path */
const MappingPath = ({
	mappings_line_data,
} :MappingPathProps) =>
	<>
		{mappings_line_data.map((mapping_details, index) =>
			<MappingElement key={index} {...mapping_details} />,
		)}
	</>;

const field_group_labels :{[key :string] :string} = {
	required_fields: 'Required Fields',
	optional_fields: 'Optional Fields',
	hidden_fields: 'Hidden Fields',
};

/* Generates a new mapping element */
function MappingElement(
	props :MappingElementProps,
) {

	const field_groups = Object.fromEntries(Object.keys(field_group_labels).map((field_group_label) =>
		[field_group_label, [] as CustomSelectElementOptionProps[]],
	));

	Object.values(props.fields_data).forEach(({
			field_friendly_name,  // field label
			is_enabled = true,  // whether field is enabled (not mapped yet)
			is_default = false,  // whether field is selected by default
			table_name = '',  // table name for this option
			is_relationship = false,  // whether this field is relationship, tree rank or reference item
			is_required = false,  // whether this field is required
			is_hidden = false,  // whether this field is hidden
		}) =>
			field_groups[
			is_hidden && 'hidden_fields' ||
			is_required && 'required_fields' ||
			'optional_fields'
				].push({
				option_name: field_friendly_name,
				is_enabled,
				is_relationship,
				is_default,
				table_name,
			}),
	);

	const table_fields = [];
	for (const [group_name, group_fields] of Object.entries(field_groups))
		if (group_fields.length !== 0)
			table_fields.push({
				select_group_name: group_name,
				select_group_label: field_group_labels[group_name],
				select_options_data: group_fields,
			});

	return <CustomSelectElement
		{...props}
		select_groups_data={table_fields}
	/>;

}

/* Return a textarea with a given value for a new static header */
const StaticHeader = ({
	default_value = '',
}) =>
	<textarea value={default_value}/>;