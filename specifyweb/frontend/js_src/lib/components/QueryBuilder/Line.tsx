import React from 'react';

import { commonText } from '../../localization/common';
import type { Parser } from '../../utils/parser/definitions';
import { resolveParser } from '../../utils/parser/definitions';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Select } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { schema } from '../DataModel/schema';
import { genericTables, getTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { join } from '../Molecules';
import { TableIcon } from '../Molecules/TableIcon';
import { customSelectElementBackground } from '../WbPlanView/CustomSelectElement';
import { mappingPathIsComplete } from '../WbPlanView/helpers';
import {
  getMappingLineProps,
  MappingElement,
  mappingElementDivider,
} from '../WbPlanView/LineComponents';
import type { MappingPath } from '../WbPlanView/Mapper';
import {
  formattedEntry,
  mappingPathToString,
  parsePartialField,
  valueIsPartialField,
} from '../WbPlanView/mappingHelpers';
import { generateMappingPathPreview } from '../WbPlanView/mappingPreview';
import {
  getMappingLineData,
  getTableFromMappingPath,
} from '../WbPlanView/navigator';
import { navigatorSpecs } from '../WbPlanView/navigatorSpecs';
import { IsQueryBasicContext } from './Context';
import type { QueryFieldFilter, QueryFieldType } from './FieldFilter';
import {
  filtersWithDefaultValue,
  queryFieldFilters,
  QueryLineFilter,
} from './FieldFilter';
import { FieldFilterTool } from './FieldFilterTool';
import type { DatePart } from './fieldSpec';
import { QueryFieldSpec } from './fieldSpec';
import { QueryFieldFormatter } from './Formatter';
import type { QueryField } from './helpers';
import { QueryLineTools } from './QueryLineTools';

// REFACTOR: split this component into smaller components
export function QueryLine({
  isLast,
  baseTableName,
  field,
  fieldHash,
  enforceLengthLimit = false,
  isFocused,
  openedElement,
  showHiddenFields,
  fieldName,
  getMappedFields,
  onChange: handleChange,
  onMappingChange: handleMappingChange,
  onRemove: handleRemove,
  onOpen: handleOpen,
  onClose: handleClose,
  onLineFocus: handleLineFocus,
  onMoveUp: handleMoveUp,
  onMoveDown: handleMoveDown,
  onOpenMap: handleOpenMap,
}: {
  readonly isLast: boolean;
  readonly baseTableName: keyof Tables;
  readonly field: QueryField;
  readonly fieldHash: string;
  readonly enforceLengthLimit?: boolean;
  readonly isFocused: boolean;
  readonly openedElement: number | undefined;
  readonly showHiddenFields: boolean;
  readonly fieldName: string;
  readonly getMappedFields: (mappingPathFilter: MappingPath) => RA<string>;
  readonly onChange: ((newField: QueryField) => void) | undefined;
  readonly onMappingChange:
    | ((payload: {
        readonly index: number;
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
  readonly onLineFocus: (target: 'current' | 'next' | 'previous') => void;
  readonly onMoveUp: (() => void) | undefined;
  readonly onMoveDown: (() => void) | undefined;
  readonly onOpenMap: (() => void) | undefined;
}): JSX.Element {
  const lineRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (isFocused && lineRef.current?.contains(document.activeElement) !== true)
      lineRef.current?.focus();
  }, [isFocused]);

  const [fieldMeta, setFieldMeta] = React.useState<{
    readonly fieldType: QueryFieldType | undefined;
    readonly parser: Parser | undefined;
    readonly canOpenMap: boolean;
    readonly tableName: keyof Tables | undefined;
  }>({
    fieldType: undefined,
    parser: undefined,
    canOpenMap: false,
    tableName: undefined,
  });

  React.useEffect(
    () => {
      const isFormatted =
        field.mappingPath.at(-1)?.startsWith(schema.fieldPartSeparator) ??
        false;
      const mappingPath = isFormatted
        ? field.mappingPath.slice(0, -1)
        : field.mappingPath;
      const partialField = mappingPath.at(-1) ?? '';
      const [fieldName, datePart] = valueIsPartialField(partialField)
        ? parsePartialField<DatePart>(partialField)
        : [partialField, undefined];
      const isMapped = mappingPathIsComplete(field.mappingPath);
      const tableName = isMapped
        ? getTableFromMappingPath(baseTableName, field.mappingPath)
        : undefined;
      const dataModelField = isFormatted
        ? undefined
        : getTable(tableName ?? '')?.getField(fieldName);

      let fieldType: QueryFieldType | undefined = undefined;
      let parser = undefined;
      const hasParser =
        typeof dataModelField === 'object' &&
        !dataModelField.isRelationship &&
        isMapped;
      let canOpenMap = false;
      if (hasParser) {
        parser = {
          ...resolveParser(dataModelField, { datePart }),
          required: false,
        };
        // Remove autoNumbering wildCard from default values
        if (dataModelField.getUiFormatter()?.valueOrWild() === parser.value)
          parser = { ...parser, value: undefined };

        fieldType =
          tableName === 'CollectionObject' &&
          dataModelField.name === 'catalogNumber'
            ? 'id'
            : tableName === 'CollectionObject' && dataModelField.name === 'age'
            ? 'age'
            : parser.type ?? 'text';

        canOpenMap = fieldName === 'latitude1' || fieldName === 'longitude1';
      } else if (isMapped)
        fieldType =
          isFormatted && mappingPath.at(-1) === `${schema.referenceSymbol}1`
            ? 'aggregator'
            : 'formatter';

      const updatedFilters = hasParser
        ? field.filters.map((filter) => {
            const resetFilter =
              fieldType === undefined ||
              !queryFieldFilters[filter.type].types?.includes(fieldType);
            return resetFilter
              ? ({
                  type: 'any',
                  isNot: false,
                  startValue: '',
                } as const)
              : filter.type === 'any' && filter.isNot
              ? {
                  ...filter,
                  isNot: false,
                }
              : filter;
          })
        : [];
      const anyFilter =
        updatedFilters.length -
        1 -
        Array.from(updatedFilters)
          .reverse()
          .findIndex(({ type }) => type === 'any');
      // Make sure there is only one "any" filter at one time
      const newFilters = updatedFilters.filter(
        ({ type }, index) => type !== 'any' || index === anyFilter
      );

      setFieldMeta({ parser, fieldType, canOpenMap, tableName });

      if (
        newFilters.length !== updatedFilters.length ||
        (field.filters.length === newFilters.length &&
          field.filters.some((filter, index) => filter !== newFilters[index]))
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
    spec: navigatorSpecs.queryBuilder,
    getMappedFields,
  });

  const mappingLineProps = getMappingLineProps({
    mappingLineData: lineData,
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

  const availableFilters = Object.entries(queryFieldFilters).filter(
    ([filterName, { types }]) =>
      typeof fieldMeta.fieldType === 'string'
        ? !Array.isArray(types) || types.includes(fieldMeta.fieldType)
        : filterName === 'any'
  );
  const filtersVisible =
    availableFilters.length > 0 &&
    (availableFilters.length > 1 || availableFilters[0][0] !== 'any');

  const hasAny = field.filters.some(({ type }) => type === 'any');

  const fieldSpec = React.useMemo(
    () =>
      mappingPathIsComplete(field.mappingPath)
        ? QueryFieldSpec.fromPath(baseTableName, field.mappingPath)
        : undefined,
    [baseTableName, field.mappingPath]
  );

  const rowTableName = React.useMemo(
    () =>
      fieldSpec === undefined
        ? fieldName
        : generateMappingPathPreview(
            fieldSpec.baseTable.name,
            fieldSpec.toMappingPath()
          ),
    [fieldSpec]
  );

  const isBasic = React.useContext(IsQueryBasicContext);

  return (
    <>
      <div
        aria-current={isFocused ? 'location' : undefined}
        className={`
        flex flex-1 gap-2 border-t border-t-gray-500 bg-[color:var(--form-foreground)] py-2
        ${isBasic ? 'contents' : ''}
      `}
      >
        {typeof handleRemove === 'function' && (
          <Button.Small
            aria-label={commonText.remove()}
            className={`
            ${isBasic ? 'h-full' : ''} print:hidden
          `}
            title={commonText.remove()}
            variant={className.dangerButton}
            onClick={handleRemove}
          >
            {icons.trash}
          </Button.Small>
        )}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div
          className={`
          flex flex-1 flex-wrap gap-2 overflow-auto sm:overflow-visible print:gap-1
          ${field.filters.length > 1 ? 'items-baseline' : 'items-center'}
          ${isFocused ? 'rounded bg-gray-300 dark:bg-neutral-700' : ''}
          ${isBasic ? 'contents' : ''}
        `}
          ref={lineRef}
          role="list"
          tabIndex={0}
          // Same key bindings as in WbPlanView
          onClick={(): void => handleLineFocus('current')}
          onKeyDown={({ target, key }): void => {
            if ((target as HTMLElement).closest('input, select') !== null)
              return;
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
        >
          <div
            className={`flex flex-wrap items-center gap-2 px-2 
              ${
                isFocused && isBasic
                  ? 'rounded bg-gray-300 dark:bg-neutral-700'
                  : ''
              }
              ${isBasic ? 'pb-1 pt-1' : ''}
            `}
          >
            {isBasic ? (
              <div className="flex contents items-center gap-2">
                <TableIcon
                  className="h-7 w-7"
                  label
                  name={
                    mappingLineProps.at(-1)?.tableName ?? baseTableName ?? ''
                  }
                />
                <p>
                  {rowTableName}{' '}
                  {field.mappingPath.at(-1) === formattedEntry
                    ? mappingLineProps.at(-1)?.fieldsData[formattedEntry]
                        ?.optionLabel
                    : ''}
                </p>
              </div>
            ) : (
              join(
                mappingLineProps.map((mappingDetails) => (
                  <div>
                    <MappingElement {...mappingDetails} role="listitem" />
                  </div>
                )),
                mappingElementDivider
              )
            )}
            {(fieldMeta.fieldType === 'formatter' ||
              fieldMeta.fieldType === 'aggregator') &&
            typeof fieldMeta.tableName === 'string' ? (
              <QueryFieldFormatter
                formatter={field.dataObjFormatter}
                tableName={fieldMeta.tableName}
                type={fieldMeta.fieldType}
                onChange={
                  handleChange === undefined
                    ? undefined
                    : (dataObjectFormatter): void =>
                        handleChange({
                          ...field,
                          dataObjFormatter: dataObjectFormatter,
                        })
                }
              />
            ) : undefined}
          </div>
          {filtersVisible ? (
            <div
              className={
                field.filters.length > 1
                  ? 'flex flex-col gap-2'
                  : `flex items-center gap-2 ${isBasic ? '' : ' flex-wrap'}`
              }
            >
              {field.filters.map((filter, index) => (
                <div
                  className={
                    field.filters.length > 1
                      ? 'flex flex-wrap gap-2'
                      : 'contents'
                  }
                  key={index}
                >
                  <div className="flex contents items-center gap-2">
                    <FieldFilterTool
                      fieldFilters={field.filters}
                      fieldName={field.mappingPath[0]}
                      handleChange={handleChange}
                      handleFilterChange={handleFilterChange}
                      hasAny={hasAny}
                      index={index}
                      isBasic={isBasic}
                      isFieldComplete={isFieldComplete}
                    />
                    <div className="contents w-full">
                      <Select
                        aria-label={
                          queryFieldFilters[field.filters[index].type]
                            .description ?? commonText.filter()
                        }
                        className={`
                        !w-[unset] ${customSelectElementBackground}
                      `}
                        disabled={handleChange === undefined}
                        title={
                          queryFieldFilters[field.filters[index].type]
                            .description ?? commonText.filter()
                        }
                        value={filter.type}
                        onChange={({ target }): void => {
                          const newFilter = (target as HTMLSelectElement)
                            .value as QueryFieldFilter;
                          const startValue =
                            queryFieldFilters[newFilter].component === undefined
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
                        {availableFilters.map(([filterName, { label }]) => (
                          <option key={filterName} value={filterName}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div className="contents">
                    {typeof fieldMeta.parser === 'object' && (
                      <QueryLineFilter
                        enforceLengthLimit={enforceLengthLimit}
                        fieldName={mappingPathToString(field.mappingPath)}
                        filter={field.filters[index]}
                        parser={fieldMeta.parser}
                        terminatingField={
                          isFieldComplete
                            ? genericTables[baseTableName].getField(
                                mappingPathToString(field.mappingPath)
                              )
                            : undefined
                        }
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
                </div>
              ))}
            </div>
          ) : (
            <span className={`${isBasic ? 'col-span-1' : 'contents'}`} />
          )}
        </div>
        <QueryLineTools
          field={field}
          fieldMeta={fieldMeta}
          isFieldComplete={isFieldComplete}
          onChange={handleChange}
          onMoveDown={handleMoveDown}
          onMoveUp={handleMoveUp}
          onOpenMap={handleOpenMap}
        />
      </div>
      {isBasic && !isLast ? (
        <div className="col-span-full h-px bg-gray-400" />
      ) : null}
    </>
  );
}
