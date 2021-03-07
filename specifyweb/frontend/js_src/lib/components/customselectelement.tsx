/*
*
* Custom Select Element (picklist). Used by workbench mapper
*
* */

'use strict';

import icons               from '../icons';
import React               from 'react';
import { named_component } from '../statemanagement';


export type CustomSelectType =
  'opened_list' /*
  * used in the mapping view
  * list without an `input` box but with always opened list of options
  * and a table name on top has onChange event */

  | 'closed_list' /*
  * used in mapping lines
  * list with an `input` box and a list of options that can be opened
  * has onOpen/onClose and onChange events */

  | 'preview_list' /*
  * used in the mapping validation results
  * list with an `input` box but with no list of options
  * has no events */

  | 'suggestion_list' /*
  * used to display a list of automapper suggestions
  * like opened_list, but without a table name on top
  * has onChange event: */

  | 'suggestion_line_list' /*
  * used inside `suggestion_list` to display a mapping path element for
  * a single suggestion line list with an `input` box but with no list of
  * options has no events: */

  | 'base_table_selection_list' /*
  * used for base table selection
  * like opened_list, but without a header and option group labels
  * has onChange event */;

export type CustomSelectSubtype =
  'simple'  // for fields and relationships
  | 'to_many'  // for reference items
  | 'tree'  // for tree ranks

interface CustomSelectElementIconProps {
  // whether the option is a relationship (False for fields, true for
  // relationships, tree ranks and reference items)
  readonly is_relationship?: boolean,
  readonly is_default?: boolean,  // whether the option is now selected
  readonly table_name?: string,  // the name of the table this option represents
  // the name of the option. Would be used as a label (visible to the user)
  readonly option_label?: string | JSX.Element,
  // True if option can be selected. False if option cannot be selected because
  // it was already selected
  readonly is_enabled?: boolean,
  // whether an icon is used inside of preview_row in closed_list
  readonly is_preview?: boolean,
}

interface CustomSelectElementOptionProps extends CustomSelectElementIconProps {
  readonly handleClick?: () => void,
}

export interface CustomSelectElementDefaultOptionProps {
  readonly option_name: string
  readonly option_label: string | JSX.Element
  readonly table_name?: string
  readonly is_relationship?: boolean
}

export type CustomSelectElementOptions =
  Record<string, CustomSelectElementOptionProps>

interface CustomSelectElementOptionGroupProps {
  readonly select_group_name?: string,  // group's name (used for styling)
  readonly select_group_label?: string,  // group's label (shown to the user)
  // list of options data. See custom_select_element.get_select_option_html()
  // for the data structure
  readonly select_options_data: CustomSelectElementOptions
  readonly handleClick?: (
    new_value: string,
    is_relationship: boolean,
  ) => void,
}

type CustomSelectElementOptionGroups =
  Record<string, CustomSelectElementOptionGroupProps>

interface CustomSelectElementPropsBase {
  readonly select_label?: string,  // the label to use for the element
  readonly custom_select_type: CustomSelectType,
  readonly custom_select_subtype?: CustomSelectSubtype,
  readonly default_option?: CustomSelectElementDefaultOptionProps,
  readonly is_open: boolean,
  readonly table_name?: string,

  readonly handleOpen?: () => void,
  readonly field_names?: string[],

  readonly handleChange?: (
    new_value: string,
    is_relationship: boolean,
  ) => void,
  readonly handleClose?: () => void,
  readonly custom_select_option_groups?: CustomSelectElementOptionGroups,
  readonly automapper_suggestions?: JSX.Element,
}

export interface CustomSelectElementPropsClosed
  extends CustomSelectElementPropsBase {
  readonly is_open: false,
  readonly handleOpen?: () => void,
  readonly field_names: string[],
}

export interface CustomSelectElementPropsOpenBase
  extends CustomSelectElementPropsBase {
  readonly is_open: true,
  readonly handleChange?: (
    new_value: string,
    is_relationship: boolean,
  ) => void
  readonly handleClose?: () => void,
}

interface CustomSelectElementPropsOpen
  extends CustomSelectElementPropsOpenBase {
  readonly custom_select_option_groups: CustomSelectElementOptionGroups,
  readonly automapper_suggestions?: JSX.Element,
}


export function Icon({
  is_relationship = false,
  is_preview = false,
  is_enabled = true,
  table_name = '',
  option_label = '0',
}: CustomSelectElementIconProps): JSX.Element | null {

  const not_relationship = !is_relationship;

  if (option_label === '0')
    return <span className="custom_select_option_icon_undefined">&#8416;</span>;
  if (not_relationship && (
    is_preview || !is_enabled
  ))
    return <span className="custom_select_option_icon_selected">&#10003;</span>;
  else if (not_relationship || table_name === '')
    return null;

  const table_icon_src = icons.getIcon(table_name);
  if (table_icon_src !== '/images/unknown.png')
    return <span
      className="custom_select_option_icon_table"
      style={{backgroundImage: `url('${table_icon_src}')`}}
    />;

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
}

