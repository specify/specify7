/**
 * Custom `<select>` Element (picklist)
 * Used extensively by WbPlanView
 * Has full screen reader and keyboard navigation support
 * Supports icons, unlike default `<select>` element
 *
 * @module
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useId } from '../../hooks/useId';
import { useValidation } from '../../hooks/useValidation';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { wbPlanText } from '../../localization/wbPlan';
import type { IR, RA, RR } from '../../utils/types';
import { filterArray, localized } from '../../utils/types';
import { camelToKebab, upperToKebab } from '../../utils/utils';
import { iconClassName, icons } from '../Atoms/Icons';
import { getTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import {
  TableIcon,
  tableIconEmpty,
  tableIconSelected,
  tableIconUndefined,
} from '../Molecules/TableIcon';
import { titlePosition } from '../Molecules/Tooltips';
import { scrollIntoView } from '../TreeView/helpers';
import { emptyMapping } from './mappingHelpers';

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
  // Has tabIndex of 0
  | 'tabIndex'
  /*
   * Handle keyboard navigation click locally instead of emitting
   * handleClick(close: false, value, ...), unless pressed Enter
   */
  | 'handleKeyboardClick'
  /*
   * Has a persistent scroll bar. Otherwise, scroll bar appears as needed.
   * For picklists that must maintain same width when open or closed,
   * scroll bar must be always present to help predict the width of an open
   * picklist from the closed state.
   */
  | 'scroll'
  // Has a shadow when open
  | 'shadow'
  // Has table icon, relationship sign, unmap icon or selected field checkmark
  | 'icon'
  // Has down arrow (closed picklist preview) or left arrow (relationship)
  | 'arrow';
export type CustomSelectType =
  | 'CLOSED_LIST'
  | 'OPENED_LIST'
  | 'OPTIONS_LIST'
  | 'PREVIEW_LIST'
  | 'SIMPLE_LIST'
  | 'SUGGESTION_LIST';
/* eslint-disable @typescript-eslint/naming-convention */
export const customSelectTypes: RR<CustomSelectType, RA<Properties>> = {
  // Used in Map Explorer
  OPENED_LIST: [
    'interactive',
    'header',
    'autoScroll',
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
    'scroll',
    'shadow',
    'icon',
    'arrow',
  ],
  /*
   * Like CLOSED_LIST but meant for usage outside the WorkBench mapper
   * Needed to fix https://github.com/specify/specify7/issues/2729
   */
  SIMPLE_LIST: [
    'interactive',
    'preview',
    'unmapOption',
    'autoScroll',
    'scroll',
    'shadow',
    'icon',
    'arrow',
  ],
  /*
   * Like CLOSED_LIST, but not interactive
   * Used for displaying validation results and inside of a SUGGESTION_LIST
   */
  PREVIEW_LIST: ['preview', 'icon'],
  // Used to display a list of AutoMapper suggestions
  SUGGESTION_LIST: ['interactive', 'tabIndex', 'handleKeyboardClick', 'shadow'],
  /*
   * Used for configuring mapping options for a mapping line or filter options
   * for a query line
   */
  OPTIONS_LIST: ['interactive', 'preview', 'shadow', 'scroll'],
} as const;

const customSelectClassNames: Partial<RR<CustomSelectType, string>> = {
  OPENED_LIST: '!h-full',
  OPTIONS_LIST: 'grid',
  CLOSED_LIST: 'grid',
  SIMPLE_LIST: 'grid',
  SUGGESTION_LIST: 'z-[10] h-auto !fixed',
};
/* eslint-enable @typescript-eslint/naming-convention */

export type CustomSelectSubtype =
  // For fields and relationships
  | 'simple'
  // For -to-many indexes
  | 'toMany'
  // For tree ranks
  | 'tree';

type CustomSelectElementIconProps = {
  /*
   * Whether the option is a relationship
   * False for fields
   * True for relationships, tree ranks and -to-many indexes)
   */
  readonly isRelationship?: boolean;
  // Whether the option is now selected

  readonly isDefault?: boolean;
  // The name of the table this option represents
  readonly tableName?: keyof Tables;
  // The name of the option. Would be used as a label (visible to the user)
  readonly optionLabel?: JSX.Element | string;
  // The value of the title HTML attribute

  readonly title?: LocalizedString;
  /*
   * True if option can be selected. False if option cannot be selected because
   * it was already selected
   */
  readonly isEnabled?: boolean;
  // Whether an icon is used inside of preview_row in CLOSED_LIST
  readonly isPreview?: boolean;
};

