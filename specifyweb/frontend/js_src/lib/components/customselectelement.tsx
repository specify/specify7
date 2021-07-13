/*
 *
 * Custom Select Element (picklist). Used by workbench mapper
 *
 *
 */

import '../../css/customselectelement.css';
import '../../css/theme.css';

import React from 'react';

import { upperToKebab } from '../wbplanviewhelper';
import {
  TableIcon,
  TableIconEmpty,
  TableIconSelected,
  TableIconUndefined,
} from './common';
import type { IR, R, RA } from './wbplanview';

export type CustomSelectType =
  | 'OPENED_LIST'
  /*
   * Used in the mapping view
   * list without an `input` box but with always opened list of options
   * and a table name on top has onChange event
   */
  | 'CLOSED_LIST'
  /*
   * Used in mapping lines
   * list with an `input` box and a list of options that can be opened
   * has onOpen/onClose and onChange events
   */
  | 'PREVIEW_LIST'
  /*
   * Used in the mapping validation results
   * list with an `input` box but with no list of options
   * has no events
   */
  | 'SUGGESTION_LIST'
  /*
   * Used to display a list of AutoMapper suggestions
   * like OPENED_LIST, but without a table name on top
   * has onChange event:
   */
  | 'SUGGESTION_LINE_LIST'
  /*
   * Used inside `SUGGESTION_LIST` to display a mapping path element for
   * a single suggestion line list with an `input` box but with no list of
   * options has no events:
   */
  | 'BASE_TABLE_SELECTION_LIST'
  /*
   * Used for base table selection
   * like OPENED_LIST, but without a header and option group labels
   * has onChange event
   */
  | 'MAPPING_OPTIONS_LIST'
  /*
   * Used for configuring mapping options for a mapping line
   * appears as a gear icon at the end of the mapping line
   */
  | 'MAPPING_OPTION_LINE_LIST';
/*
 * Used inside of MAPPING_OPTIONS_LIST
 * exactly the same as BASE_TABLE_SELECTION_LIST
 * it is named differently to avoid confusion
 */

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

export interface CustomSelectElementDefaultOptionProps {
  readonly optionName: string;
  readonly optionLabel: string | JSX.Element;
  readonly tableName?: string;
  readonly isRelationship?: boolean;
  readonly isRequired?: boolean;
  readonly isHidden?: boolean;
}

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
  readonly defaultOption?: CustomSelectElementDefaultOptionProps;
  readonly isOpen: boolean;
  readonly tableName?: string;

  readonly handleOpen?: () => void;
  readonly fieldNames?: RA<string>;

  readonly handleChange?: (
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
  readonly fieldNames: RA<string>;
}

