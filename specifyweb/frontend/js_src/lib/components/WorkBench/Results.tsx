/**
 * Workbench Upload results side bar with table counts
 *
 * @module
 */

import React from 'react';

import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { f } from '../../utils/functools';
import type { RR, ValueOf } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { H2, H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { formatNumber } from '../Atoms/Internationalization';
import { strictGetTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { TableIcon } from '../Molecules/TableIcon';
import { CreateRecordSetButton } from './RecordSet';
import { RecordCounts } from './WbValidation';
import { LocalizedString } from 'typesafe-i18n';


const localizationMap: Record<keyof RecordCounts, LocalizedString> = {
  'Uploaded': wbText.recordsCreated(),
  'Deleted': wbText.recordsDeleted(),
  'MatchedAndChanged': wbText.recordsMatchedAndChanged(),
  'Updated': wbText.recordsUpdated()
}

export function WbUploaded({
  recordCounts,
  datasetId,
  datasetName,
  isUploaded,
  onClose: handleClose,
}: {
  readonly recordCounts: RecordCounts;
  readonly datasetId: number;
  readonly datasetName: string;
  readonly isUploaded: boolean;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <ErrorBoundary dismissible>
      <div className="flex h-full w-60 flex-col gap-4">
        <div>
          <H2>{isUploaded ? wbText.affectedResults() : wbText.potentialAffectedResults()}</H2>
          <p>
            {isUploaded
              ? wbText.wbAffectedDescription()
              : wbText.wbAffectedPotentialDescription()
              }
          </p>
        </div>
        <Ul className="flex flex-1 flex-col gap-2">
          {Object.entries(recordCounts).sort(sortFunction(([value])=>value)).map(
            ([resultType, recordsPerType], id)=><ResultsPerType resultType={resultType} recordsPerType={recordsPerType} key={id}/>)}
        </Ul>
        <div className="flex flex-wrap gap-2">
          {isUploaded && (
            <CreateRecordSetButton
              datasetId={datasetId}
              datasetName={datasetName}
              small
              onClose={f.void}
            />
          )}
          <Button.Small className="flex-1" onClick={handleClose}>
            {commonText.close()}
          </Button.Small>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function ResultsPerType({resultType, recordsPerType}:{readonly resultType: keyof RecordCounts; readonly recordsPerType: ValueOf<RecordCounts>}): JSX.Element {
  return <>
      <H3>{localizationMap[resultType]}</H3>
      {Object.entries(recordsPerType ?? {}).sort(
        sortFunction(([_tableName, recordCount]) => recordCount, false)
      )
      .map(([tableName, recordCount], index) =>
        typeof recordCount === 'number' ? (
          <TableResults
            key={index}
            recordCount={recordCount}
            tableName={tableName}
          />
        ) : null
      )}
  </>
}

export function TableRecordCounts({
  recordCounts,
  sortFunction: rawSortFunction,
}: {
  readonly recordCounts: Partial<RR<Lowercase<keyof Tables>, number>>;
  readonly sortFunction?: (
    value: readonly [
      Lowercase<keyof Tables>,
      ValueOf<Partial<Record<Lowercase<keyof Tables>, number>>>
    ]
  ) => ValueOf<Partial<Record<Lowercase<keyof Tables>, number>>>;
}): JSX.Element {
  const resolvedRecords =
    typeof rawSortFunction === 'function'
      ? Object.entries(recordCounts).sort(sortFunction(rawSortFunction))
      : Object.entries(recordCounts);

  return (
    <Ul className="flex flex-1 flex-col gap-2">
      {resolvedRecords.map(([tableName, recordCount], index) =>
        typeof recordCount === 'number' ? (
          <TableResults
            key={index}
            recordCount={recordCount}
            tableName={tableName}
          />
        ) : null
      )}
    </Ul>
  );
}

function TableResults({
  tableName,
  recordCount,
}: {
  readonly tableName: Lowercase<keyof Tables>;
  readonly recordCount: number;
}): JSX.Element {
  return (
    <li className="flex items-center gap-1">
      <TableIcon label={false} name={tableName} />
      <span>
        {commonText.colonLine({
          label: strictGetTable(tableName).label,
          value: formatNumber(recordCount),
        })}
      </span>
    </li>
  );
}