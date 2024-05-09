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
import { H2, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { formatNumber } from '../Atoms/Internationalization';
import { strictGetTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { TableIcon } from '../Molecules/TableIcon';
import { CreateRecordSetButton } from './RecordSet';

export function WbUploaded({
  recordCounts,
  dataSetId,
  dataSetName,
  isUploaded,
  onClose: handleClose,
}: {
  readonly recordCounts: Partial<RR<Lowercase<keyof Tables>, number>>;
  readonly dataSetId: number;
  readonly dataSetName: string;
  readonly isUploaded: boolean;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <div className="flex h-full w-60 flex-col gap-4">
      <div>
        <H2>
          {isUploaded
            ? wbText.uploadResults()
            : wbText.potentialUploadResults()}
        </H2>
        <p>
          {isUploaded
            ? wbText.wbUploadedDescription()
            : wbText.wbUploadedPotentialDescription()}
        </p>
      </div>
      <TableRecordCounts
        recordCounts={recordCounts}
        sortFunction={([_tableName, recordCount]) => recordCount}
      />
      <div className="flex flex-wrap gap-2">
        {isUploaded && (
          <CreateRecordSetButton
            dataSetId={dataSetId}
            dataSetName={dataSetName}
            small
            onClose={f.void}
          />
        )}
        <Button.Small className="flex-1" onClick={handleClose}>
          {commonText.close()}
        </Button.Small>
      </div>
    </div>
  );
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
