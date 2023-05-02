import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useSearchParameter } from '../../hooks/navigation';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { wbPlanText } from '../../localization/wbPlan';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getModelById, schema, strictGetModel } from '../DataModel/schema';
import type {
  RecordSet,
  SpQuery,
  SpQueryField,
  Tables,
} from '../DataModel/types';
import { recordSetView } from '../FormParse/webOnlyViews';
import { ResourceView } from '../Forms/ResourceView';
import { userInformation } from '../InitialContext/userInformation';
import { loadingBar } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { formatUrl } from '../Router/queryString';
import { ButtonWithConfirmation } from '../WbPlanView/Components';
import { mappingPathIsComplete } from '../WbPlanView/helpers';
import type { QueryField } from './helpers';
import { QuerySaveDialog } from './Save';

export function SaveQueryButtons({
  isReadOnly,
  fields,
  saveRequired,
  isValid,
  queryResource,
  unsetUnloadProtect,
  getQueryFieldRecords,
  onSaved: handleSaved,
  onTriedToSave: handleTriedToSave,
}: {
  readonly isReadOnly: boolean;
  readonly fields: RA<QueryField>;
  readonly saveRequired: boolean;
  readonly isValid: () => boolean;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly unsetUnloadProtect: () => void;
  readonly getQueryFieldRecords:
    | (() => RA<SerializedResource<SpQueryField>>)
    | undefined;
  readonly onSaved: () => void;
  readonly onTriedToSave: () => boolean;
}): JSX.Element {
  const [recordSetId] = useSearchParameter('recordsetid');

  const [showDialog, setShowDialog] = React.useState<'save' | 'saveAs' | false>(
    false
  );
  const showConfirmation = (): boolean =>
    fields.some(({ mappingPath }) => !mappingPathIsComplete(mappingPath));

  function handleSave(newState: typeof showDialog): void {
    if (
      typeof getQueryFieldRecords === 'function' &&
      (newState === 'save' || newState === 'saveAs')
    ) {
      queryResource.set('fields', getQueryFieldRecords());
    }
    setShowDialog(newState);
  }

  const navigate = useNavigate();

  return (
    <>
      {typeof showDialog === 'string' && (
        <QuerySaveDialog
          isSaveAs={showDialog === 'saveAs'}
          query={queryResource}
          onClose={(): void => setShowDialog(false)}
          onSaved={(queryId: number): void => {
            handleSaved();
            setShowDialog(false);
            unsetUnloadProtect();
            navigate(
              formatUrl(
                `/specify/query/${queryId}/`,
                recordSetId === undefined ? {} : { recordSetId }
              ),
              {
                replace: true,
              }
            );
          }}
        />
      )}
      {isReadOnly ||
      queryResource.get('specifyUser') !==
        userInformation.resource_uri ? undefined : (
        <QueryButton
          disabled={!saveRequired || fields.length === 0}
          showConfirmation={showConfirmation}
          onClick={(): void =>
            handleTriedToSave() && isValid() ? handleSave('save') : undefined
          }
        >
          {queryText.saveQuery()}
        </QueryButton>
      )}
      {isReadOnly || queryResource.isNew() ? undefined : (
        <QueryButton
          disabled={fields.length === 0}
          showConfirmation={showConfirmation}
          onClick={(): void =>
            handleTriedToSave() && isValid() ? handleSave('saveAs') : undefined
          }
        >
          {queryText.saveAs()}
        </QueryButton>
      )}
    </>
  );
}

export function ToggleMappingViewButton({
  fields,
  showMappingView,
  onClick: handleClick,
}: {
  readonly fields: RA<QueryField>;
  readonly showMappingView: boolean;
  readonly onClick: () => void;
}): JSX.Element {
  return (
    <Button.Small
      aria-pressed={!showMappingView}
      disabled={fields.length === 0 && showMappingView}
      onClick={handleClick}
    >
      {showMappingView
        ? wbPlanText.hideFieldMapper()
        : wbPlanText.showFieldMapper()}
    </Button.Small>
  );
}

