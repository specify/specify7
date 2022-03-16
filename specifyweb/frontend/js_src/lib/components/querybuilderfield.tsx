import React from 'react';

import type { Tables } from '../datamodel';
import commonText from '../localization/common';
import queryText from '../localization/query';
import type { QueryField } from '../querybuilderutils';
import { mutateLineData, sortTypes } from '../querybuilderutils';
import type { DatePart } from '../queryfieldspec';
import { getModel, schema } from '../schema';
import type { RA } from '../types';
import { defined, filterArray } from '../types';
import type { Parser } from '../uiparse';
import { resolveParser } from '../uiparse';
import {
  mappingPathToString,
  parsePartialField,
  valueIsPartialField,
} from '../wbplanviewmappinghelper';
import {
  getMappingLineData,
  getTableFromMappingPath,
} from '../wbplanviewnavigator';
import { mappingPathIsComplete } from '../wbplanviewutils';
import { Button, className, Select } from './basic';
import { customSelectElementBackground } from './customselectelement';
import { iconClassName, icons } from './icons';
import type {
  QueryFieldFilter,
  QueryFieldType,
} from './querybuilderfieldinput';
import {
  filtersWithDefaultValue,
  queryFieldFilters,
  QueryLineFilter,
} from './querybuilderfieldinput';
import createBackboneView from './reactbackboneextend';
import {
  getMappingLineProps,
  MappingElement,
  mappingElementDivider,
  mappingElementDividerClassName,
} from './wbplanviewcomponents';
import type { MappingPath } from './wbplanviewmapper';
import { replaceItem } from './wbplanviewstate';

