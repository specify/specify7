/*
 *
 * Collection of common React components used in the wbplanview
 *
 *
 */

import React from 'react';
import wbText from '../localization/workbench';

import type { DataModelListOfTables } from '../wbplanviewmodelfetcher';
import type {
  CustomSelectElementDefaultOptionProps,
  CustomSelectElementOptions,
  CustomSelectElementPropsClosed,
  CustomSelectElementPropsOpenBase,
} from './customselectelement';
import { CustomSelectElement, SuggestionBox } from './customselectelement';
import { closeDialog, ModalDialog } from './modaldialog';
import type { IR, RA } from './wbplanview';
import type {
  AutomapperSuggestion,
  MappingType,
  SelectElementPosition,
} from './wbplanviewmapper';

export interface HtmlGeneratorFieldData {
  readonly label: string | JSX.Element;
  readonly title?: string;
  readonly isEnabled?: boolean;
  readonly isRequired?: boolean;
  readonly isHidden?: boolean;
  readonly isDefault?: boolean;
  readonly isRelationship?: boolean;
  readonly tableName?: string;
}

interface MappingLineBaseProps {
  readonly lineData: RA<MappingElementProps>;
  readonly mappingType: MappingType;
  readonly headerName: string;
  readonly isFocused: boolean;
  readonly handleFocus: () => void;
  readonly handleClearMapping: () => void;
  readonly readonly: boolean;
}

export interface MappingPathProps {
  readonly mappingLineData: RA<MappingElementProps>;
}

type HtmlGeneratorFieldsData = IR<HtmlGeneratorFieldData>;

export type MappingElementProps =
  | (Omit<CustomSelectElementPropsOpenBase, 'automapperSuggestions'> & {
      readonly fieldsData: HtmlGeneratorFieldsData;
      readonly automapperSuggestions?: RA<AutomapperSuggestion>;
      readonly handleAutomapperSuggestionSelection?: (
        suggestion: string
      ) => void;
    })
  | (Omit<CustomSelectElementPropsClosed, 'fieldNames'> & {
      readonly fieldsData: HtmlGeneratorFieldsData;
    });

export const ListOfBaseTables = React.memo(function ListOfBaseTables({
  listOfTables,
  handleChange,
  showHiddenTables,
}: {
  readonly listOfTables: DataModelListOfTables;
  readonly handleChange: (newValue: string, isRelationship: boolean) => void;
  readonly showHiddenTables: boolean;
}) {
  return (
    <MappingElement
      isOpen={true}
      handleChange={handleChange}
      selectLabel=""
      fieldsData={Object.fromEntries(
        (showHiddenTables
          ? Object.entries(listOfTables)
          : Object.entries(listOfTables).filter(([, { isHidden }]) => !isHidden)
        ).map(([tableName, { label, isHidden }]) => [
          tableName,
          {
            label: label,
            tableName,
            isRelationship: true,
            isHidden,
          },
        ])
      )}
      customSelectType="BASE_TABLE_SELECTION_LIST"
      customSelectSubtype="simple"
    />
  );
});

export function ButtonWithConfirmation(props: {
  readonly children: React.ReactNode;
  readonly buttons: (
    confirm: () => void,
    cancel: () => void
  ) => JQueryUI.DialogOptions['buttons'];
  readonly dialogContent: React.ReactNode;
  readonly onConfirm: () => void;
  readonly dialogTitle: string;
  readonly showConfirmation?: () => boolean;
}): JSX.Element {
  const [displayPrompt, setDisplayPrompt] = React.useState<boolean>(false);

  return (
    <>
      <button
        className="magic-button"
        type="button"
        onClick={(): void =>
          typeof props.showConfirmation === 'undefined' ||
          props.showConfirmation()
            ? setDisplayPrompt(true)
            : props.onConfirm()
        }
      >
        {props.children}
      </button>
      {displayPrompt ? (
        <ModalDialog
          properties={{
            title: props.dialogTitle,
            close: (): void => setDisplayPrompt(false),
            width: '400',
            buttons: props.buttons(props.onConfirm, closeDialog),
          }}
        >
          {props.dialogContent}
        </ModalDialog>
      ) : undefined}
    </>
  );
}

export function ValidationButton(props: {
  readonly canValidate: boolean;
  readonly isValidated: boolean;
  readonly onClick: () => void;
}): JSX.Element {
  const [displayPrompt, setDisplayPrompt] = React.useState<boolean>(false);

  return (
    <>
      <button
        className={`magic-button validation-indicator ${
          props.isValidated ? 'validation-indicator-success' : ''
        }`}
        type="button"
        style={
          {
            '--text-content': wbText('validated'),
          } as React.CSSProperties
        }
        onClick={
          props.canValidate ? props.onClick : (): void => setDisplayPrompt(true)
        }
      >
        {wbText('validate')}
      </button>
      {displayPrompt ? (
        <ModalDialog
          properties={{
            title: wbText('nothingToValidateDialogTitle'),
            close: (): void => setDisplayPrompt(false),
          }}
        >
          {wbText('nothingToValidateDialogHeader')}
          {wbText('nothingToValidateDialogMessage')}
        </ModalDialog>
      ) : undefined}
    </>
  );
}

