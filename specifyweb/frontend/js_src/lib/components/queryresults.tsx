import React from 'react';

import { Http } from '../ajax';
import type { AnySchema } from '../datamodelutils';
import { format } from '../dataobjformatters';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { formsText } from '../localization/forms';
import type { QueryFieldSpec } from '../queryfieldspec';
import { getModelById } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import { hijackBackboneAjax } from '../startapp';
import type { RA } from '../types';
import { fieldFormat } from '../uiparse';
import { Input, Link } from './basic';
import { useAsyncState } from './hooks';
import { queryIdField } from './queryresultstable';
import { usePref } from './preferenceshooks';

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
  const genericFormatted = `${model.name} #${id}`;
  return hijackBackboneAjax(
    [Http.OK, Http.NOT_FOUND],
    async () =>
      resource
        .fetch()
        .then(format)
        .then((string) => (
          <Link.NewTab href={resource.viewUrl()}>
            {string ?? genericFormatted}
          </Link.NewTab>
        )),
    (status) => {
      if (status === Http.NOT_FOUND) errorHandled = true;
    }
  ).catch((error) => {
    if (errorHandled)
      return `${genericFormatted} ${formsText('deletedInline')}`;
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

  const modelId = fields.findIndex((field) => field?.name === 'tableNum');
  if (modelId === -1) return undefined;
  const model = getModelById(modelId);

  const parentModelId = fields.findIndex(
    (field) => field?.name === 'parentTableNum'
  );
  if (parentModelId === -1) return undefined;
  const parentModel = getModelById(parentModelId);

  return async (resultRow): Promise<RA<string | JSX.Element>> =>
    Promise.all(
      resultRow
        .filter((_, index) => !hasIdField || index !== queryIdField)
        .map(async (value, index) => {
          if (value === null || value === '') return '';
          const stringValue = value.toString();
          if (fields[index]?.name === 'fieldName')
            return model.getField(stringValue)?.label ?? stringValue;
          else if (fields[index]?.name === 'recordId')
            return resourceToLink(model, Number(value));
          else if (fields[index]?.name === 'parentRecordId')
            return resourceToLink(parentModel, Number(value));
          else
            return fieldFormat(
              fields[index],
              fieldSpecs[index].parser,
              (value ?? '').toString()
            );
        })
    );
}

function getClassName(condensedQueryResult) {
  return `border-gray-500 border-r bg-[color:var(--bg)] p-${
    condensedQueryResult ? '0.5' : '1'
  } first:border-l min-h-[theme(spacing.${condensedQueryResult ? '4' : '8'} )]`;
}

function QueryResultCell({
  fieldSpec,
  value,
  condensedQueryResult,
}: {
  readonly condensedQueryResult: boolean;
  readonly fieldSpec: QueryFieldSpec | undefined;
  readonly value: JSX.Element | string | number | null;
}): JSX.Element {
  const field = fieldSpec?.getField();

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
      className={`${getClassName(condensedQueryResult)} ${
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
        : typeof fieldSpec === 'undefined' || typeof value === 'object'
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
  readonly onSelected?: (isSelected: boolean, isShiftClick: boolean) => void;
}): JSX.Element {
  const [resource] = React.useState<
    SpecifyResource<AnySchema> | undefined | false
  >((): SpecifyResource<AnySchema> | false => {
    if (!hasIdField) return false;
    return new model.Resource({
      id: result[queryIdField],
    });
  });
  const [formattedValues] = useAsyncState(
    React.useCallback(
      () => recordFormatter?.(result),
      [result, recordFormatter]
    ),
    false
  );
  const [condensedQueryResult] = usePref(
    'queryBuilder',
    'appearance',
    'condensedQueryResult'
  );
  const cells = result
    .filter((_, index) => !hasIdField || index !== queryIdField)
    .map((value, index) => (
      <QueryResultCell
        key={index}
        value={formattedValues?.[index] ?? value}
        fieldSpec={
          typeof formattedValues?.[index] === 'undefined'
            ? fieldSpecs[index]
            : undefined
        }
        condensedQueryResult={condensedQueryResult}
      />
    ));
  console.log('fieldSpecs: ', fieldSpecs);
  const viewUrl = typeof resource === 'object' ? resource.viewUrl() : undefined;

  return (
    <div
      role="row"
      className={`query-result sticky even:[--bg:transparent]
        odd:[--bg:theme(colors.gray.100)]
        odd:dark:[--bg:theme(colors.neutral.700)] ${
          condensedQueryResult ? 'text-sm' : ''
        }`}
      onClick={
        typeof handleSelected === 'function'
          ? ({ target, shiftKey }): void =>
              // Ignore clicks on the "View" links
              (target as Element).closest('a') === null
                ? handleSelected?.(!isSelected, shiftKey)
                : undefined
          : undefined
      }
    >
      {typeof handleSelected === 'function' && (
        <span
          role="cell"
          className={`${getClassName(condensedQueryResult)} sticky`}
        >
          <Input.Checkbox
            checked={isSelected}
            /* Ignore click event, as click would be handled by onClick on row */
            onChange={f.undefined}
          />
        </span>
      )}
      {typeof viewUrl === 'string' && (
        <span
          role="cell"
          className={`${getClassName(condensedQueryResult)} sticky`}
        >
          <Link.NewTab
            className="print:hidden"
            href={viewUrl}
            role="row"
            rel="noreferrer"
          />
        </span>
      )}
      {cells}
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
  readonly onSelected?: (
    id: number,
    isSelected: boolean,
    isShiftClick: boolean
  ) => void;
}): JSX.Element {
  // FIXME: test distinct query on audit log
  const recordFormatter = React.useMemo(
    () => getAuditRecordFormatter(fieldSpecs, hasIdField),
    [fieldSpecs, hasIdField]
  );
  return (
    <div role="rowgroup">
      {results.map((result, index) => (
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
          onSelected={
            typeof handleSelected === 'function' && hasIdField
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
    </div>
  );
}
