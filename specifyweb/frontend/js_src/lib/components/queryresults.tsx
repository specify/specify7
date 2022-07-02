import React from 'react';

import { Http } from '../ajax';
import type { AnySchema } from '../datamodelutils';
import { format } from '../dataobjformatters';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { formsText } from '../localization/forms';
import { hasTablePermission } from '../permissions';
import type { QueryFieldSpec } from '../queryfieldspec';
import { getModelById } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import { hijackBackboneAjax } from '../startapp';
import type { RA } from '../types';
import { defined } from '../types';
import { fieldFormat } from '../uiparse';
import { Input, Link } from './basic';
import { useAsyncState, useLiveState } from './hooks';
import { usePref } from './preferenceshooks';
import { queryIdField } from './queryresultstable';

const needAuditLogFormatting = (fieldSpecs: RA<QueryFieldSpec>): boolean =>
  fieldSpecs.some(({ table }) =>
    ['SpAuditLog', 'SpAuditLogField'].includes(table.name)
  );

async function resourceToLink(
  model: SpecifyModel,
  id: number
): Promise<JSX.Element | string> {
  const resource = new model.Resource({ id });
  let errorHandled = false;
  return hijackBackboneAjax(
    [Http.OK, Http.NOT_FOUND],
    async () =>
      resource
        .fetch()
        .then(async (resource) => format(resource, undefined, true))
        .then((string) =>
          hasTablePermission(resource.specifyModel.name, 'read') ? (
            <Link.NewTab href={resource.viewUrl()}>{string}</Link.NewTab>
          ) : (
            defined(string)
          )
        ),
    (status) => {
      if (status === Http.NOT_FOUND) errorHandled = true;
    }
  ).catch((error) => {
    if (errorHandled)
      return `${model.name} #${id} ${formsText('deletedInline')}`;
    else throw error;
  });
}

function getAuditRecordFormatter(
  fieldSpecs: RA<QueryFieldSpec>,
  hasIdField: boolean
):
  | undefined
  | ((
      resultRow: RA<string | number | null>
    ) => Promise<RA<string | JSX.Element>>) {
  if (!needAuditLogFormatting(fieldSpecs)) return undefined;
  const fields = Array.from(
    fieldSpecs
      .map((fieldSpec) => fieldSpec.getField())
      .map((field) => (field?.isRelationship === false ? field : undefined))
  );

  const modelIdIndex = fields.findIndex((field) => field?.name === 'tableNum');
  if (modelIdIndex <= 0) return undefined;

  const parentModelIdIndex = fields.findIndex(
    (field) => field?.name === 'parentTableNum'
  );
  if (parentModelIdIndex <= 0) return undefined;

  return async (resultRow): Promise<RA<string | JSX.Element>> =>
    Promise.all(
      resultRow
        .filter((_, index) => !hasIdField || index !== queryIdField)
        .map((value, index, row) => {
          if (value === null || value === '') return '';
          const stringValue = value.toString();
          if (fields[index]?.name === 'fieldName') {
            const modelId = row[modelIdIndex];
            return typeof modelId === 'number'
              ? getModelById(modelId).getField(stringValue)?.label ??
                  stringValue
              : modelId ?? '';
          } else if (fields[index]?.name === 'recordId') {
            const modelId = row[modelIdIndex];
            return typeof modelId === 'number'
              ? resourceToLink(getModelById(modelId), Number(value))
              : modelId ?? '';
          } else if (fields[index]?.name === 'parentRecordId') {
            const modelId = row[parentModelIdIndex];
            return typeof modelId === 'number'
              ? resourceToLink(getModelById(modelId), Number(value))
              : modelId ?? '';
          } else
            return fieldFormat(
              fields[index],
              fieldSpecs[index].parser,
              (value ?? '').toString()
            );
        })
    );
}

const getCellClassName = (condenseQueryResults: boolean): string =>
  `border-gray-500 border-r bg-[color:var(--bg)] ${
    condenseQueryResults ? 'p-0.5' : 'p-1'
  } first:border-l ${
    condenseQueryResults ? 'min-h-[theme(spacing.4)' : 'min-h-[theme(spacing.8)'
  }]`;

function QueryResultCell({
  fieldSpec,
  value,
  condenseQueryResults,
}: {
  readonly condenseQueryResults: boolean;
  readonly fieldSpec: QueryFieldSpec | undefined;
  readonly value: JSX.Element | string | number | null;
}): JSX.Element {
  const field = fieldSpec?.getField();

  // TODO: move this hook into parent for performance reasons
  const formatted = React.useMemo<string | number | undefined | JSX.Element>(
    () =>
      typeof value !== 'object' &&
      typeof field === 'object' &&
      !field.isRelationship &&
      typeof fieldSpec === 'object'
        ? fieldFormat(field, fieldSpec.parser, (value ?? '').toString())
        : value ?? '',
    [field, fieldSpec, value]
  );

  return (
    <span
      role="cell"
      className={`${getCellClassName(condenseQueryResults)} ${
        value === null ? 'text-gray-700 dark:text-neutral-500' : ''
      } ${
        fieldSpec?.parser.type === 'number' ? 'tabular-nums justify-end' : ''
      }`}
      title={
        typeof value === 'string' && value !== formatted ? value : undefined
      }
    >
      {value === null
        ? undefined
        : fieldSpec === undefined || typeof value === 'object'
        ? value
        : formatted}
    </span>
  );
}

