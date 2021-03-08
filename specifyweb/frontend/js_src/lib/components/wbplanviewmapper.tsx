/*
*
* Contains WbPlanView logic for when the application is in the Mapping State
* (when base table is selected and headers are loaded)
*
* */

'use strict';

import $                                 from 'jquery';
import {
  array_of_mappings_to_mappings_tree,
  array_to_tree,
  mappings_tree_to_array_of_mappings,
  MappingsTree,
  traverse_tree,
}                                        from '../wbplanviewtreehelper';
import {
  find_duplicate_mappings,
  full_mapping_path_parser,
} from '../wbplanviewhelper';
import {
  MappingElement,
  MappingLine,
  MappingPath,
  MappingPathProps, StaticHeader,
} from './wbplanviewcomponents';
import {
  format_reference_item,
  get_max_to_many_value,
  show_required_missing_fields,
  value_is_reference_item,
  value_is_tree_rank,
}                                        from '../wbplanviewmodelhelper';
import navigation                        from '../navigation';
import { get_mapping_line_data }         from '../wbplanviewnavigator';
import automapper, { AutoMapperResults } from '../automapper';
import {
  mappings_tree_to_upload_plan,
  MatchBehaviors,
  upload_plan_to_mappings_tree,
  UploadPlan,
}                                        from '../wbplanviewconverter';
import React                             from 'react';
import { named_component }     from '../statemanagement';
import {
  AutoScrollTypes,
  ChangeSelectElementValueAction,
  LoadingState,
  MappingActions,
  MappingState,
  PublicWBPlanViewProps,
  RefMappingState,
  WBPlanViewWrapperProps,
}                              from './wbplanview';


/* Scope is used to differentiate between mapper definitions that should
* be used by the automapper and suggestion boxes*/
export type AutomapperScope =
  Readonly<'automapper'  // used when selecting a base table
    | 'suggestion'>;  // suggestion boxes - used when opening a picklist
export type MappingPath = string[];
export type FullMappingPath = [
  ...string[], MappingType, string, MappingLine['options']
];
export type ListOfHeaders = string[];
export type MappingType = Readonly<'existing_header'
  | 'new_column'
  | 'new_static_column'>;
export type RelationshipType = Readonly<'one-to-one'
  | 'one-to-many'
  | 'many-to-one'
  | 'many-to-many'>;

export interface SelectElementPosition {
  readonly line: number,
  readonly index: number,
}

export interface MappingLine {
  readonly type: MappingType,
  readonly name: string,
  readonly mapping_path: MappingPath,
  readonly options: {
    matchBehavior: MatchBehaviors,
    nullAllowed: boolean,
    default: string | null,
  }
  readonly is_focused?: boolean,
}

export interface AutomapperSuggestion extends MappingPathProps {
  mapping_path: MappingPath,
}

export interface WBPlanViewMapperBaseProps {
  readonly mapping_is_templated: boolean,
  readonly show_hidden_fields: boolean,
  readonly show_mapping_view: boolean,
  readonly base_table_name: string,
  // the index that would be shown in the header name the next time the user
  // presses `New Column`
  readonly new_header_id: number,
  readonly mapping_view: MappingPath,
  readonly validation_results: MappingPath[],
  readonly lines: MappingLine[],
  readonly open_select_element?: SelectElementPosition,
  readonly focused_line?: number,
  readonly automapper_suggestions?: AutomapperSuggestion[],
}

export type GetMappedFieldsBind = (
  // a mapping path that would be used as a filter
  mapping_path_filter: MappingPath,
) => MappingsTree;

export type PathIsMappedBind = (
  // a mapping path that would be used as a filter
  mapping_path_filter: MappingPath,
) => boolean;


// the maximum count of suggestions to show in the suggestions box
const max_suggestions_count = 3;

