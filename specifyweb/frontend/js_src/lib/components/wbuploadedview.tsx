/**
 * Workbench Upload results side bar with table counts
 *
 * @module
 */

import React from 'react';

import commonText from '../localization/common';
import wbText from '../localization/workbench';
import type { IR } from '../types';
import { defined } from '../types';
import { TableIcon } from './common';
import createBackboneView from './reactbackboneextend';
import { Button, H2, Ul } from './basic';
import { getModel } from '../schema';

function TableResults({
  tableName,
  recordCount,
}: {
  readonly tableName: string;
  readonly recordCount: number;
}): JSX.Element {
  return (
    <li className="gap-x-1 flex items-center">
      <TableIcon tableName={tableName} />
      <span>
        {`${defined(getModel(tableName)).getLocalizedName()}: ${recordCount}`}
      </span>
    </li>
  );
}

function WbUploadedView({
  recordCounts,
  onClose: handleClose,
  isUploaded,
}: {
  readonly recordCounts: IR<number>;
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
      <Button.Simple onClick={handleClose}>{commonText('close')}</Button.Simple>
    </div>
  );
}

export default createBackboneView(WbUploadedView);