export type CustomSelectElementOptionProps = CustomSelectElementIconProps & {
  readonly onClick?: (payload: { readonly isDoubleClick: boolean }) => void;
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
  readonly selectGroupLabel?: LocalizedString;
  readonly selectOptionsData: IR<CustomSelectElementOptionProps>;
  readonly onClick?: (payload: {
    readonly newValue: string;
    readonly isRelationship: boolean;
    readonly newTableName: keyof Tables | undefined;
    readonly isDoubleClick: boolean;
  }) => void;
  readonly hasIcon?: boolean;
  readonly hasArrow?: boolean;
};

type ChangeEvent = {
  readonly newValue: string;
  readonly isRelationship: boolean;
  readonly currentTableName: keyof Tables | undefined;
  readonly newTableName: keyof Tables | undefined;
  readonly isDoubleClick: boolean;
};

type CustomSelectElementPropsBase = {
  // The label to use for the element
  readonly selectLabel?: LocalizedString;
  readonly customSelectType: CustomSelectType;
  readonly customSelectSubtype?: CustomSelectSubtype;
  readonly isOpen: boolean;
  readonly tableName?: keyof Tables;
  readonly role?: string;
  readonly previewOption?: CustomSelectElementDefaultOptionProps;

  readonly validation?: string;

  readonly onOpen?: () => void;

  readonly onChange?: (event: ChangeEvent) => void;
  readonly onClose?: () => void;
  readonly customSelectOptionGroups?: IR<CustomSelectElementOptionGroupProps>;
  readonly autoMapperSuggestions?: JSX.Element;
};

export type CustomSelectElementPropsClosed = CustomSelectElementPropsBase & {
  readonly isOpen: false;
  readonly onOpen?: () => void;
};

export type CustomSelectElementPropsOpenBase = CustomSelectElementPropsBase & {
  readonly isOpen: true;
  readonly onChange?: (payload: {
    readonly newValue: string;
    readonly isRelationship: boolean;
    readonly currentTableName: keyof Tables | undefined;
    readonly newTableName: keyof Tables | undefined;
    readonly isDoubleClick: boolean;
  }) => void;
  readonly onClose?: () => void;
};

type CustomSelectElementPropsOpen = CustomSelectElementPropsOpenBase & {
  readonly customSelectOptionGroups: IR<CustomSelectElementOptionGroupProps>;
  readonly autoMapperSuggestions?: JSX.Element;
};

export function Icon({
  isRelationship = false,
  isPreview = false,
  isEnabled = true,
  tableName = undefined,
  optionLabel = emptyMapping,
}: CustomSelectElementIconProps): JSX.Element {
  if (optionLabel === emptyMapping) return tableIconUndefined;
  else if (!isRelationship && (isPreview || !isEnabled))
    return tableIconSelected;
  else if (!isRelationship || tableName === undefined) return tableIconEmpty;
  else return <TableIcon label name={tableName} />;
}

function Option({
  optionLabel,
  title,
  isEnabled = true,
  isRelationship = false,
  isDefault = false,
  tableName = undefined,
  onClick: handleClick,
  hasIcon = true,
  hasArrow = true,
}: CustomSelectElementOptionProps): JSX.Element {
  const classes = ['p-1 flex items-center gap-1'];

  if ((!isEnabled || isDefault) && !isRelationship)
    classes.push(
      '!cursor-not-allowed dark:text-white',
      'bg-[color:var(--custom-select-b1)]'
    );
  else
    classes.push(
      'hover:bg-[color:var(--custom-select-b2)]',
      'focus:bg-[color:var(--custom-select-b2)]'
    );

  if (isDefault)
    classes.push(
      'custom-select-option-selected cursor-auto dark:text-white',
      '!bg-[color:var(--custom-select-accent)]'
    );

  const tableLabel = getTable(tableName ?? '')?.label;

  const fullTitle = filterArray([
    title ?? (typeof optionLabel === 'string' ? optionLabel : tableLabel),
    isRelationship ? `(${formsText.relationship()})` : '',
    isDefault ? `(${commonText.selected()})` : '',
  ]).join(' ');

  return (
    // Keyboard events are handled by the parent
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <li
      aria-atomic="true"
      aria-current={isDefault ? 'location' : undefined}
      aria-disabled={!isEnabled || isDefault}
      aria-label={fullTitle}
      aria-selected={isDefault}
      className={classes.join(' ')}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
      role="option"
      tabIndex={-1}
      onClick={
        typeof handleClick === 'function'
          ? (event): void => handleClick({ isDoubleClick: event.detail > 1 })
          : undefined
      }
    >
      {hasIcon && (
        <Icon
          isDefault={isDefault}
          isEnabled={isEnabled}
          isRelationship={isRelationship}
          optionLabel={optionLabel}
          tableName={tableName}
        />
      )}
      <span className="flex-1">
        {optionLabel === emptyMapping ? wbPlanText.unmap() : optionLabel}
      </span>
      {hasArrow &&
        (isRelationship ? (
          <span
            aria-label={wbPlanText.relationshipWithTable({
              tableName: tableLabel ?? '',
            })}
            className="print:hidden"
            role="img"
            title={
              typeof tableLabel === 'string'
                ? wbPlanText.relationshipWithTable({ tableName: tableLabel })
                : undefined
            }
            {...{ [titlePosition]: 'right' }}
          >
            {icons.chevronRight}
          </span>
        ) : (
          <span className={`print:hidden ${iconClassName}`} />
        ))}
    </li>
  );
}

