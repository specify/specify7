import React from 'react';

import { commonText } from '../../localization/common';
import { localityText } from '../../localization/locality';
import { queryText } from '../../localization/query';
import type { Parser } from '../../utils/parser/definitions';
import { resolveParser } from '../../utils/parser/definitions';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Select } from '../Atoms/Form';
import { iconClassName, icons } from '../Atoms/Icons';
import { getModel, schema } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';
import { join } from '../Molecules';
import { customSelectElementBackground } from '../WbPlanView/CustomSelectElement';
import { mappingPathIsComplete } from '../WbPlanView/helpers';
import {
  getMappingLineProps,
  MappingElement,
  mappingElementDivider,
  mappingElementDividerClassName,
} from '../WbPlanView/LineComponents';
import type { MappingPath } from '../WbPlanView/Mapper';
import {
  mappingPathToString,
  parsePartialField,
  valueIsPartialField,
} from '../WbPlanView/mappingHelpers';
import {
  getMappingLineData,
  getTableFromMappingPath,
} from '../WbPlanView/navigator';
import type { QueryFieldFilter, QueryFieldType } from './FieldFilter';
import {
  filtersWithDefaultValue,
  queryFieldFilters,
  QueryLineFilter,
} from './FieldFilter';
import type { DatePart } from './fieldSpec';
import type { QueryField } from './helpers';
import { mutateLineData, sortTypes } from './helpers';

