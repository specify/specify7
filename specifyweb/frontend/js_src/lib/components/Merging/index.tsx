import React from 'react';
import { useParams } from 'react-router-dom';

import { useSearchParameter } from '../../hooks/navigation';
import { resourceEvents } from '../../hooks/store';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useCachedState } from '../../hooks/useCachedState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { mergingText } from '../../localization/merging';
import { treeText } from '../../localization/tree';
import { ajax } from '../../utils/ajax';
import { hijackBackboneAjax } from '../../utils/ajax/backboneAjax';
import { Http } from '../../utils/ajax/definitions';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { removeKey, sortFunction } from '../../utils/utils';
import { ErrorMessage } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { deserializeResource } from '../DataModel/helpers';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import { fetchResource } from '../DataModel/resource';
import { getModel } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { formatUrl } from '../Router/queryString';
import { OverlayContext, OverlayLocation } from '../Router/Router';
import { getUserPref } from '../UserPreferences/helpers';
import { autoMerge, postMergeResource } from './autoMerge';
import { CompareRecords } from './Compare';

const recordMergingTables = new Set<keyof Tables>(['Agent']);

export const mergingQueryParameter = 'records';

export function RecordMergingLink({
  table,
  selectedRows,
  // Called when merging dialog closed, only if some records were merged
  onMerged: handleMerged,
  onDeleted: handleDeleted,
}: {
  readonly table: SpecifyModel;
  readonly selectedRows: ReadonlySet<number>;
  readonly onMerged: () => void;
  readonly onDeleted: (resourceId: number) => void;
}): JSX.Element | null {
  const overlayLocation = React.useContext(OverlayLocation);
  const [records] = useSearchParameter(mergingQueryParameter, overlayLocation);
  const oldRecords = React.useRef(records);
  const needUpdateQueryResults = React.useRef(false);
  React.useEffect(() => {
    if (oldRecords.current === undefined && records !== undefined)
      needUpdateQueryResults.current = false;
    // Detect agent merging dialog getting closed after some records are merged
    else if (
      records === undefined &&
      oldRecords.current !== undefined &&
      needUpdateQueryResults.current
    )
      handleMerged();
    oldRecords.current = records;
  }, [records]);

  React.useEffect(
    () =>
      resourceEvents.on('deleted', (resource) => {
        needUpdateQueryResults.current = true;
        handleDeleted(resource.id);
      }),
    [handleDeleted]
  );

  return recordMergingTables.has(table.name) ? (
    selectedRows.size > 1 ? (
      <Link.Small
        href={formatUrl(`/specify/overlay/merge/${table.name}/`, {
          [mergingQueryParameter]: Array.from(selectedRows).join(','),
        })}
      >
        {mergingText.mergeRecords()}
      </Link.Small>
    ) : (
      <Button.Small onClick={undefined}>
        {mergingText.mergeRecords()}
      </Button.Small>
    )
  ) : null;
}

export function MergingDialog(): JSX.Element | null {
  const { tableName = '' } = useParams();
  const model = getModel(tableName);

  const [rawIds = '', setIds] = useSearchParameter(mergingQueryParameter);
  const ids = React.useMemo(
    () => filterArray(rawIds.split(',').map(f.parseInt)),
    [rawIds]
  );
  React.useEffect(
    () =>
      resourceEvents.on('deleted', (resource) =>
        setIds(ids.filter((id) => id !== resource.id).join(','))
      ),
    [ids, setIds]
  );

  const handleDismiss = (dismissedId: number) =>
    setIds(ids.filter((id) => id !== dismissedId).join(','));

  return model === undefined ? null : (
    <Merging ids={ids} model={model} onDismiss={handleDismiss} />
  );
}

