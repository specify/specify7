import React from 'react';

import { commonText } from '../../localization/common';
import { formatterToParser } from '../../utils/parser/definitions';
import type { RA } from '../../utils/types';
import { Select } from '../Atoms/Form';
import { genericTables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { getUiFormatters } from '../FieldFormatters';
import { customSelectElementBackground } from '../WbPlanView/CustomSelectElement';
import type { MappingPath } from '../WbPlanView/Mapper';
import {
  getGenericMappingPath,
  mappingPathToString,
} from '../WbPlanView/mappingHelpers';
import type { QueryFieldFilter } from './FieldFilterSpec';
import { filtersWithDefaultValue } from './FieldFilterSpec';
import { FieldFilterTool } from './FieldFilterTool';
import { CatalogNumberFormatSelection } from './Formatter';
import type { QueryField } from './helpers';
import type { QueryLineFieldMeta } from './Line';
import { QueryLineFilter } from './QueryLineFilter';
import type {
  ExpandedFieldFilter,
  useQueryFieldFilterSpecs,
} from './useQueryFieldFilterSpecs';

export function QueryLineFilters({
  baseTableName,
  enforceLengthLimit,
  fieldFilters,
  fieldMeta,
  hasAny,
  isBasic,
  isFieldComplete,
  mappingPath,
  queryFieldFilterSpecs,
  onFilterChange: handleFilterChange,
  onQueryFieldChange: handleQueryFieldChange,
}: {
  readonly baseTableName: keyof Tables;
  readonly enforceLengthLimit: boolean;
  readonly fieldFilters: QueryField['filters'];
  readonly fieldMeta: QueryLineFieldMeta;
  readonly hasAny: boolean;
  readonly isBasic: boolean;
  readonly isFieldComplete: boolean;
  readonly mappingPath: MappingPath;
  readonly queryFieldFilterSpecs: ReturnType<typeof useQueryFieldFilterSpecs>;
  readonly onFilterChange: (
    index: number,
    filter: QueryField['filters'][number] | undefined
  ) => void;
  readonly onQueryFieldChange: ((newField: QueryField) => void) | undefined;
}): JSX.Element {
  const availableFilters = Object.entries(queryFieldFilterSpecs).filter(
    ([filterName, { types }]) =>
      typeof fieldMeta.fieldType === 'string'
        ? Object.keys(types).includes(fieldMeta.fieldType)
        : filterName === 'any'
  );
  const filtersVisible =
    availableFilters.length > 0 &&
    (availableFilters.length > 1 || availableFilters[0][0] !== 'any');

  return filtersVisible ? (
    <div
      className={
        fieldFilters.length > 1
          ? 'flex flex-col gap-2'
          : `flex items-center gap-2 ${isBasic ? '' : ' flex-wrap'}`
      }
    >
      {fieldFilters.map((_, index) => (
        <QueryLineFilterWrapper
          availableFilters={availableFilters}
          baseTableName={baseTableName}
          enforceLengthLimit={enforceLengthLimit}
          fieldFilters={fieldFilters}
          fieldMeta={fieldMeta}
          hasAny={hasAny}
          index={index}
          isBasic={isBasic}
          isFieldComplete={isFieldComplete}
          key={index}
          mappingPath={mappingPath}
          queryFieldFilterSpecs={queryFieldFilterSpecs}
          onFilterChange={handleFilterChange}
          onQueryFieldChange={handleQueryFieldChange}
        />
      ))}
    </div>
  ) : (
    <span className={`${isBasic ? 'col-span-1' : 'contents'}`} />
  );
}

function QueryLineFilterWrapper({
  availableFilters,
  baseTableName,
  enforceLengthLimit,
  hasAny,
  index,
  isBasic,
  isFieldComplete,
  fieldFilters,
  fieldMeta,
  mappingPath,
  queryFieldFilterSpecs,
  onFilterChange: handleFilterChange,
  onQueryFieldChange: handleQueryFieldChange,
}: {
  readonly availableFilters: RA<
    readonly [QueryFieldFilter, ExpandedFieldFilter]
  >;
  readonly baseTableName: keyof Tables;
  readonly enforceLengthLimit: boolean;
  readonly hasAny: boolean;
  readonly index: number;
  readonly isBasic: boolean;
  readonly isFieldComplete: boolean;
  readonly fieldFilters: QueryField['filters'];
  readonly fieldMeta: QueryLineFieldMeta;
  readonly mappingPath: MappingPath;
  readonly queryFieldFilterSpecs: ReturnType<typeof useQueryFieldFilterSpecs>;
  readonly onFilterChange: (
    index: number,
    filter: QueryField['filters'][number] | undefined
  ) => void;
  readonly onQueryFieldChange: ((newField: QueryField) => void) | undefined;
}): JSX.Element {
  const filter = fieldFilters[index];

  const terminatingField = isFieldComplete
    ? genericTables[baseTableName].getField(
        mappingPathToString(getGenericMappingPath(mappingPath))
      )
    : undefined;

  const fieldFormatter =
    filter.fieldFormat === undefined
      ? undefined
      : getUiFormatters()[filter.fieldFormat];

  const parser =
    (terminatingField === undefined || fieldFormatter === undefined
      ? undefined
      : formatterToParser(terminatingField, fieldFormatter)) ??
    fieldMeta.parser;

  return (
    <div
      className={fieldFilters.length > 1 ? 'flex flex-wrap gap-2' : 'contents'}
      key={index}
    >
      <div className="flex contents items-center gap-2">
        <FieldFilterTool
          fieldFilters={fieldFilters}
          fieldName={mappingPath[0]}
          handleChange={handleQueryFieldChange}
          handleFilterChange={handleFilterChange}
          hasAny={hasAny}
          index={index}
          isBasic={isBasic}
          isFieldComplete={isFieldComplete}
        />
        <div className="contents w-full">
          <Select
            aria-label={
              queryFieldFilterSpecs[filter.type].description ??
              commonText.filter()
            }
            className={`
                        !w-[unset] ${customSelectElementBackground}
                      `}
            disabled={handleQueryFieldChange === undefined}
            title={
              queryFieldFilterSpecs[filter.type].description ??
              commonText.filter()
            }
            value={filter.type}
            onChange={({ target }): void => {
              const newFilter = (target as HTMLSelectElement)
                .value as QueryFieldFilter;
              const startValue =
                queryFieldFilterSpecs[newFilter].component === undefined
                  ? ''
                  : filter.type === 'any' &&
                      filtersWithDefaultValue.has(newFilter) &&
                      filter.startValue === '' &&
                      typeof parser?.value === 'string'
                    ? parser.value
                    : filter.startValue;

              /*
               * When going from "in" to another filter type, throw away
               * all but first one or two values
               */
              const valueLength = newFilter === 'between' ? 2 : 1;
              const trimmedValue =
                filter.type === 'in'
                  ? startValue
                  : startValue.split(',').slice(0, valueLength).join(', ');

              handleFilterChange?.(index, {
                ...filter,
                type: newFilter,
                startValue: trimmedValue,
              });
            }}
          >
            {/**
             * Only visible filters types are shown and able to
             * be selected. If the current filter type is
             * supported but isn't supposed to be visible
             * (i.e., the filter in the database has the
             * supported type), still show the filter
             */}
            {availableFilters
              .filter(
                ([filterName, { types }]) =>
                  fieldMeta.fieldType === undefined ||
                  filterName === filter.type ||
                  types[fieldMeta.fieldType]?.visible == true
              )
              .map(([filterName, { label }]) => (
                <option key={filterName} value={filterName}>
                  {label}
                </option>
              ))}
          </Select>
        </div>
      </div>
      <div className="contents">
        {typeof parser === 'object' && (
          <QueryLineFilter
            enforceLengthLimit={enforceLengthLimit}
            fieldName={mappingPathToString(mappingPath)}
            filter={filter}
            parser={parser}
            terminatingField={terminatingField}
            onChange={
              typeof handleQueryFieldChange === 'function'
                ? (startValue): void =>
                    handleFilterChange(index, {
                      ...filter,
                      startValue,
                    })
                : undefined
            }
          />
        )}
        {/**
         * The CO catalogNumber format can be determined by the
         * Collection Object Type (COT) catalogNumberFormatName
         *
         * This format selection allows selecting which COT
         * field formatter is being used for this query filter
         */}
        {fieldMeta.tableName === 'CollectionObject' &&
        terminatingField?.name === 'catalogNumber' &&
        queryFieldFilterSpecs[filter.type].hasParser ? (
          <CatalogNumberFormatSelection
            formatter={filter.fieldFormat}
            onChange={
              handleQueryFieldChange === undefined
                ? undefined
                : (formatName): void => {
                    handleFilterChange(index, {
                      ...filter,
                      fieldFormat: (formatName ?? '') || undefined,
                    });
                  }
            }
          />
        ) : undefined}
      </div>
    </div>
  );
}
