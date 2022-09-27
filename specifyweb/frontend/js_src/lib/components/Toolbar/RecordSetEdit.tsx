import { SpecifyResource } from '../DataModel/legacyTypes';
import { RecordSet } from '../DataModel/types';
import { useNavigate } from 'react-router-dom';
import { useBooleanState } from '../../hooks/useBooleanState';
import { ResourceView } from '../Forms/ResourceView';
import { formsText } from '../../localization/forms';
import { hasToolPermission } from '../Permissions/helpers';
import { Button } from '../Atoms/Button';
import { commonText } from '../../localization/common';
import { getResourceViewUrl } from '../DataModel/resource';
import { getModelById } from '../DataModel/schema';
import React from 'react';
import { userInformation } from '../InitialContext/userInformation';
import { QueryListDialog, useQueries } from './Query';
import { formatUrl } from '../Router/queryString';

export function EditRecordSet({
  recordSet,
  isReadOnly,
  onClose: handleClose,
}: {
  readonly recordSet: SpecifyResource<RecordSet>;
  readonly isReadOnly: boolean;
  readonly onClose: () => void;
}): JSX.Element {
  const navigate = useNavigate();
  const [isQuerying, handleOpenQuery, handleCloseQuery] = useBooleanState();
  return isQuerying ? (
    <QueryRecordSet
      isReadOnly={isReadOnly}
      recordSet={recordSet}
      onClose={handleCloseQuery}
    />
  ) : (
    <ResourceView
      canAddAnother={false}
      // BUG: the message is stale if record set is renamed
      deletionMessage={formsText(
        'recordSetDeletionWarning',
        recordSet.get('name') ?? ''
      )}
      dialog="modal"
      extraButtons={
        hasToolPermission('queryBuilder', 'read') && !recordSet.isNew() ? (
          <>
            <span className="-ml-2 flex-1" />
            <Button.Blue onClick={handleOpenQuery}>
              {commonText('query')}
            </Button.Blue>
          </>
        ) : undefined
      }
      isDependent={false}
      isSubForm={false}
      mode={
        isReadOnly ||
        (!recordSet.isNew() && !hasToolPermission('recordSets', 'update'))
          ? 'view'
          : 'edit'
      }
      resource={recordSet}
      onClose={handleClose}
      onDeleted={undefined}
      onSaved={(): void =>
        navigate(
          getResourceViewUrl(
            getModelById(recordSet.get('dbTableId')).name,
            undefined,
            recordSet.id
          )
        )
      }
    />
  );
}

function QueryRecordSet({
  recordSet,
  isReadOnly,
  onClose: handleClose,
}: {
  readonly recordSet: SpecifyResource<RecordSet>;
  readonly isReadOnly: boolean;
  readonly onClose: () => void;
}): JSX.Element {
  const filters = React.useMemo(
    () => ({
      specifyUser: userInformation.id,
      contextTableId: recordSet.get('dbTableId'),
    }),
    [recordSet]
  );
  const queries = useQueries(filters);

  return (
    <QueryListDialog
      getQuerySelectUrl={(query): string =>
        formatUrl(`/specify/query/${query.id}/`, {
          recordSetId: recordSet.id.toString(),
        })
      }
      isReadOnly={isReadOnly}
      newQueryUrl={formatUrl(
        `/specify/query/new/${getModelById(
          recordSet.get('dbTableId')
        ).name.toLowerCase()}/`,
        { recordSetId: recordSet.id.toString() }
      )}
      queries={queries}
      onClose={handleClose}
    />
  );
}
