import React from 'react';

import type { AttachmentDataSet } from './types';
import { DataSetMeta } from '../WorkBench/DataSetMeta';
import { LocalizedString } from 'typesafe-i18n';
import { useNavigate } from 'react-router-dom';
import { removeKey } from '../../utils/utils';

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
  const navigate = useNavigate();
  return (
    <DataSetMeta
      dataset={dataset}
      datasetUrl="/attachment_gw/dataset/"
      onChange={(changed) =>
        changed.needsSaved
          ? undefined
          : handleChange(removeKey(changed, 'needsSaved'))
      }
      onClose={handleClose}
      onDeleted={() => navigate('/specify/', { replace: true })}
    />
  );
}