export function MappingLineComponent({
  lineData,
  headerName,
  readonly,
  isFocused,
  handleFocus,
  handleClearMapping,
}: MappingLineBaseProps): JSX.Element {
  return (
    <div
      className={`wbplanview-mapping-line ${
        isFocused ? 'wbplanview-mapping-line-focused' : ''
      } ${
        lineData.slice(-1)[0].customSelectType === 'MAPPING_OPTIONS_LIST'
          ? ''
          : 'wbplanview-mapping-line-header-unmapped'
      }
      `}
      onClick={handleFocus}
    >
      <div className="wbplanview-mapping-line-controls">
        <button
          type="button"
          title="Clear mapping"
          onClick={handleClearMapping}
          disabled={readonly}
        >
          ⌦
        </button>
      </div>
      <div className="v-center wbplanview-mapping-line-header">
        {headerName}
      </div>
      <div className="v-center wbplanview-mapping-line-elements">
        <MappingPathComponent mappingLineData={lineData} />
      </div>
    </div>
  );
}

export function MappingPathComponent({
  mappingLineData,
}: MappingPathProps & {
  readonly openSelectElement?: SelectElementPosition;
}): JSX.Element {
  return (
    <>
      {mappingLineData.map((mappingDetails, index) => (
        <React.Fragment key={index}>
          <MappingElement {...mappingDetails} />
          {index + 1 !== mappingLineData.length &&
            mappingLineData[index + 1]?.customSelectType !==
              'MAPPING_OPTIONS_LIST' &&
            MappingElementDivider}
        </React.Fragment>
      ))}
    </>
  );
}

const fieldGroupLabels: IR<string> = {
  requiredFields: 'Required Fields',
  optionalFields: 'Optional Fields',
  hiddenFields: 'Hidden Fields',
} as const;

const MappingElementDivider = (
  <span className="wbplanview-mapping-line-divider">&#x2192;</span>
);

const getFieldGroupName = (isHidden: boolean, isRequired: boolean) =>
  isHidden ? 'hiddenFields' : isRequired ? 'requiredFields' : 'optionalFields';

export function MappingElement(props: MappingElementProps): JSX.Element {
  const fieldGroups = Object.fromEntries(
    Object.keys(fieldGroupLabels).map((fieldGroupLabel) => [
      fieldGroupLabel,
      {} as CustomSelectElementOptions,
    ])
  );

  let defaultOption: CustomSelectElementDefaultOptionProps | undefined =
    undefined;

  const fieldNames: string[] = [];

  Object.entries(props.fieldsData).forEach(
    ([
      fieldName,
      {
        // Field label
        label,
        title,
        // Whether field is enabled (not mapped yet)
        isEnabled = true,
        // Whether field is selected by default
        isDefault = false,
        // Table name for this option
        tableName = '',
        // Whether this field is relationship, tree rank or reference item
        isRelationship = false,
        // Whether this field is required
        isRequired = false,
        // Whether this field is hidden
        isHidden = false,
      },
    ]) => {
      if (isDefault) {
        if (defaultOption)
          throw new Error(
            'Multiple default options cannot be present in the same list'
          );

        defaultOption = {
          optionName: fieldName,
          optionLabel: label,
          tableName,
          isRelationship,
          isRequired,
          isHidden,
        };
      }

      if (props.isOpen)
        fieldGroups[getFieldGroupName(isHidden, isRequired)][fieldName] = {
          optionLabel: label,
          title,
          isEnabled,
          isRelationship,
          isDefault,
          tableName,
        };
      else if (typeof label === 'string') fieldNames.push(label);
    }
  );

  defaultOption ??=
    typeof props.defaultOption == 'undefined'
      ? {
          optionName: '0',
          optionLabel: '0',
          tableName: '',
          isRelationship: false,
          isRequired: false,
          isHidden: false,
        }
      : props.defaultOption;

  return props.isOpen ? (
    <CustomSelectElement
      {...props}
      customSelectOptionGroups={Object.fromEntries(
        Object.entries(fieldGroups)
          .filter(([, groupFields]) => Object.entries(groupFields).length > 0)
          .map(([groupName, groupFields]) => [
            groupName,
            {
              // Don't show group labels on some custom select types
              selectGroupLabel:
                props.customSelectSubtype === 'tree' ||
                props.customSelectSubtype === 'toMany' ||
                props.customSelectType === 'BASE_TABLE_SELECTION_LIST' ||
                props.customSelectType === 'MAPPING_OPTIONS_LIST' ||
                props.customSelectType === 'MAPPING_OPTION_LINE_LIST'
                  ? undefined
                  : fieldGroupLabels[groupName],
              selectOptionsData: groupFields,
            },
          ])
      )}
      defaultOption={defaultOption}
      automapperSuggestions={
        typeof props.automapperSuggestions !== 'undefined' &&
        props.automapperSuggestions.length > 0 &&
        typeof props.handleAutomapperSuggestionSelection !== 'undefined' ? (
          <SuggestionBox
            onSelect={props.handleAutomapperSuggestionSelection}
            selectOptionsData={Object.fromEntries(
              props.automapperSuggestions.map((automapperSuggestion, index) => [
                /*
                 * Since "0" is reserved for `no value`, we need to
                 * start counting from 1
                 */
                index + 1,
                {
                  optionLabel: (
                    <MappingPathComponent
                      mappingLineData={automapperSuggestion.mappingLineData}
                    />
                  ),
                },
              ])
            )}
          />
        ) : undefined
      }
    />
  ) : (
    <CustomSelectElement
      defaultOption={defaultOption}
      {...props}
      fieldNames={fieldNames}
    />
  );
}
