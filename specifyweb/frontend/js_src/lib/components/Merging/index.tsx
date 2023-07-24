import React from 'react';
import { useParams } from 'react-router-dom';

import { useSearchParameter } from '../../hooks/navigation';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useCachedState } from '../../hooks/useCachedState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { mergingText } from '../../localization/merging';
import { treeText } from '../../localization/tree';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { multiSortFunction, removeKey } from '../../utils/utils';
import { ErrorMessage } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { deserializeResource } from '../DataModel/helpers';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import {
  fetchResource,
  resourceEvents,
  resourceOn,
} from '../DataModel/resource';
import { getModel } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { Dialog } from '../Molecules/Dialog';
import { formatUrl } from '../Router/queryString';
import { OverlayContext, OverlayLocation } from '../Router/Router';
import { autoMerge, postMergeResource } from './autoMerge';
import { CompareRecords } from './Compare';
import { userPreferences } from '../Preferences/userPreferences';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { SaveBlockedDialog } from '../Forms/Save';
import { useLiveState } from '../../hooks/useLiveState';
import { InvalidMergeRecordsDialog } from './InvalidMergeRecords';
import { recordMergingTableSpec } from './definitions';

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

  return table.name in recordMergingTableSpec ? (
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

  const handleDismiss = (dismissedIds: RA<number>) =>
    setIds(ids.filter((id) => !dismissedIds.includes(id)).join(','));

  return model === undefined ? null : (
    <RestrictMerge model={model} ids={ids} onDismiss={handleDismiss} />
  );
}

// FIXME: Remove this once bussinessrules issues have been figured out
function RestrictMerge({
  model,
  ids,
  onDismiss: handleDismiss,
}: {
  readonly model: SpecifyModel;
  readonly ids: RA<number>;
  readonly onDismiss: (ids: RA<number>) => void;
}): JSX.Element | null {
  const records = useResources(model, ids);

  const [recordsToIgnore] = useLiveState(
    React.useCallback(
      () =>
        records === undefined
          ? undefined
          : filterArray(
              records.map((record) =>
                recordMergingTableSpec[model.name]?.filterIgnore?.(
                  record as never
                )
              )
            ),
      [records]
    )
  );

  return records === undefined ? null : recordsToIgnore !== undefined &&
    recordsToIgnore.length > 0 ? (
    <InvalidMergeRecordsDialog
      recordsToIgnore={recordsToIgnore as RA<SerializedResource<AnySchema>>}
      modelName={model.name}
      onDismiss={
        // Disable merging if less than 2 remaining
        records.length - recordsToIgnore.length >= 2 ? handleDismiss : undefined
      }
    />
  ) : (
    <Merging records={records} model={model} onDismiss={handleDismiss} />
  );
}

function Merging({
  model,
  records,
  onDismiss: handleDismiss,
}: {
  readonly model: SpecifyModel;
  readonly records: RA<SerializedResource<AnySchema>>;
  readonly onDismiss: (ids: RA<number>) => void;
}): JSX.Element | null {
  const initialRecords = React.useRef(records);
  const handleClose = React.useContext(OverlayContext);
  // Close the dialog when resources are deleted/unselected
  React.useEffect(
    () => (records.length < 2 ? handleClose() : undefined),
    [records, handleClose]
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
                userPreferences.get('recordMerging', 'behavior', 'autoPopulate')
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
          <Button.Success
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
          </Button.Success>
          <ToggleMergeView />
          <span className="-ml-2 flex-1" />
          <Button.BorderedGray onClick={handleClose}>
            {commonText.cancel()}
          </Button.BorderedGray>
          <MergeButton id={id} mergeResource={merged} />
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
            multiSortFunction(
              (resource) => resource.get('specifyUser'),
              true,
              (resource) => resource.get('timestampCreated')
            )
          );
          const target = resources[0];
          target.bulkSet(removeKey(merged.toJSON(), 'version'));

          const clones = resources.slice(1);
          loading(
            // eslint-disable-next-line functional/no-loop-statement
            ajax(
              `/api/specify/${model.name.toLowerCase()}/replace/${target.id}/`,
              {
                method: 'POST',
                headers: {
                  Accept: 'text/plain',
                },
                body: {
                  old_record_ids: clones.map((clone) => clone.id),
                  new_record_data: merged.toJSON(),
                },
                expectedErrors: [Http.NOT_ALLOWED],
                errorMode: 'dismissible',
              }
            ).then((response) => {
              if (response.status === Http.NOT_ALLOWED) {
                setError(response.data);
                return;
              }
              for (const clone of clones) {
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

function MergeButton<SCHEMA extends AnySchema>({
  id,
  mergeResource,
}: {
  readonly id: (suffix: string) => string;
  readonly mergeResource: SpecifyResource<SCHEMA>;
}): JSX.Element {
  const [formId] = React.useState(id('form'));
  const [saveBlocked, setSaveBlocked] = React.useState(false);
  const [showSaveBlockedDialog, setShowBlockedDialog] = React.useState(false);

  React.useEffect(() => {
    setSaveBlocked(false);
    return resourceOn(
      mergeResource,
      'blockersChanged',
      (): void => {
        const onlyDeferredBlockers = Array.from(
          mergeResource.saveBlockers?.blockingResources ?? []
        ).every((resource) => resource.saveBlockers?.hasOnlyDeferredBlockers());
        setSaveBlocked(!onlyDeferredBlockers);
      },
      true
    );
  }, [mergeResource]);

  return (
    <>
      {!saveBlocked ? (
        <Submit.Blue form={formId}>{treeText.merge()}</Submit.Blue>
      ) : (
        <Submit.Red className="cursor-not-allowed">
          {treeText.merge()}
        </Submit.Red>
      )}
      {showSaveBlockedDialog && (
        <SaveBlockedDialog
          resource={mergeResource}
          onClose={() => setShowBlockedDialog(false)}
        />
      )}
    </>
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
