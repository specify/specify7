import React from 'react';

import type { AttachmentDataSet } from './types';
import { DataSetMeta } from '../WorkBench/DataSetMeta';
import { LocalizedString } from 'typesafe-i18n';

export function AttachmentDatasetMeta({
  dataset,
  onChange: handleChange,
  onClose: handleClose,
}: {
  readonly dataset: AttachmentDataSet;
  readonly onChange: ({
    name,
    remarks,
  }: {
    readonly name: LocalizedString;
    readonly remarks: LocalizedString;
  }) => void;
  readonly onClose: () => void;
}): JSX.Element | null {
  return (
    <DataSetMeta
      dataset={dataset}
      datasetUrl="/attachment_gw/dataset/"
      onChange={handleChange}
      onClose={handleClose}
      onDeleted={handleClose}
      // Sync is handled via eager dataset's save, so no action is needed here
      onSync={async (name, remarks) => ({ name, remarks })}
    />
  );
}
