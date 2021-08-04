/*
 * Custom Select Element (picklist). Used by workbench mapper
 */

import '../../css/customselectelement.css';

import React from 'react';

import wbText from '../localization/workbench';
import { upperToKebab } from '../wbplanviewhelper';
import dataModelStorage from '../wbplanviewmodel';
import {
  TableIcon,
  TableIconEmpty,
  TableIconSelected,
  TableIconUndefined,
} from './common';
import type { IR, R, RA } from './wbplanview';

type Properties =
  /*
   * Has onClick event
   * Has tabIndex of -1 if does not have 'tabIndex'
   */
  | 'interactive'
  // Has Header with table name
  | 'header'
  // Has a preview line when closed
  | 'preview'
  // Has an "UNMAP" option among options when mapped
  | 'unmapOption'
  // Autoscroll the list to selected value when created/opened
  | 'autoScroll'
  // Has option group labels
  | 'groupLabels'
  // Has tabIndex of 0
  | 'tabIndex';
const customSelectTypes: IR<RA<Properties>> = {
  /* eslint-disable @typescript-eslint/naming-convention */
  // Used in the mapping view
  OPENED_LIST: [
    'interactive',
    'header',
    'autoScroll',
    'groupLabels',
    'tabIndex',
  ],
  // Used in mapping lines
  CLOSED_LIST: [
    'interactive',
    'preview',
    'unmapOption',
    'autoScroll',
    'groupLabels',
  ],
  // Used inside of mapping validation results dialog and suggestion list
  PREVIEW_LIST: ['preview'],
  // Used to display a list of AutoMapper suggestions
  SUGGESTION_LIST: ['interactive', 'groupLabels', 'tabIndex'],
  SUGGESTION_LINE_LIST: ['preview'],
  // Used for base table selection
  BASE_TABLE_SELECTION_LIST: ['interactive', 'tabIndex'],
  // Used for configuring mapping options for a mapping line
  MAPPING_OPTIONS_LIST: ['interactive', 'preview'],
  /* eslint-enable @typescript-eslint/naming-convention */
} as const;
export type CustomSelectType = keyof typeof customSelectTypes;

export type CustomSelectSubtype =
  // For fields and relationships
  | 'simple'
  // For reference items
  | 'toMany'
  // For tree ranks
  | 'tree';

interface CustomSelectElementIconProps {
  /*
   * Whether the option is a relationship (False for fields, true for
   * relationships, tree ranks and reference items)
   */
  readonly isRelationship?: boolean;
  // Whether the option is now selected
  readonly isDefault?: boolean;
  // The name of the table this option represents
  readonly tableName?: string;
  // The name of the option. Would be used as a label (visible to the user)
  readonly optionLabel?: string | JSX.Element;
  // The value of the title HTML attribute
  readonly title?: string;
  /*
   * True if option can be selected. False if option cannot be selected because
   * it was already selected
   */
  readonly isEnabled?: boolean;
  // Whether an icon is used inside of preview_row in CLOSED_LIST
  readonly isPreview?: boolean;
}

interface CustomSelectElementOptionProps extends CustomSelectElementIconProps {
  readonly handleClick?: () => void;
}

export type CustomSelectElementDefaultOptionProps =
  CustomSelectElementIconProps & {
    readonly optionName: string;
    readonly isRequired?: boolean;
    readonly isHidden?: boolean;
  };

export type CustomSelectElementOptions = R<CustomSelectElementOptionProps>;

interface CustomSelectElementOptionGroupProps {
  // Group's name (used for styling)
  readonly selectGroupName?: string;
  // Group's label (shown to the user)
  readonly selectGroupLabel?: string;
  /*
   * List of options data. See customSelectElement.getSelectOptionHtml()
   * for the data structure
   */
  readonly selectOptionsData: CustomSelectElementOptions;
  readonly handleClick?: (
    newValue: string,
    isRelationship: boolean,
    newTableName: string
  ) => void;
}

type CustomSelectElementOptionGroups = IR<CustomSelectElementOptionGroupProps>;

