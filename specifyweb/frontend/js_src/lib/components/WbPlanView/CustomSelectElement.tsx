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

import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { wbPlanText } from '../../localization/wbPlan';
import type { IR, RA, RR } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { camelToKebab, upperToKebab } from '../../utils/utils';
import { iconClassName, icons } from '../Atoms/Icons';
import { getModel } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';
import {
  TableIcon,
  tableIconEmpty,
  tableIconSelected,
  tableIconUndefined,
} from '../Molecules/TableIcon';
import { titlePosition } from '../Molecules/Tooltips';
import { scrollIntoView } from '../TreeView/helpers';

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
  | 'BASE_TABLE_SELECTION_LIST'
  | 'CLOSED_LIST'
  | 'OPENED_LIST'
  | 'OPTIONS_LIST'
  | 'PREVIEW_LIST'
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
   * Like CLOSED_LIST, but not interactive
   * Used for displaying validation results and inside of a SUGGESTION_LIST
   */
  PREVIEW_LIST: ['preview', 'icon'],
  // Used to display a list of AutoMapper suggestions
  SUGGESTION_LIST: ['interactive', 'tabIndex', 'handleKeyboardClick', 'shadow'],
  // Used for base table selection in mapping view, schema config, et. al.
  BASE_TABLE_SELECTION_LIST: [
    'interactive',
    'autoScroll',
    'tabIndex',
    'handleKeyboardClick',
    'icon',
  ],
  /*
   * Used for configuring mapping options for a mapping line or filter options
   * for a query line
   */
  OPTIONS_LIST: ['interactive', 'preview', 'shadow', 'scroll'],
} as const;

const customSelectClassNames: Partial<RR<CustomSelectType, string>> = {
  OPENED_LIST: '!h-full',
  BASE_TABLE_SELECTION_LIST: 'flex-1',
  OPTIONS_LIST: 'grid',
  CLOSED_LIST: 'grid',
  SUGGESTION_LIST: '[z-index:10] h-auto !fixed',
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

type CustomSelectElementPropsBase = {
  // The label to use for the element
  readonly selectLabel?: LocalizedString;
  readonly customSelectType: CustomSelectType;
  readonly customSelectSubtype?: CustomSelectSubtype;
  readonly isOpen: boolean;
  readonly tableName?: keyof Tables;
  readonly role?: string;
  readonly previewOption?: CustomSelectElementDefaultOptionProps;

  readonly onOpen?: () => void;

  readonly onChange?: (payload: {
    readonly close: boolean;
    readonly newValue: string;
    readonly isRelationship: boolean;
    readonly currentTableName: keyof Tables | undefined;
    readonly newTableName: keyof Tables | undefined;
    readonly isDoubleClick: boolean;
  }) => void;
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
    readonly close: boolean;
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
  optionLabel = '0',
}: CustomSelectElementIconProps): JSX.Element {
  if (optionLabel === '0') return tableIconUndefined;
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
      '!cursor-not-allowed text-gray-500',
      'bg-[color:var(--custom-select-b1)]'
    );
  else
    classes.push(
      'hover:bg-[color:var(--custom-select-b2)]',
      'focus:bg-[color:var(--custom-select-b2)]'
    );

  if (isDefault)
    classes.push(
      'custom-select-option-selected cursor-auto',
      'bg-[color:var(--custom-select-accent)]'
    );

  const tableLabel = getModel(tableName ?? '')?.label;

  const fullTitle = filterArray([
    title ?? (typeof optionLabel === 'string' ? optionLabel : tableLabel),
    isRelationship ? `(${formsText.relationship()})` : '',
    isDefault ? `(${commonText.selected()})` : '',
  ]).join(' ');

  return (
    // Keyboard events are handled by the parent
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <span
      aria-atomic="true"
      aria-current={isDefault ? 'location' : undefined}
      aria-disabled={!isEnabled || isDefault}
      aria-label={fullTitle}
      aria-selected={isDefault}
      className={classes.join(' ')}
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
        {optionLabel === '0' ? wbPlanText.unmap() : optionLabel}
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
    </span>
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
  optionName: '0',
  optionLabel: '0',
  tableName: undefined,
  isRelationship: false,
  isRequired: false,
  isHidden: false,
};

