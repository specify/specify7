import '../../css/wbuploaded.css';

import React from 'react';

import commonText from '../localization/common';
import wbText from '../localization/workbench';
import dataModelStorage from '../wbplanviewmodel';
import { TableIcon } from './common';
import createBackboneView from './reactbackboneextend';
import type { IR } from '../types';

type Props = {
  readonly recordCounts: IR<number>;
  readonly onClose: () => void;
  readonly isUploaded: boolean;
};

function TableResults({
  tableName,
  recordCount,
}: {
  readonly tableName: string;
  readonly recordCount: number;
}): JSX.Element {
  return (
    <li>
      <TableIcon tableName={tableName.toLowerCase()} />
      <span>
        {`${dataModelStorage.tables[tableName].label}: ${recordCount}`}
      </span>
    </li>
  );
}

function WbUploadedView({
  recordCounts,
  onClose: handleClose,
  isUploaded,
}: Props): JSX.Element {
  return (
    <>
      <h2>
        {isUploaded
          ? wbText('uploadResults')
          : wbText('potentialUploadResults')}
      </h2>
      <p>
        {isUploaded
          ? wbText('wbUploadedDescription')
          : wbText('wbUploadedPotentialDescription')}
      </p>
      <ul>
        {Object.entries(recordCounts).map(([tableName, recordCount], index) => (
          <TableResults
            key={index}
            tableName={tableName}
            recordCount={recordCount}
          />
        ))}
      </ul>
      <button type="button" className="magic-button" onClick={handleClose}>
        {commonText('close')}
      </button>
    </>
  );
}

export default createBackboneView<Props>({
  moduleName: 'WBUploadedView',
  className: 'wb-uploaded-view',
  component: WbUploadedView,
});