function QueryResult({
  model,
  fieldSpecs,
  hasIdField,
  result,
  recordFormatter,
  isSelected,
  isLast,
  onSelected: handleSelected,
}: {
  readonly model: SpecifyModel;
  readonly fieldSpecs: RA<QueryFieldSpec>;
  readonly hasIdField: boolean;
  readonly result: RA<string | number | null>;
  readonly recordFormatter?: (
    result: RA<string | number | null>
  ) => Promise<RA<string | JSX.Element>>;
  readonly isSelected: boolean;
  readonly isLast: boolean;
  readonly onSelected?: (isSelected: boolean, isShiftClick: boolean) => void;
}): JSX.Element {
  const [resource] = useLiveState<
    SpecifyResource<AnySchema> | undefined | false
  >(
    React.useCallback((): SpecifyResource<AnySchema> | false => {
      if (!hasIdField) return false;
      return new model.Resource({
        id: result[queryIdField],
      });
    }, [hasIdField, model, result])
  );
  const [formattedValues] = useAsyncState(
    React.useCallback(
      () => recordFormatter?.(result),
      [result, recordFormatter]
    ),
    false
  );
  const [condenseQueryResults] = usePref(
    'queryBuilder',
    'appearance',
    'condenseQueryResults'
  );
  const viewUrl = typeof resource === 'object' ? resource.viewUrl() : undefined;

  return (
    <div
      role="row"
      className={`even:[--bg:transparent] odd:[--bg:theme(colors.gray.100)]
        odd:dark:[--bg:theme(colors.neutral.700)]
        ${condenseQueryResults ? 'text-sm' : ''}
      `}
      onClick={
        typeof handleSelected === 'function'
          ? ({ target, shiftKey }): void =>
              /*
               * Ignore clicks on the "View" links and formatted audit log cell
               * links
               */
              (target as Element).closest('a') === null
                ? handleSelected?.(!isSelected, shiftKey)
                : undefined
          : undefined
      }
    >
      {hasIdField && (
        <>
          <span
            role="cell"
            className={`${getCellClassName(condenseQueryResults)} sticky
              ${isLast ? 'rounded-bl' : ''}
            `}
          >
            <Input.Checkbox
              checked={isSelected}
              /* Ignore click event, as click would be handled by onClick on row */
              onChange={f.undefined}
            />
          </span>
          <span
            role="cell"
            className={`${getCellClassName(condenseQueryResults)} sticky`}
          >
            <Link.NewTab
              className="print:hidden"
              href={viewUrl}
              role="row"
              rel="noreferrer"
            />
          </span>
        </>
      )}
      {result
        .filter((_, index) => !hasIdField || index !== queryIdField)
        .map((value, index) => (
          <QueryResultCell
            key={index}
            value={formattedValues?.[index] ?? value}
            fieldSpec={
              formattedValues?.[index] === undefined
                ? fieldSpecs[index]
                : undefined
            }
            condenseQueryResults={condenseQueryResults}
          />
        ))}
    </div>
  );
}

export function QueryResults({
  model,
  fieldSpecs,
  hasIdField,
  results,
  selectedRows,
  onSelected: handleSelected,
}: {
  readonly model: SpecifyModel;
  readonly fieldSpecs: RA<QueryFieldSpec>;
  readonly hasIdField: boolean;
  readonly results: RA<RA<string | number | null>>;
  readonly selectedRows: Set<number>;
  readonly onSelected: (
    id: number,
    isSelected: boolean,
    isShiftClick: boolean
  ) => void;
}): JSX.Element {
  const recordFormatter = React.useMemo(
    () => getAuditRecordFormatter(fieldSpecs, hasIdField),
    [fieldSpecs, hasIdField]
  );
  return (
    <>
      {results.map((result, index, { length }) => (
        <QueryResult
          key={index}
          model={model}
          fieldSpecs={fieldSpecs}
          hasIdField={hasIdField}
          result={result}
          recordFormatter={recordFormatter}
          isSelected={
            hasIdField &&
            selectedRows.has(results[index][queryIdField] as number)
          }
          isLast={index + 1 === length}
          onSelected={
            hasIdField
              ? (isSelected, isShiftClick): void =>
                  handleSelected(
                    result[queryIdField] as number,
                    isSelected,
                    isShiftClick
                  )
              : undefined
          }
        />
      ))}
    </>
  );
}