// TODO: split this component into smaller components
export function QueryLine({
  baseTableName,
  field,
  fieldHash,
  onChange: handleChange,
  onMappingChange: handleMappingChange,
  onRemove: handleRemove,
  onOpen: handleOpen,
  onClose: handleClose,
  onLineFocus: handleLineFocus,
  onMoveUp: handleMoveUp,
  onMoveDown: handleMoveDown,
  isFocused,
  openedElement,
  showHiddenFields,
  getMappedFields,
}: {
  readonly baseTableName: keyof Tables;
  readonly field: QueryField;
  readonly fieldHash: string;
  readonly onChange: (newField: QueryField) => void;
  readonly onMappingChange: (payload: {
    readonly index: number;
    readonly close: boolean;
    readonly newValue: string;
    readonly isRelationship: boolean;
    readonly parentTableName: keyof Tables | undefined;
    readonly currentTableName: keyof Tables | undefined;
    readonly newTableName: keyof Tables | undefined;
    readonly isDoubleClick: boolean;
  }) => void;
  readonly onRemove?: () => void;
  readonly onOpen: (index: number) => void;
  readonly onClose: () => void;
  readonly onLineFocus: (target: 'previous' | 'current' | 'next') => void;
  readonly onMoveUp: (() => void) | undefined;
  readonly onMoveDown: (() => void) | undefined;
  readonly isFocused: boolean;
  readonly openedElement: number | undefined;
  readonly showHiddenFields: boolean;
  readonly getMappedFields: (mappingPathFilter: MappingPath) => RA<string>;
}): JSX.Element {
  const lineRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (isFocused && lineRef.current?.contains(document.activeElement) !== true)
      lineRef.current?.focus();
  }, [isFocused]);

  const [fieldMeta, setFieldMeta] = React.useState<{
    readonly fieldType: QueryFieldType | undefined;
    readonly parser: Parser | undefined;
  }>({ fieldType: undefined, parser: undefined });

  React.useEffect(() => {
    const [fieldName, datePart] = valueIsPartialField(
      field.mappingPath.slice(-1)[0] ?? ''
    )
      ? parsePartialField<DatePart>(field.mappingPath.slice(-1)[0])
      : [field.mappingPath.slice(-1)[0], undefined];
    const tableName =
      mappingPathIsComplete(field.mappingPath) &&
      !fieldName.startsWith(schema.fieldPartSeparator)
        ? getTableFromMappingPath(baseTableName, field.mappingPath)
        : undefined;
    const dataModelField = getModel(tableName ?? '')?.getField(fieldName);

    let fieldType: QueryFieldType | undefined = undefined;
    let parser = undefined;
    const hasParser =
      typeof dataModelField === 'object' &&
      !dataModelField.isRelationship &&
      mappingPathIsComplete(field.mappingPath);
    // TODO: define parser and fieldType for (formatted) and (aggregated)
    if (hasParser) {
      parser = defined(
        resolveParser(dataModelField, {
          datePart,
          isRequired: true,
        })
      );

      fieldType =
        tableName === 'CollectionObject' &&
        dataModelField.name === 'catalogNumber'
          ? 'id'
          : parser.type ?? 'text';
    }

    const newFilters = hasParser
      ? field.filters.map((filter) => {
          const filterType =
            typeof fieldType === 'undefined' ||
            queryFieldFilters[filter.type].types?.includes(fieldType) === false
              ? 'any'
              : filter.type;
          return filterType === 'any' && filter.type !== 'any'
            ? ({
                type: 'any',
                isNot: false,
                startValue: '',
              } as const)
            : filter;
        })
      : [];

    setFieldMeta({ parser, fieldType });

    if (
      field.filters.length === newFilters.length &&
      field.filters.some((filter, index) => filter !== newFilters[index])
    )
      handleChange({
        ...field,
        filters: newFilters,
      });
  }, [
    baseTableName,
    field,
    // Since handleChange changes at each render, fieldHash is used instead
    fieldHash,
  ]);

  const lineData = getMappingLineData({
    baseTableName,
    mappingPath: field.mappingPath,
    showHiddenFields,
    generateFieldData: 'all',
    scope: 'queryBuilder',
    getMappedFields,
  });

  const mappingLineProps = getMappingLineProps({
    mappingLineData: mutateLineData(lineData),
    customSelectType: 'CLOSED_LIST',
    onChange: handleMappingChange,
    onOpen: handleOpen,
    onClose: handleClose,
    openSelectElement: openedElement,
  });

  const handleFilterChange = (
    index: number,
    filter: QueryField['filters'][number] | undefined
  ): void =>
    handleChange({
      ...field,
      filters: filterArray(replaceItem(field.filters, index, filter)),
    });

  const isFieldComplete = mappingPathIsComplete(field.mappingPath);

  return (
    <li
      className="border-t-gray-500 gap-x-2 flex py-2 border-t"
      aria-current={isFocused}
    >
      {typeof handleRemove === 'function' && (
        <Button.Simple
          className={`${className.redButton} print:hidden`}
          title={commonText('remove')}
          aria-label={commonText('remove')}
          onClick={handleRemove}
        >
          {icons.trash}
        </Button.Simple>
      )}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className={`flex-1 print:gap-1 flex flex-wrap gap-2
          ${field.filters.length > 1 ? 'items-baseline' : 'items-center'}
          ${isFocused ? 'bg-gray-300 dark:bg-neutral-700 rounded' : ''}`}
        role="list"
        /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
        tabIndex={0}
        onClick={(): void => handleLineFocus('current')}
        // Same key bindings as in WbPlanView
        onKeyDown={({ target, key }): void => {
          if ((target as HTMLElement).closest('input, select') !== null) return;
          if (typeof openedElement === 'number') {
            if (key === 'ArrowLeft')
              if (openedElement > 0) handleOpen(openedElement - 1);
              else handleClose();
            else if (key === 'ArrowRight')
              if (openedElement + 1 < mappingLineProps.length)
                handleOpen(openedElement + 1);
              else handleClose();

            return;
          }

          if (key === 'ArrowLeft') handleOpen(mappingLineProps.length - 1);
          else if (key === 'ArrowRight' || key === 'Enter') handleOpen(0);
          else if (key === 'ArrowUp') handleLineFocus('previous');
          else if (key === 'ArrowDown') handleLineFocus('next');
        }}
        ref={lineRef}
      >
        <div
          className={
            field.filters.length > 1 ? 'flex flex-wrap gap-2' : 'contents'
          }
        >
          {mappingLineProps.map((mappingDetails, index, { length }) => (
            <React.Fragment key={index}>
              <MappingElement {...mappingDetails} role="listitem" />
              {index + 1 === length ? undefined : mappingElementDivider}
            </React.Fragment>
          ))}
        </div>
        <div
          className={
            field.filters.length > 1 ? 'flex flex-col gap-2' : 'contents'
          }
        >
          {field.filters.map((filter, index) => (
            <div
              className={
                field.filters.length > 1 ? 'flex flex-wrap gap-2' : 'contents'
              }
              key={index}
            >
              {index === 0 ? (
                <React.Fragment>
                  {mappingElementDivider}
                  <Button.Simple
                    title={queryText('or')}
                    aria-label={queryText('or')}
                    className={`aria-handled print:hidden
                      ${isFieldComplete ? '' : 'invisible'}
                      ${field.filters.length > 1 ? className.blueButton : ''}
                    `}
                    onClick={(): void =>
                      handleFilterChange(field.filters.length, {
                        type: 'any',
                        isNot: false,
                        startValue: '',
                      })
                    }
                    aria-pressed={field.filters.length > 1}
                  >
                    {icons.plus}
                  </Button.Simple>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <span className={mappingElementDividerClassName}>
                    <span
                      className={`uppercase flex items-center justify-center
                        ${iconClassName}`}
                    >
                      {queryText('or')}
                    </span>
                  </span>
                  <Button.Simple
                    className={`${className.redButton} print:hidden`}
                    title={commonText('remove')}
                    aria-label={commonText('remove')}
                    onClick={(): void => handleFilterChange(index, undefined)}
                  >
                    {icons.trash}
                  </Button.Simple>
                </React.Fragment>
              )}
              {field.filters[index].type === 'any' ? undefined : (
                <Button.Simple
                  title={queryText('negate')}
                  aria-label={queryText('negate')}
                  className={`aria-handled ${
                    field.filters[index].isNot ? className.redButton : ''
                  }`}
                  onClick={(): void =>
                    handleFilterChange(index, {
                      ...field.filters[index],
                      isNot: !field.filters[index].isNot,
                    })
                  }
                  aria-pressed={field.filters[index].isNot}
                >
                  {icons.ban}
                </Button.Simple>
              )}
              <Select
                aria-label={
                  queryFieldFilters[field.filters[index].type].description ??
                  queryText('filter')
                }
                title={
                  queryFieldFilters[field.filters[index].type].description ??
                  queryText('filter')
                }
                value={filter.type}
                className={customSelectElementBackground}
                onChange={({ target }): void => {
                  const newFilter = (target as HTMLSelectElement)
                    .value as QueryFieldFilter;
                  const startValue =
                    filter.type === 'any' &&
                    filtersWithDefaultValue.has(newFilter) &&
                    filter.startValue === '' &&
                    typeof fieldMeta.parser?.value === 'string'
                      ? fieldMeta.parser.value
                      : filter.startValue;
                  handleFilterChange(index, {
                    ...field.filters[index],
                    type: newFilter,
                    startValue,
                  });
                }}
              >
                {Object.entries(queryFieldFilters).map(
                  ([filterName, { label, types }]) =>
                    !Array.isArray(types) ||
                    (typeof fieldMeta.fieldType === 'string' &&
                      types.includes(fieldMeta.fieldType)) ? (
                      <option key={filterName} value={filterName}>
                        {label}
                      </option>
                    ) : undefined
                )}
              </Select>
              {typeof fieldMeta.parser === 'object' && (
                <QueryLineFilter
                  filter={field.filters[index]}
                  fieldName={mappingPathToString(field.mappingPath)}
                  parser={fieldMeta.parser}
                  onChange={(startValue): void =>
                    handleFilterChange(index, {
                      ...field.filters[index],
                      startValue,
                    })
                  }
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="contents print:hidden">
        <Button.Simple
          title={queryText('showButtonDescription')}
          aria-label={queryText('showButtonDescription')}
          className={`
            aria-handled
            ${isFieldComplete ? '' : 'invisible'}
            ${field.isDisplay ? className.greenButton : ''}
          `}
          onClick={(): void =>
            handleChange({
              ...field,
              isDisplay: !field.isDisplay,
            })
          }
          aria-pressed={field.isDisplay}
        >
          {icons.check}
        </Button.Simple>
        <Button.Simple
          className={isFieldComplete ? '' : 'invisible'}
          title={
            field.sortType === 'ascending'
              ? queryText('ascendingSort')
              : field.sortType === 'descending'
              ? queryText('descendingSort')
              : queryText('sort')
          }
          aria-label={
            field.sortType === 'ascending'
              ? queryText('ascendingSort')
              : field.sortType === 'descending'
              ? queryText('descendingSort')
              : queryText('sort')
          }
          onClick={(): void =>
            handleChange({
              ...field,
              sortType:
                sortTypes[
                  (sortTypes.indexOf(field.sortType) + 1) % sortTypes.length
                ],
            })
          }
        >
          {field.sortType === 'ascending'
            ? icons.arrowCircleDown
            : field.sortType === 'descending'
            ? icons.arrowCircleUp
            : icons.circle}
        </Button.Simple>
        <Button.Simple
          title={queryText('moveUp')}
          aria-label={queryText('moveUp')}
          disabled={typeof handleMoveUp === 'undefined'}
          onClick={handleMoveUp}
        >
          {icons.chevronUp}
        </Button.Simple>
        <Button.Simple
          title={queryText('moveDown')}
          aria-label={queryText('moveDown')}
          disabled={typeof handleMoveDown === 'undefined'}
          onClick={handleMoveDown}
        >
          {icons.chevronDown}
        </Button.Simple>
      </div>
    </li>
  );
}

export const QueryLineView = createBackboneView(QueryLine);
