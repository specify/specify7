/*
 * Custom Select Element (picklist). Used by workbench mapper
 */

import '../../css/customselectelement.css';

import React from 'react';

import wbText from '../localization/workbench';
import { camelToKebab, upperToKebab } from '../wbplanviewhelper';
import dataModelStorage from '../wbplanviewmodel';
import {
  TableIcon,
  tableIconEmpty,
  tableIconSelected,
  tableIconUndefined,
} from './common';
import type { IR, R, RA } from '../types';

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
  | 'tabIndex'
  /*
   * Handle keyboard navigation click locally instead of emitting
   * handleClick(close: false, value, ...), unless pressed Enter
   */
  | 'handleKeyboardClick';
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
  SUGGESTION_LIST: [
    'interactive',
    'groupLabels',
    'tabIndex',
    'handleKeyboardClick',
  ],
  // Used for base table selection
  BASE_TABLE_SELECTION_LIST: [
    'interactive',
    'autoScroll',
    'tabIndex',
    'handleKeyboardClick',
  ],
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
  readonly handleClick?: (payload: { readonly isDoubleClick: boolean }) => void;
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
  readonly handleClick?: (payload: {
    readonly newValue: string;
    readonly isRelationship: boolean;
    readonly newTableName: string;
    readonly isDoubleClick: boolean;
  }) => void;
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

  readonly handleChange?: (payload: {
    readonly close: boolean;
    readonly newValue: string;
    readonly isRelationship: boolean;
    readonly currentTableName: string;
    readonly newTableName: string;
    readonly isDoubleClick: boolean;
  }) => void;
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
  readonly handleChange?: (payload: {
    readonly close: boolean;
    readonly newValue: string;
    readonly isRelationship: boolean;
    readonly currentTableName: string;
    readonly newTableName: string;
    readonly isDoubleClick: boolean;
  }) => void;
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
  if (optionLabel === '0') return tableIconUndefined;
  if (!isRelationship && (isPreview || !isEnabled)) return tableIconSelected;
  else if (!isRelationship || tableName === '') return tableIconEmpty;
  else return <TableIcon tableName={tableName} />;
}

function Option({
  optionLabel,
  title,
  isEnabled = true,
  isRelationship = false,
  isDefault = false,
  tableName = '',
  handleClick,
}: CustomSelectElementOptionProps): JSX.Element {
  const classes = ['custom-select-option'];

  if (!isEnabled && !isRelationship)
    // Don't disable relationships
    classes.push('custom-select-option-disabled');

  if (isRelationship) classes.push('custom-select-option-relationship');

  if (isDefault) classes.push('custom-select-option-selected');

  const fullTitle = [
    title ?? optionLabel,
    isRelationship ? `(${wbText('relationshipInline')})` : '',
    isDefault ? `(${wbText('selected')})` : '',
  ]
    .filter((part) => part)
    .join(' ');

  const tableLabel = dataModelStorage.tables?.[tableName]?.label;

  return (
    <span
      className={classes.join(' ')}
      title={fullTitle === optionLabel ? tableLabel : fullTitle}
      aria-label={fullTitle}
      tabIndex={-1}
      onClick={
        typeof handleClick === 'function'
          ? (event): void => handleClick({ isDoubleClick: event.detail > 1 })
          : undefined
      }
      aria-selected={isDefault}
      role="option"
      aria-disabled={!isEnabled}
      aria-current={!isEnabled}
      aria-atomic="true"
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
          aria-label={wbText('relationship')(tableLabel ?? '')}
          role="img"
        >
          ▶
        </span>
      )}
    </span>
  );
}

