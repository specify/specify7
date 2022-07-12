import React from 'react';

import type { Tables } from '../datamodel';
import { replaceItem } from '../helpers';
import { commonText } from '../localization/common';
import { queryText } from '../localization/query';
import type { QueryField } from '../querybuilderutils';
import { mutateLineData, sortTypes } from '../querybuilderutils';
import type { DatePart } from '../queryfieldspec';
import { getModel, schema } from '../schema';
import type { RA } from '../types';
import { filterArray } from '../types';
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
} from './querybuilderfieldfilter';
import {
  filtersWithDefaultValue,
  queryFieldFilters,
  QueryLineFilter,
} from './querybuilderfieldfilter';
import {
  getMappingLineProps,
  MappingElement,
  mappingElementDivider,
  mappingElementDividerClassName,
} from './wbplanviewcomponents';
import type { MappingPath } from './wbplanviewmapper';

// TODO: split this component into smaller components
export function QueryLine({
  baseTableName,
  field,
  fieldHash,
  enforceLengthLimit = false,
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
  readonly enforceLengthLimit?: boolean;
  readonly onChange: ((newField: QueryField) => void) | undefined;
  readonly onMappingChange:
    | ((payload: {
        readonly index: number;
        readonly close: boolean;
        readonly newValue: string;
        readonly isRelationship: boolean;
        readonly parentTableName: keyof Tables | undefined;
        readonly currentTableName: keyof Tables | undefined;
        readonly newTableName: keyof Tables | undefined;
        readonly isDoubleClick: boolean;
      }) => void)
    | undefined;
  readonly onRemove?: () => void;
  readonly onOpen: ((index: number) => void) | undefined;
  readonly onClose: (() => void) | undefined;
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

  React.useEffect(
    () => {
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
      if (hasParser) {
        parser = resolveParser(dataModelField, { datePart });
        // Remove autoNumbering wildCard from default values
        if (dataModelField.getUiFormatter()?.valueOrWild() === parser.value)
          parser = { ...parser, value: undefined };

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
              queryFieldFilters[filter.type].types?.includes(fieldType) ===
                false
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
        handleChange?.({
          ...field,
          filters: newFilters,
        });
    },
    // Since handleChange changes at each render, fieldHash is used instead
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseTableName, field, fieldHash, enforceLengthLimit]
  );

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
    handleChange?.({
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
        <Button.Small
          className="print:hidden"
          variant={className.redButton}
          title={commonText('remove')}
          aria-label={commonText('remove')}
          onClick={handleRemove}
        >
          {icons.trash}
        </Button.Small>
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
              if (openedElement > 0) handleOpen?.(openedElement - 1);
              else handleClose?.();
            else if (key === 'ArrowRight')
              if (openedElement + 1 < mappingLineProps.length)
                handleOpen?.(openedElement + 1);
              else handleClose?.();

            return;
          }

          if (key === 'ArrowLeft') handleOpen?.(mappingLineProps.length - 1);
          else if (key === 'ArrowRight' || key === 'Enter') handleOpen?.(0);
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
                  <Button.Small
                    title={queryText('or')}
                    aria-label={queryText('or')}
                    variant={
                      field.filters.length > 1
                        ? className.blueButton
                        : className.grayButton
                    }
                    className={`aria-handled print:hidden
                      ${isFieldComplete ? '' : 'invisible'}
                    `}
                    disabled={typeof handleChange === 'undefined'}
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
                  </Button.Small>
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
                  <Button.Small
                    className="print:hidden"
                    variant={className.redButton}
                    title={commonText('remove')}
                    aria-label={commonText('remove')}
                    disabled={typeof handleChange === 'undefined'}
                    onClick={(): void => handleFilterChange(index, undefined)}
                  >
                    {icons.trash}
                  </Button.Small>
                </React.Fragment>
              )}
              {field.filters[index].type === 'any' ? undefined : (
                <Button.Small
                  title={queryText('negate')}
                  aria-label={queryText('negate')}
                  variant={
                    field.filters[index].isNot
                      ? className.redButton
                      : className.grayButton
                  }
                  className="aria-handled"
                  disabled={typeof handleChange === 'undefined'}
                  onClick={(): void =>
                    handleFilterChange(index, {
                      ...field.filters[index],
                      isNot: !field.filters[index].isNot,
                    })
                  }
                  aria-pressed={field.filters[index].isNot}
                >
                  {icons.ban}
                </Button.Small>
              )}
              <div>
                <Select
                  aria-label={
                    queryFieldFilters[field.filters[index].type].description ??
                    commonText('filter')
                  }
                  title={
                    queryFieldFilters[field.filters[index].type].description ??
                    commonText('filter')
                  }
                  value={filter.type}
                  className={customSelectElementBackground}
                  disabled={typeof handleChange === 'undefined'}
                  onChange={({ target }): void => {
                    const newFilter = (target as HTMLSelectElement)
                      .value as QueryFieldFilter;
                    const startValue =
                      typeof queryFieldFilters[newFilter].component ===
                      'undefined'
                        ? ''
                        : filter.type === 'any' &&
                          filtersWithDefaultValue.has(newFilter) &&
                          filter.startValue === '' &&
                          typeof fieldMeta.parser?.value === 'string'
                        ? fieldMeta.parser.value
                        : filter.startValue;

                    /*
                     * When going from "in" to another filter type, throw away
                     * all but first one or two values
                     */
                    const valueLength = newFilter === 'between' ? 2 : 1;
                    const trimmedValue =
                      filter.type === 'in'
                        ? startValue
                        : startValue
                            .split(',')
                            .slice(0, valueLength)
                            .join(', ');

                    handleFilterChange?.(index, {
                      ...field.filters[index],
                      type: newFilter,
                      startValue: trimmedValue,
                    });
                  }}
                >
                  {Object.entries(queryFieldFilters).map(
                    ([filterName, { label, types }]) =>
                      (
                        typeof fieldMeta.fieldType === 'string'
                          ? !Array.isArray(types) ||
                            types.includes(fieldMeta.fieldType)
                          : filterName === 'any'
                      ) ? (
                        <option key={filterName} value={filterName}>
                          {label}
                        </option>
                      ) : undefined
                  )}
                </Select>
              </div>
              {typeof fieldMeta.parser === 'object' && (
                <QueryLineFilter
                  filter={field.filters[index]}
                  fieldName={mappingPathToString(field.mappingPath)}
                  parser={fieldMeta.parser}
                  enforceLengthLimit={enforceLengthLimit}
                  onChange={
                    typeof handleChange === 'function'
                      ? (startValue): void =>
                          handleFilterChange(index, {
                            ...field.filters[index],
                            startValue,
                          })
                      : undefined
                  }
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="contents print:hidden">
        <Button.Small
          title={queryText('showButtonDescription')}
          aria-label={queryText('showButtonDescription')}
          className={`aria-handled ${isFieldComplete ? '' : 'invisible'}`}
          variant={
            field.isDisplay ? className.greenButton : className.grayButton
          }
          disabled={typeof handleChange === 'undefined'}
          onClick={(): void =>
            handleChange?.({
              ...field,
              isDisplay: !field.isDisplay,
            })
          }
          aria-pressed={field.isDisplay}
        >
          {icons.check}
        </Button.Small>
        <Button.Small
          className={isFieldComplete ? undefined : 'invisible'}
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
          disabled={typeof handleChange === 'undefined'}
          onClick={(): void =>
            handleChange?.({
              ...field,
              sortType:
                sortTypes[
                  (sortTypes.indexOf(field.sortType) + 1) % sortTypes.length
                ],
            })
          }
        >
          {field.sortType === 'ascending'
            ? icons.arrowCircleUp
            : field.sortType === 'descending'
            ? icons.arrowCircleDown
            : icons.circle}
        </Button.Small>
        <Button.Small
          title={queryText('moveUp')}
          aria-label={queryText('moveUp')}
          disabled={typeof handleMoveUp === 'undefined'}
          onClick={handleMoveUp}
        >
          {icons.chevronUp}
        </Button.Small>
        <Button.Small
          title={queryText('moveDown')}
          aria-label={queryText('moveDown')}
          disabled={typeof handleMoveDown === 'undefined'}
          onClick={handleMoveDown}
        >
          {icons.chevronDown}
        </Button.Small>
      </div>
    </li>
  );
}
