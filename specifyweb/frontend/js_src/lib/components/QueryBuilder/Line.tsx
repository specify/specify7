import React from 'react';

import { commonText } from '../../localization/common';
import type { Parser } from '../../utils/parser/definitions';
import { resolveParser } from '../../utils/parser/definitions';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { schema } from '../DataModel/schema';
import { getTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { join } from '../Molecules';
import { TableIcon } from '../Molecules/TableIcon';
import { mappingPathIsComplete } from '../WbPlanView/helpers';
import {
  getMappingLineProps,
  MappingElement,
  mappingElementDivider,
} from '../WbPlanView/LineComponents';
import type { MappingPath } from '../WbPlanView/Mapper';
import {
  formattedEntry,
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
import type { QueryFieldType } from './FieldFilterSpec';
import type { DatePart } from './fieldSpec';
import { QueryFieldSpec } from './fieldSpec';
import { QueryFieldRecordFormatter } from './Formatter';
import type { QueryField } from './helpers';
import { QueryLineFilters } from './QueryLineFilters';
import { QueryLineTools } from './QueryLineTools';
import { useQueryFieldFilterSpecs } from './useQueryFieldFilterSpecs';

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
  const queryFieldFilterSpecs = useQueryFieldFilterSpecs();

  React.useLayoutEffect(() => {
    if (isFocused && lineRef.current?.contains(document.activeElement) !== true)
      lineRef.current?.focus();
  }, [isFocused]);

  const [fieldMeta, setFieldMeta] = React.useState<QueryLineFieldMeta>({
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
      let parser: Parser | undefined = undefined;
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
            : tableName === 'Component' &&
                dataModelField.name === 'catalogNumber'
              ? 'id'
              : tableName === 'CollectionObject' &&
                  dataModelField.name === 'age'
                ? 'age'
                : (parser.type ?? 'text');

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
              /*
               * We want to include all supported types for the filter, not
               * just visible ones
               */
              !Object.keys(
                queryFieldFilterSpecs[filter.type].types ?? {}
              ).includes(fieldType);
            return resetFilter
              ? ({
                  type: 'any',
                  isNot: false,
                  isStrict: false,
                  startValue: '',
                } as const)
              : filter.type === 'any' && filter.isNot
                ? {
                    ...filter,
                    isNot: false,
                    isStrict: false,
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
            typeof fieldMeta.tableName === 'string' &&
            hasAny ? (
              // REFACTOR: move this to the field.filters map
              <QueryFieldRecordFormatter
                formatter={
                  field.filters.find(({ type }) => type === 'any')?.fieldFormat
                }
                tableName={fieldMeta.tableName}
                type={fieldMeta.fieldType}
                onChange={
                  handleChange === undefined
                    ? undefined
                    : (dataObjectFormatter): void => {
                        const filterIndex = field.filters.findIndex(
                          ({ type }) => type === 'any'
                        );
                        handleFilterChange(filterIndex, {
                          ...field.filters[filterIndex],
                          fieldFormat: dataObjectFormatter,
                        });
                      }
                }
              />
            ) : undefined}
          </div>
          <QueryLineFilters
            baseTableName={baseTableName}
            enforceLengthLimit={enforceLengthLimit}
            fieldFilters={field.filters}
            fieldMeta={fieldMeta}
            hasAny={hasAny}
            isBasic={isBasic}
            isFieldComplete={isFieldComplete}
            mappingPath={field.mappingPath}
            queryFieldFilterSpecs={queryFieldFilterSpecs}
            onFilterChange={handleFilterChange}
            onQueryFieldChange={handleChange}
          />
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

export type QueryLineFieldMeta = {
  readonly fieldType: QueryFieldType | undefined;
  readonly parser: Parser | undefined;
  readonly canOpenMap: boolean;
  readonly tableName: keyof Tables | undefined;
};