const MappingsControlPanel = React.memo(named_component(
  'MappingsControlPanel',
  ({
    show_hidden_fields,
    handleChange,
    mapping_is_templated,
    handleToggleMappingIsTemplated,
    // handleAddNewColumn,
    // handleAddNewStaticColumn,
  }: {
    readonly show_hidden_fields: boolean,
    readonly handleChange: () => void,
    readonly handleAddNewColumn: () => void,
    readonly handleAddNewStaticColumn: () => void,
    readonly mapping_is_templated: boolean,
    readonly handleToggleMappingIsTemplated: () => void,
  }) =>
    <div className="mappings_control_panel">
      <label>
        <input
          type="checkbox"
          checked={mapping_is_templated}
          onChange={handleToggleMappingIsTemplated}
        />
        Use this mapping as a template
      </label>
      {/*<button onClick={handleAddNewColumn}>Add new column</button>*/}
      {/*<button onClick={handleAddNewStaticColumn}>
        Add new static column
      </button>*/}
      <label>
        {' '}<input
        type="checkbox"
        checked={show_hidden_fields}
        onChange={handleChange}
      />
        Reveal hidden fields
      </label>
    </div>),
);

function FormatValidationResults(props: {
  readonly base_table_name: string,
  readonly validation_results: MappingPath[],
  readonly handleSave: () => void
  readonly get_mapped_fields: GetMappedFieldsBind,
  readonly onValidationResultClick: (mapping_path: MappingPath) => void,
}) {
  if (props.validation_results.length === 0)
    return null;

  return <div className="validation_results">
    <span>
      The following fields should be mapped before you can upload
      the dataset:
    </span>
    {props.validation_results.map((field_path, index) =>
      <div
        className="wbplanview_mapping_line_elements"
        key={index}
        onClick={props.onValidationResultClick.bind(null, field_path)}
      >
        <MappingPath
          mapping_line_data={get_mapping_line_data({
            base_table_name: props.base_table_name,
            mapping_path: field_path,
            generate_last_relationship_data: false,
            custom_select_type: 'preview_list',
            get_mapped_fields: props.get_mapped_fields,
          })}
        />
      </div>,
    )}
    <span>
      Or you can <button
      onClick={props.handleSave}>Save Unfinished Mapping</button>
      and finish editing it later
    </span>
  </div>;
}

export const go_back = (props: PublicWBPlanViewProps): void =>
  navigation.go(`/workbench/${props.dataset.id}/`);

export function save_plan(
  props: WBPlanViewWrapperProps,
  state: MappingState,
  ignore_validation = false,
): LoadingState | MappingState {
  const validation_results_state = validate(state);
  if (
    !ignore_validation &&
    validation_results_state.validation_results.length !== 0
  )
    return validation_results_state;

  // props.wb.set('ownerPermissionLevel', props.mapping_is_templated ? 1 : 0);
  const upload_plan = mappings_tree_to_upload_plan(
    state.base_table_name,
    get_mappings_tree(state.lines, true),
    state.must_match_preferences,
  );

  void (
    $.ajax(`/api/workbench/dataset/${props.dataset.id}/`, {
      type: 'PUT',
      data: JSON.stringify({
        'uploadplan':
        upload_plan,
      }),
      dataType: 'json',
      processData: false,
    }).done(() => {

      if (state.changes_made)
        props.remove_unload_protect();

      go_back(props);

    })
  );

  return state;
}

/* Validates the current mapping and shows error messages if needed */
export function validate(state: MappingState): MappingState {

  const validation_results = show_required_missing_fields(
    state.base_table_name,
    get_mappings_tree(state.lines, true),
  );

  return {
    ...state,
    type: 'MappingState',
    // Show mapping view panel if there were validation errors
    show_mapping_view:
      state.show_mapping_view ||
      Object.values(validation_results).length !== 0,
    mappings_are_validated: Object.values(validation_results).length === 0,
    validation_results,
  };
}

export const defaultLineOptions: MappingLine['options'] = {
  matchBehavior: 'ignoreNever',
  nullAllowed: false,
  default: null,
} as const;

export function get_lines_from_headers({
  headers = [],
  run_automapper,
  base_table_name = '',
}: {
  headers?: ListOfHeaders
} & (
  {
    run_automapper: true,
    base_table_name: string,
  } |
  {
    run_automapper: false,
    base_table_name?: string,
  }
  )): MappingLine[] {

  const lines = headers.map((header_name): MappingLine => (
    {
      mapping_path: ['0'],
      type: 'existing_header',
      name: header_name,
      options: defaultLineOptions,
    }
  ));

  if (!run_automapper || typeof base_table_name === 'undefined')
    return lines;

  const automapper_results: AutoMapperResults = (
    new automapper({
      headers,
      base_table: base_table_name,
      scope: 'automapper',
      check_for_existing_mappings: false,
    })
  ).map();

  return lines.map(line => {
    const {name: header_name} = line;
    const automapper_mapping_paths = automapper_results[header_name];
    if (typeof automapper_mapping_paths === 'undefined')
      return line;
    else
      return {
        mapping_path: automapper_mapping_paths[0],
        type: 'existing_header',
        name: header_name,
        options: defaultLineOptions,
      };
  });

}

