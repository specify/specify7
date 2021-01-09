/*
*
* Generate HTML for various control elements created during mapping process
*
* */

'use strict';

import React from 'react';
import {CustomSelectElement, SuggestionBox} from './customselectelement';

/* Generates a list of tables */
export const ListOfBaseTables = React.memo(({
		list_of_tables,
		handleChange,
	} :ListOfBaseTablesProps) =>
		<MappingElement
			is_open={true}
			handleChange={handleChange}
			select_label=''
			fields_data={
				Object.fromEntries(
					Object.entries(list_of_tables).map(([table_name, table_label]) => (
						[
							table_name,
							{
								field_friendly_name: table_label,
								table_name,
								is_relationship: true,
							}
						]
					))
				)
			}
			custom_select_type='opened_list'
			custom_select_subtype='simple'
		/>,
);

/* Generates a mapping line */
export const MappingLine = ({
	line_data,
	mapping_type,
	header_name,
	is_focused,
	handleFocus,
	handleClearMapping,
	handleStaticHeaderChange=()=>{}
} :MappingLineProps) =>
	<div className={`wbplanview_mappings_line ${is_focused ? 'wbplanview_mappings_line_focused' : ''}`}
		 onClick={handleFocus}>
		<div className="wbplanview_mappings_line_controls">
			<button className="wbplanview_mappings_line_delete" title="Clear mapping" onClick={handleClearMapping}>
				<img src="../../../static/img/discard.svg" alt="Clear mapping"/>
			</button>
		</div>
		<div className="wbplanview_mappings_line_header">
			{
				mapping_type === 'new_static_column' ?
					<StaticHeader default_value={header_name} onChange={handleStaticHeaderChange}/> :
					header_name
			}
		</div>
		<div className="wbplanview_mappings_line_elements">
			<MappingPath mappings_line_data={line_data}/>
		</div>
	</div>;

/* Generates a mapping path */
export const MappingPath = ({
	mappings_line_data,
}:MappingPathProps) =>
	<>
		{mappings_line_data.map((mapping_details, index) =>
			<React.Fragment key={index}>
				<MappingElement {...mapping_details} />
				{index+1 !== mappings_line_data.length && <MappingElementDivider />}
			</React.Fragment>,
		)}
	</>;

const field_group_labels :{[key :string] :string} = {
	required_fields: 'Required Fields',
	optional_fields: 'Optional Fields',
	hidden_fields: 'Hidden Fields',
};

const MappingElementDivider = ()=>
	<span className="wbplanview_mappings_line_divider">&#x2192;</span>

/* Generates a new mapping element */
function MappingElement(
	props :MappingElementProps,
) {

	const field_groups = Object.fromEntries(Object.keys(field_group_labels).map((field_group_label) =>
		[field_group_label, {} as CustomSelectElementOptions],
	));

	let default_option:CustomSelectElementDefaultOptionProps|undefined;

	const field_names:string[] = [];

	Object.entries(props.fields_data).forEach(([
		field_name,
		{
		field_friendly_name,  // field label
			is_enabled = true,  // whether field is enabled (not mapped yet)
			is_default = false,  // whether field is selected by default
			table_name = '',  // table name for this option
			is_relationship = false,  // whether this field is relationship, tree rank or reference item
			is_required = false,  // whether this field is required
			is_hidden = false,  // whether this field is hidden
		}
	])=>{

		if(is_default){

			if(default_option)
				throw new Error('Multiple default options can not be present in the same list');

			default_option = {
				option_name: field_name,
				option_label: field_friendly_name,
				table_name,
				is_relationship
			};
		}

		if(!props.is_open)
			field_names.push(field_friendly_name);
		else {
			const filed_group = is_hidden && 'hidden_fields' ||
				is_required && 'required_fields' ||
				'optional_fields';

			field_groups[filed_group][field_name] = {
				option_label: field_friendly_name,
				is_enabled,
				is_relationship,
				is_default,
				table_name,
			}
		}
	});

	if(!default_option)
		default_option = {
			option_name: '0',
			option_label: '0',
			table_name: '',
			is_relationship: false,
		}


	return props.is_open ?
		<CustomSelectElement
			{...props}
			custom_select_option_groups={
				Object.entries(field_groups).filter(([_group_name, group_fields])=>
					group_fields.length !== 0
				).map(([group_name, group_fields])=>({
					select_group_label: props.custom_select_subtype==='tree' ?  // don't show group labels on tree ranks
						undefined :
						field_group_labels[group_name],
					select_options_data: group_fields,
				}))
			}
			default_option={default_option}
			automapper_suggestions={
				typeof props.automapper_suggestions !== "undefined" && props.automapper_suggestions.length>0 ?
					<SuggestionBox
						select_options_data={{
							option_label:
								<>{
									props.automapper_suggestions.map(automapper_suggestion=>
										<MappingPath mappings_line_data={automapper_suggestion} />
									)
								}</>
						}}
					/> :
					undefined
			}
		/> :
		<CustomSelectElement
			default_option={default_option}
			{...props}
			field_names={field_names}
		/>;

}

/* Return a textarea with a given value for a new static header */
const StaticHeader = ({
	default_value = '',
	onChange: handleChange,
}:StaticHeaderProps) =>
	<textarea value={default_value} onChange={handleChange}/>;