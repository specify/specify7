import React from 'react';

import type { Tables } from '../datamodel';
import commonText from '../localization/common';
import queryText from '../localization/query';
import type { QueryField } from '../querybuilderutils';
import { mutateLineData } from '../querybuilderutils';
import type { DatePart } from '../queryfieldspec';
import { getModel } from '../schema';
import { defined, filterArray } from '../types';
import type { Parser } from '../uiparse';
import { resolveParser } from '../uiparse';
import {
  getMappingLineData,
  getTableFromMappingPath,
} from '../wbplanviewnavigator';
import { mappingPathIsComplete } from '../wbplanviewutils';
import { Button, className } from './basic';
import type {
  CustomSelectSubtype,
  CustomSelectType,
} from './customselectelement';
import { icons } from './icons';
import { dateParts } from './internationalization';
import type {
  QueryFieldFilter,
  QueryFieldType,
} from './querybuilderfieldinput';
import { queryFieldFilters, QueryLineFilter } from './querybuilderfieldinput';
import createBackboneView from './reactbackboneextend';
import {
  getMappingLineProps,
  MappingElement,
  mappingElementDivider,
} from './wbplanviewcomponents';

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
}): JSX.Element {
  const lineRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (isFocused && lineRef.current?.contains(document.activeElement) !== true)
      lineRef.current?.focus();
  }, [isFocused]);

  const [fieldMeta, setFieldMeta] = React.useState<{
    readonly fieldType: QueryFieldType | undefined;
    readonly pickListName: string | undefined;
    readonly parser: Parser | undefined;
  }>({ fieldType: undefined, pickListName: undefined, parser: undefined });

  React.useEffect(() => {
    let details = field.details;
    let filter = field.filter;
    let fieldType: QueryFieldType | undefined = undefined;
    let parser;
    let pickListName = undefined;

    const tableName =
      mappingPathIsComplete(field.mappingPath) &&
      !field.mappingPath.slice(-1)[0].startsWith('_')
        ? getTableFromMappingPath(baseTableName, field.mappingPath)
        : undefined;
    const dataModelField = getModel(tableName ?? '')?.getField(
      field.mappingPath.slice(-1)[0]
    );
    if (
      typeof dataModelField === 'object' &&
      !dataModelField.isRelationship &&
      mappingPathIsComplete(field.mappingPath)
    ) {
      pickListName = dataModelField.getPickList();

      if (dataModelField.isTemporal() && details.type !== 'dateField')
        details = { type: 'dateField', datePart: 'fullDate' };
      else if (!dataModelField.isTemporal() && details.type !== 'regularField')
        details = { type: 'regularField' };

      parser = defined(
        resolveParser(dataModelField, {
          datePart: details.type === 'dateField' ? details.datePart : undefined,
          isRequired: true,
        })
      );

      fieldType =
        tableName === 'CollectionObject' &&
        field.mappingPath.slice(-1)[0] === 'catalogNumber'.toLowerCase()
          ? 'id'
          : parser.type ?? 'text';
      if (queryFieldFilters[filter].types?.includes(fieldType) === false)
        filter = 'any';
    }
    // TODO: define parser and fieldType for (formatted) and (aggregated)
    else {
      parser = undefined;
      filter = 'any';
      if (details.type !== 'regularField') details = { type: 'regularField' };
    }

    setFieldMeta({ parser, fieldType, pickListName });

    if (field.details !== details || field.filter !== filter)
      handleChange({
        ...field,
        details,
        filter,
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
  });

  /*
   * TODO: test queries on tree ranks and tree fields (and (any))
   * TODO: test formatters and aggregators
   */
  const filteredLineData = mutateLineData(lineData, field.mappingPath);

  const fieldOptionsByIndex = {
    [filteredLineData.length]:
      field.details.type === 'dateField' ? 'datePart' : undefined,
    [filteredLineData.length + (field.details.type === 'dateField' ? 1 : 0)]:
      'filter',
  } as const;

  const fieldOptions = filterArray([
    field.details.type === 'dateField'
      ? {
          fieldsData: Object.fromEntries(
            Object.entries(dateParts).map(([partName, optionLabel]) => [
              partName,
              {
                optionLabel,
                isDefault:
                  field.details.type === 'dateField' &&
                  field.details.datePart === partName,
              },
            ])
          ),
          selectLabel: queryText('datePart'),
          customSelectSubtype: 'simple' as CustomSelectSubtype,
        }
      : undefined,
    {
      customSelectSubtype: 'simple' as CustomSelectSubtype,
      selectLabel: queryText('filter'),
      fieldsData: Object.fromEntries(
        filterArray(
          Object.entries(queryFieldFilters).map(
            ([filterName, { label, types }]) =>
              !Array.isArray(types) ||
              (typeof fieldMeta.fieldType === 'string' &&
                types.includes(fieldMeta.fieldType))
                ? [
                    filterName,
                    {
                      optionLabel: label,
                      isDefault: filterName === field.filter,
                    },
                  ]
                : undefined
          )
        )
      ),
    },
  ]);

  const lineProps = getMappingLineProps({
    mappingLineData: [...filteredLineData, ...fieldOptions],
    customSelectType: 'CLOSED_LIST',
    onChange: (payload) => {
      if (fieldOptionsByIndex[payload.index] === 'datePart')
        handleChange({
          ...field,
          details: {
            type: 'dateField',
            datePart: payload.newValue as DatePart,
          },
        });
      else if (fieldOptionsByIndex[payload.index] === 'filter')
        handleChange({
          ...field,
          filter: payload.newValue as QueryFieldFilter,
        });
      else handleMappingChange(payload);
    },
    onOpen: handleOpen,
    onClose: handleClose,
    openSelectElement: openedElement,
  }).map((elementProps, index) =>
    typeof fieldOptionsByIndex[index] === 'string'
      ? {
          ...elementProps,
          customSelectType: 'OPTIONS_LIST' as CustomSelectType,
        }
      : elementProps
  );

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
        className={`flex-1 print:gap-1 flex flex-wrap items-center gap-2 ${
          isFocused ? 'bg-gray-300 dark:bg-neutral-700 rounded' : ''
        }`}
        role="list"
        /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
        tabIndex={0}
        onClick={(): void => handleLineFocus('current')}
        // Same key bindings as in WbPlanView
        onKeyDown={({ key }): void => {
          if (typeof openedElement === 'number') {
            if (key === 'ArrowLeft')
              if (openedElement > 0) handleOpen(openedElement - 1);
              else handleClose();
            else if (key === 'ArrowRight')
              if (openedElement + 1 < lineProps.length)
                handleOpen(openedElement + 1);
              else handleClose();

            return;
          }

          if (key === 'ArrowLeft') handleOpen(lineProps.length - 1);
          else if (key === 'ArrowRight' || key === 'Enter') handleOpen(0);
          else if (key === 'ArrowUp') handleLineFocus('previous');
          else if (key === 'ArrowDown') handleLineFocus('next');
        }}
        ref={lineRef}
      >
        {lineProps
          .filter(({ customSelectType }) => customSelectType !== 'OPTIONS_LIST')
          .map((mappingDetails, index) => (
            <React.Fragment key={index}>
              <MappingElement {...mappingDetails} role="listitem" />
              {index + 1 !== lineProps.length && mappingElementDivider}
            </React.Fragment>
          ))}
        {lineProps
          .filter(({ customSelectType }) => customSelectType === 'OPTIONS_LIST')
          .map((mappingDetails, index, { length }) => (
            <React.Fragment key={index}>
              {index + 1 === length && field.filter !== 'any' ? (
                <Button.Simple
                  title={queryText('negate')}
                  aria-label={queryText('negate')}
                  className={`aria-handled ${
                    field.isNot ? className.redButton : ''
                  }`}
                  onClick={(): void =>
                    handleChange({
                      ...field,
                      isNot: !field.isNot,
                    })
                  }
                  aria-pressed={field.isNot}
                >
                  {icons.ban}
                </Button.Simple>
              ) : undefined}
              <MappingElement {...mappingDetails} role="listitem" />
              {index + 1 !== length && mappingElementDivider}
            </React.Fragment>
          ))}
        {typeof fieldMeta.parser === 'object' && (
          <QueryLineFilter
            field={field}
            parser={fieldMeta.parser}
            pickListName={fieldMeta.pickListName}
            onChange={(startValue): void =>
              handleChange({
                ...field,
                startValue,
              })
            }
          />
        )}
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
                field.sortType === 'ascending'
                  ? 'descending'
                  : field.sortType === 'descending'
                  ? undefined
                  : 'ascending',
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
