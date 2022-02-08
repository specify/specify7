import React from 'react';

import type { Tables } from '../datamodel';
import commonText from '../localization/common';
import queryText from '../localization/query';
import type { QueryField } from '../querybuilderutils';
import { getModel } from '../schema';
import type { RA } from '../types';
import { defined, filterArray } from '../types';
import { getParser, Parser } from '../uiparse';
import { getMappingLineData } from '../wbplanviewnavigator';
import { mappingPathIsComplete } from '../wbplanviewutils';
import { Button, className } from './basic';
import type {
  CustomSelectSubtype,
  CustomSelectType,
} from './customselectelement';
import { icons } from './icons';
import { dateParts } from './internationalization';
import type { QueryFieldType } from './querybuilderfieldinput';
import {
  QueryFieldFilter,
  queryFieldFilters,
  QueryLineFilter,
} from './querybuilderfieldinput';
import type { MappingElementProps } from './wbplanviewcomponents';
import {
  getMappingLineProps,
  MappingElement,
  mappingElementDivider,
} from './wbplanviewcomponents';
import { LiteralField } from '../specifyfield';
import { DatePart } from '../queryfieldspec';

export function QueryLine({
  baseTableName,
  field,
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
  readonly baseTableName: Lowercase<keyof Tables>;
  readonly field: QueryField;
  readonly onChange: (newField: QueryField) => void;
  readonly onMappingChange: (payload: {
    readonly index: number;
    readonly close: boolean;
    readonly newValue: string;
    readonly isRelationship: boolean;
    readonly parentTableName: string;
    readonly currentTableName: string;
    readonly newTableName: string;
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

  const [lineProps, setLineProps] = React.useState<RA<MappingElementProps>>([]);
  const [parser, setParser] = React.useState<Parser | undefined>(undefined);
  const previousField = React.useRef<LiteralField | undefined>(undefined);

  React.useEffect(() => {
    const lineData = getMappingLineData({
      baseTableName,
      mappingPath: field.mappingPath,
      iterate: true,
      showHiddenFields,
      generateFieldData: 'all',
    });

    let details = field.details;
    let filter = field.filter;
    let fieldType: QueryFieldType | undefined = undefined;
    if (mappingPathIsComplete(field.mappingPath)) {
      const tableName = defined(lineData.slice(-1)[0].tableName);
      const dataModelField = defined(
        getModel(tableName)?.getLiteralField(field.mappingPath.slice(-1)[0])
      );
      const parser = defined(
        getParser({
          ...dataModelField,
          datePart:
            field.details.type === 'dateField'
              ? field.details.datePart
              : undefined,
        })
      );
      if (dataModelField !== previousField.current) setParser(parser);
      previousField.current = dataModelField;
      if (parser.type === 'date')
        details ??= { type: 'dateField', datePart: 'fullDate' };
      fieldType =
        tableName === 'CollectionObject' &&
        field.mappingPath.slice(-1)[0] === 'catalogNumber'.toLowerCase()
          ? 'id'
          : parser.type ?? 'text';
      if (queryFieldFilters[filter].types?.includes(fieldType) === false)
        filter = 'any';
    } else {
      setParser(undefined);
      previousField.current = undefined;
      details = { type: 'regularField' };
      filter = 'any';
    }

    if (field.details !== details || field.filter !== filter)
      handleChange({
        ...field,
        details,
        filter,
      });

    const filteredLineData = filterArray(
      lineData.map((mappingElementProps, index) =>
        mappingElementProps.customSelectSubtype === 'toMany'
          ? undefined
          : {
              ...mappingElementProps,
              fieldsData: {
                ...(lineData[index - 1]?.customSelectSubtype === 'toMany'
                  ? {
                      _aggregated: {
                        optionLabel: queryText('aggregated'),
                        tableName: mappingElementProps.tableName,
                        isRelationship: false,
                        isDefault: field.mappingPath[index] === '_aggregated',
                      },
                    }
                  : mappingElementProps?.customSelectSubtype === 'simple' &&
                    index !== 0
                  ? {
                      _formatted: {
                        optionLabel: queryText('formatted'),
                        tableName: mappingElementProps.tableName,
                        isRelationship: false,
                        isDefault: field.mappingPath[index] === '_formatted',
                      },
                    }
                  : {}),
                ...mappingElementProps.fieldsData,
              },
            }
      )
    );

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
                (typeof fieldType === 'string' && types.includes(fieldType))
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
      // TODO: detect outside click
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

    setLineProps(lineProps);
  }, [
    baseTableName,
    field,
    showHiddenFields,
    handleMappingChange,
    handleOpen,
    handleClose,
    openedElement,
    handleChange,
  ]);

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
        // TODO: deduplicate this logic here and in mapping view
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
                  // TODO: remove extra classNames
                  className={`
                    aria-handled
                    ${field.isNot ? className.redButton : ''}
                    op-negate
                    field-state-hide
                    operation-state-show
                    datepart-state-hide
                  `}
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
        {typeof parser === 'object' && (
          <QueryLineFilter
            field={field}
            parser={parser}
            onChange={handleChange}
          />
        )}
      </div>
      <div className="contents print:hidden">
        <Button.Simple
          title={queryText('showButtonDescription')}
          aria-label={queryText('showButtonDescription')}
          className={`
            aria-handled
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
