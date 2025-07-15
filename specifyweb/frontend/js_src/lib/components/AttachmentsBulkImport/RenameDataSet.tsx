import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { attachmentsText } from '../../localization/attachments';
import { removeKey } from '../../utils/utils';
import { DataSetMeta } from '../WorkBench/DataSetMeta';
import type { EagerDataSet } from './Import';

export function AttachmentDatasetMeta({
  dataset,
  onChange: handleChange,
  onClose: handleClose,
  unsetUnloadProtect,
}: {
  readonly dataset: EagerDataSet;
  readonly onChange: ({
    name,
    remarks,
  }: {
    readonly name: LocalizedString;
    readonly remarks: LocalizedString;
  }) => void;
  readonly onClose: () => void;
  readonly unsetUnloadProtect: () => void;
}): JSX.Element | null {
  const navigate = useNavigate();
  return (
    <DataSetMeta
      dataset={dataset}
      datasetVariant="bulkAttachment"
      deleteDescription={attachmentsText.deleteAttachmentDataSetDescription()}
      permissionResource="/attachment_import/dataset"
      onChange={(changed) =>
        changed.needsSaved
          ? handleChange(removeKey(changed, 'needsSaved'))
          : undefined
      }
      onClose={handleClose}
      onDeleted={() => {
        navigate('/specify/', { replace: true });
        unsetUnloadProtect();
      }}
    />
  );
}