export const customSelectElementBackground = 'bg-white dark:bg-neutral-600';

export function CustomSelectElement({
  customSelectType,
  customSelectSubtype = 'simple',
  customSelectOptionGroups: initialSelectOptionGroups,
  selectLabel = '',
  isOpen,
  tableName,
  onChange: handleChange,
  onOpen: handleOpen,
  onClose: handleClose,
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

  if (showUnmapOption && typeof defaultDefaultOption === 'string')
    inlineOptions = [defaultDefaultOption, ...inlineOptions];

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
        readonly newTableName: keyof Tables | undefined;
        readonly isDoubleClick: boolean;
      }): void =>
        isDoubleClick || close || newValue !== defaultOption.optionName
          ? handleChange?.({
              currentTableName: defaultOption.tableName,
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
        className={`
          flex items-center gap-y-2 gap-x-1 rounded rounded-b-none
          border border-brand-300 bg-brand-100 p-2 dark:bg-brand-500
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
    preview = (
      // Not tabbable because keyboard events are handled separately
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/interactive-supports-focus
      <header
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`
          flex min-h-[theme(spacing.8)] min-w-max
          cursor-pointer items-center gap-1 rounded border border-gray-500 px-1 dark:border-none md:min-w-[unset]
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
          ${isOpen ? 'rounded-b-none [z-index:3]' : ''}
        `}
        role="button"
        onClick={
          has('interactive') ? (isOpen ? handleClose : handleOpen) : undefined
        }
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
            flex-1 ${
              defaultOption.optionLabel === '0'
                ? 'font-extrabold text-red-600'
                : ''
            }
          `}
        >
          {defaultOption.optionLabel === '0'
            ? wbPlanText.notMapped()
            : defaultOption.optionLabel}
        </span>
        {has('arrow') && (
          <span className="print:hidden">{icons.chevronDown}</span>
        )}
      </header>
    );

    unmapOption = showUnmapOption ? (
      <Option
        hasArrow
        hasIcon
        isDefault={defaultOption.optionLabel === '0'}
        optionLabel="0"
        onClick={(): void =>
          handleClick?.({
            close: true,
            newValue: '0',
            isRelationship: false,
            newTableName: undefined,
            isDoubleClick: false,
          })
        }
      />
    ) : undefined;

    const fieldNames = inlineOptions
      .map(({ optionLabel }) => optionLabel)
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
              typeof handleClick === 'function'
                ? (payload): void => handleClick({ close: true, ...payload })
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

  const listOfOptionsRef = React.useRef<HTMLElement>(null);
  const customSelectOptions = (Boolean(unmapOption) || groups) && (
    <span
      aria-label={selectLabel}
      aria-readonly={!has('interactive') || typeof handleChange !== 'function'}
      className={`
        h-fit flex-1 cursor-pointer overflow-x-hidden
        rounded-b border border-brand-300 bg-[color:var(--custom-select-b1)]
        ${has('preview') ? '[z-index:2]' : ''}
        ${has('scroll') ? 'overflow-y-scroll' : 'overflow-y-auto'}
        ${has('shadow') ? 'max-h-[theme(spacing.64)] shadow-md' : ''}
        ${customSelectType === 'SUGGESTION_LIST' ? '' : 'min-w-max'}
      `}
      ref={listOfOptionsRef}
      role="listbox"
      tabIndex={-1}
    >
      {unmapOption}
      {groups}
    </span>
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
        custom-select relative flex h-8
        flex-col custom-select-${upperToKebab(customSelectType)}
        ${customSelectClassNames[customSelectType] ?? ''}
      `}
      ref={customSelectElementRef}
      role={role}
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
                const newValue = inlineOptions[newIndex]?.optionName ?? '0';
                if (!close && has('handleKeyboardClick'))
                  setSelectedValue(newValue);
                else
                  handleClick?.({
                    close,
                    newValue,
                    isRelationship:
                      inlineOptions[newIndex]?.isRelationship ?? false,
                    newTableName: inlineOptions[newIndex]?.tableName,
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