function OptionGroup({
  selectGroupName,
  selectGroupLabel,
  selectOptionsData,
  handleClick,
}: CustomSelectElementOptionGroupProps): JSX.Element {
  return (
    <section
      className={`custom-select-group custom-select-group-${camelToKebab(
        selectGroupName ?? ''
      )}`}
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
              handleClick={({ isDoubleClick }): void =>
                typeof handleClick === 'function' &&
                (isDoubleClick || selectionOptionData.isEnabled !== false)
                  ? handleClick({
                      newValue: optionName,
                      isRelationship:
                        selectionOptionData.isRelationship ?? false,
                      newTableName: selectionOptionData.tableName ?? '',
                      isDoubleClick,
                    })
                  : undefined
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
  customSelectOptionGroups: initialSelectOptionGroups,
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

  // Used to store internal state if handleKeyboardClick is set
  const [selectedValue, setSelectedValue] = React.useState<string | undefined>(
    undefined
  );
  const customSelectOptionGroups =
    typeof selectedValue === 'string'
      ? Object.fromEntries(
          Object.entries(initialSelectOptionGroups ?? {}).map(
            ([groupName, { selectOptionsData, ...groupData }]) => [
              groupName,
              {
                ...groupData,
                selectOptionsData: Object.fromEntries(
                  Object.entries(selectOptionsData).map(([key, data]) => [
                    key,
                    { ...data, isDefault: key === selectedValue },
                  ])
                ),
              },
            ]
          )
        )
      : initialSelectOptionGroups;

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
    ? ({
        isDoubleClick,
        close,
        newValue,
        ...rest
      }: {
        readonly close: boolean;
        readonly newValue: string;
        readonly isRelationship: boolean;
        readonly newTableName: string;
        readonly isDoubleClick: boolean;
      }): void =>
        isDoubleClick || close || newValue !== defaultOption.optionName
          ? handleChange?.({
              currentTableName: defaultOption.tableName ?? '',
              newValue,
              isDoubleClick,
              close,
              ...rest,
            })
          : undefined
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
        handleClick={(): void =>
          handleClick?.({
            close: true,
            newValue: '0',
            isRelationship: false,
            newTableName: '0',
            isDoubleClick: false,
          })
        }
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
            handleClick={
              typeof handleClick === 'function'
                ? (payload): void => handleClick({ close: true, ...payload })
                : undefined
            }
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
      aria-label={selectLabel}
    >
      {unmapOption}
      {groups}
    </span>
  );

  const previousDefaultOption = React.useRef<
    undefined | CustomSelectElementDefaultOptionProps
  >(undefined);
  React.useEffect(() => {
    if (
      /* Auto scroll the list to selected option if: */
      // List is open
      listOfOptionsRef.current !== null &&
      // And this type of picklist has auto scroll enabled
      has('autoScroll') &&
      // And default value has changed
      previousDefaultOption.current?.optionName !== defaultOption.optionName
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
  }, [listOfOptionsRef.current, defaultOption.optionName]);

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
      role={role}
      ref={customSelectElementRef}
      aria-live={has('interactive') ? 'polite' : 'off'}
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
                has('handleKeyboardClick') &&
                typeof inlineOptions[selectedValueIndex] === 'object'
              ) {
                close = true;
                newIndex = selectedValueIndex;
              } else if (event.key === 'Enter' || event.key === 'Escape')
                handleClose?.();
              else if (event.key === 'ArrowUp')
                newIndex =
                  selectedValueIndex > 0
                    ? selectedValueIndex - 1
                    : inlineOptions.length - 1;
              else if (event.key === 'ArrowDown')
                newIndex =
                  selectedValueIndex !== -1 &&
                  selectedValueIndex < inlineOptions.length - 1
                    ? selectedValueIndex + 1
                    : 0;

              if (typeof newIndex === 'number') {
                const newValue = inlineOptions[newIndex]?.optionName ?? '0';
                if (!close && has('handleKeyboardClick'))
                  setSelectedValue(newValue);
                else
                  handleClick?.({
                    close,
                    newValue,
                    isRelationship:
                      inlineOptions[newIndex]?.isRelationship ?? false,
                    newTableName: inlineOptions[newIndex]?.tableName ?? '0',
                    isDoubleClick: false,
                  });
              }
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
  return (
    <CustomSelectElement
      customSelectType="SUGGESTION_LIST"
      customSelectSubtype="simple"
      customSelectOptionGroups={{
        suggestedMappings: {
          selectGroupLabel: wbText('suggestedMappings'),
          selectOptionsData,
        },
      }}
      isOpen={true}
      handleChange={({ newValue }): void => handleSelect(newValue)}
      {...props}
    />
  );
}
