/**
 * Collection of common React components used in the WbPlanView
 *
 * @module
 */

import React from 'react';

import type { Tables } from '../datamodel';
import { wbText } from '../localization/workbench';
import { hasTablePermission } from '../permissionutils';
import { schema } from '../schema';
import type { IR, R, RA } from '../types';
import type { MappingLineData } from '../wbplanviewnavigator';
import { Button } from './basic';
import type {
  CustomSelectElementOptionProps,
  CustomSelectElementPropsClosed,
  CustomSelectElementPropsOpenBase,
  CustomSelectType,
} from './customselectelement';
import {
  CustomSelectElement,
  customSelectTypes,
  SuggestionBox,
} from './customselectelement';
import { useBooleanState, useId } from './hooks';
import { icons } from './icons';
import { Dialog, dialogClassNames } from './modaldialog';
import { usePref } from './preferenceshooks';
import type { AutoMapperSuggestion } from './wbplanviewmapper';

export type HtmlGeneratorFieldData = {
  readonly optionLabel: JSX.Element | string;
  readonly title?: string;
  readonly isEnabled?: boolean;
  readonly isRequired?: boolean;
  readonly isHidden?: boolean;
  readonly isDefault?: boolean;
  readonly isRelationship?: boolean;
  readonly tableName?: keyof Tables;
};

type MappingLineBaseProps = {
  readonly lineData: RA<MappingElementProps>;
  readonly headerName: string;
  readonly isFocused: boolean;
  readonly onFocus: () => void;
  readonly onKeyDown: (key: string) => void;
  readonly onClearMapping: () => void;
  readonly isReadOnly: boolean;
};

export type MappingElementProps = {
  readonly fieldsData: IR<HtmlGeneratorFieldData>;
} & (
  | Omit<CustomSelectElementPropsClosed, 'fieldNames'>
  | (Omit<CustomSelectElementPropsOpenBase, 'autoMapperSuggestions'> & {
      readonly autoMapperSuggestions?: RA<AutoMapperSuggestion>;
      readonly onAutoMapperSuggestionSelection?: (suggestion: string) => void;
    })
);

export function ListOfBaseTables({
  onChange: handleChange,
  showHiddenTables,
}: {
  readonly onChange: (newTable: keyof Tables) => void;
  readonly showHiddenTables: boolean;
}): JSX.Element {
  const [isNoRestrictionMode] = usePref(
    'workBench',
    'wbPlanView',
    'noRestrictionsMode'
  );
  const [showNoAccessTables] = usePref(
    'workBench',
    'wbPlanView',
    'showNoAccessTables'
  );
  const fieldsData = Object.fromEntries(
    Object.entries(schema.models)
      .filter(
        ([tableName, { overrides }]) =>
          (isNoRestrictionMode ||
            (!overrides.isSystem && !overrides.isHidden)) &&
          (overrides.isCommon || showHiddenTables) &&
          (showNoAccessTables || hasTablePermission(tableName, 'create'))
      )
      .map(
        ([tableName, { label, overrides }]) =>
          [
            tableName,
            {
              optionLabel: label,
              tableName,
              isRelationship: true,
              isHidden: !overrides.isCommon,
            },
          ] as const
      )
  );
  return (
    <MappingElement
      customSelectSubtype="tree"
      customSelectType="BASE_TABLE_SELECTION_LIST"
      fieldsData={fieldsData}
      isOpen
      onChange={({ newValue }): void => handleChange(newValue as keyof Tables)}
    />
  );
}

export function ButtonWithConfirmation(props: {
  readonly children: React.ReactNode;
  readonly dialogHeader: string;
  readonly dialogMessage: React.ReactNode;
  readonly dialogButtons: (
    confirm: () => void
  ) => Parameters<typeof Dialog>[0]['buttons'];
  readonly onConfirm: () => void;
  readonly showConfirmation?: () => boolean;
  readonly disabled?: boolean;
}): JSX.Element {
  const [displayPrompt, handleShow, handleHide] = useBooleanState();

  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        disabled={props.disabled}
        onClick={(): void =>
          props.showConfirmation === undefined || props.showConfirmation()
            ? handleShow()
            : props.onConfirm()
        }
      >
        {props.children}
      </Button.Small>
      <Dialog
        buttons={props.dialogButtons(() => {
          handleHide();
          props.onConfirm();
        })}
        className={{
          container: dialogClassNames.narrowContainer,
        }}
        header={props.dialogHeader}
        isOpen={displayPrompt}
        onClose={handleHide}
      >
        {props.dialogMessage}
      </Dialog>
    </>
  );
}

export function getMappingLineProps({
  mappingLineData,
  openSelectElement,
  customSelectType,
  onChange: handleChange,
  onOpen: handleOpen,
  onClose: handleClose,
  onAutoMapperSuggestionSelection: handleAutoMapperSuggestionSelection,
  autoMapperSuggestions,
}: {
  readonly mappingLineData: RA<MappingLineData>;
  // Index of custom select element that should be open
  readonly openSelectElement?: number;
  readonly customSelectType: CustomSelectType;
  readonly onChange?: (payload: {
    readonly index: number;
    readonly close: boolean;
    readonly newValue: string;
    readonly isRelationship: boolean;
    readonly parentTableName: keyof Tables | undefined;
    readonly currentTableName: keyof Tables | undefined;
    readonly newTableName: keyof Tables | undefined;
    readonly isDoubleClick: boolean;
  }) => void;
  readonly onOpen?: (index: number) => void;
  readonly onClose?: () => void;
  readonly onAutoMapperSuggestionSelection?: (suggestion: string) => void;
  readonly autoMapperSuggestions?: RA<AutoMapperSuggestion>;
}): RA<MappingElementProps> {
  return mappingLineData.map((data, index) => {
    const isOpen =
      openSelectElement === index ||
      // If it doesn't have a preview, then it is always open
      !customSelectTypes[customSelectType].includes('preview');

    return {
      ...data,
      customSelectType,
      ...(isOpen
        ? {
            isOpen: true,
            onChange:
              typeof handleChange === 'function'
                ? (payload): void => {
                    handleChange({
                      index,
                      parentTableName: data.tableName,
                      ...payload,
                    });
                  }
                : undefined,
            onClose: handleClose?.bind(undefined, index),
            autoMapperSuggestions,
            onAutoMapperSuggestionSelection:
              handleAutoMapperSuggestionSelection,
          }
        : {
            isOpen: false,
            onOpen: handleOpen?.bind(undefined, index),
          }),
    };
  });
}

