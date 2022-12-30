/**
 * Workbench Upload results side bar with table counts
 *
 * @module
 */

import React from 'react';

import type { Tables } from '../DataModel/types';
import { sortFunction } from '../../utils/utils';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { strictGetModel } from '../DataModel/schema';
import type { RR } from '../../utils/types';
import { H2, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { TableIcon } from '../Molecules/TableIcon';
import { formatNumber } from '../Atoms/Internationalization';

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

const a = { a: 'b' } as const;
const b = Object.keys(a);
console.log(b);

export function WbUploaded({
  recordCounts,
  onClose: handleClose,
  isUploaded,
}: {
  readonly recordCounts: RR<keyof Tables, number>;
  readonly onClose: () => void;
  readonly isUploaded: boolean;
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
      <Button.Small onClick={handleClose}>{commonText.close()}</Button.Small>
    </div>
  );
}
