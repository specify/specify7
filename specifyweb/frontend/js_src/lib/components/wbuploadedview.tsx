import '../../css/wbuploaded.css';

import React from 'react';

import commonText from '../localization/common';
import wbText from '../localization/workbench';
import dataModelStorage from '../wbplanviewmodel';
import { TableIcon } from './common';
import createBackboneView from './reactbackboneextend';
import type { IR } from './wbplanview';

type Props = Readonly<ConstructorProps>;

type ConstructorProps = {
  recordCounts: IR<number>;
  onClose: () => void;
  isUploaded: boolean;
};

function TableResults({
  tableName,
  recordCount,
}: {
  readonly tableName: string;
  readonly recordCount: number;
}): JSX.Element {
  return (
    <div className="wb-uploaded-view-line">
      <TableIcon
        tableName={tableName.toLowerCase()}
      />
      <span>
        {`${dataModelStorage.tables[tableName].label}: ${recordCount}`}
      </span>
    </div>
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
      <div className="wb-uploaded-view-content">
        {Object.entries(recordCounts).map(([tableName, recordCount], index) => (
          <TableResults
            key={index}
            tableName={tableName}
            recordCount={recordCount}
          />
        ))}
      </div>
      <button type="button" className="magic-button" onClick={handleClose}>
        {commonText('close')}
      </button>
    </>
  );
}

export default createBackboneView<Props, ConstructorProps, Props>({
  moduleName: 'WBUploadedView',
  className: 'wb-uploaded',
  initialize(self, { recordCounts, onClose, isUploaded }) {
    self.recordCounts = recordCounts;
    self.onClose = onClose;
    self.isUploaded = isUploaded;
  },
  renderPre: (self) => self.el.classList.add('wb-uploaded-view'),
  Component: WbUploadedView,
  getComponentProps: (self) => ({
    recordCounts: self.recordCounts,
    onClose: self.onClose,
    isUploaded: self.isUploaded,
  }),
});