export function MappingLineComponent({
  lineData,
  headerName,
  isReadOnly,
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

  const isComplete = lineData.at(-1)?.customSelectType === 'OPTIONS_LIST';
  return (
    <li
      aria-current={isFocused}
      aria-labelledby={id('header')}
      className="contents"
    >
      <div className="border-t border-t-gray-500 py-2 print:hidden">
        <Button.Small
          aria-label={wbText('clearMapping')}
          className="h-full w-full p-2"
          disabled={isReadOnly}
          title={wbText('clearMapping')}
          onClick={handleClearMapping}
        >
          {icons.backspace}
        </Button.Small>
      </div>
      <div
        className={`
          flex max-w-[25vw] items-center justify-end border-t border-t-gray-500
          p-2 ${isComplete ? '' : 'font-extrabold text-red-600'}
        `}
        id={id('header')}
      >
        {headerName}
      </div>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        aria-label={wbText('columnMapping')}
        className={`
          flex flex-wrap items-center gap-2 border-t border-t-gray-500
          py-2 print:gap-1
          ${isFocused ? 'bg-gray-300 dark:bg-neutral-700' : ''}
        `}
        ref={lineRef}
        role="list"
        tabIndex={0}
        title={wbText('columnMapping')}
        onClick={handleFocus}
        onKeyDown={({ key }): void => handleKeyDown(key)}
      >
        <MappingPathComponent mappingLineData={lineData} />
      </div>
    </li>
  );
}

export function MappingPathComponent({
  mappingLineData,
}: {
  readonly mappingLineData: RA<MappingElementProps>;
}): JSX.Element {
  return (
    <>
      {mappingLineData.map((mappingDetails, index) => (
        <React.Fragment key={index}>
          <MappingElement {...mappingDetails} role="listitem" />
          {index + 1 !== mappingLineData.length &&
          mappingLineData[index + 1]?.customSelectType !== 'OPTIONS_LIST'
            ? mappingElementDivider
            : undefined}
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

export const mappingElementDividerClassName = `print:px-1 flex items-center px-2`;
export const mappingElementDivider = (
  <span aria-hidden className={mappingElementDividerClassName}>
    {icons.arrowRight}
  </span>
);

const getFieldGroupName = (isHidden: boolean, isRequired: boolean): string =>
  isHidden ? 'hiddenFields' : isRequired ? 'requiredFields' : 'optionalFields';

export function MappingElement({
  fieldsData,
  ...props
}: MappingElementProps): JSX.Element {
  const fieldGroups = Object.entries(fieldsData).reduce<
    R<R<CustomSelectElementOptionProps>>
  >((fieldGroups, [fieldName, fieldData]) => {
    const groupName = getFieldGroupName(
      fieldData.isHidden ?? false,
      fieldData.isRequired ?? false
    );
    fieldGroups[groupName] ??= {};
    fieldGroups[groupName][fieldName] = fieldData;
    return fieldGroups;
  }, Object.fromEntries(Object.keys(fieldGroupLabels).map((groupName) => [groupName, {}])));

  const customSelectOptionGroups = Object.fromEntries(
    Object.entries(fieldGroups)
      .filter(([, groupFields]) => Object.entries(groupFields).length > 0)
      .map(([groupName, groupFields], _index, { length }) => [
        groupName,
        {
          // Don't show group labels if there is only one group
          selectGroupLabel:
            length === 1
              ? undefined
              : fieldGroupLabels[groupName as keyof typeof fieldGroupLabels],
          selectOptionsData: groupFields,
        },
      ])
  );

  return props.isOpen ? (
    <CustomSelectElement
      {...props}
      autoMapperSuggestions={
        Array.isArray(props.autoMapperSuggestions) &&
        props.autoMapperSuggestions.length > 0 &&
        typeof props.onAutoMapperSuggestionSelection === 'function' ? (
          <SuggestionBox
            selectOptionsData={Object.fromEntries(
              props.autoMapperSuggestions.map((autoMapperSuggestion, index) => [
                /*
                 * Start counting from 1 since "0" is reserved for
                 * `no value`
                 */
                index + 1,
                {
                  optionLabel: (
                    <span className="flex flex-wrap gap-2">
                      <MappingPathComponent
                        mappingLineData={autoMapperSuggestion.mappingLineData}
                      />
                    </span>
                  ),
                },
              ])
            )}
            onSelect={(selection): void =>
              props.onAutoMapperSuggestionSelection?.(selection)
            }
          />
        ) : undefined
      }
      customSelectOptionGroups={customSelectOptionGroups}
    />
  ) : (
    <CustomSelectElement
      {...props}
      customSelectOptionGroups={customSelectOptionGroups}
    />
  );
}