export interface CustomSelectElementPropsOpenBase
  extends CustomSelectElementPropsBase {
  readonly isOpen: true;
  readonly handleChange?: (
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

  return (
    <span
      className={classes.join(' ')}
      tabIndex={0}
      onClick={handleClick}
      title={title}
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
        <span className="custom-select-option-relationship-icon">▶</span>
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
    <span
      className={`custom-select-group custom-select-group-${
        selectGroupName?.replace(
          /[A-Z]/g,
          (letter) => `-${letter.toLowerCase()}`
        ) ?? 'undefined'
      }`}
    >
      {typeof selectGroupLabel !== 'undefined' && (
        <span className="custom-select-group-label">{selectGroupLabel}</span>
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
    </span>
  );
}

const ShadowListOfOptions = React.memo(function ShadowListOfOptions({
  fieldNames,
}: {
  readonly fieldNames: RA<string>;
}) {
  return (
    <span className="custom-select-element-shadow-list">
      {fieldNames.map((fieldName, index) => (
        <span key={index}>{fieldName}</span>
      ))}
    </span>
  );
});

const NON_INTERACTIVE_SELECT_TYPES: RA<CustomSelectType> = [
  'PREVIEW_LIST',
  'SUGGESTION_LINE_LIST',
] as const;
const SELECT_TYPES_WITH_HEADERS: RA<CustomSelectType> = [
  'OPENED_LIST',
] as const;
const SELECT_TYPES_WITH_FIRST_ROW: RA<CustomSelectType> = [
  'CLOSED_LIST',
  'PREVIEW_LIST',
  'SUGGESTION_LINE_LIST',
  'MAPPING_OPTIONS_LIST',
] as const;
const SELECT_TYPES_WITH_AUTOSCROLL: RA<CustomSelectType> = [
  'CLOSED_LIST',
  'OPENED_LIST',
] as const;

export function CustomSelectElement({
  customSelectType,
  customSelectSubtype = 'simple',
  customSelectOptionGroups,
  selectLabel = '',
  defaultOption = {
    optionName: '0',
    optionLabel: '0',
    tableName: '',
    isRelationship: false,
    isRequired: false,
    isHidden: false,
  },
  isOpen,
  tableName,
  fieldNames,
  handleChange,
  handleOpen,
  handleClose,
  automapperSuggestions,
}: CustomSelectElementPropsClosed | CustomSelectElementPropsOpen): JSX.Element {
  const listOfOptionsRef = React.useRef<HTMLElement>(null);

  const optionIsIntractable =
    !NON_INTERACTIVE_SELECT_TYPES.includes(customSelectType);

  const handleClick =
    optionIsIntractable &&
    ((newValue: string, isRelationship: boolean, newTable: string) =>
      newValue !== defaultOption.optionName &&
      handleChange?.(
        newValue,
        isRelationship,
        defaultOption.tableName ?? '',
        newTable
      ));

  let header;
  let preview;
  let firstRow;
  let optionsShadow;
  if (SELECT_TYPES_WITH_HEADERS.includes(customSelectType) && selectLabel)
    header = (
      <span className="custom-select-header">
        <Icon
          isDefault={true}
          isRelationship={true}
          tableName={tableName}
          optionLabel={tableName}
        />
        <span>{selectLabel}</span>
      </span>
    );
  else if (SELECT_TYPES_WITH_FIRST_ROW.includes(customSelectType)) {
    preview = (
      <span
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
        tabIndex={0}
        onClick={
          optionIsIntractable ? (isOpen ? handleClose : handleOpen) : undefined
        }
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
        {optionIsIntractable && customSelectType !== 'MAPPING_OPTIONS_LIST' && (
          <span>▼</span>
        )}
      </span>
    );

    const showFirstRow =
      isOpen &&
      optionIsIntractable &&
      customSelectType !== 'MAPPING_OPTIONS_LIST' &&
      customSelectSubtype === 'simple' &&
      defaultOption.optionName !== '0';

    firstRow = showFirstRow && (
      <Option
        handleClick={(handleClick || undefined)?.bind(null, '0', false, '0')}
        isDefault={defaultOption.optionLabel === '0'}
        optionLabel="0"
      />
    );

    optionsShadow = !isOpen &&
      optionIsIntractable &&
      fieldNames &&
      customSelectType !== 'MAPPING_OPTIONS_LIST' && (
        <ShadowListOfOptions fieldNames={fieldNames} />
      );
  }

  const groups =
    isOpen &&
    optionIsIntractable &&
    Object.entries(customSelectOptionGroups ?? {})
      .filter(
        ([, { selectOptionsData }]) => Object.keys(selectOptionsData).length > 0
      )
      .map(([selectGroupName, selectGroupData], index) => (
        <OptionGroup
          key={index}
          handleClick={handleClick || undefined}
          selectGroupName={selectGroupName}
          {...selectGroupData}
        />
      ));

  const customSelectOptions = (firstRow || groups) && (
    <span className="custom-select-options" ref={listOfOptionsRef}>
      {firstRow}
      {groups}
    </span>
  );

  const previousDefaultOption = React.useRef<
    undefined | CustomSelectElementDefaultOptionProps
  >(undefined);
  React.useEffect(() => {
    if (
      /* Auto scroll down the option if: */
      // The list is open
      isOpen &&
      // And it can be opened
      optionIsIntractable &&
      // And DOM is rendered
      listOfOptionsRef.current !== null &&
      // And this type of picklist has auto scroll enabled
      SELECT_TYPES_WITH_AUTOSCROLL.includes(customSelectType) &&
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
        // The current line and half a line before it is visible
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
          listOfOptionsRef.current.scrollTop < maxGoodOffsetTop
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
  }, [isOpen, listOfOptionsRef, Object.values(defaultOption).join('')]);

  return (
    <span
      className={`custom-select custom-select-${upperToKebab(
        customSelectType
      )} ${
        customSelectType === 'CLOSED_LIST' && isOpen
          ? 'custom-select-closed-list-active'
          : ''
      }`}
      title={
        customSelectType === 'OPENED_LIST' ||
        customSelectType === 'BASE_TABLE_SELECTION_LIST'
          ? undefined
          : selectLabel
      }
    >
      {automapperSuggestions}
      {header}
      {preview}
      {optionsShadow}
      {customSelectOptions}
    </span>
  );
}

export function SuggestionBox({
  selectOptionsData,
  onSelect: handleSelect,
  ...props
}: Partial<CustomSelectElementPropsOpen> & {
  readonly selectOptionsData: CustomSelectElementOptions;
  readonly onSelect: (suggestion: string) => void;
}): JSX.Element {
  return (
    <CustomSelectElement
      customSelectType="SUGGESTION_LIST"
      customSelectSubtype="simple"
      customSelectOptionGroups={{
        'suggested-mappings': {
          selectGroupLabel: 'Suggested mappings:',
          selectOptionsData,
        },
      }}
      isOpen={true}
      handleChange={handleSelect}
      {...props}
    />
  );
}