export function QueryButton({
  disabled,
  children,
  onClick: handleClick,
  showConfirmation,
}: {
  readonly disabled: boolean;
  readonly children: string;
  readonly onClick: () => void;
  readonly showConfirmation: () => boolean;
}): JSX.Element {
  return (
    <ButtonWithConfirmation
      dialogButtons={(confirm): JSX.Element => (
        <>
          <Button.Orange onClick={confirm}>{commonText.remove()}</Button.Orange>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
        </>
      )}
      dialogHeader={queryText.queryDeleteIncomplete()}
      dialogMessage={queryText.queryDeleteIncompleteDescription()}
      disabled={disabled}
      showConfirmation={showConfirmation}
      onConfirm={handleClick}
    >
      {children}
    </ButtonWithConfirmation>
  );
}

/**
 * Create a Record Set from all query results.
 * See also `CreateRecordSet`
 */
export function MakeRecordSetButton({
  baseTableName,
  queryResource,
  fields,
  getQueryFieldRecords,
}: {
  readonly baseTableName: keyof Tables;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly fields: RA<QueryField>;
  readonly getQueryFieldRecords:
    | (() => RA<SerializedResource<SpQueryField>>)
    | undefined;
}): JSX.Element {
  const [state, setState] = React.useState<
    'editing' | 'saved' | 'saving' | undefined
  >(undefined);

  const [recordSet, setRecordSet] = React.useState<
    SpecifyResource<RecordSet> | undefined
  >(undefined);

  return (
    <>
      <QueryButton
        disabled={fields.length === 0}
        showConfirmation={(): boolean =>
          fields.some(({ mappingPath }) => !mappingPathIsComplete(mappingPath))
        }
        onClick={(): void => {
          setState('editing');
          if (typeof getQueryFieldRecords === 'function')
            queryResource.set('fields', getQueryFieldRecords());

          const recordSet = new schema.models.RecordSet.Resource();

          if (!queryResource.isNew())
            recordSet.set('name', queryResource.get('name'));

          recordSet.set('dbTableId', strictGetModel(baseTableName).tableId);
          // @ts-expect-error Adding a non-datamodel field
          recordSet.set('fromQuery', queryResource.toJSON());
          // @ts-expect-error Overwriting the resource back-end URL
          recordSet.url = '/stored_query/make_recordset/';
          setRecordSet(recordSet);
        }}
      >
        {queryText.createRecordSet({
          recordSetTable: schema.models.RecordSet.label,
        })}
      </QueryButton>
      {state === 'editing' || state === 'saving' ? (
        <>
          {typeof recordSet === 'object' && (
            <ResourceView
              dialog="modal"
              isDependent={false}
              isSubForm={false}
              mode="edit"
              resource={recordSet}
              viewName={recordSetView}
              onAdd={undefined}
              onClose={(): void => setState(undefined)}
              onDeleted={f.never}
              onSaved={(): void => setState('saved')}
              onSaving={(): void => setState('saving')}
            />
          )}
          {state === 'saving' && recordSetFromQueryLoading()}
        </>
      ) : undefined}
      {state === 'saved' && typeof recordSet === 'object' ? (
        <RecordSetCreated
          recordSet={recordSet}
          onClose={(): void => setState(undefined)}
        />
      ) : undefined}
    </>
  );
}

export const recordSetFromQueryLoading = f.store(() => (
  <Dialog
    buttons={undefined}
    header={queryText.recordSetToQuery({
      recordSetTable: schema.models.RecordSet.label,
    })}
    onClose={undefined}
  >
    {queryText.recordSetToQueryDescription({
      recordSetTable: schema.models.RecordSet.label,
    })}
    {loadingBar}
  </Dialog>
));

export function RecordSetCreated({
  recordSet,
  onClose: handleClose,
}: {
  readonly recordSet: SpecifyResource<RecordSet>;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      header={queryText.recordSetCreated({
        recordSetTable: schema.models.RecordSet.label,
      })}
      onClose={handleClose}
    >
      <Link.Default href={`/specify/record-set/${recordSet.id}/`}>
        <TableIcon label name={getModelById(recordSet.get('dbTableId')).name} />
        {recordSet.get('name')}
      </Link.Default>
    </Dialog>
  );
}
