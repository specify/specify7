/**
 * Custom `<select>` Element (picklist)
 * Used extensively by WbPlanView
 * Has full screen reader and keyboard navigation support
 * Supports icons, unlike default `<select>` element
 *
 * @module
 */

import React from 'react';

import wbText from '../localization/workbench';
import type { IR, RA, RR } from '../types';
import { camelToKebab, upperToKebab } from '../wbplanviewhelper';
import dataModelStorage from '../wbplanviewmodel';
import {
  TableIcon,
  tableIconEmpty,
  tableIconSelected,
  tableIconUndefined,
} from './common';
import icons from './icons';

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
  | 'handleKeyboardClick'
  // Has a persistent scroll bar. Otherwise, scroll bar appears as needed
  | 'scroll'
  // Has a shadow when open
  | 'shadow'
  // Has table icon, relationship sign, unmap icon or selected field checkmark
  | 'icon'
  // Has down arrow (closed picklist preview) or left arrow (relationship)
  | 'arrow';
export type CustomSelectType =
  | 'OPENED_LIST'
  | 'CLOSED_LIST'
  | 'PREVIEW_LIST'
  | 'SUGGESTION_LIST'
  | 'SUGGESTION_LINE_LIST'
  | 'BASE_TABLE_SELECTION_LIST'
  | 'MAPPING_OPTIONS_LIST';
/* eslint-disable @typescript-eslint/naming-convention */
const customSelectTypes: RR<CustomSelectType, RA<Properties>> = {
  // Used in the mapping view
  OPENED_LIST: [
    'interactive',
    'header',
    'autoScroll',
    'groupLabels',
    'tabIndex',
    'icon',
    'arrow',
  ],
  // Used in mapping lines
  CLOSED_LIST: [
    'interactive',
    'preview',
    'unmapOption',
    'autoScroll',
    'groupLabels',
    /*
     * Scroll bar must be always present to be able to predict the width of
     * the picklist when it is closed
     */
    'scroll',
    'shadow',
    'icon',
    'arrow',
  ],
  // Used inside of mapping validation results dialog
  PREVIEW_LIST: ['preview', 'icon'],
  // Used to display a list of AutoMapper suggestions
  SUGGESTION_LIST: [
    'interactive',
    'groupLabels',
    'tabIndex',
    'handleKeyboardClick',
    'shadow',
  ],
  // Used inside a suggestion line
  SUGGESTION_LINE_LIST: ['preview', 'icon'],
  // Used for base table selection
  BASE_TABLE_SELECTION_LIST: [
    'interactive',
    'autoScroll',
    'tabIndex',
    'handleKeyboardClick',
    'icon',
  ],
  // Used for configuring mapping options for a mapping line
  MAPPING_OPTIONS_LIST: ['interactive', 'preview'],
} as const;

const customSelectClassNames: Partial<RR<CustomSelectType, string>> = {
  OPENED_LIST: '!h-full',
  BASE_TABLE_SELECTION_LIST: 'flex-1',
  MAPPING_OPTIONS_LIST: 'grid pl-2',
  CLOSED_LIST: 'grid',
  SUGGESTION_LIST: '[z-index:10] h-auto !fixed',
};
/* eslint-enable @typescript-eslint/naming-convention */

export type CustomSelectSubtype =
  // For fields and relationships
  | 'simple'
  // For reference items
  | 'toMany'
  // For tree ranks
  | 'tree';

type CustomSelectElementIconProps = {
  /*
   * Whether the option is a relationship (False for fields, true for
   * relationships, tree ranks and reference items)
   */
  readonly isRelationship?: boolean;
  // Whether the option is now selected
  // eslint-disable-next-line react/no-unused-prop-types
  readonly isDefault?: boolean;
  // The name of the table this option represents
  readonly tableName?: string;
  // The name of the option. Would be used as a label (visible to the user)
  readonly optionLabel?: string | JSX.Element;
  // The value of the title HTML attribute
  // eslint-disable-next-line react/no-unused-prop-types
  readonly title?: string;
  /*
   * True if option can be selected. False if option cannot be selected because
   * it was already selected
   */
  readonly isEnabled?: boolean;
  // Whether an icon is used inside of preview_row in CLOSED_LIST
  readonly isPreview?: boolean;
};

export type CustomSelectElementOptionProps = CustomSelectElementIconProps & {
  readonly handleClick?: (payload: { readonly isDoubleClick: boolean }) => void;
  readonly hasIcon?: boolean;
  readonly hasArrow?: boolean;
};

