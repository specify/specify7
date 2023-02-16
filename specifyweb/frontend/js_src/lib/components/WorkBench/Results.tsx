/**
 * Workbench Upload results side bar with table counts
 *
 * @module
 */

import React from 'react';

import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { f } from '../../utils/functools';
import type { RR } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { H2, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { formatNumber } from '../Atoms/Internationalization';
import { strictGetModel } from '../DataModel/schema';
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
  readonly recordCounts: RR<keyof Tables, number>;
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
      <Ul className="flex flex-1 flex-col gap-2">
        {Object.entries(recordCounts)
          .sort(sortFunction(([_tableName, recordCount]) => recordCount, false))
          .map(([tableName, recordCount], index) => (
            <TableResults
              key={index}
              recordCount={recordCount}
              tableName={tableName}
            />
          ))}
      </Ul>
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

function TableResults({
  tableName,
  recordCount,
}: {
  readonly tableName: keyof Tables;
  readonly recordCount: number;
}): JSX.Element {
  return (
    <li className="flex items-center gap-1">
      <TableIcon label={false} name={tableName} />
      <span>
        {commonText.colonLine({
          label: strictGetModel(tableName).label,
          value: formatNumber(recordCount),
        })}
      </span>
    </li>
  );
}
