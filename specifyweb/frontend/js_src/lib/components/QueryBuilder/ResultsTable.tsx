import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useLiveState } from '../../hooks/useLiveState';
import { syncFieldFormat } from '../../utils/fieldFormat';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Input } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { userPreferences } from '../Preferences/userPreferences';
import { getAuditRecordFormatter } from './AuditLogFormatter';
import type { QueryFieldSpec } from './fieldSpec';
import type { QueryResultRow } from './Results';
import { queryIdField } from './Results';

export function QueryResultsTable({
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
  readonly results: RA<QueryResultRow>;
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
        <Row
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

function Row({
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
  readonly result: QueryResultRow;
  readonly recordFormatter?: (
    result: QueryResultRow
  ) => Promise<RA<JSX.Element | string>>;
  readonly isSelected: boolean;
  readonly isLast: boolean;
  readonly onSelected?: (isSelected: boolean, isShiftClick: boolean) => void;
}): JSX.Element {
  // REFACTOR: replace this with getResourceViewUrl()
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
  const [condenseQueryResults] = userPreferences.use(
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
        .map((value, index) =>
          fieldSpecs[index].isPhantom ? undefined : (
            <Cell
              condenseQueryResults={condenseQueryResults}
              fieldSpec={
                formattedValues?.[index] === undefined
                  ? fieldSpecs[index]
                  : undefined
              }
              key={index}
              value={formattedValues?.[index] ?? value}
            />
          )
        )}
    </div>
  );
}

const getCellClassName = (condenseQueryResults: boolean): string =>
  `border-gray-500 border-r bg-[color:var(--bg)] ${
    condenseQueryResults ? 'p-0.5' : 'p-1'
  } first:border-l ${
    condenseQueryResults ? 'min-h-[theme(spacing.4)' : 'min-h-[theme(spacing.8)'
  }]`;

function Cell({
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
        (typeof value === 'string' || typeof value === 'number') &&
        value !== formatted
          ? value.toString()
          : undefined
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