export function get_lines_from_upload_plan(
  headers: ListOfHeaders = [],
  upload_plan: UploadPlan,
): {
  readonly base_table_name: string,
  readonly lines: MappingLine[],
  readonly must_match_preferences: Record<string, boolean>
} {

  const lines = get_lines_from_headers({
    headers,
    run_automapper: false,
  });
  const {
    base_table_name,
    mappings_tree,
    must_match_preferences,
  } = upload_plan_to_mappings_tree(headers, upload_plan);

  const array_of_mappings = mappings_tree_to_array_of_mappings(mappings_tree);
  array_of_mappings.forEach(full_mapping_path => {
    const [
      mapping_path,
      mapping_type,
      header_name,
      options
    ] = full_mapping_path_parser(full_mapping_path);
    const header_index = headers.indexOf(header_name);
    if (header_index !== -1)
      lines[header_index] = {
        mapping_path,
        type: mapping_type,
        name: header_name,
        options
      };
  });

  return {
    base_table_name: base_table_name,
    lines,
    must_match_preferences,
  };

}

function get_array_of_mappings(
  lines: MappingLine[],
  include_headers:true
):FullMappingPath[];
function get_array_of_mappings(
  lines: MappingLine[],
  include_headers?:false
):MappingPath[];
function get_array_of_mappings(
  lines: MappingLine[],
  include_headers = false,
): (MappingPath|FullMappingPath)[] {
  return lines.filter(({mapping_path}) =>
    mapping_path_is_complete(mapping_path),
  ).map(({mapping_path, type, name, options}) =>
    include_headers ?
      [...mapping_path, type, name, options] :
      mapping_path,
  );
}

export const get_mappings_tree = (
  lines: MappingLine[],
  include_headers = false,
): MappingsTree =>
  array_of_mappings_to_mappings_tree(
    // overloading does not seem to work nicely with dynamic types
    include_headers ?
      get_array_of_mappings(lines, true) :
      get_array_of_mappings(lines, false),
    include_headers
  );

/* Get a mappings tree branch given a particular starting mapping path */
export function get_mapped_fields(
  lines: MappingLine[],
  // a mapping path that would be used as a filter
  mapping_path_filter: MappingPath,
): MappingsTree {
  const mappings_tree = traverse_tree(
    get_mappings_tree(lines),
    array_to_tree([...mapping_path_filter]),
  );
  return typeof mappings_tree === 'object' ?
    mappings_tree :
    {};
}

export const path_is_mapped = (
  lines: MappingLine[],
  mapping_path: MappingPath,
): boolean =>
  Object.keys(
    get_mapped_fields(lines, mapping_path.slice(0, -1)),
  ).indexOf(mapping_path.slice(-1)[0]) !== -1;


export const mapping_path_is_complete = (mapping_path: MappingPath): boolean =>
  mapping_path[mapping_path.length - 1] !== '0';

/* Unmap headers that have a duplicate mapping path */
export function deduplicate_mappings(
  lines: MappingLine[],
  focused_line: number | false,
): MappingLine[] {

  const array_of_mappings = get_array_of_mappings(lines);
  const duplicate_mapping_indexes = find_duplicate_mappings(
    array_of_mappings,
    focused_line,
  );

  return lines.map((line, index) =>
    duplicate_mapping_indexes.indexOf(index) === -1 ?
      line :
      {
        ...line,
        mapping_path: line.mapping_path.slice(0, -1),
      },
  );

}


