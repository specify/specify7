import React from 'react';
import { useParams } from 'react-router-dom';

import { useSearchParameter } from '../../hooks/navigation';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
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
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { deserializeResource } from '../DataModel/helpers';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import {
  fetchResource,
  resourceEvents,
  resourceOn,
} from '../DataModel/resource';
import { getModel } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { SaveBlockedDialog } from '../Forms/Save';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { userPreferences } from '../Preferences/userPreferences';
import { formatUrl } from '../Router/queryString';
import { OverlayContext, OverlayLocation } from '../Router/Router';
import { autoMerge, postMergeResource } from './autoMerge';
import { CompareRecords } from './Compare';
import { Status } from './Status';
import { InvalidMergeRecordsDialog } from './InvalidMergeRecords';
import { recordMergingTableSpec } from './definitions';
import { icons } from '../Atoms/Icons';

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

  const initialRecords = React.useRef(records);
  if (initialRecords.current === undefined && records !== undefined)
    initialRecords.current = records;

  const recordsToIgnore = React.useMemo(
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
  );

  return records === undefined ? null : recordsToIgnore !== undefined &&
    recordsToIgnore.length > 0 ? (
    <InvalidMergeRecordsDialog
      recordsToIgnore={recordsToIgnore as RA<SerializedResource<AnySchema>>}
      tableName={model.name}
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
  const formId = id('form');
  const loading = React.useContext(LoadingContext);

  const [needUpdate, setNeedUpdate] = React.useState(false);

  const rawSpecifyResources = React.useMemo(
    () => records.map(deserializeResource),
    [records, needUpdate]
  );

  const sortedResources = React.useMemo(
    () =>
      /*
       * Use the oldest resource as base so as to preserve timestampCreated
       * and, presumably the longest auditing history
       */
      Array.from(rawSpecifyResources).sort(
        multiSortFunction(
          (resource) => resource.get('specifyUser'),
          true,
          (resource) => resource.get('timestampCreated')
        )
      ),
    [rawSpecifyResources]
  );

  const target = sortedResources[0];
  const clones = sortedResources.slice(1);

  const [merged, setMerged] = useAsyncState(
    React.useCallback(
      async () =>
        records === undefined || initialRecords.current === undefined
          ? undefined
          : postMergeResource(
              initialRecords.current,
              autoMerge(
                model,
                initialRecords.current,
                userPreferences.get(
                  'recordMerging',
                  'behavior',
                  'autoPopulate'
                ),
                target.id
              )
            ).then((merged) =>
              deserializeResource(merged as SerializedResource<AnySchema>)
            ),
      [model, records]
    ),
    true
  );

  const [mergeId, setMergeId] = React.useState<string | undefined>(undefined);

  return merged === undefined ? null : (
    <MergeDialogContainer
      buttons={
        <>
          <Button.Success
            onClick={(): void =>
              loading(
                postMergeResource(
                  records,
                  autoMerge(model, records, false, target.id)
                )
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
          <MergeButton formId={formId} mergeResource={merged} />
        </>
      }
      onClose={handleClose}
    >
      {mergeId === undefined ? undefined : (
        <Status
          handleClose={() => {
            /*
             * Because we can not pass down anything from the Query Builder
             * as a prop, this is needed to rerun the query results once
             * the merge completes.
             * (the RecordMergingLink component is listening to the event)
             */
            for (const clone of clones) {
              resourceEvents.trigger('deleted', clone);
            }
            handleClose();
          }}
          mergingId={mergeId}
        />
      )}
      <CompareRecords
        formId={formId}
        merged={merged}
        model={model}
        resources={rawSpecifyResources}
        onDismiss={handleDismiss}
        onMerge={(): void => {
          target.bulkSet(removeKey(merged.toJSON(), 'version'));
          loading(
            ajax(
              `/api/specify/${model.name.toLowerCase()}/replace/${target.id}/`,
              {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                },
                body: {
                  old_record_ids: clones.map((clone) => clone.id),
                  new_record_data: merged.toJSON(),
                  background: false,
                },
                expectedErrors: [Http.NOT_ALLOWED],
                errorMode: 'dismissible',
              }
            ).then(({ data, response }) => {
              if (!response.ok) return;
              setMergeId(data);
            })
          );
          setNeedUpdate(!needUpdate);
        }}
      />
    </MergeDialogContainer>
  );
}

function MergeButton<SCHEMA extends AnySchema>({
  formId,
  mergeResource,
}: {
  readonly formId: string;
  readonly mergeResource: SpecifyResource<SCHEMA>;
}): JSX.Element {
  const [saveBlocked, setSaveBlocked] = React.useState(false);
  const [showSaveBlockedDialog, setShowBlockedDialog] = React.useState(false);
  const [
    warningDialog,
    _,
    handleCloseWarningDialog,
    handleToggleWarningDialog,
  ] = useBooleanState(false);

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

  const [noShowWarning = false, setNoShowWarning] = useCachedState(
    'merging',
    'warningDialog'
  );

  return (
    <>
      {saveBlocked ? (
        <Button.Danger className="cursor-not-allowed" onClick={undefined}>
          {treeText.merge()}
        </Button.Danger>
      ) : (
        <>
          {noShowWarning ? (
            <Submit.Blue form={formId}>{treeText.merge()}</Submit.Blue>
          ) : (
            <Button.Info onClick={handleToggleWarningDialog}>
              {treeText.merge()}
            </Button.Info>
          )}
        </>
      )}
      {showSaveBlockedDialog && (
        <SaveBlockedDialog
          resource={mergeResource}
          onClose={(): void => setShowBlockedDialog(false)}
        />
      )}
      {warningDialog && (
        <Dialog
          buttons={
            <>
              <Button.Warning onClick={handleToggleWarningDialog}>
                {commonText.cancel()}
              </Button.Warning>
              <span className="-ml-2 flex-1" />
              <Label.Inline>
                <Input.Checkbox
                  checked={noShowWarning}
                  onValueChange={(): void => setNoShowWarning(!noShowWarning)}
                />
                {commonText.dontShowAgain()}
              </Label.Inline>
              <Button.Info
                onClick={(): void => {
                  handleCloseWarningDialog();
                  document.forms.namedItem(formId)?.requestSubmit();
                }}
              >
                {commonText.proceed()}
              </Button.Info>
            </>
          }
          className={{
            container: dialogClassNames.narrowContainer,
          }}
          dimensionsKey="merging-warning"
          header={mergingText.mergeRecords()}
          onClose={undefined}
        >
          {mergingText.warningMergeText()}
        </Dialog>
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
      icon={icons.cog}
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
          selectedRows.map(async (id) => {
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