interface CustomSelectElementPropsBase {
  // The label to use for the element
  readonly selectLabel?: string;
  readonly customSelectType: CustomSelectType;
  readonly customSelectSubtype?: CustomSelectSubtype;
  readonly isOpen: boolean;
  readonly tableName?: string;
  readonly role?: string;
  readonly previewOption?: CustomSelectElementDefaultOptionProps;

  readonly handleOpen?: () => void;

  readonly handleChange?: (
    close: boolean,
    newValue: string,
    isRelationship: boolean,
    currentTable: string,
    newTable: string
  ) => void;
  readonly handleClose?: () => void;
  readonly customSelectOptionGroups?: CustomSelectElementOptionGroups;
  readonly automapperSuggestions?: JSX.Element;
}

export interface CustomSelectElementPropsClosed
  extends CustomSelectElementPropsBase {
  readonly isOpen: false;
  readonly handleOpen?: () => void;
}

export interface CustomSelectElementPropsOpenBase
  extends CustomSelectElementPropsBase {
  readonly isOpen: true;
  readonly handleChange?: (
    close: boolean,
    newValue: string,
    isRelationship: boolean,
    currentTable: string,
    newTable: string
  ) => void;
  readonly handleClose?: () => void;
}

interface CustomSelectElementPropsOpen
  extends CustomSelectElementPropsOpenBase {
  readonly customSelectOptionGroups: CustomSelectElementOptionGroups;
  readonly automapperSuggestions?: JSX.Element;
}

export function Icon({
  isRelationship = false,
  isPreview = false,
  isEnabled = true,
  tableName = '',
  optionLabel = '0',
}: CustomSelectElementIconProps): JSX.Element {
  if (optionLabel === '0') return TableIconUndefined;
  if (!isRelationship && (isPreview || !isEnabled)) return TableIconSelected;
  else if (!isRelationship || tableName === '') return TableIconEmpty;
  else return <TableIcon tableName={tableName} />;
}

const Option = React.memo(function Option({
  optionLabel,
  title,
  isEnabled = true,
  isRelationship = false,
  isDefault = false,
  tableName = '',
  handleClick,
}: CustomSelectElementOptionProps) {
  const classes = ['custom-select-option'];

  if (!isEnabled && !isRelationship)
    // Don't disable relationships
    classes.push('custom-select-option-disabled');

  if (isRelationship) classes.push('custom-select-option-relationship');

  if (isDefault) classes.push('custom-select-option-selected');

  const tableLabel = dataModelStorage.tables?.[tableName]?.label;

  return (
    <span
      className={classes.join(' ')}
      tabIndex={-1}
      onClick={handleClick}
      title={title ?? tableLabel}
      aria-selected={isDefault}
      role="option"
      aria-disabled={!isEnabled}
      aria-current={!isEnabled}
    >
      <Icon
        optionLabel={optionLabel}
        isRelationship={isRelationship}
        isEnabled={isEnabled}
        tableName={tableName}
      />
      <span
        className={`v-center custom-select-option-label ${
          optionLabel === '0' ? 'custom-select--label-unmapped' : ''
        }`}
      >
        {optionLabel === '0' ? 'UNMAP' : optionLabel}
      </span>
      {isRelationship && (
        <span
          className="custom-select-option-relationship-icon"
          title={tableLabel ? wbText('relationship')(tableLabel) : undefined}
          aria-label={
            tableLabel ? wbText('relationship')(tableLabel) : undefined
          }
        >
          ▶
        </span>
      )}
    </span>
  );
});

function OptionGroup({
  selectGroupName,
  selectGroupLabel,
  selectOptionsData,
  handleClick,
}: CustomSelectElementOptionGroupProps): JSX.Element {
  return (
    <section
      className={`custom-select-group custom-select-group-${
        selectGroupName?.replace(
          /[A-Z]/g,
          (letter) => `-${letter.toLowerCase()}`
        ) ?? 'undefined'
      }`}
      role="group"
      aria-label={selectGroupLabel}
    >
      {typeof selectGroupLabel !== 'undefined' && (
        <header aria-hidden={true} className="custom-select-group-label">
          {selectGroupLabel}
        </header>
      )}
      {Object.entries(selectOptionsData).map(
        ([optionName, selectionOptionData]) => {
          return (
            <Option
              key={optionName}
              handleClick={
                selectionOptionData.isEnabled === false
                  ? undefined
                  : handleClick?.bind(
                      null,
                      optionName,
                      typeof selectionOptionData.isRelationship !==
                        'undefined' && selectionOptionData.isRelationship,
                      selectionOptionData.tableName ?? ''
                    )
              }
              {...selectionOptionData}
            />
          );
        }
      )}
    </section>
  );
}