export type CustomSelectElementDefaultOptionProps =
  CustomSelectElementIconProps & {
    readonly optionName: string;
    readonly isRequired?: boolean;
    readonly isHidden?: boolean;
  };

type CustomSelectElementOptionGroupProps = {
  // Group's name (used for styling)
  readonly selectGroupName?: string;
  // Group's label (shown to the user)
  readonly selectGroupLabel?: string;
  readonly selectOptionsData: IR<CustomSelectElementOptionProps>;
  readonly handleClick?: (payload: {
    readonly newValue: string;
    readonly isRelationship: boolean;
    readonly newTableName: string;
    readonly isDoubleClick: boolean;
  }) => void;
  readonly hasIcon?: boolean;
  readonly hasArrow?: boolean;
};

type CustomSelectElementOptionGroups = IR<CustomSelectElementOptionGroupProps>;

type CustomSelectElementPropsBase = {
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
  readonly autoMapperSuggestions?: JSX.Element;
};

export type CustomSelectElementPropsClosed = CustomSelectElementPropsBase & {
  readonly isOpen: false;
  readonly handleOpen?: () => void;
};

export type CustomSelectElementPropsOpenBase = CustomSelectElementPropsBase & {
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
};

type CustomSelectElementPropsOpen = CustomSelectElementPropsOpenBase & {
  readonly customSelectOptionGroups: CustomSelectElementOptionGroups;
  readonly autoMapperSuggestions?: JSX.Element;
};

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
  hasIcon = true,
  hasArrow = true,
}: CustomSelectElementOptionProps): JSX.Element {
  const classes = ['p-1 flex items-center gap-x-1'];

  if (!isEnabled && !isRelationship)
    classes.push(
      'cursor-not-allowed text-gray-500 bg-[color:var(--custom-select-b1)]'
    );
  else
    classes.push(
      'hover:bg-[color:var(--custom-select-b2)]',
      'focus:bg-[color:var(--custom-select-b2)]'
    );

  if (isDefault)
    classes.push(
      'custom-select-option-selected cursor-auto bg-[color:var(--custom-select-accent)]'
    );

  const tableLabel = dataModelStorage.tables?.[tableName]?.label;

  const fullTitle = [
    title ?? (typeof optionLabel === 'string' ? optionLabel : tableLabel),
    isRelationship ? `(${wbText('relationshipInline')})` : '',
    isDefault ? `(${wbText('selected')})` : '',
  ]
    .filter((part) => part)
    .join(' ');

  return (
    // Keyboard events are handled by the parent
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
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
      {hasIcon && (
        <Icon
          optionLabel={optionLabel}
          isRelationship={isRelationship}
          isEnabled={isEnabled}
          tableName={tableName}
        />
      )}
      <span className="flex-1">
        {optionLabel === '0' ? wbText('unmap') : optionLabel}
      </span>
      {hasArrow && isRelationship ? (
        <span
          className="print:hidden w-3"
          title={tableLabel ? wbText('relationship')(tableLabel) : undefined}
          aria-label={wbText('relationship')(tableLabel ?? '')}
          role="img"
        >
          {icons.chevronRight}
        </span>
      ) : (
        <span className="print:hidden w-3" />
      )}
    </span>
  );
}

function OptionGroup({
  selectGroupName,
  selectGroupLabel,
  selectOptionsData,
  handleClick,
  hasIcon,
  hasArrow,
}: CustomSelectElementOptionGroupProps): JSX.Element {
  return (
    <section
      className={`bg-[color:var(--custom-select-b1)] flex flex-col
        custom-select-group-${camelToKebab(selectGroupName ?? '')}`}
      role="group"
      aria-label={selectGroupLabel}
    >
      {typeof selectGroupLabel !== 'undefined' && (
        <header
          aria-hidden={true}
          className="bg-[color:var(--custom-select-b2)] px-1 cursor-auto"
        >
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
              hasIcon={hasIcon}
              hasArrow={hasArrow}
            />
          );
        }
      )}
    </section>
  );
}