function OptionGroup({
  selectGroupName = '',
  selectGroupLabel,
  selectOptionsData,
  onClick: handleClick,
  hasIcon,
  hasArrow,
}: CustomSelectElementOptionGroupProps): JSX.Element {
  return (
    <section
      className={`
        flex flex-col bg-[color:var(--custom-select-b1)]
        custom-select-group-${camelToKebab(selectGroupName)}
      `}
      role="group"
    >
      {typeof selectGroupLabel === 'string' && (
        <header
          aria-hidden
          className="cursor-auto bg-[color:var(--custom-select-b2)] px-1"
        >
          {selectGroupLabel}
        </header>
      )}
      {Object.entries(selectOptionsData).map(
        ([optionName, selectionOptionData]) => (
          <Option
            key={optionName}
            onClick={({ isDoubleClick }): void =>
              typeof handleClick === 'function' &&
              (isDoubleClick ||
                (selectionOptionData.isEnabled !== false &&
                  selectionOptionData.isDefault !== true))
                ? handleClick({
                    newValue: optionName,
                    isRelationship: selectionOptionData.isRelationship ?? false,
                    newTableName: selectionOptionData.tableName,
                    isDoubleClick,
                  })
                : undefined
            }
            {...selectionOptionData}
            hasArrow={hasArrow}
            hasIcon={hasIcon}
          />
        )
      )}
    </section>
  );
}

/**
 * All picklist options are rendered invisibly for every closed picklist to
 * ensure opening picklist doesn't change their width and it turn cause a
 * layout shift.
 *
 * If whitespace in <Option> is changed, the change would have to be reflected
 * here (replace pr-[3.75rem] with another value).
 * I don't like this solution, but am not sure what is a better one. Rendering
 * a bunch of <Option> with visibility:hidden for each pick list is too expensive
 */
function ShadowListOfOptions({
  fieldNames,
  hasIcon,
  hasArrow,
}: {
  readonly fieldNames: RA<string>;
  readonly hasIcon: boolean;
  readonly hasArrow: boolean;
}): JSX.Element {
  const gap = 0.25;
  const paddingRight =
    gap * 2 + (hasIcon ? gap + 1.25 : 0) + (hasArrow ? gap + 1.5 : 0);
  return (
    <span
      aria-hidden="true"
      className={`
        invisible -mt-2 flex flex-col overflow-y-scroll border
        print:hidden
      `}
      style={{ paddingRight: `${paddingRight}rem` }}
    >
      {fieldNames.map((fieldName, index) => (
        <span key={index}>{fieldName}</span>
      ))}
    </span>
  );
}

const defaultDefaultOption = {
  optionName: emptyMapping,
  optionLabel: emptyMapping,
  tableName: undefined,
  isRelationship: false,
  isRequired: false,
  isHidden: false,
};

export const customSelectElementBackground = 'bg-white dark:bg-neutral-600';

/**
 * An alternative to <select>. Used since we need to embed table icons in
 * items. Needed until <selectmenu> is supported by all browsers.
 */
