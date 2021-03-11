/*
*
* Collection of common React components used in the wbplanview
*
* */

'use strict';

import React                                 from 'react';
import {
  CustomSelectElement,
  CustomSelectElementDefaultOptionProps,
  CustomSelectElementOptions,
  CustomSelectElementPropsClosed,
  CustomSelectElementPropsOpenBase,
  SuggestionBox,
}                         from './customselectelement';
import { namedComponent } from '../statemanagement';
import {
  AutomapperSuggestion,
  MappingType,
  SelectElementPosition,
}                         from './wbplanviewmapper';
import { DataModelListOfTables }             from '../wbplanviewmodelfetcher';


export interface HtmlGeneratorFieldData {
  readonly fieldFriendlyName: string|JSX.Element,
  readonly title?: string,
  readonly isEnabled?: boolean,
  readonly isRequired?: boolean,
  readonly isHidden?: boolean,
  readonly isDefault?: boolean,
  readonly isRelationship?: boolean,
  readonly tableName?: string,
}

interface MappingLineBaseProps {
  readonly lineData: MappingElementProps[],
  readonly mappingType: MappingType,
  readonly headerName: string,
  readonly isFocused: boolean,
  readonly handleFocus: () => void,
  readonly handleClearMapping: () => void,
  readonly handleStaticHeaderChange?: (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => void,
}

export interface MappingPathProps {
  readonly mappingLineData: MappingElementProps[],
}

type HtmlGeneratorFieldsData = Readonly<Record<string, HtmlGeneratorFieldData>>

export type MappingElementProps = (
  Omit<CustomSelectElementPropsOpenBase, 'automapperSuggestions'> & {
  readonly fieldsData: HtmlGeneratorFieldsData,
  readonly automapperSuggestions?: AutomapperSuggestion[],
  readonly handleAutomapperSuggestionSelection?: (suggestion: string) => void,
}
  ) | (
  Omit<CustomSelectElementPropsClosed, 'fieldNames'> & {
  readonly fieldsData: HtmlGeneratorFieldsData,
}
  );


/* Generates a list of tables */
export const ListOfBaseTables = React.memo(namedComponent(
  'ListOfBaseTables',
  ({
    listOfTables,
    handleChange,
    showHiddenTables,
  }: {
    listOfTables: DataModelListOfTables
    handleChange: (
      newValue: string,
      isRelationship: boolean,
    ) => void,
    showHiddenTables: boolean,
  }) =>
    <MappingElement
      isOpen={true}
      handleChange={handleChange}
      selectLabel=''
      fieldsData={
        Object.fromEntries(
          (
            showHiddenTables ?
              Object.entries(listOfTables) :
              Object.entries(listOfTables).filter(([, {isHidden: isHidden}]) =>
                !isHidden,
              )
          ).map(([tableName, {tableFriendlyName, isHidden}]) => (
              [
                tableName,
                {
                  fieldFriendlyName: tableFriendlyName,
                  tableName: tableName,
                  isRelationship: true,
                  isHidden: isHidden,
                },
              ]
            ),
          ),
        )
      }
      customSelectType='BASE_TABLE_SELECTION_LIST'
      customSelectSubtype='simple'
    />),
);

/* Generates a mapping line */
export function MappingLine({
  lineData,
  mappingType,
  headerName,
  isFocused,
  handleFocus,
  handleClearMapping,
  handleStaticHeaderChange,
}: MappingLineBaseProps & (
  {
    readonly mappingType: Exclude<MappingType, 'newStaticColumn'>,
  } | {
  readonly mappingType: 'newStaticColumn',
  readonly handleStaticHeaderChange?: (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => void,
}
  )): JSX.Element {
  return <div
    className={
      `wbplanview-mapping-line ${
        isFocused ?
          'wbplanview-mapping-line-focused' :
          ''
      }
      `}
    onClick={handleFocus}
  >
    <div className="wbplanview-mapping-line-controls">
      <button title="Clear mapping" onClick={handleClearMapping}>
        <img src="../../../static/img/discard.svg" alt="Clear mapping" />
      </button>
    </div>
    <div className="wbplanview-mapping-line-header">
      {
        mappingType === 'newStaticColumn' ?
          <StaticHeader defaultValue={headerName}
            onChange={handleStaticHeaderChange} /> :
          headerName
      }
    </div>
    <div className="wbplanview-mapping-line-elements">
      <MappingPath
        mappingLineData={lineData}
      />
    </div>
  </div>;
}

/* Generates a mapping path */
export function MappingPath(
  {
    mappingLineData,
  }: MappingPathProps & {openSelectElement?: SelectElementPosition}
): JSX.Element {
  return <>
    {mappingLineData.map((mappingDetails, index) =>
      <React.Fragment key={index}>
        <MappingElement {...mappingDetails} />
        {
          index + 1 !== mappingLineData.length &&
          mappingLineData[index+1
            ]?.customSelectType !== 'MAPPING_OPTIONS_LIST' &&
          MappingElementDivider
        }
      </React.Fragment>,
    )}
  </>;
}

const fieldGroupLabels: {[key: string]: string} = {
  requiredFields: 'Required Fields',
  optionalFields: 'Optional Fields',
  hiddenFields: 'Hidden Fields',
} as const;

const MappingElementDivider = <span
  className="wbplanview-mapping-line-divider">&#x2192;</span>;

const getFieldGroupName = (isHidden: boolean, isRequired: boolean) =>
  isHidden ? 'hiddenFields' :
    isRequired ? 'requiredFields' : 'optionalFields';

/* Generates a new mapping element */
export function MappingElement(
  props: MappingElementProps,
) {

  const fieldGroups = Object.fromEntries(
    Object.keys(
      fieldGroupLabels,
    ).map((fieldGroupLabel) =>
      [fieldGroupLabel, {} as CustomSelectElementOptions],
    ),
  );

  let defaultOption:
    CustomSelectElementDefaultOptionProps | undefined = undefined;

  const fieldNames: string[] = [];

  Object.entries(props.fieldsData).forEach(([
    fieldName,
    {
      fieldFriendlyName,  // field label
      title,
      isEnabled = true,  // whether field is enabled (not mapped yet)
      isDefault = false,  // whether field is selected by default
      tableName = '',  // table name for this option
      // whether this field is relationship, tree rank or reference item
      isRelationship: isRelationship = false,
      isRequired = false,  // whether this field is required
      isHidden = false,  // whether this field is hidden
    },
  ]) => {

    if (isDefault) {

      if (defaultOption)
        throw new Error('Multiple default options cannot be present in the' +
          ' same list');

      defaultOption = {
        optionName: fieldName,
        optionLabel: fieldFriendlyName,
        tableName: tableName,
        isRelationship: isRelationship,
      };
    }

    if (props.isOpen)
      fieldGroups[getFieldGroupName(isHidden, isRequired)][fieldName] = {
        optionLabel: fieldFriendlyName,
        title,
        isEnabled: isEnabled,
        isRelationship: isRelationship,
        isDefault: isDefault,
        tableName: tableName,
      };
    else if(typeof fieldFriendlyName === 'string')
      fieldNames.push(fieldFriendlyName);
  });

  defaultOption ??= typeof props.defaultOption == 'undefined' ?
    {
      optionName: '0',
      optionLabel: '0',
      tableName: '',
      isRelationship: false,
    } :
    props.defaultOption;

  return props.isOpen ?
    <CustomSelectElement
      {...props}
      customSelectOptionGroups={
        Object.fromEntries(
          Object.entries(fieldGroups).filter(([, groupFields]) =>
            groupFields.length !== 0,
          ).map(([groupName, groupFields]) => [
            groupName,
            {
              // don't show group labels on some custom select types
              selectGroupLabel:
                props.customSelectSubtype === 'tree' ||
                props.customSelectSubtype === 'toMany' ||
                props.customSelectType === 'BASE_TABLE_SELECTION_LIST' ||
                props.customSelectType === 'MAPPING_OPTIONS_LIST' ||
                props.customSelectType === 'MAPPING_OPTION_LINE_LIST' ?
                  undefined :
                  fieldGroupLabels[groupName],
              selectOptionsData: groupFields,
            },
          ]),
        )
      }
      defaultOption={defaultOption}
      automapperSuggestions={
        typeof props.automapperSuggestions !== 'undefined' &&
        props.automapperSuggestions.length > 0 &&
        typeof props.handleAutomapperSuggestionSelection !== 'undefined' ?
          <SuggestionBox
            handleAutomapperSuggestionSelection={
              props.handleAutomapperSuggestionSelection
            }
            selectOptionsData={
              Object.fromEntries(
                props.automapperSuggestions.map((
                  automapperSuggestion,
                  index,
                ) => [
                  // since "0" is reserved for `no value`, we need to
                  // start counting from 1
                  index + 1,
                  {
                    optionLabel:
                      <MappingPath mappingLineData={
                        automapperSuggestion.mappingLineData
                      } />,
                  },
                ]),
              )
            }
          /> :
          undefined
      }
    /> :
    <CustomSelectElement
      defaultOption={defaultOption}
      {...props}
      fieldNames={fieldNames}
    />;

}

/* Return a textarea with a given value for a new static header */
export function StaticHeader({
  defaultValue = '',
  onChange: handleChange,
}: {
  defaultValue: string,
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
}): JSX.Element {
  return <textarea
    value={defaultValue}
    onChange={handleChange}
  />;
}