/**
 * All picklist options are rendered invisibly for every closed picklist to
 * ensure picklist doesn't grow in size when opened and shift all elements
 * to the right of it.
 *
 * If whitespace in <Option> is changed, the change would have to be reflected
 * here (replace pr-12 with another value).
 * I don't like this solution, but am not what is a better one. Rendering
 * a bunch of <Option> with visibility:hidden for each pick list is too expensive
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
const ShadowListOfOptions = React.memo(function ShadowListOfOptions({
  fieldNames,
}: {
  readonly fieldNames: RA<string>;
}) {
  return (
    <span
      className="print:hidden flex flex-col invisible pr-12 overflow-y-scroll border"
      aria-hidden="true"
    >
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
  autoMapperSuggestions,
  role,
}: CustomSelectElementPropsClosed | CustomSelectElementPropsOpen): JSX.Element {
  const has = React.useCallback(
    (property: Properties): boolean =>
      customSelectTypes[customSelectType].includes(property),
    [customSelectType]
  );

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
      <header
        className={`border border-brand-300 p-2 flex gap-y-2 gap-x-1
          items-center bg-brand-100`}
      >
        {has('icon') && (
          <Icon
            isDefault={true}
            isRelationship={true}
            tableName={tableName}
            optionLabel={tableName}
          />
        )}
        <span>{selectLabel}</span>
      </header>
    );
  else if (has('preview')) {
    preview = (
      // Not tabbable because keyboard events are handled separately
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/interactive-supports-focus
      <header
        className={`cursor-pointer min-h-[theme(spacing.8)]
          flex items-center gap-x-1 px-1 border border-gray-600 ${
            defaultOption?.isRequired === true
              ? 'bg-[color:var(--custom-select-required-b2)]'
              : defaultOption?.isHidden === true
              ? 'bg-[color:var(--custom-select-hidden-b2)]'
              : customSelectType === 'MAPPING_OPTIONS_LIST' &&
                defaultOption?.isRelationship === true
              ? 'bg-yellow-250'
              : 'bg-white'
          }
        ${isOpen ? '[z-index:3]' : ''}`}
        role="button"
        onClick={
          has('interactive') ? (isOpen ? handleClose : handleOpen) : undefined
        }
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {has('icon') && (
          <Icon
            isDefault={true}
            isRelationship={defaultOption.isRelationship}
            tableName={defaultOption.tableName}
            optionLabel={defaultOption.optionLabel}
            isPreview={true}
          />
        )}
        <span
          className={`flex-1 ${
            defaultOption.optionLabel === '0'
              ? 'font-extrabold text-red-600'
              : ''
          }`}
        >
          {defaultOption.optionLabel === '0'
            ? 'NOT MAPPED'
            : defaultOption.optionLabel}
        </span>
        {has('arrow') && (
          <span className="print:hidden">{icons.chevronDown}</span>
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
        hasIcon={true}
        hasArrow={true}
      />
    ) : undefined;

    const fieldNames = inlineOptions
      .map(({ optionLabel }) => optionLabel)
      .filter(
        (optionLabel): optionLabel is string => typeof optionLabel === 'string'
      );
    optionsShadow =
      !isOpen && has('scroll') && fieldNames.length > 0 ? (
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
            hasIcon={has('icon')}
            hasArrow={has('arrow')}
          />
        )
      );

  const listOfOptionsRef = React.useRef<HTMLElement>(null);
  const customSelectOptions = (Boolean(unmapOption) || groups) && (
    <span
      className={`[z-index:2] cursor-pointer h-fit
        bg-[color:var(--custom-select-b1)] border border-brand-300 flex-1
        ${has('scroll') ? 'overflow-y-scroll' : 'overflow-y-auto'}
        ${
          has('shadow')
            ? 'shadow-[0_3px_5px_-1px] max-h-[theme(spacing.64)]'
            : ''
        }
        ${customSelectType === 'SUGGESTION_LIST' ? '' : 'min-w-max'}
      `}
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
  }, [defaultOption, has]);

  const customSelectElementRef = React.useRef<HTMLElement>(null);
  const interactive = has('interactive');
  React.useEffect(() => {
    if (isOpen && has('interactive') && !has('tabIndex'))
      customSelectElementRef.current?.focus();
  }, [isOpen, interactive, has]);

  return (
    <article
      className={`h-8 relative flex flex-col
        custom-select custom-select-${upperToKebab(customSelectType)}
        ${customSelectClassNames[customSelectType] ?? ''}
      `}
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
                document.activeElement?.classList.contains('custom-select') ===
                  true &&
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
      {autoMapperSuggestions}
      {header}
      {preview}
      {optionsShadow}
      {customSelectOptions}
    </article>
  );
}

/**
 * Picklist that renders on top of currently opened picklist and displays
 * top 3 autoMapper suggestions (if available)
 */
export function SuggestionBox({
  selectOptionsData,
  onSelect: handleSelect,
  ...props
}: Partial<CustomSelectElementPropsOpen> & {
  readonly selectOptionsData: IR<CustomSelectElementOptionProps>;
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
          hasIcon: false,
          hasArrow: false,
        },
      }}
      isOpen={true}
      handleChange={({ newValue }): void => handleSelect(newValue)}
      {...props}
    />
  );
}