export function CustomSelectElement({
  customSelectType,
  customSelectSubtype = 'simple',
  customSelectOptionGroups: initialSelectOptionGroups,
  selectLabel = localized(''),
  isOpen,
  tableName,
  onChange: handleChangeRaw,
  onOpen: handleOpen,
  onClose: handleClose,
  previewOption,
  autoMapperSuggestions,
  validation,
}: CustomSelectElementPropsClosed | CustomSelectElementPropsOpen): JSX.Element {
  const has = React.useCallback(
    (property: Properties): boolean =>
      customSelectTypes[customSelectType].includes(property),
    [customSelectType]
  );
  const handleChange =
    has('interactive') && typeof handleChangeRaw === 'function'
      ? (props: Omit<ChangeEvent, 'currentTableName'>): void =>
          handleChangeRaw({
            currentTableName: defaultOption.tableName,
            ...props,
          })
      : undefined;

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
    defaultOption.optionName !== emptyMapping;

  if (showUnmapOption) inlineOptions = [defaultDefaultOption, ...inlineOptions];

  const id = useId('listbox');
  const { validationRef } = useValidation(validation);

  let header: JSX.Element | undefined;
  let preview: JSX.Element | undefined;
  let unmapOption: JSX.Element | undefined;
  let optionsShadow: JSX.Element | undefined;
  if (has('header') && selectLabel)
    header = (
      <header
        className={`
          border-brand-300 bg-brand-100 dark:bg-brand-500 flex items-center gap-x-1 gap-y-2 rounded rounded-b-none border p-2
        `}
      >
        {has('icon') && (
          <Icon
            isDefault
            isRelationship
            optionLabel={tableName}
            tableName={tableName}
          />
        )}
        <span>{selectLabel}</span>
      </header>
    );
  else if (has('preview')) {
    const handleClick = has('interactive')
      ? isOpen
        ? handleClose
        : handleOpen
      : undefined;
    preview = (
      // Not tabbable because keyboard events are handled separately
      <button
        aria-controls={id('options')}
        aria-describedby={id('validation')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`
          flex min-h-[theme(spacing.8)] min-w-max cursor-pointer
          items-center gap-1 rounded px-1 text-left
          md:min-w-[unset] dark:border-none
          ${
            defaultOption?.isRequired === true
              ? 'custom-select-input-required bg-[color:var(--custom-select-b2)]'
              : defaultOption?.isHidden === true
              ? `custom-select-input-hidden bg-[color:var(--custom-select-b2)]
                dark:!border-solid`
              : customSelectType === 'OPTIONS_LIST' &&
                defaultOption?.isRelationship === true
              ? 'bg-yellow-250 dark:bg-yellow-900'
              : customSelectElementBackground
          }
          ${isOpen ? 'z-[3] rounded-b-none' : ''}
          ${handleClick === undefined ? '' : 'border border-gray-500'}
        `}
        disabled={handleClick === undefined}
        type="button"
        onClick={handleClick}
      >
        {has('icon') && (
          <Icon
            isDefault
            isPreview
            isRelationship={defaultOption.isRelationship}
            optionLabel={defaultOption.optionLabel}
            tableName={defaultOption.tableName}
          />
        )}
        <span
          className={`
            flex-1
            ${
              defaultOption.optionLabel === emptyMapping &&
              customSelectType !== 'SIMPLE_LIST'
                ? 'font-extrabold text-red-600'
                : ''
            }
          `}
        >
          {defaultOption.optionLabel === emptyMapping
            ? wbPlanText.notSelected()
            : defaultOption.optionLabel}
        </span>
        {has('arrow') && (
          <span className="print:hidden">{icons.chevronDown}</span>
        )}
      </button>
    );

    unmapOption = showUnmapOption ? (
      <Option
        hasArrow
        hasIcon
        isDefault={defaultOption.optionLabel === emptyMapping}
        optionLabel={emptyMapping}
        onClick={(): void => {
          handleChange?.({
            newValue: emptyMapping,
            isRelationship: false,
            newTableName: undefined,
            isDoubleClick: false,
          });
          handleClose?.();
        }}
      />
    ) : undefined;

    const fieldNames = inlineOptions
      .map(({ optionLabel }) =>
        optionLabel === emptyMapping ? wbPlanText.notSelected() : optionLabel
      )
      .filter((option): option is string => typeof option === 'string');
    optionsShadow =
      !isOpen && has('scroll') && fieldNames.length > 0 ? (
        <ShadowListOfOptions
          fieldNames={fieldNames}
          hasArrow={has('arrow')}
          hasIcon={has('icon')}
        />
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
            selectGroupName={selectGroupName}
            onClick={
              typeof handleChange === 'function'
                ? (payload): void => {
                    handleChange(payload);
                    handleClose?.();
                  }
                : undefined
            }
            {...selectGroupData}
            hasArrow={has('arrow')}
            hasIcon={has('icon')}
            selectGroupLabel={
              customSelectSubtype === 'simple' ? selectGroupLabel : undefined
            }
          />
        )
      );

  const listOfOptionsRef = React.useRef<HTMLDivElement>(null);
  const customSelectOptions = (Boolean(unmapOption) || groups) && (
    <div
      aria-label={selectLabel}
      aria-orientation="vertical"
      aria-readonly={!has('interactive') || typeof handleChange !== 'function'}
      className={`
        border-brand-300 h-fit flex-1 cursor-pointer
        overflow-x-hidden rounded-b border bg-[color:var(--custom-select-b1)]
        ${has('preview') ? 'z-[2]' : ''}
        ${has('scroll') ? 'overflow-y-scroll' : 'overflow-y-auto'}
        ${has('shadow') ? 'max-h-[theme(spacing.64)] shadow-md' : ''}
        ${customSelectType === 'SUGGESTION_LIST' ? '' : 'min-w-max'}
      `}
      id={id('options')}
      ref={listOfOptionsRef}
      role="listbox"
      tabIndex={-1}
    >
      {unmapOption}
      {groups}
    </div>
  );

  const previousDefaultOption = React.useRef<
    CustomSelectElementDefaultOptionProps | undefined
  >(undefined);
  React.useEffect(() => {
    const optionChanged =
      Object.values(defaultOption).join('') !==
      Object.values(previousDefaultOption.current ?? {}).join('');
    if (
      optionChanged &&
      /* Auto scroll the list to selected option if: */
      // List is open
      listOfOptionsRef.current !== null &&
      // And this type of picklist has auto scroll enabled
      has('autoScroll')
    ) {
      const selectedOption = listOfOptionsRef.current.getElementsByClassName(
        'custom-select-option-selected'
      )?.[0] as HTMLElement | undefined;

      if (typeof selectedOption === 'object')
        scrollIntoView(selectedOption, 'nearest');
      previousDefaultOption.current = defaultOption;
    }
  }, [defaultOption, has]);

  const customSelectElementRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    if (isOpen && has('interactive') && !has('tabIndex'))
      customSelectElementRef.current?.focus();
  }, [isOpen, has]);

  return (
    <article
      aria-live={has('interactive') ? 'polite' : 'off'}
      className={`
        custom-select relative flex h-8 flex-col
        custom-select-${upperToKebab(customSelectType)}
        ${customSelectClassNames[customSelectType] ?? ''}
      `}
      ref={customSelectElementRef}
      tabIndex={has('tabIndex') ? 0 : has('interactive') ? -1 : undefined}
      title={selectLabel}
      {...{ [titlePosition]: 'top' }}
      onBlur={
        has('interactive')
          ? (event): void => {
              if (
                // If newly focused element is a child, ignore onBlur event
                (event.relatedTarget &&
                  customSelectElementRef.current?.contains(
                    event.relatedTarget as Node
                  ) === true) ||
                // If in development, don't close on outside click
                process.env.NODE_ENV === 'development'
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
                event.preventDefault();
                const newValue =
                  inlineOptions[newIndex]?.optionName ?? emptyMapping;
                if (!close && has('handleKeyboardClick'))
                  setSelectedValue(newValue);
                else {
                  handleChange?.({
                    newValue,
                    isRelationship:
                      inlineOptions[newIndex]?.isRelationship ?? false,
                    newTableName: inlineOptions[newIndex]?.tableName,
                    isDoubleClick: false,
                  });
                  if (close) handleClose?.();
                }
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
      {
        /*
         * A very hacky way to display validation messages for custom list-boxes
         * Not sure if there is a simpler way that is at least this good until
         * <selectmenu> is wildly supported.
         */
        (validation ?? '').length > 0 && (
          <div
            // Place the browser's tooltip at bottom center
            className="sr-only bottom-0 top-[unset] flex w-full justify-center"
          >
            <input
              // Associate validation message with the listbox
              id={id('validation')}
              defaultValue={validation}
              // Announce validation message to screen readers
              aria-live="polite"
              // Act as an error message, not an input
              role="alert"
              /*
               * Set a validation message for input (using useValidation).
               * It will be displayed by browsers on form submission
               */
              ref={validationRef}
              type="text"
              // Don't show the input
              className="sr-only"
            />
          </div>
        )
      }
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
      customSelectOptionGroups={{
        suggestedMappings: {
          selectGroupLabel: wbPlanText.suggestedMappings(),
          selectOptionsData,
          hasIcon: false,
          hasArrow: false,
        },
      }}
      customSelectSubtype="simple"
      customSelectType="SUGGESTION_LIST"
      isOpen
      onChange={({ newValue }): void => handleSelect(newValue)}
      {...props}
    />
  );
}
