/**
 * Workbench Upload results side bar with table counts
 *
 * @module
 */

import React from 'react';

import type { Tables } from '../datamodel';
import { commonText } from '../localization/common';
import { wbText } from '../localization/workbench';
import { getModel } from '../schema';
import type { RR } from '../types';
import { defined } from '../types';
import { Button, H2, Ul } from './basic';
import { TableIcon } from './common';
import { createBackboneView } from './reactbackboneextend';

function TableResults({
  tableName,
  recordCount,
}: {
  readonly tableName: keyof Tables;
  readonly recordCount: number;
}): JSX.Element {
  return (
    <li className="gap-x-1 flex items-center">
      <TableIcon name={tableName} />
      <span>{`${defined(getModel(tableName)).label}: ${recordCount}`}</span>
    </li>
  );
}

function WbUploaded({
  recordCounts,
  onClose: handleClose,
  isUploaded,
}: {
  readonly recordCounts: RR<keyof Tables, number>;
  readonly onClose: () => void;
  readonly isUploaded: boolean;
}): JSX.Element {
  return (
    <div className="gap-y-4 w-60 flex flex-col h-full">
      <div>
        <H2>
          {isUploaded
            ? wbText('uploadResults')
            : wbText('potentialUploadResults')}
        </H2>
        <p>
          {isUploaded
            ? wbText('wbUploadedDescription')
            : wbText('wbUploadedPotentialDescription')}
        </p>
      </div>
      <Ul className="gap-y-2 flex flex-col flex-1">
        {Object.entries(recordCounts).map(([tableName, recordCount], index) => (
          <TableResults
            key={index}
            tableName={tableName}
            recordCount={recordCount}
          />
        ))}
      </Ul>
      <Button.Small onClick={handleClose}>{commonText('close')}</Button.Small>
    </div>
  );
}

export const WbUploadedView = createBackboneView(WbUploaded);
