import '../../css/wbuploaded.css';

import React from 'react';
import dataModelStorage from '../wbplanviewmodel';

import WbText from '../wbtext';
import { Icon } from './customselectelement';
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
      <Icon
        tableName={tableName.toLowerCase()}
        optionLabel={tableName}
        isRelationship={true}
      />
      <span>
        {`${dataModelStorage.tables[tableName].tableFriendlyName} - ${recordCount}`}
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
        {isUploaded ? WbText.uploadResults : WbText.potentialUploadResults}
      </h2>
      <p>{WbText.wbUploadedDescriptions}</p>
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
        {WbText.close}
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