const ShadowListOfOptions = React.memo(function ShadowListOfOptions({
  fieldNames,
}: {
  readonly fieldNames: RA<string>;
}) {
  return (
    <span className="custom-select-element-shadow-list" aria-hidden="true">
      {fieldNames.map((fieldName, index) => (
        <span key={index}>{fieldName}</span>
      ))}
    </span>
  );
});

const defaultDefaultOption = {
  optionName: '0',
  optionLabel: '0',
  tableName: '',
  isRelationship: false,
  isRequired: false,
  isHidden: false,
};

export function CustomSelectElement({
  customSelectType,
  customSelectSubtype = 'simple',
  customSelectOptionGroups,
  selectLabel = '',
  isOpen,
  tableName,
  handleChange,
  handleOpen,
  handleClose,
  previewOption,
  automapperSuggestions,
  role,
}: CustomSelectElementPropsClosed | CustomSelectElementPropsOpen): JSX.Element {
  const has = (property: Properties): boolean =>
    customSelectTypes[customSelectType].includes(property);

  let inlineOptions: RA<CustomSelectElementDefaultOptionProps> = Object.values(
    customSelectOptionGroups ?? {}
  ).flatMap(({ selectOptionsData }) =>
    Object.entries(selectOptionsData)
      .filter(
        ([_optionName, { isEnabled, isDefault }]) =>
          isEnabled !== false || Boolean(isDefault)
      )
      .map(([optionName, optionData]) => ({
        optionName,
        ...optionData,
      }))
  );

  const defaultOption =
    previewOption ??
    inlineOptions.find(({ isDefault }) => isDefault) ??
    defaultDefaultOption;

  const showUnmapOption =
    isOpen &&
    customSelectSubtype === 'simple' &&
    has('unmapOption') &&
    defaultOption.optionName !== '0';

  if (showUnmapOption) inlineOptions = [defaultDefaultOption, ...inlineOptions];

  const handleClick = has('interactive')
    ? (
        close: boolean,
        newValue: string,
        isRelationship: boolean,
        newTable: string
      ): void =>
        newValue === defaultOption.optionName &&
        customSelectType !== 'SUGGESTION_LIST'
          ? undefined
          : handleChange?.(
              close,
              newValue,
              isRelationship,
              defaultOption.tableName ?? '',
              newTable
            )
    : undefined;

  let header: JSX.Element | undefined;
  let preview: JSX.Element | undefined;
  let unmapOption: JSX.Element | undefined;
  let optionsShadow: JSX.Element | undefined;
  if (has('header') && selectLabel)
    header = (
      <header className="custom-select-header">
        <Icon
          isDefault={true}
          isRelationship={true}
          tableName={tableName}
          optionLabel={tableName}
        />
        <span>{selectLabel}</span>
      </header>
    );
  else if (has('preview')) {
    preview = (
      <header
        className={`custom-select-input ${
          defaultOption?.isRequired === true
            ? 'custom-select-input-required'
            : ''
        } ${
          defaultOption?.isHidden === true ? 'custom-select-input-hidden' : ''
        } ${
          customSelectType === 'MAPPING_OPTIONS_LIST' &&
          defaultOption?.isRelationship === true
            ? 'custom-select-label-modified'
            : ''
        }`}
        role="button"
        onClick={
          has('interactive') ? (isOpen ? handleClose : handleOpen) : undefined
        }
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Icon
          isDefault={true}
          isRelationship={defaultOption.isRelationship}
          tableName={defaultOption.tableName}
          optionLabel={defaultOption.optionLabel}
          isPreview={true}
        />
        <span
          className={`custom-select-input-label ${
            defaultOption.optionLabel === '0'
              ? 'custom-select-label-unmapped'
              : ''
          }`}
        >
          {defaultOption.optionLabel === '0'
            ? 'NOT MAPPED'
            : defaultOption.optionLabel}
        </span>
        {has('interactive') && customSelectType !== 'MAPPING_OPTIONS_LIST' && (
          <span>▼</span>
        )}
      </header>
    );

    unmapOption = showUnmapOption ? (
      <Option
        handleClick={(): void => handleClick?.(true, '0', false, '0')}
        isDefault={defaultOption.optionLabel === '0'}
        optionLabel="0"
      />
    ) : undefined;

    const fieldNames = inlineOptions
      .map(({ optionLabel }) => optionLabel)
      .filter(
        (optionLabel): optionLabel is string => typeof optionLabel === 'string'
      );
    optionsShadow =
      !isOpen && has('interactive') && fieldNames.length > 0 ? (
        <ShadowListOfOptions fieldNames={fieldNames} />
      ) : undefined;
  }

  const groups =
    isOpen &&
    has('interactive') &&
    Object.entries(customSelectOptionGroups ?? {})
      .filter(
        ([, { selectOptionsData }]) => Object.keys(selectOptionsData).length > 0
      )
      .map(
        (
          [selectGroupName, { selectGroupLabel, ...selectGroupData }],
          index
        ) => (
          <OptionGroup
            key={index}
            handleClick={handleClick?.bind(undefined, true) ?? undefined}
            selectGroupName={selectGroupName}
            {...selectGroupData}
            selectGroupLabel={
              has('groupLabels') && customSelectSubtype === 'simple'
                ? selectGroupLabel
                : undefined
            }
          />
        )
      );

  const listOfOptionsRef = React.useRef<HTMLElement>(null);
  const customSelectOptions = (Boolean(unmapOption) || groups) && (
    <span
      className="custom-select-options"
      ref={listOfOptionsRef}
      aria-readonly={!has('interactive') || typeof handleChange !== 'function'}
      role="listbox"
      tabIndex={-1}
    >
      {unmapOption}
      {groups}
    </span>
  );

  const previousDefaultOption = React.useRef<
    undefined | CustomSelectElementDefaultOptionProps
  >(undefined);
  const serializedDefaultOption = Object.values(defaultOption).join('');
  React.useEffect(() => {
    if (
      /* Auto scroll down the option if: */
      // The list is open
      isOpen &&
      // And DOM is rendered
      listOfOptionsRef.current !== null &&
      // And this type of picklist has auto scroll enabled
      has('autoScroll') &&
      // And list is not scrolled
      (listOfOptionsRef.current.scrollTop === 0 ||
        // Or default value has changed
        ((typeof previousDefaultOption.current !== 'undefined' ||
          defaultOption.optionName !== '0') &&
          previousDefaultOption.current?.optionName !==
            defaultOption.optionName))
    ) {
      const selectedOption = listOfOptionsRef.current.getElementsByClassName(
        'custom-select-option-selected'
      )?.[0] as undefined | HTMLElement;

      if (typeof selectedOption !== 'undefined') {
        // The current line and half a line before it should be visible
        const minGoodOffsetTop = Math.max(
          0,
          selectedOption.offsetTop +
            selectedOption.offsetHeight -
            listOfOptionsRef.current.offsetHeight
        );
        const maxGoodOffsetTop =
          selectedOption.offsetTop -
          selectedOption.offsetHeight -
          listOfOptionsRef.current.offsetTop;

        // Change scrollTop only if current option is not visible
        if (
          minGoodOffsetTop > listOfOptionsRef.current.scrollTop ||
          listOfOptionsRef.current.scrollTop > maxGoodOffsetTop
        )
          /*
           * Make selected option appear at the middle of the list, if possible
           */
          listOfOptionsRef.current.scrollTop =
            minGoodOffsetTop === 0
              ? 0
              : Math.floor(
                  minGoodOffsetTop + (maxGoodOffsetTop - minGoodOffsetTop) / 2
                );
      }
    }
    if (
      Object.values(defaultOption).join('') !==
      Object.values(previousDefaultOption.current ?? {}).join('')
    )
      previousDefaultOption.current = defaultOption;
  }, [isOpen, listOfOptionsRef, serializedDefaultOption]);

  const customSelectElementRef = React.useRef<HTMLElement>(null);
  const interactive = has('interactive');
  React.useEffect(() => {
    if (isOpen && has('interactive') && !has('tabIndex'))
      customSelectElementRef.current?.focus();
  }, [isOpen, interactive]);

  return (
    <article
      className={`custom-select custom-select-${upperToKebab(
        customSelectType
      )} ${isOpen ? 'custom-select-active' : ''}`}
      title={selectLabel}
      aria-label={selectLabel}
      role={role}
      ref={customSelectElementRef}
      tabIndex={has('tabIndex') ? 0 : has('interactive') ? -1 : undefined}
      onBlur={
        has('interactive')
          ? (event): void => {
              // If newly focused element is a child, ignore onBlur event
              if (
                event.relatedTarget &&
                customSelectElementRef.current?.contains(
                  event.relatedTarget as Node
                ) === true
              )
                return;
              handleClose?.();
            }
          : undefined
      }
      onKeyDown={
        typeof customSelectOptions === 'object'
          ? (event): void => {
              if (
                document.activeElement?.classList.contains('custom-select') &&
                document.activeElement !== customSelectElementRef.current
              )
                return;

              const selectedValueIndex = inlineOptions.findIndex(
                ({ optionName }) => optionName === defaultOption?.optionName
              );
              let newIndex: number | undefined;
              let close = false;

              if (
                event.key === 'Enter' &&
                customSelectType === 'SUGGESTION_LIST' &&
                typeof inlineOptions[selectedValueIndex] === 'object'
              ) {
                close = true;
                newIndex = selectedValueIndex;
              } else if (event.key === 'Enter' || event.key === 'Escape')
                handleClose?.();
              else if (event.key === 'ArrowUp')
                if (selectedValueIndex > 0) newIndex = selectedValueIndex - 1;
                else newIndex = inlineOptions.length - 1;
              else if (event.key === 'ArrowDown')
                if (
                  selectedValueIndex !== -1 &&
                  selectedValueIndex < inlineOptions.length - 1
                )
                  newIndex = selectedValueIndex + 1;
                else newIndex = 0;

              if (typeof newIndex === 'number')
                handleClick?.(
                  close,
                  inlineOptions[newIndex]?.optionName ?? '0',
                  inlineOptions[newIndex]?.isRelationship ?? false,
                  inlineOptions[newIndex]?.tableName ?? '0'
                );
            }
          : undefined
      }
    >
      {automapperSuggestions}
      {header}
      {preview}
      {optionsShadow}
      {customSelectOptions}
    </article>
  );
}

export function SuggestionBox({
  selectOptionsData,
  onSelect: handleSelect,
  ...props
}: Partial<CustomSelectElementPropsOpen> & {
  readonly selectOptionsData: CustomSelectElementOptions;
  readonly onSelect: (selection: string) => void;
}): JSX.Element {
  const [selectedValue, setSelectedValue] = React.useState<string | undefined>(
    undefined
  );
  return (
    <CustomSelectElement
      customSelectType="SUGGESTION_LIST"
      customSelectSubtype="simple"
      customSelectOptionGroups={{
        suggestedMappings: {
          selectGroupLabel: wbText('suggestedMappings'),
          selectOptionsData:
            typeof selectedValue === 'string'
              ? Object.fromEntries(
                  Object.entries(selectOptionsData).map(([key, data]) => [
                    key,
                    { ...data, isDefault: key === selectedValue },
                  ])
                )
              : selectOptionsData,
        },
      }}
      isOpen={true}
      handleChange={(close, value): void => {
        console.log(close, value, selectedValue);
        if (close) handleSelect(value);
        else setSelectedValue(value);
      }}
      {...props}
    />
  );
}