/*
* Show automapper suggestion on top of an opened `closed_list`
* The automapper suggestions are shown only if the current box doesn't have
* a value selected
* */
export const get_automapper_suggestions = ({
  lines,
  line,
  index,
  base_table_name,
}: SelectElementPosition & {
  readonly lines: MappingLine[],
  readonly base_table_name: string,
}): Promise<AutomapperSuggestion[]> =>
  new Promise((resolve) => {

    const local_mapping_path = [...lines[line].mapping_path];

    if (  // don't show suggestions
      (  // if opened picklist has a value selected
        local_mapping_path.length - 1 !== index ||
        mapping_path_is_complete(local_mapping_path)
      ) ||  // or if header is a new column / new static column
      lines[line].type !== 'existing_header'
    )
      return resolve([]);

    const mapping_line_data = get_mapping_line_data({
      base_table_name,
      mapping_path: mapping_path_is_complete(local_mapping_path) ?
        local_mapping_path :
        local_mapping_path.slice(0, local_mapping_path.length - 1),
      iterate: false,
      custom_select_type: 'suggestion_list',
      get_mapped_fields: get_mapped_fields.bind(null, lines),
    });

    // don't show suggestions if picklist has only one field / no fields
    if (
      mapping_line_data.length === 1 &&
      Object.keys(mapping_line_data[0].fields_data).length < 2
    )
      return resolve([]);

    const base_mapping_path = local_mapping_path.slice(0, -1);

    let path_offset = 0;
    if (
      mapping_line_data.length === 1 &&
      mapping_line_data[0].custom_select_subtype === 'to_many'
    ) {
      base_mapping_path.push('#1');
      path_offset = 1;
    }

    const all_automapper_results = Object.entries((
      new automapper({
        headers: [lines[line].name],
        base_table: base_table_name,
        starting_table: mapping_line_data.length === 0 ?
          base_table_name :
          mapping_line_data[mapping_line_data.length - 1].table_name,
        path: base_mapping_path,
        path_offset,
        allow_multiple_mappings: true,
        check_for_existing_mappings: true,
        scope: 'suggestion',
        path_is_mapped: path_is_mapped.bind(null, lines),
      })
    ).map({
      commit_to_cache: false,
    }));

    if (all_automapper_results.length === 0)
      return resolve([]);

    let automapper_results = all_automapper_results[0][1];

    if (automapper_results.length > max_suggestions_count)
      automapper_results = automapper_results.slice(0, 3);

    resolve(automapper_results.map(automapper_result => (
      {
        mapping_path: automapper_result,
        mapping_line_data: get_mapping_line_data({
          base_table_name,
          mapping_path: automapper_result,
          custom_select_type: 'suggestion_line_list',
          get_mapped_fields: get_mapped_fields.bind(null, lines),
        }).slice(base_mapping_path.length - path_offset),
      }
    )));

  });

function MappingView(props: {
  readonly base_table_name: string,
  readonly focused_line_exists: boolean,
  readonly mapping_path: MappingPath,
  map_button_is_enabled: boolean,
  readonly handleMapButtonClick: () => void
  readonly handleMappingViewChange: (
    index: number,
    new_value: string,
    is_relationship: boolean,
  ) => void,
  readonly get_mapped_fields: GetMappedFieldsBind,
  readonly automapper_suggestions?: AutomapperSuggestion[],
  readonly show_hidden_fields?: boolean,
}) {

  const mapping_line_data = get_mapping_line_data({
    base_table_name: props.base_table_name,
    mapping_path: props.mapping_path,
    generate_last_relationship_data: true,
    custom_select_type: 'opened_list',
    handleChange: props.handleMappingViewChange,
    get_mapped_fields: props.get_mapped_fields,
    show_hidden_fields: props.show_hidden_fields,
  });
  const map_button_is_enabled =
    props.map_button_is_enabled && (
      Object.entries(
        mapping_line_data[mapping_line_data.length - 1]?.fields_data,
      ).filter(([, {is_default}]) =>
        is_default,
      )?.[0]?.[1].is_enabled ?? false
    );

  return <>
    <div className="mapping_view">
      <MappingPath
        mapping_line_data={mapping_line_data}
      />
    </div>
    <button
      className="wbplanview_mapping_view_map_button"
      disabled={!map_button_is_enabled}
      onClick={
        map_button_is_enabled && props.focused_line_exists ?
          props.handleMapButtonClick :
          undefined
      }
    >
      Map
      <span
        className="wbplanview_mapping_view_map_button_arrow">&#8594;</span>
    </button>
  </>;
}

