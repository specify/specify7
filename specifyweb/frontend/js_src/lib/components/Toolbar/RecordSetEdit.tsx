import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useBooleanState } from '../../hooks/useBooleanState';
import { formsText } from '../../localization/forms';
import { queryText } from '../../localization/query';
import { Button } from '../Atoms/Button';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getTableById, tables } from '../DataModel/tables';
import type { RecordSet } from '../DataModel/types';
import { ResourceView } from '../Forms/ResourceView';
import { userInformation } from '../InitialContext/userInformation';
import { hasToolPermission } from '../Permissions/helpers';
import { formatUrl } from '../Router/queryString';
import { QueryListDialog, useQueries } from './Query';
import { ReadOnlyContext } from '../Core/Contexts';

export function EditRecordSet({
  recordSet,
  onClose: handleClose,
  onDeleted: handleDeleted,
  onSaving: handleSaving,
}: {
  readonly recordSet: SpecifyResource<RecordSet>;
  readonly onClose: () => void;
  readonly onDeleted?: () => void;
  readonly onSaving?: Parameters<typeof ResourceView>[0]['onSaving'];
}): JSX.Element {
  const navigate = useNavigate();
  const [isQuerying, handleOpenQuery, handleCloseQuery] = useBooleanState();
  const isReadOnly =
    React.useContext(ReadOnlyContext) ||
    (!recordSet.isNew() && !hasToolPermission('recordSets', 'update'));
  return (
    <ReadOnlyContext.Provider value={isReadOnly}>
      {isQuerying ? (
        <QueryRecordSet recordSet={recordSet} onClose={handleCloseQuery} />
      ) : (
        <ResourceView
          // BUG: the message is stale if record set is renamed
          deletionMessage={formsText.recordSetDeletionWarning({
            recordSetTable: tables.RecordSet.label,
            recordSetName: recordSet.get('name') ?? '',
          })}
          dialog="modal"
          extraButtons={
            hasToolPermission('queryBuilder', 'read') && !recordSet.isNew() ? (
              <>
                <span className="-ml-2 flex-1" />
                <Button.Blue onClick={handleOpenQuery}>
                  {queryText.query()}
                </Button.Blue>
              </>
            ) : undefined
          }
          isDependent={false}
          isSubForm={false}
          resource={recordSet}
          onAdd={undefined}
          onClose={handleClose}
          onDeleted={() => {
            handleDeleted?.();
            handleClose();
          }}
          onSaved={(): void => navigate(`/specify/record-set/${recordSet.id}/`)}
          onSaving={handleSaving}
        />
      )}
    </ReadOnlyContext.Provider>
  );
}

function QueryRecordSet({
  recordSet,
  onClose: handleClose,
}: {
  readonly recordSet: SpecifyResource<RecordSet>;
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
          recordSetId: recordSet.id,
        })
      }
      newQueryUrl={formatUrl(
        `/specify/query/new/${getTableById(
          recordSet.get('dbTableId')
        ).name.toLowerCase()}/`,
        { recordSetId: recordSet.id }
      )}
      queries={queries}
      onClose={handleClose}
    />
  );
}
