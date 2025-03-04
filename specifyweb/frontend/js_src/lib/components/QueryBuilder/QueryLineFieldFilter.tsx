import React from 'react';
import { commonText } from '../../localization/common';
import { formatterToParser, Parser } from '../../utils/parser/definitions';
import { RA, ValueOf } from '../../utils/types';
import { Select } from '../Atoms/Form';
import { genericTables } from '../DataModel/tables';
import { Tables } from '../DataModel/types';
import { getUiFormatters } from '../FieldFormatters';
import { customSelectElementBackground } from '../WbPlanView/CustomSelectElement';
import {
  mappingPathToString,
  valueIsToManyIndex,
} from '../WbPlanView/mappingHelpers';
import {
  filtersWithDefaultValue,
  queryFieldFilters,
  QueryFieldFilterType,
  QueryLineFilter,
} from './FieldFilter';
import { FieldFilterTool } from './FieldFilterTool';
import { CatalogNumberFormatSelection } from './Formatter';
import { QueryField, QueryFieldFilter } from './helpers';

// REFACTOR: Simplify this
export type QueryFieldFilterProps = {
  readonly fieldFilter: QueryFieldFilter;
  readonly isBasic: boolean;
  readonly isFirst: boolean;
  readonly hasMultipleFilters: boolean;
  readonly hasAny: boolean;
  readonly isFieldComplete: boolean;
  readonly onChange:
    | ((newFieldFilter: QueryFieldFilter | undefined) => void)
    | undefined;
  readonly onAddFieldFilter:
    | ((newFieldFilter: QueryFieldFilter) => void)
    | undefined;
  readonly onRemoveFieldFilter: (() => void) | undefined;
};

export function QueryLineFieldFilter({
  queryField,
  fieldFilter,
  terminatingTableName,
  baseTableName,
  baseParser,
  isBasic,
  isFirst,
  isFieldComplete,
  hasAny,
  hasMultipleFilters,
  enforceLengthLimit,
  shownFilters,
  onChange: handleChange,
  onAddFieldFilter: handleAddFieldFilter,
  onRemoveFieldFilter: handleRemoveFieldFilter,
}: {
  readonly queryField: QueryField;
  readonly fieldFilter: QueryFieldFilter;
  readonly baseParser: Parser | undefined;
  readonly baseTableName: keyof Tables;
  readonly terminatingTableName: keyof Tables | undefined;
  readonly shownFilters: RA<
    readonly [keyof typeof queryFieldFilters, ValueOf<typeof queryFieldFilters>]
  >;
  readonly enforceLengthLimit: boolean;
} & QueryFieldFilterProps): JSX.Element {
  const terminatingField = isFieldComplete
    ? genericTables[baseTableName].getField(
        mappingPathToString(
          queryField.mappingPath.filter(
            (fieldName) => !valueIsToManyIndex(fieldName)
          )
        )
      )
    : undefined;

  const fieldFormatter =
    fieldFilter.fieldFormat === undefined
      ? undefined
      : getUiFormatters()[fieldFilter.fieldFormat];

  const parser =
    (terminatingField === undefined || fieldFormatter === undefined
      ? undefined
      : formatterToParser(terminatingField, fieldFormatter)) ?? baseParser;
  return (
    <>
      <div className="flex contents items-center gap-2">
        <FieldFilterTool
          fieldFilter={fieldFilter}
          isFirst={isFirst}
          hasAny={hasAny}
          hasMultipleFilters={hasMultipleFilters}
          isBasic={isBasic}
          isFieldComplete={isFieldComplete}
          onChange={handleChange}
          onAddFieldFilter={handleAddFieldFilter}
          onRemoveFieldFilter={handleRemoveFieldFilter}
        />
        <div className="contents w-full">
          <Select
            aria-label={
              queryFieldFilters[fieldFilter.type].description ??
              commonText.filter()
            }
            className={`
        !w-[unset] ${customSelectElementBackground}
      `}
            disabled={handleChange === undefined}
            title={
              queryFieldFilters[fieldFilter.type].description ??
              commonText.filter()
            }
            value={fieldFilter.type}
            onChange={({ target }): void => {
              const newFilter = (target as HTMLSelectElement)
                .value as QueryFieldFilterType;
              const startValue =
                queryFieldFilters[newFilter].component === undefined
                  ? ''
                  : fieldFilter.type === 'any' &&
                      filtersWithDefaultValue.has(newFilter) &&
                      fieldFilter.startValue === '' &&
                      typeof parser?.value === 'string'
                    ? parser.value
                    : fieldFilter.startValue;

              /*
               * When going from "in" to another filter type, throw away
               * all but first one or two values
               */
              const valueLength = newFilter === 'between' ? 2 : 1;
              const trimmedValue =
                fieldFilter.type === 'in'
                  ? startValue
                  : startValue.split(',').slice(0, valueLength).join(', ');

              handleChange?.({
                ...fieldFilter,
                type: newFilter,
                startValue: trimmedValue,
              });
            }}
          >
            {shownFilters.map(([filterName, { label }]) => (
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
            fieldName={mappingPathToString(queryField.mappingPath)}
            filter={fieldFilter}
            parser={parser}
            terminatingField={terminatingField}
            onChange={
              typeof handleChange === 'function'
                ? (startValue): void =>
                    handleChange({ ...fieldFilter, startValue })
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
        {terminatingTableName === 'CollectionObject' &&
        terminatingField?.name === 'catalogNumber' &&
        queryFieldFilters[fieldFilter.type].hasParser ? (
          <CatalogNumberFormatSelection
            formatter={fieldFilter.fieldFormat}
            onChange={
              handleChange === undefined
                ? undefined
                : (formatName): void => {
                    handleChange({
                      ...fieldFilter,
                      fieldFormat: (formatName ?? '') || undefined,
                    });
                  }
            }
          />
        ) : undefined}
      </div>
    </>
  );
}