export function mutate_mapping_path({
  lines,
  mapping_view,
  line,
  index,
  value,
  is_relationship,
}: Omit<ChangeSelectElementValueAction, 'type'> & {
  readonly lines: MappingLine[],
  readonly mapping_view: MappingPath,
  readonly is_relationship: boolean,
}): MappingPath {

  let mapping_path = [...(
    line === 'mapping_view' ?
      mapping_view :
      lines[line].mapping_path
  )];

  const is_simple =
    !value_is_reference_item(value) &&
    !value_is_tree_rank(value);

  if (value === 'add') {
    const mapped_fields = Object.keys(
      get_mapped_fields(lines, mapping_path.slice(0, index)),
    );
    const max_to_many_value = get_max_to_many_value(mapped_fields);
    mapping_path[index] = format_reference_item(max_to_many_value + 1);
  }
  else if (is_simple)
    mapping_path = [...mapping_path.slice(0, index), value];
  else
    mapping_path[index] = value;

  if ((
    !is_simple || is_relationship
  ) && mapping_path.length - 1 === index)
    return [...mapping_path, '0'];

  return mapping_path;

}

export const defaultMappingViewHeight = 300;
export const minMappingViewHeight = 250;


export default function WBPlanViewMapper(
  props: WBPlanViewMapperBaseProps & {
    readonly mapper_dispatch: (action: MappingActions) => void,
    readonly refObject: React.MutableRefObject<Partial<RefMappingState>>
    readonly handleSave: () => void,
    readonly handleFocus: (line_index: number) => void,
    readonly handleMappingViewMap: () => void,
    readonly handleAddNewHeader: () => void,
    readonly handleAddNewStaticHeader: () => void,
    readonly handleToggleHiddenFields: () => void,
    readonly handleAddNewColumn: () => void,
    readonly handleAddNewStaticColumn: () => void,
    readonly handleOpen: (
      line: number,
      index: number,
    ) => void;
    readonly handleClose: () => void
    readonly handleChange: (
      line: 'mapping_view' | number,
      index: number,
      new_value: string,
      is_relationship: boolean,
    ) => void,
    readonly handleClearMapping: (
      index: number,
    ) => void,
    readonly handleStaticHeaderChange:
      (
        index: number,
        event: React.ChangeEvent<HTMLTextAreaElement>,
      ) => void,
    readonly handleAutomapperSuggestionSelection:
      (suggestion: string) => void,
    readonly handleValidationResultClick:
      (mapping_path: MappingPath) => void,
    readonly handleToggleMappingIsTemplated: () => void,
    readonly handleToggleMappingView: () => void,
    readonly handleMappingViewResize: (height: number) => void,
    readonly handleAutoscrollStatusChange: (
      autoscroll_type: AutoScrollTypes,
      status: boolean,
    ) => void,
    readonly handleChangeMatchBehaviorAction: (
      line: number,
      match_behavior: MatchBehaviors
    )=>void
    readonly handleToggleAllowNullsAction: (
      line: number,
      allow_null: boolean,
    )=>void,
    readonly handleChangeDefaultValue: (
      line: number,
      default_value: string|null
    )=>void
  }): JSX.Element {
  const get_mapped_fields_bind = get_mapped_fields.bind(
    null,
    props.lines,
  );
  const list_of_mappings = React.useRef<HTMLDivElement>(
    null,
  );

  const mappingViewParentRef = React.useRef<HTMLDivElement | null>(null);

  // scroll list_of_mappings/mapping_view/open picklist to correct position
  React.useEffect(() => {

    if (
      typeof props.refObject.current.autoscroll === 'undefined' ||
      !list_of_mappings.current ||
      !mappingViewParentRef.current
    )
      return;

    (
      Object.entries(
        props.refObject.current.autoscroll,
      ) as [AutoScrollTypes, boolean][]
    ).filter(([, autoscroll]) =>
      autoscroll,
    ).map(([autoscroll_type]) => {
      if (autoscroll_type === 'list_of_mappings') {

        if (!list_of_mappings.current)
          return;

        list_of_mappings.current.scrollTop =
          list_of_mappings.current.scrollHeight;
      }

      if (autoscroll_type === 'mapping_view') {

        if (!mappingViewParentRef.current)
          return;

        if (props.validation_results.length !== 0)
          mappingViewParentRef.current.scrollLeft = 0;

      }

      props.handleAutoscrollStatusChange(
        autoscroll_type,
        false,
      );

    });
  });

  // `resize` event listener for the mapping view
  React.useEffect(() => {

    if (
      // @ts-ignore
      typeof ResizeObserver === 'undefined' ||
      mappingViewParentRef === null ||
      !mappingViewParentRef.current
    )
      return;

    const resizeObserver =
      // @ts-ignore
      new ResizeObserver(() =>
        mappingViewParentRef.current &&
        props.handleMappingViewResize.bind(
          null,
          mappingViewParentRef.current.clientHeight,
        ),
      );

    resizeObserver.observe(mappingViewParentRef.current);

    return () =>
      resizeObserver.disconnect();
  }, [mappingViewParentRef.current]);

  // reposition suggestions box if it doesn't fit
  function repositionSuggestionBox(): void {

    if (
      typeof props.automapper_suggestions === 'undefined' ||
      props.automapper_suggestions.length === 0
    )
      return;

    if (list_of_mappings.current === null)
      return;

    const automapper_suggestions =
      list_of_mappings.current.getElementsByClassName(
        'custom_select_suggestion_list',
      )[0] as HTMLElement | undefined;

    if (!automapper_suggestions)
      return;

    const custom_select_element = automapper_suggestions.parentElement;

    if (!custom_select_element)
      return;

    const automapper_suggestions_height = automapper_suggestions.clientHeight;

    const list_of_mappings_position = list_of_mappings.current.offsetTop;
    const current_scroll_top = list_of_mappings.current.scrollTop;
    const picklist_position = custom_select_element.offsetTop;

    // suggestions list fits on the screen. nothing to do
    if (
      picklist_position
      - list_of_mappings_position
      - automapper_suggestions_height >= 0
    )
      return;

    if (!automapper_suggestions.classList.contains('controlled'))
      automapper_suggestions.classList.add('controlled');

    const suggestions_list_position =
      picklist_position - automapper_suggestions_height - current_scroll_top;

    const scroll_position =
      picklist_position - current_scroll_top - list_of_mappings_position;

    // hide suggestions box once its parent picklist becomes hidden
    automapper_suggestions.style.visibility = scroll_position > 0 ?
      'visible' :
      'hidden';

    if (scroll_position > 0)
      automapper_suggestions.style.top = `${
        suggestions_list_position
      }px`;

  }

  React.useEffect(
    repositionSuggestionBox,
    [props.automapper_suggestions, list_of_mappings],
  );

  React.useEffect(() => {
    window.addEventListener('resize', repositionSuggestionBox);
    return () =>
      window.removeEventListener('resize', repositionSuggestionBox);
  }, []);

  return <>
    {
      props.show_mapping_view &&
      <div
        className="mapping_view_parent"
        style={{
          'minHeight': minMappingViewHeight,
          '--original_height':
            `${
              props.refObject.current.mapping_view_height || ''
            }px`,
        } as React.CSSProperties}
        ref={mappingViewParentRef}
      >
        <div
          className="mapping_view_container"
        >
          <FormatValidationResults
            base_table_name={props.base_table_name}
            validation_results={props.validation_results}
            handleSave={props.handleSave}
            get_mapped_fields={get_mapped_fields_bind}
            onValidationResultClick={
              props.handleValidationResultClick
            }
          />
          <MappingView
            base_table_name={props.base_table_name}
            focused_line_exists={
              typeof props.focused_line !== 'undefined'
            }
            mapping_path={props.mapping_view}
            show_hidden_fields={props.show_hidden_fields}
            map_button_is_enabled={
              typeof props.focused_line !== 'undefined' &&
              mapping_path_is_complete(props.mapping_view)
            }
            handleMapButtonClick={props.handleMappingViewMap}
            handleMappingViewChange={props.handleChange.bind(
              null,
              'mapping_view',
            )}
            get_mapped_fields={get_mapped_fields_bind}
            automapper_suggestions={props.automapper_suggestions}
          />
        </div>
      </div>
    }

    <div
      className="list__mappings"
      ref={list_of_mappings}
      onScroll={repositionSuggestionBox}
    >{
      props.lines.map(({mapping_path, name, type, options}, index) =>
        <MappingLine
          key={index}
          header_name={name}
          mapping_type={type}
          is_focused={index === props.focused_line}
          handleFocus={props.handleFocus.bind(null, index)}
          handleClearMapping={props.handleClearMapping.bind(null, index)}
          handleStaticHeaderChange={
            props.handleStaticHeaderChange.bind(null, index)
          }
          line_data={
            get_mapping_line_data({
              base_table_name: props.base_table_name,
              mapping_path,
              generate_last_relationship_data: true,
              custom_select_type: 'closed_list',
              handleChange: props.handleChange.bind(null, index),
              handleOpen: props.handleOpen.bind(null, index),
              handleClose: props.handleClose.bind(null, index),
              handleAutomapperSuggestionSelection:
              props.handleAutomapperSuggestionSelection,
              get_mapped_fields: get_mapped_fields_bind,
              open_select_element:
                typeof props.open_select_element !== 'undefined' &&
                props.open_select_element.line === index ?
                  props.open_select_element :
                  undefined,
              show_hidden_fields: props.show_hidden_fields,
              automapper_suggestions: props.automapper_suggestions,
              mapping_options_menu_generator: ()=>({
                'matchBehavior': {
                  field_friendly_name: <label>
                    Match behavior:
                    <MappingElement
                      is_open={true}
                      custom_select_type='mapping_option_line_list'
                      handleChange={(match_behavior)=>
                        props.handleChangeMatchBehaviorAction(
                          index,
                          match_behavior as MatchBehaviors,
                        )
                      }
                      fields_data={{
                        'ignoreWhenBlank': {
                          field_friendly_name: 'Ignore when Blank',
                          title: 'When set to "Ignore when Blank" blank ' +
                            'values in this column will not be ' +
                            'considered for matching purposes. Blank ' +
                            'values are ignored when matching even if a ' +
                            'default value is provided',
                          is_enabled: true,
                          is_required: false,
                          is_hidden: false,
                          is_default:
                            options.matchBehavior === 'ignoreWhenBlank',
                        },
                        'ignoreAlways': {
                          field_friendly_name: 'Always ignore',
                          title: 'When set to ignoreAlways the value in ' +
                            'this column will never be considered for ' +
                            'matching purposes, only for uploading.',
                          is_enabled: true,
                          is_required: false,
                          is_hidden: false,
                          is_default:
                            options.matchBehavior === 'ignoreAlways',
                        },
                        'ignoreNever': {
                          field_friendly_name: 'Never ignore',
                          title: 'This column would always be considered ' +
                            'for matching purposes, regardless of it\'s ' +
                            'value',
                          is_enabled: true,
                          is_required: false,
                          is_hidden: false,
                          is_default:
                            options.matchBehavior === 'ignoreNever',
                        }
                      }}
                    />
                  </label>,
                },
                'nullAllowed': {
                  field_friendly_name: <label>
                    <input
                      type='checkbox'
                      checked={options.nullAllowed}
                      onChange={(event)=>
                        props.handleToggleAllowNullsAction(
                          index,
                          event.target.checked,
                        )
                      }
                    />
                    {' '}Allow Null values
                  </label>
                },
                'default': {
                  field_friendly_name: <>
                    <label>
                      <input
                        type='checkbox'
                        checked={options.default !== null}
                        onChange={()=>
                          props.handleChangeDefaultValue(
                            index,
                            options.default === null ?
                              '' :
                              null,
                          )
                        }
                      />
                      {' '}Use default value
                    </label>
                    {
                      typeof options.default === 'string' &&
                      <label><br />
                        Default value:<br />
                        <StaticHeader
                          default_value={options.default || ''}
                          onChange={(event)=>
                            props.handleChangeDefaultValue(
                              index,
                              event.target.value
                            )
                          }
                        />
                      </label>
                    }
                  </>,
                  title: 'This value would be used in place of empty cells'
                }
              })
            })
          }
        />,
      )
    }</div>

    <MappingsControlPanel
      show_hidden_fields={props.show_hidden_fields}
      handleChange={props.handleToggleHiddenFields}
      handleAddNewColumn={props.handleAddNewColumn}
      handleAddNewStaticColumn={props.handleAddNewStaticColumn}
      handleToggleMappingIsTemplated={props.handleToggleMappingIsTemplated}
      mapping_is_templated={props.mapping_is_templated}
    />
  </>;

}
