import React from 'react';
import { useParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

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
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { runAllFieldChecks } from '../DataModel/businessRules';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { fetchResource, resourceEvents } from '../DataModel/resource';
import { useAllSaveBlockers } from '../DataModel/saveBlockers';
import { deserializeResource } from '../DataModel/serializers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTable } from '../DataModel/tables';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { userPreferences } from '../Preferences/userPreferences';
import { formatUrl } from '../Router/queryString';
import { OverlayContext, OverlayLocation } from '../Router/Router';
import { autoMerge, postMergeResource } from './autoMerge';
import { CompareRecords } from './Compare';
import { recordMergingTableSpec } from './definitions';
import { InvalidMergeRecordsDialog } from './InvalidMergeRecords';
import { mergingQueryParameter } from './queryString';
import { MergeStatus } from './Status';

export function RecordMergingLink({
  table,
  selectedRows,
  // Called when merging dialog closed, only if some records were merged
  onMerged: handleMerged,
  onDeleted: handleDeleted,
}: {
  readonly table: SpecifyTable;
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
  const table = getTable(tableName);

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

  const handleDismiss = (dismissedIds: RA<number>): void =>
    setIds(ids.filter((id) => !dismissedIds.includes(id)).join(','));

  return table === undefined ? null : (
    <RestrictMerge ids={ids} table={table} onDismiss={handleDismiss} />
  );
}

// FIXME: Remove this once bussinessrules issues have been figured out
function RestrictMerge({
  table,
  ids,
  onDismiss: handleDismiss,
}: {
  readonly table: SpecifyTable;
  readonly ids: RA<number>;
  readonly onDismiss: (ids: RA<number>) => void;
}): JSX.Element | null {
  const records = useResources(table, ids);

  const initialRecords = React.useRef(records);
  if (initialRecords.current === undefined && records !== undefined)
    initialRecords.current = records;

  const recordsToIgnore = React.useMemo(
    () =>
      records?.filter((record) =>
        recordMergingTableSpec[table.name]?.unmergable?.matches(record as never)
      ),
    [records]
  );

  return records === undefined ? null : recordsToIgnore !== undefined &&
    recordsToIgnore.length > 0 ? (
    <InvalidMergeRecordsDialog
      recordsToIgnore={recordsToIgnore}
      tableName={table.name}
      onDismiss={
        // Disable merging if less than 2 remaining
        records.length - recordsToIgnore.length >= 2 ? handleDismiss : undefined
      }
    />
  ) : (
    <Merging records={records} table={table} onDismiss={handleDismiss} />
  );
}

function Merging({
  table,
  records,
  onDismiss: handleDismiss,
}: {
  readonly table: SpecifyTable;
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

  const [form, setForm] = React.useState<HTMLFormElement | null>(null);
  const formId = useId('merging')('form');
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
       * and, presumably the longest auditing history. If specifyuser exist
       * for agents being merged, take the most recent agent with specify user.
       * Multiple agents with specify user isn't handled.
       */
      Array.from(rawSpecifyResources).sort(
        multiSortFunction(
          (resource) => resource.get('specifyUser') ?? '',
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
                table,
                initialRecords.current,
                userPreferences.get(
                  'recordMerging',
                  'behavior',
                  'autoPopulate'
                ),
                target.id
              )
            ).then(async (merged) => {
              const mergedResource = deserializeResource(
                merged as SerializedResource<AnySchema>
              );
              if (merged !== undefined) await runAllFieldChecks(mergedResource);
              return mergedResource;
            }),
      [table, records]
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
                  autoMerge(table, records, false, target.id)
                )
                  .then(async (merged) => {
                    // REFACTOR: move all this to postMergeResource?
                    const mergedResource = deserializeResource(
                      merged as SerializedResource<AnySchema>
                    );
                    if (merged !== undefined)
                      await runAllFieldChecks(mergedResource);
                    return mergedResource;
                  })
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
          <MergeButton form={form} mergeResource={merged} />
        </>
      }
      onClose={handleClose}
    >
      {mergeId === undefined ? undefined : (
        <MergeStatus
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
        formRef={setForm}
        id={formId}
        merged={merged}
        records={records}
        table={table}
        onDismiss={handleDismiss}
        onMerge={(): void => {
          target.bulkSet(removeKey(merged.toJSON(), 'version'));
          loading(
            ajax(
              `/api/specify/${table.name.toLowerCase()}/replace/${target.id}/`,
              {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                },
                body: {
                  old_record_ids: clones.map((clone) => clone.id),
                  new_record_data: merged.toJSON(),
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
  form,
  mergeResource,
}: {
  readonly form: HTMLFormElement | null;
  readonly mergeResource: SpecifyResource<SCHEMA>;
}): JSX.Element | null {
  const [saveBlocked, setSaveBlocked] = React.useState(false);
  const [
    warningDialog,
    _,
    handleCloseWarningDialog,
    handleToggleWarningDialog,
  ] = useBooleanState(false);

  const blockers = useAllSaveBlockers(mergeResource);

  React.useEffect(() => {
    setSaveBlocked(() => blockers.length > 0);
  }, [mergeResource, blockers]);

  const [noShowWarning = false, setNoShowWarning] = useCachedState(
    'merging',
    'warningDialog'
  );

  return form === null ? null : (
    <>
      {saveBlocked ? (
        <Button.Danger className="cursor-not-allowed" onClick={undefined}>
          {treeText.merge()}
        </Button.Danger>
      ) : (
        <>
          {noShowWarning ? (
            <Submit.Info form={form.id}>{treeText.merge()}</Submit.Info>
          ) : (
            <Button.Info onClick={handleToggleWarningDialog}>
              {treeText.merge()}
            </Button.Info>
          )}
        </>
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
                  form.requestSubmit();
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
  readonly header?: LocalizedString;
  readonly children: React.ReactNode;
  readonly buttons: JSX.Element;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={buttons}
      icon={icons.cog}
      onClose={handleClose}
      header={header}
      // Disable gradient because table headers have solid backgrounds
      specialMode="noGradient"
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
  table: SpecifyTable,
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
            return resource ?? fetchResource(table.name, id);
          })
        ).then((resources) => {
          cached.current = resources;
          return resources;
        }),
      [table, selectedRows]
    ),
    true
  )[0];
}
