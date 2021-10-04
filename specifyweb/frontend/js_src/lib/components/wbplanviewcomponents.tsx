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
  CustomSelectElementOptions,
  CustomSelectElementPropsClosed,
  CustomSelectElementPropsOpenBase,
} from './customselectelement';
import { CustomSelectElement, SuggestionBox } from './customselectelement';
import { closeDialog, ModalDialog } from './modaldialog';
import type { IR, R, RA } from './wbplanview';
import type { AutomapperSuggestion, MappingType } from './wbplanviewmapper';

export interface HtmlGeneratorFieldData {
  readonly optionLabel: string | JSX.Element;
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
  readonly onFocus: () => void;
  readonly onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  readonly onClearMapping: () => void;
  readonly readonly: boolean;
}

export interface MappingPathProps {
  readonly mappingLineData: RA<MappingElementProps>;
}

export type MappingElementProps = {
  readonly fieldsData: IR<HtmlGeneratorFieldData>;
} & (
  | (Omit<
      CustomSelectElementPropsOpenBase,
      'onFocusAutomapper' | 'automapperSuggestions'
    > & {
      readonly automapperSuggestions?: RA<AutomapperSuggestion>;
      readonly handleAutomapperSuggestionSelection?: (
        suggestion: string
      ) => void;
    })
  | Omit<CustomSelectElementPropsClosed, 'onFocusAutomapper' | 'fieldNames'>
);

export function ListOfBaseTables({
  listOfTables,
  handleChange,
  showHiddenTables,
}: {
  readonly listOfTables: DataModelListOfTables;
  readonly handleChange: (newValue: string) => void;
  readonly showHiddenTables: boolean;
}): JSX.Element {
  return (
    <MappingElement
      isOpen={true}
      handleChange={(_close, newValue): void => handleChange(newValue)}
      fieldsData={Object.fromEntries(
        (showHiddenTables
          ? Object.entries(listOfTables)
          : Object.entries(listOfTables).filter(([, { isHidden }]) => !isHidden)
        ).map(([tableName, { label, isHidden }]) => [
          tableName,
          {
            optionLabel: label,
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
}

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
  readonly role?: string;
}): JSX.Element {
  const [displayPrompt, setDisplayPrompt] = React.useState<boolean>(false);

  return (
    <>
      <button
        className="magic-button"
        role={props.role}
        aria-haspopup="dialog"
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
            buttons: props.buttons(() => {
              setDisplayPrompt(false);
              props.onConfirm();
            }, closeDialog),
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
        role="menuitem"
        type="button"
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
          <p>{wbText('nothingToValidateDialogMessage')}</p>
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
  onFocus: handleFocus,
  onKeyDown: handleKeyDown,
  onClearMapping: handleClearMapping,
}: MappingLineBaseProps): JSX.Element {
  const lineRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (isFocused && !lineRef.current?.contains(document.activeElement))
      lineRef.current?.focus();
  }, [isFocused]);

  return (
    <li
      className={`wbplanview-mapping-line ${
        lineData.slice(-1)[0].customSelectType === 'MAPPING_OPTIONS_LIST'
          ? ''
          : 'wbplanview-mapping-line-header-unmapped'
      }`}
      aria-label={headerName}
      aria-current={isFocused}
    >
      <div className="wbplanview-mapping-line-controls">
        <button
          type="button"
          title={wbText('clearMapping')}
          aria-label={wbText('clearMapping')}
          onClick={handleClearMapping}
          disabled={readonly}
        >
          ⌦
        </button>
      </div>
      <div className="v-center wbplanview-mapping-line-header">
        {headerName}
      </div>
      <div
        className="v-center wbplanview-mapping-line-elements"
        role="list"
        tabIndex={0}
        onClick={handleFocus}
        onKeyDown={handleKeyDown}
        ref={lineRef}
      >
        <MappingPathComponent mappingLineData={lineData} />
      </div>
    </li>
  );
}

export function MappingPathComponent({
  mappingLineData,
}: MappingPathProps): JSX.Element {
  return (
    <>
      {mappingLineData.map((mappingDetails, index) => (
        <React.Fragment key={index}>
          <MappingElement {...mappingDetails} role="listitem" />
          {index + 1 !== mappingLineData.length &&
            mappingLineData[index + 1]?.customSelectType !==
              'MAPPING_OPTIONS_LIST' &&
            MappingElementDivider}
        </React.Fragment>
      ))}
    </>
  );
}

const fieldGroupLabels = {
  suggestedMappings: wbText('suggestedMappings'),
  requiredFields: wbText('requiredFields'),
  optionalFields: wbText('optionalFields'),
  hiddenFields: wbText('hiddenFields'),
} as const;

const MappingElementDivider = (
  <span className="wbplanview-mapping-line-divider" aria-label=",">
    {'→'}
  </span>
);

const getFieldGroupName = (isHidden: boolean, isRequired: boolean): string =>
  isHidden ? 'hiddenFields' : isRequired ? 'requiredFields' : 'optionalFields';

export function MappingElement(props: MappingElementProps): JSX.Element {
  const fieldGroups = Object.entries(props.fieldsData).reduce<
    R<CustomSelectElementOptions>
  >((fieldGroups, [fieldName, { isRequired, isHidden, ...rest }]) => {
    const groupName = getFieldGroupName(isHidden ?? false, isRequired ?? false);
    fieldGroups[groupName] ??= {};
    fieldGroups[groupName][fieldName] = rest;
    return fieldGroups;
  }, Object.fromEntries(Object.keys(fieldGroupLabels).map((groupName) => [groupName, {}])));

  const customSelectOptionGroups = Object.fromEntries(
    Object.entries(fieldGroups)
      .filter(([, groupFields]) => Object.entries(groupFields).length > 0)
      .map(([groupName, groupFields]) => [
        groupName,
        {
          selectGroupLabel:
            fieldGroupLabels[groupName as keyof typeof fieldGroupLabels],
          selectOptionsData: groupFields,
        },
      ])
  );

  return props.isOpen ? (
    <CustomSelectElement
      {...props}
      customSelectOptionGroups={customSelectOptionGroups}
      automapperSuggestions={
        typeof props.automapperSuggestions !== 'undefined' &&
        props.automapperSuggestions.length > 0 &&
        typeof props.handleAutomapperSuggestionSelection !== 'undefined' ? (
          <SuggestionBox
            onSelect={(selection): void =>
              props.handleAutomapperSuggestionSelection?.(selection)
            }
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
      {...props}
      customSelectOptionGroups={customSelectOptionGroups}
    />
  );
}