// REFACTOR: split this component into smaller components
export function QueryLine({
  baseTableName,
  field,
  fieldHash,
  enforceLengthLimit = false,
  isFocused,
  openedElement,
  showHiddenFields,
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
  readonly baseTableName: keyof Tables;
  readonly field: QueryField;
  readonly fieldHash: string;
  readonly enforceLengthLimit?: boolean;
  readonly isFocused: boolean;
  readonly openedElement: number | undefined;
  readonly showHiddenFields: boolean;
  readonly getMappedFields: (mappingPathFilter: MappingPath) => RA<string>;
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
  }>({ fieldType: undefined, parser: undefined, canOpenMap: false });

  React.useEffect(
    () => {
      const partialField = field.mappingPath.at(-1) ?? '';
      const [fieldName, datePart] = valueIsPartialField(partialField)
        ? parsePartialField<DatePart>(partialField)
        : [field.mappingPath.at(-1)!, undefined];
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
            : parser.type ?? 'text';

        canOpenMap = fieldName === 'latitude1' || fieldName === 'longitude1';
      }

      const updatedFilters = hasParser
        ? field.filters.map((filter) => {
            const resetFilter =
              fieldType === undefined ||
              queryFieldFilters[filter.type].types?.includes(fieldType) ===
                false;
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

      setFieldMeta({ parser, fieldType, canOpenMap });

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

  const availableFilters = Object.entries(queryFieldFilters).filter(
    ([filterName, { types }]) =>
      typeof fieldMeta.fieldType === 'string'
        ? !Array.isArray(types) || types.includes(fieldMeta.fieldType)
        : filterName === 'any'
  );
  const filtersVisible =
    availableFilters.length > 1 || availableFilters[0][0] !== 'any';

  const hasAny = field.filters.some(({ type }) => type === 'any');

  return (
    <div
      aria-current={isFocused ? 'location' : undefined}
      className="flex flex-1 gap-2 border-t border-t-gray-500 bg-[color:var(--form-foreground)] py-2"
    >
      {typeof handleRemove === 'function' && (
        <Button.Small
          aria-label={commonText.remove()}
          className="print:hidden"
          title={commonText.remove()}
          variant={className.redButton}
          onClick={handleRemove}
        >
          {icons.trash}
        </Button.Small>
      )}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className={`
          flex flex-1 flex-wrap gap-2 print:gap-1
          ${field.filters.length > 1 ? 'items-baseline' : 'items-center'}
          ${isFocused ? 'rounded bg-gray-300 dark:bg-neutral-700' : ''}
        `}
        ref={lineRef}
        role="list"
        tabIndex={0}
        // Same key bindings as in WbPlanView
        onClick={(): void => handleLineFocus('current')}
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
      >
        <div
          className={
            field.filters.length > 1 ? 'flex flex-wrap gap-2' : 'contents'
          }
        >
          {join(
            mappingLineProps.map((mappingDetails) => (
              <MappingElement {...mappingDetails} role="listitem" />
            )),
            mappingElementDivider
          )}
        </div>
        {filtersVisible && (
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
                  <>
                    {mappingElementDivider}
                    {!hasAny && (
                      <Button.Small
                        aria-label={queryText.or()}
                        aria-pressed={field.filters.length > 1}
                        className={`
                          print:hidden
                          ${className.ariaHandled}
                          ${isFieldComplete ? '' : 'invisible'}
                        `}
                        disabled={handleChange === undefined}
                        title={queryText.or()}
                        variant={
                          field.filters.length > 1
                            ? className.blueButton
                            : className.lightGrayButton
                        }
                        onClick={(): void =>
                          handleFilterChange(field.filters.length, {
                            type: 'any',
                            isNot: false,
                            startValue: '',
                          })
                        }
                      >
                        {icons.plus}
                      </Button.Small>
                    )}
                  </>
                ) : (
                  <>
                    <span className={mappingElementDividerClassName}>
                      <span
                        className={`
                          flex items-center justify-center uppercase
                          ${iconClassName}
                        `}
                      >
                        {queryText.or()}
                      </span>
                    </span>
                    <Button.Small
                      aria-label={commonText.remove()}
                      className="print:hidden"
                      disabled={handleChange === undefined}
                      title={commonText.remove()}
                      variant={className.redButton}
                      onClick={(): void => handleFilterChange(index, undefined)}
                    >
                      {icons.trash}
                    </Button.Small>
                  </>
                )}
                {field.filters[index].type !== 'any' && (
                  <Button.Small
                    aria-label={queryText.negate()}
                    aria-pressed={field.filters[index].isNot}
                    className={className.ariaHandled}
                    disabled={handleChange === undefined}
                    title={queryText.negate()}
                    variant={
                      field.filters[index].isNot
                        ? className.redButton
                        : className.lightGrayButton
                    }
                    onClick={(): void =>
                      handleFilterChange(index, {
                        ...field.filters[index],
                        isNot: !field.filters[index].isNot,
                      })
                    }
                  >
                    {icons.ban}
                  </Button.Small>
                )}
                <div>
                  <Select
                    aria-label={
                      queryFieldFilters[field.filters[index].type]
                        .description ?? commonText.filter()
                    }
                    className={customSelectElementBackground}
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
                {typeof fieldMeta.parser === 'object' && (
                  <QueryLineFilter
                    enforceLengthLimit={enforceLengthLimit}
                    fieldName={mappingPathToString(field.mappingPath)}
                    filter={field.filters[index]}
                    parser={fieldMeta.parser}
                    terminatingField={
                      isFieldComplete
                        ? schema.models[baseTableName].getField(
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
            ))}
          </div>
        )}
      </div>
      <div className="contents print:hidden">
        {fieldMeta.canOpenMap && typeof handleOpenMap === 'function' ? (
          <Button.Small
            aria-label={localityText.openMap()}
            title={localityText.openMap()}
            variant={className.blueButton}
            onClick={handleOpenMap}
          >
            {icons.locationMarker}
          </Button.Small>
        ) : undefined}
        <Button.Small
          aria-label={queryText.showButtonDescription()}
          aria-pressed={field.isDisplay}
          className={`${className.ariaHandled} ${
            isFieldComplete ? '' : 'invisible'
          }`}
          title={queryText.showButtonDescription()}
          variant={
            field.isDisplay ? className.greenButton : className.lightGrayButton
          }
          onClick={handleChange?.bind(undefined, {
            ...field,
            isDisplay: !field.isDisplay,
          })}
        >
          {icons.check}
        </Button.Small>
        <Button.Small
          aria-label={
            field.sortType === 'ascending'
              ? queryText.ascendingSort()
              : field.sortType === 'descending'
              ? queryText.descendingSort()
              : queryText.sort()
          }
          className={isFieldComplete ? undefined : 'invisible'}
          title={
            field.sortType === 'ascending'
              ? queryText.ascendingSort()
              : field.sortType === 'descending'
              ? queryText.descendingSort()
              : queryText.sort()
          }
          onClick={handleChange?.bind(undefined, {
            ...field,
            sortType:
              sortTypes[
                (sortTypes.indexOf(field.sortType) + 1) % sortTypes.length
              ],
          })}
        >
          {field.sortType === 'ascending'
            ? icons.arrowCircleUp
            : field.sortType === 'descending'
            ? icons.arrowCircleDown
            : icons.circle}
        </Button.Small>
        <Button.Small
          aria-label={queryText.moveUp()}
          title={queryText.moveUp()}
          onClick={handleMoveUp}
        >
          {icons.chevronUp}
        </Button.Small>
        <Button.Small
          aria-label={queryText.moveDown()}
          title={queryText.moveDown()}
          onClick={handleMoveDown}
        >
          {icons.chevronDown}
        </Button.Small>
      </div>
    </div>
  );
}
