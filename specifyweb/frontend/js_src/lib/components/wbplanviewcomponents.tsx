/**
 * Collection of common React components used in the WbPlanView
 *
 * @module
 */

import React from 'react';

import wbText from '../localization/workbench';
import type { IR, R, RA } from '../types';
import type { DataModelListOfTables } from '../wbplanviewmodelfetcher';
import { useId } from './hooks';
import type {
  CustomSelectElementOptionProps,
  CustomSelectElementPropsClosed,
  CustomSelectElementPropsOpenBase,
} from './customselectelement';
import { CustomSelectElement, SuggestionBox } from './customselectelement';
import { closeDialog, JqueryDialog } from './modaldialog';
import type { AutoMapperSuggestion } from './wbplanviewmapper';
import { Button } from './basic';

export type HtmlGeneratorFieldData = {
  readonly optionLabel: string | JSX.Element;
  readonly title?: string;
  readonly isEnabled?: boolean;
  readonly isRequired?: boolean;
  readonly isHidden?: boolean;
  readonly isDefault?: boolean;
  readonly isRelationship?: boolean;
  readonly tableName?: string;
};

type MappingLineBaseProps = {
  readonly lineData: RA<MappingElementProps>;
  readonly headerName: string;
  readonly isFocused: boolean;
  readonly onFocus: () => void;
  readonly onKeyDown: (key: string) => void;
  readonly onClearMapping: () => void;
  readonly readonly: boolean;
};

export type MappingPathProps = {
  readonly mappingLineData: RA<MappingElementProps>;
};

export type MappingElementProps = {
  readonly fieldsData: IR<HtmlGeneratorFieldData>;
} & (
  | (Omit<
      CustomSelectElementPropsOpenBase,
      'onFocusAutoMapper' | 'autoMapperSuggestions'
    > & {
      readonly autoMapperSuggestions?: RA<AutoMapperSuggestion>;
      readonly handleAutoMapperSuggestionSelection?: (
        suggestion: string
      ) => void;
    })
  | Omit<CustomSelectElementPropsClosed, 'onFocusAutoMapper' | 'fieldNames'>
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
  const fieldsData = Object.fromEntries(
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
  );
  return (
    <MappingElement
      isOpen={true}
      handleChange={({ newValue }): void => handleChange(newValue)}
      fieldsData={fieldsData}
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
  ) => JQueryUI.DialogButtonOptions[];
  readonly dialogContent: React.ReactNode;
  readonly onConfirm: () => void;
  readonly dialogTitle: string;
  readonly showConfirmation?: () => boolean;
  readonly role?: string;
}): JSX.Element {
  const [displayPrompt, setDisplayPrompt] = React.useState<boolean>(false);

  return (
    <>
      <Button
        role={props.role}
        aria-haspopup="dialog"
        onClick={(): void =>
          typeof props.showConfirmation === 'undefined' ||
          props.showConfirmation()
            ? setDisplayPrompt(true)
            : props.onConfirm()
        }
      >
        {props.children}
      </Button>
      {displayPrompt ? (
        <JqueryDialog
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
        </JqueryDialog>
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
      <Button
        className={props.isValidated ? 'bg-green-400' : undefined}
        role="menuitem"
        onClick={
          props.canValidate ? props.onClick : (): void => setDisplayPrompt(true)
        }
      >
        {wbText('validate')}
      </Button>
      {displayPrompt ? (
        <JqueryDialog
          properties={{
            title: wbText('nothingToValidateDialogTitle'),
            close: (): void => setDisplayPrompt(false),
          }}
        >
          {wbText('nothingToValidateDialogHeader')}
          <p>{wbText('nothingToValidateDialogMessage')}</p>
        </JqueryDialog>
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
    if (isFocused && lineRef.current?.contains(document.activeElement) !== true)
      lineRef.current?.focus();
  }, [isFocused]);

  const id = useId('mapping-line');

  const isMapped =
    lineData.slice(-1)[0].customSelectType === 'MAPPING_OPTIONS_LIST';
  return (
    <li className="contents" aria-label={headerName} aria-current={isFocused}>
      <div className="print:hidden border-t-gray-500 py-2 border-t">
        <Button
          className="w-full h-full p-2"
          title={wbText('clearMapping')}
          aria-label={wbText('clearMapping')}
          onClick={handleClearMapping}
          disabled={readonly}
        >
          ⌦
        </Button>
      </div>
      <div
        className={`flex items-center justify-end max-w-[25vw] p-2 border-t
          border-t-gray-500 ${isMapped ? '' : 'font-extrabold text-red-600'}`}
        id={id('header')}
      >
        {headerName}
      </div>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className={`print:gap-1 flex flex-wrap items-center gap-2 border-t
          border-t-gray-500 py-2 ${isFocused ? 'bg-gray-300' : ''}
        `}
        role="list"
        /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
        tabIndex={0}
        onClick={handleFocus}
        onKeyDown={({ key }): void => handleKeyDown(key)}
        ref={lineRef}
        title={wbText('columnMapping')}
        aria-labelledby={id('header')}
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
  <span className="print:px-1 flex items-center px-2" aria-label=",">
    {'→'}
  </span>
);

const getFieldGroupName = (isHidden: boolean, isRequired: boolean): string =>
  isHidden ? 'hiddenFields' : isRequired ? 'requiredFields' : 'optionalFields';

export function MappingElement(props: MappingElementProps): JSX.Element {
  const fieldGroups = Object.entries(props.fieldsData).reduce<
    R<R<CustomSelectElementOptionProps>>
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
      autoMapperSuggestions={
        typeof props.autoMapperSuggestions !== 'undefined' &&
        props.autoMapperSuggestions.length > 0 &&
        typeof props.handleAutoMapperSuggestionSelection !== 'undefined' ? (
          <SuggestionBox
            onSelect={(selection): void =>
              props.handleAutoMapperSuggestionSelection?.(selection)
            }
            selectOptionsData={Object.fromEntries(
              props.autoMapperSuggestions.map((autoMapperSuggestion, index) => [
                /*
                 * Start counting from 1 since "0" is reserved for
                 * `no value`
                 */
                index + 1,
                {
                  optionLabel: (
                    <span className="gap-y-2 flex flex-wrap">
                      <MappingPathComponent
                        mappingLineData={autoMapperSuggestion.mappingLineData}
                      />
                    </span>
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
