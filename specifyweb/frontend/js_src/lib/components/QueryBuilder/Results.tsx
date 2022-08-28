import React from 'react';

import { Http } from '../../utils/ajax/helpers';
import type { AnySchema } from '../DataModel/helpers';
import { format } from '../Forms/dataObjFormatters';
import { f } from '../../utils/functools';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { formsText } from '../../localization/forms';
import { hasTablePermission } from '../Permissions/helpers';
import type { QueryFieldSpec } from './fieldSpec';
import { getModelById } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { hijackBackboneAjax } from '../../utils/ajax/backboneAjax';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { fieldFormat, syncFieldFormat } from '../../utils/uiParse';
import { Input, Link } from '../Atoms/Basic';
import { useAsyncState, useLiveState } from '../../hooks/hooks';
import { usePref } from '../UserPreferences/Hooks';
import { queryIdField } from './ResultsTable';

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
  | ((
      resultRow: RA<number | string | null>
    ) => Promise<RA<JSX.Element | string>>)
  | undefined {
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

  return async (resultRow): Promise<RA<JSX.Element | string>> =>
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
  readonly value: JSX.Element | number | string | null;
}): JSX.Element {
  const field = fieldSpec?.getField();

  // REFACTOR: move this hook into parent for performance reasons
  const formatted = React.useMemo<JSX.Element | number | string | undefined>(
    () =>
      typeof value !== 'object' &&
      typeof field === 'object' &&
      !field.isRelationship &&
      typeof fieldSpec === 'object' &&
      !field.isTemporal()
        ? syncFieldFormat(field, fieldSpec.parser, (value ?? '').toString())
        : value ?? '',
    [field, fieldSpec, value]
  );

  return (
    <span
      className={`
        ${getCellClassName(condenseQueryResults)}
        ${value === null ? 'text-gray-700 dark:text-neutral-500' : ''}
        ${fieldSpec?.parser.type === 'number' ? 'justify-end tabular-nums' : ''}
      `}
      role="cell"
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
  readonly result: RA<number | string | null>;
  readonly recordFormatter?: (
    result: RA<number | string | null>
  ) => Promise<RA<JSX.Element | string>>;
  readonly isSelected: boolean;
  readonly isLast: boolean;
  readonly onSelected?: (isSelected: boolean, isShiftClick: boolean) => void;
}): JSX.Element {
  const [resource] = useLiveState<
    SpecifyResource<AnySchema> | false | undefined
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
      className={`
        odd:[--bg:theme(colors.gray.100)] even:[--bg:transparent]
        odd:dark:[--bg:theme(colors.neutral.700)]
        ${condenseQueryResults ? 'text-sm' : ''}
      `}
      role="row"
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
      {typeof viewUrl === 'string' && (
        <>
          <span
            className={`
              ${getCellClassName(condenseQueryResults)} sticky
              ${isLast ? 'rounded-bl' : ''}
            `}
            role="cell"
          >
            <Input.Checkbox
              checked={isSelected}
              /* Ignore click event, as click would be handled by onClick on row */
              onChange={f.undefined}
            />
          </span>
          <span
            className={`${getCellClassName(condenseQueryResults)} sticky`}
            role="cell"
          >
            <Link.NewTab
              className="print:hidden"
              href={viewUrl}
              rel="noreferrer"
            />
          </span>
        </>
      )}
      {result
        .filter((_, index) => !hasIdField || index !== queryIdField)
        .map((value, index) => (
          <QueryResultCell
            condenseQueryResults={condenseQueryResults}
            fieldSpec={
              formattedValues?.[index] === undefined
                ? fieldSpecs[index]
                : undefined
            }
            key={index}
            value={formattedValues?.[index] ?? value}
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
  readonly results: RA<RA<number | string | null>>;
  readonly selectedRows: ReadonlySet<number>;
  readonly onSelected: (
    index: number,
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
          fieldSpecs={fieldSpecs}
          hasIdField={hasIdField}
          isLast={index + 1 === length}
          isSelected={
            hasIdField &&
            selectedRows.has(results[index][queryIdField] as number)
          }
          key={index}
          model={model}
          recordFormatter={recordFormatter}
          result={result}
          onSelected={
            hasIdField
              ? (isSelected, isShiftClick): void =>
                  handleSelected(index, isSelected, isShiftClick)
              : undefined
          }
        />
      ))}
    </>
  );
}
