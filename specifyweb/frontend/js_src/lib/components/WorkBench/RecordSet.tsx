import {
  ProtectedAction,
  ProtectedTool,
} from '../Permissions/PermissionDenied';
import React from 'react';
import { useBooleanState } from '../../hooks/useBooleanState';
import { wbText } from '../../localization/workbench';
import { Button } from '../Atoms/Button';
import { EditRecordSet } from '../Toolbar/RecordSetEdit';
import { schema } from '../DataModel/schema';
import { LoadingContext } from '../Core/Contexts';
import { ajax } from '../../utils/ajax';
import { formData } from '../../utils/ajax/helpers';
import { Http } from '../../utils/ajax/definitions';
import { queryText } from '../../localization/query';
import { unsafeNavigate } from '../Router/Router';

export function CreateRecordSetButton({
  dataSetId,
  dataSetName,
  onClose: handleClose,
  small,
}: {
  readonly dataSetId: number;
  readonly dataSetName: string;
  readonly onClose: () => void;
  readonly small: boolean;
}): JSX.Element {
  const [isOpen, handleOpen] = useBooleanState();
  const ButtonComponent = small ? Button.Small : Button.Blue;
  return (
    <ProtectedAction action="create_recordset" resource="/workbench/dataset">
      <ProtectedTool action="create" tool="recordSets">
        <ButtonComponent onClick={handleOpen}>
          {queryText('createRecordSet')}
        </ButtonComponent>
        {isOpen && (
          <CreateRecordSetDialog
            dataSetId={dataSetId}
            dataSetName={dataSetName}
            onClose={handleClose}
          />
        )}
      </ProtectedTool>
    </ProtectedAction>
  );
}

function CreateRecordSetDialog({
  dataSetId,
  dataSetName,
  onClose: handleClose,
}: {
  readonly dataSetId: number;
  readonly dataSetName: string;
  readonly onClose: () => void;
}): JSX.Element {
  const recordSet = React.useMemo(
    () =>
      new schema.models.RecordSet.Resource({
        name: wbText('recordSetName', dataSetName),
      }),
    [dataSetId]
  );

  const loading = React.useContext(LoadingContext);
  return (
    <EditRecordSet
      isReadOnly={false}
      recordSet={recordSet}
      onClose={handleClose}
      onSaving={(): false => {
        loading(
          ajax<number>(
            `/api/workbench/dataset/${dataSetId}/create_recordset`,
            {
              method: 'POST',
              headers: { Accept: 'application/json' },
              body: formData({ name: recordSet.get('name') }),
            },
            { expectedResponseCodes: [Http.CREATED] }
          ).then(({ data }) => unsafeNavigate(`/specify/recordset/${data}`))
        );
        return false;
      }}
    />
  );
}
