import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { syncFieldFormat } from '../Formatters/fieldFormat';
import { userPreferences } from '../Preferences/userPreferences';
import { getAuditRecordFormatter } from './AuditLogFormatter';
import type { QueryFieldSpec } from './fieldSpec';
import type { QueryResultRow } from './Results';
import { queryIdField } from './Results';
import { RecordSelectorFromIds } from '../FormSliders/RecordSelectorFromIds';

export function QueryResultsTable({
  table,
  fieldSpecs,
  results,
  selectedRows,
  onSelected: handleSelected,
  onDelete: handleDelete,
  onFetchMore: handleFetchMore,
}: {
  readonly table: SpecifyTable;
  readonly fieldSpecs: RA<QueryFieldSpec>;
  readonly results: RA<QueryResultRow>;
  readonly selectedRows: ReadonlySet<number>;
  readonly onSelected: (
    index: number,
    isSelected: boolean,
    isShiftClick: boolean
  ) => void;
  readonly onDelete: (id: number) => void;
  readonly onFetchMore: ((index: number) => void) | undefined;
}): JSX.Element {
  const recordFormatter = React.useMemo(
    () => getAuditRecordFormatter(fieldSpecs),
    [fieldSpecs]
  );
  const [showLineNumber] = userPreferences.use(
    'queryBuilder',
    'appearance',
    'showLineNumber'
  );
  return (
    <>
      {results.map((result, index, { length }) => (
        <Row
          fieldSpecs={fieldSpecs}
          isLast={index + 1 === length}
          isSelected={selectedRows.has(results[index][queryIdField] as number)}
          key={index}
          lineIndex={showLineNumber ? index : undefined}
          recordFormatter={recordFormatter}
          result={result}
          table={table}
          onSelected={(isSelected, isShiftClick): void =>
            handleSelected(index, isSelected, isShiftClick)
          }
          onDelete={handleDelete}
          onFetchMore={handleFetchMore}
        />
      ))}
    </>
  );
}

function Row({
  table,
  fieldSpecs,
  result,
  lineIndex,
  recordFormatter,
  isSelected,
  isLast,
  onSelected: handleSelected,
  onDelete: handleDelete,
  onFetchMore: handleFetchMore,
}: {
  readonly table: SpecifyTable;
  readonly fieldSpecs: RA<QueryFieldSpec>;
  readonly result: QueryResultRow;
  readonly lineIndex: number | undefined;
  readonly recordFormatter?: (
    result: QueryResultRow
  ) => Promise<RA<JSX.Element | string>>;
  readonly isSelected: boolean;
  readonly isLast: boolean;
  readonly onSelected?: (isSelected: boolean, isShiftClick: boolean) => void;
  readonly onDelete: (id: number) => void;
  readonly onFetchMore: ((index: number) => void) | undefined;
}): JSX.Element {
  // REFACTOR: replace this with getResourceViewUrl()
  const [resource] = useLiveState<
    SpecifyResource<AnySchema> | false | undefined
  >(
    React.useCallback(
      (): SpecifyResource<AnySchema> | false =>
        new table.Resource({
          id: result[queryIdField],
        }),
      [table, result]
    )
  );
  const [formattedValues] = useAsyncState(
    React.useCallback(
      async () => recordFormatter?.(result),
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

  const splitIds: RA<number> | undefined = React.useMemo(
    () =>
      typeof result[0] === 'string' && result[0].includes(',')
        ? result[0].split(',').map(Number)
        : undefined,
    [result]
  );

  const [isIdListOpen, toggleIdListOpen] = React.useState(false);

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
        <div
          className={`contents ${isLast ? '[*_&:first-child]:rounded-bl' : ''}`}
        >
          {typeof lineIndex === 'number' && (
            <div
              className={`
                ${getCellClassName(condenseQueryResults)} sticky content-center
              `}
              role="cell"
            >
              {lineIndex}
            </div>
          )}
          <div
            className={`${getCellClassName(condenseQueryResults)} sticky`}
            role="cell"
          >
            <Input.Checkbox
              checked={isSelected}
              /* Ignore click event, as click would be handled by onClick on row */
              onChange={f.undefined}
            />
          </div>
          <div
            className={`${getCellClassName(condenseQueryResults)} sticky`}
            role="cell"
          >
            {splitIds === undefined ? (
              <Link.NewTab
                className="print:hidden"
                href={viewUrl}
                rel="noreferrer"
              />
            ) : (
              <Button.Icon
                className="print:hidden"
                icon="viewList"
                title={queryText.viewListOfIds()}
                onClick={() => toggleIdListOpen(true)}
              />
            )}
            {isIdListOpen && splitIds !== undefined ? (
              <RecordSelectorFromIds
                ids={splitIds}
                defaultIndex={0}
                dialog="modal"
                isInRecordSet={false}
                headerButtons={undefined}
                isDependent={false}
                newResource={undefined}
                title={commonText.colonLine({
                  label: queryText.queryResults(),
                  value: table.label,
                })}
                onAdd={undefined}
                onClone={undefined}
                onClose={() => toggleIdListOpen(false)}
                onDelete={(index): void => handleDelete(index)}
                onSaved={f.void}
                totalCount={splitIds.length}
                table={table}
                onSlide={
                  typeof handleFetchMore === 'function'
                    ? (index): void =>
                        splitIds.length === 0 && result[index] === undefined
                          ? handleFetchMore?.(index)
                          : undefined
                    : undefined
                }
              />
            ) : null}
          </div>
        </div>
      )}
      {result
        .filter((_, index) => index !== queryIdField)
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
        ? syncFieldFormat(field, (value ?? '').toString(), fieldSpec.parser)
        : value ?? '',
    [field, fieldSpec, value]
  );

  return (
    <div
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
    </div>
  );
}