function Merging({
  model,
  ids,
  onDismiss: handleDismiss,
}: {
  readonly model: SpecifyModel;
  readonly ids: RA<number>;
  readonly onDismiss: (id: number) => void;
}): JSX.Element | null {
  const records = useResources(model, ids);
  const initialRecords = React.useRef(records);
  if (initialRecords.current === undefined && records !== undefined)
    initialRecords.current = records;

  const handleClose = React.useContext(OverlayContext);
  // Close the dialog when resources are deleted/unselected
  React.useEffect(
    () => (ids.length < 2 ? handleClose() : undefined),
    [ids, handleClose]
  );

  const id = useId('merging-dialog');
  const loading = React.useContext(LoadingContext);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [merged, setMerged] = useAsyncState(
    React.useCallback(
      () =>
        records === undefined || initialRecords.current === undefined
          ? undefined
          : postMergeResource(
              initialRecords.current,
              autoMerge(
                model,
                initialRecords.current,
                getUserPref('recordMerging', 'behavior', 'autoPopulate')
              )
            ).then((merged) =>
              deserializeResource(merged as SerializedResource<AnySchema>)
            ),
      [model, records]
    ),
    true
  );

  return records === undefined || merged === undefined ? null : (
    <MergeDialogContainer
      buttons={
        <>
          <Button.Green
            onClick={(): void =>
              loading(
                postMergeResource(records, autoMerge(model, records, false))
                  .then((merged) =>
                    deserializeResource(merged as SerializedResource<AnySchema>)
                  )
                  .then(setMerged)
              )
            }
          >
            {mergingText.autoPopulate()}
          </Button.Green>
          <ToggleMergeView />
          <span className="-ml-2 flex-1" />
          <Button.BorderedGray onClick={handleClose}>
            {commonText.cancel()}
          </Button.BorderedGray>
          <Submit.Blue form={id('form')}>{treeText.merge()}</Submit.Blue>
        </>
      }
      onClose={handleClose}
    >
      {typeof error === 'string' && <ErrorMessage>{error}</ErrorMessage>}
      <CompareRecords
        formId={id('form')}
        merged={merged}
        model={model}
        records={records}
        onDismiss={handleDismiss}
        onMerge={(merged, rawResources): void => {
          /*
           * Use the oldest resource as base so as to preserve timestampCreated
           * and, presumably the longest auditing history
           */
          const resources = Array.from(rawResources).sort(
            sortFunction((resource) => resource.get('timestampCreated'))
          );
          const target = resources[0];
          target.bulkSet(removeKey(merged.toJSON(), 'version'));

          const clones = resources.slice(1);
          loading(
            hijackBackboneAjax(
              [],
              async () => target.save(),
              undefined,
              'dismissible'
            ).then(async () => {
              /*
               * Make requests sequentially as they are expected to fail
               * (due to business rules). If we do them sequentially, we
               * can leave the UI in a state consistent with the back-end
               */
              // eslint-disable-next-line functional/no-loop-statement
              for (const clone of clones) {
                const response = await ajax(
                  `/api/specify/${model.name.toLowerCase()}/replace/${
                    clone.id
                  }/${target.id}/`,
                  {
                    method: 'POST',
                    headers: {
                      Accept: 'text/plain',
                    },
                    expectedErrors: [Http.NOT_ALLOWED],
                    errorMode: 'dismissible',
                  }
                );
                if (response.status === Http.NOT_ALLOWED) {
                  setError(response.data);
                  return;
                }
                resourceEvents.trigger('deleted', clone);
              }
              setError(undefined);
              handleClose();
            })
          );
        }}
      />
    </MergeDialogContainer>
  );
}

export function MergeDialogContainer({
  children,
  buttons,
  header = mergingText.mergeRecords(),
  onClose: handleClose,
}: {
  readonly header?: string;
  readonly children: React.ReactNode;
  readonly buttons: JSX.Element;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={buttons}
      header={header}
      // Disable gradient because table headers have solid backgrounds
      specialMode="noGradient"
      onClose={handleClose}
    >
      {children}
    </Dialog>
  );
}

export function ToggleMergeView(): JSX.Element {
  const [showMatching = false, setShowMatching] = useCachedState(
    'merging',
    'showMatchingFields'
  );
  return (
    <Label.Inline>
      <Input.Checkbox
        checked={!showMatching}
        onValueChange={(checked): void => setShowMatching(!checked)}
      />
      {mergingText.showConflictingFieldsOnly()}
    </Label.Inline>
  );
}

function useResources(
  model: SpecifyModel,
  selectedRows: RA<number>
): RA<SerializedResource<AnySchema>> | undefined {
  /**
   * During merging, ids are removed from selectedRows one by one. Shouldn't
   * try to fetch all resources every time that happens
   */
  const cached = React.useRef<RA<SerializedResource<AnySchema>>>([]);
  return useAsyncState(
    React.useCallback(
      async () =>
        Promise.all(
          selectedRows.map((id) => {
            const resource = cached.current.find(
              (resource) => resource.id === id
            );
            return resource ?? fetchResource(model.name, id);
          })
        ).then((resources) => {
          cached.current = resources;
          return resources;
        }),
      [model, selectedRows]
    ),
    true
  )[0];
}