const Option = React.memo(named_component('Option', ({
  option_label,
  is_enabled = true,
  is_relationship = false,
  is_default = false,
  table_name = '',
  handleClick,
}: CustomSelectElementOptionProps) => {

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
        is_enabled={is_enabled}
        table_name={table_name}
      />
    </span>
    {option_label !== '0' &&
    <span className="custom_select_option_label">{option_label}</span>}
    {is_relationship &&
    <span className="custom_select_option_relationship">&#9654;</span>}
  </span>;
}));

function OptionGroup({
  select_group_name,
  select_group_label,
  select_options_data,
  handleClick,
}: CustomSelectElementOptionGroupProps) {
  return <span
    className={
      `custom_select_group custom_select_group_${
        select_group_name || 'undefined'
      }`
    }>
    {
      typeof select_group_label !== 'undefined' &&
      <span
        className="custom_select_group_label">{select_group_label}</span>
    }
    {Object.entries(
      select_options_data,
    ).map(([option_name, selection_option_data]) => {
      return <Option
        key={option_name}
        handleClick={
          selection_option_data.is_enabled === false ?
            undefined :
            handleClick?.bind(
              null,
              option_name,
              typeof selection_option_data.is_relationship !== 'undefined' &&
              selection_option_data.is_relationship,
            )
        }
        {...selection_option_data}
      />;
    })}
  </span>;
}

const ShadowListOfOptions = React.memo(named_component(
  'ShadowListOfOptions',
  ({field_names}: {
    readonly field_names: string[],
  }) =>
    <span className="custom_select_element_shadow_list">{
      field_names.map((field_name, index) =>
        <span key={index}>{field_name}</span>,
      )
    }</span>),
);

const intractable_select_types: Readonly<CustomSelectType[]> = [
  'preview_list',
  'suggestion_line_list',
] as const;
const select_types_with_headers: Readonly<CustomSelectType[]> = [
  'opened_list',
  'base_table_selection_list',
] as const;
const select_types_with_first_row: Readonly<CustomSelectType[]> = [
  'closed_list',
  'preview_list',
  'suggestion_line_list',
] as const;

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
    field_names,
    handleChange,
    handleOpen,
    handleClose,
    automapper_suggestions,
  }: CustomSelectElementPropsClosed | CustomSelectElementPropsOpen,
): JSX.Element {

  const listOfOptionsRef = React.useRef<HTMLElement>(null);

  const option_is_intractable = intractable_select_types.indexOf(
    custom_select_type,
  ) === -1;

  const handleClick = option_is_intractable &&
    (
      (new_value: string, is_relationship: boolean) =>
        new_value !== default_option.option_name &&
        handleChange?.(new_value, is_relationship)
    );

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

    const default_icon = <Icon
      is_default={true}
      is_relationship={default_option.is_relationship}
      table_name={default_option.table_name}
      option_label={default_option.option_label}
      is_preview={true}
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
      {option_is_intractable &&
      <span className="custom_select_input_dropdown">&#9660;</span>}
    </span>;

    const show_first_row = is_open &&
      option_is_intractable &&
      custom_select_subtype === 'simple' &&
      default_option.option_name !== '0';

    first_row = show_first_row &&
      <Option
        handleClick={(
          handleClick || undefined
        )?.bind(null, '0', false)}
        is_default={default_option.option_label === '0'}
      />;

    options_shadow = !is_open && option_is_intractable && field_names &&
      <ShadowListOfOptions field_names={field_names} />;

  }

  const groups = is_open && option_is_intractable &&
    Object.entries(
      custom_select_option_groups || {},
    ).filter(([, {select_options_data}]) =>
      Object.keys(select_options_data).length !== 0,
    ).map(([select_group_name, select_group_data], index) =>
      <OptionGroup
        key={index}
        handleClick={handleClick || undefined}
        select_group_name={select_group_name}
        {...select_group_data}
      />,
    );

  const custom_select_options = (
      first_row || groups
    ) &&
    <span className="custom_select_options" ref={listOfOptionsRef}>
      {first_row}
      {groups}
    </span>;

  React.useEffect(() => {

    if (// auto scroll down the option if
      is_open &&  // it is open
      option_is_intractable &&  // and it can be opened
      listOfOptionsRef.current !== null &&  // and DOM is rendered
      default_option.option_name !== '0' &&  // and list has a value
      // and the list is not already scrolled
      listOfOptionsRef.current.scrollTop === 0
    ) {

      const selected_option =
        listOfOptionsRef.current.getElementsByClassName(
          'custom_select_option_selected',
        )?.[0] as undefined | HTMLElement;

      // scroll down only if selected item is not visible
      if (
        typeof selected_option !== 'undefined' &&
        listOfOptionsRef.current.offsetHeight <
        selected_option.offsetTop + selected_option.offsetHeight
      )
        listOfOptionsRef.current.scrollTop =
          selected_option.offsetTop - selected_option.offsetHeight;

    }
  }, [is_open, listOfOptionsRef]);


  return <span
    className={`custom_select custom_select_${custom_select_type}`}
    title={
      custom_select_type === 'opened_list' ||
      custom_select_type === 'base_table_selection_list' ?
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

export function SuggestionBox({
  select_options_data,
  handleAutomapperSuggestionSelection,
  ...props
}: Partial<CustomSelectElementPropsOpen> & {
  readonly select_options_data: CustomSelectElementOptions,
  readonly handleAutomapperSuggestionSelection: (suggestion: string) => void,
}): JSX.Element {
  return <CustomSelectElement
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
  />;
}