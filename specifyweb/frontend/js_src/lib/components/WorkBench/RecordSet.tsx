import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { queryText } from '../../localization/query';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import { formData } from '../../utils/ajax/helpers';
import { Button } from '../Atoms/Button';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { tables } from '../DataModel/tables';
import {
  ProtectedAction,
  ProtectedTool,
} from '../Permissions/PermissionDenied';
import { unsafeNavigate } from '../Router/Router';
import { EditRecordSet } from '../Toolbar/RecordSetEdit';
import { batchEditText } from '../../localization/batchEdit';

export function CreateRecordSetButton({
  datasetId,
  datasetName,
  isUpdate,
  onClose: handleClosed,
  small,
}: {
  readonly datasetId: number;
  readonly datasetName: string;
  readonly isUpdate: boolean
  readonly onClose: () => void;
  readonly small: boolean;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const ButtonComponent = small ? Button.Small : Button.Info;
  return (
    <ProtectedAction action="create_recordset" resource="/workbench/dataset">
      <ProtectedTool action="create" tool="recordSets">
        <ButtonComponent onClick={handleOpen}>
          {queryText.createRecordSet({
            recordSetTable: tables.RecordSet.label,
          })}
        </ButtonComponent>
        {isOpen && (
          <CreateRecordSetDialog
            datasetId={datasetId}
            datasetName={datasetName}
            isUpdate={isUpdate}
            onClose={(): void => {
              handleClose();
              handleClosed();
            }}
          />
        )}
      </ProtectedTool>
    </ProtectedAction>
  );
}

function CreateRecordSetDialog({
  datasetId,
  datasetName,
  isUpdate,
  onClose: handleClose,
}: {
  readonly datasetId: number;
  readonly datasetName: string;
  readonly isUpdate: boolean
  readonly onClose: () => void;
}): JSX.Element {
  const recordSet = React.useMemo(
    () =>
      new tables.RecordSet.Resource({
        name: isUpdate ? batchEditText.batchEditRecordSetName({dataSet: datasetName}) : wbText.recordSetName({ dataSet: datasetName }),
      }),
    [datasetId]
  );

  const loading = React.useContext(LoadingContext);
  return (
    // Override readonly context set by workbench after upload so recordset meta can be edited
    <ReadOnlyContext.Provider value={false}>
      <EditRecordSet
        recordSet={recordSet}
        onClose={handleClose}
        onSaving={(unsetUnloadProtect): false => {
          unsetUnloadProtect();
          loading(
            ajax<number>(`/api/workbench/create_recordset/${datasetId}/`, {
              method: 'POST',
              headers: { Accept: 'application/json' },
              body: formData({ name: recordSet.get('name') }),
              errorMode: 'dismissible',
            }).then(({ data }) =>
              unsafeNavigate(`/specify/record-set/${data}/`)
            )
          );
          return false;
        }}
      />
    </ReadOnlyContext.Provider>
  );
}
