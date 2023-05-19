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
import { LoadingContext } from '../Core/Contexts';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { fetchResource, resourceEvents } from '../DataModel/resource';
import { deserializeResource } from '../DataModel/serializers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { SaveButton } from '../Forms/Save';
import { Dialog } from '../Molecules/Dialog';
import { userPreferences } from '../Preferences/userPreferences';
import { formatUrl } from '../Router/queryString';
import { OverlayContext, OverlayLocation } from '../Router/Router';
import { autoMerge } from './autoMerge';
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

  const handleDismiss = (dismissedId: number): void =>
    setIds(ids.filter((id) => id !== dismissedId).join(','));

  return table === undefined ? null : (
    <Merging ids={ids} table={table} onDismiss={handleDismiss} />
  );
}

function Merging({
  table,
  ids,
  onDismiss: handleDismiss,
}: {
  readonly table: SpecifyTable;
  readonly ids: RA<number>;
  readonly onDismiss: (id: number) => void;
}): JSX.Element | null {
  const records = useResources(table, ids);
  const initialRecords = React.useRef(records);
  if (initialRecords.current === undefined && records !== undefined)
    initialRecords.current = records;

  const handleClose = React.useContext(OverlayContext);
  // Close the dialog when resources are deleted/unselected
  React.useEffect(
    () => (ids.length < 2 ? handleClose() : undefined),
    [ids, handleClose]
  );

  const [form, setForm] = React.useState<HTMLFormElement | null>(null);
  const formId = useId('merging')('form');

  const loading = React.useContext(LoadingContext);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [merged, setMerged] = useAsyncState(
    React.useCallback(
      () =>
        records === undefined || initialRecords.current === undefined
          ? undefined
          : autoMerge(
              table,
              initialRecords.current,
              userPreferences.get('recordMerging', 'behavior', 'autoPopulate')
            ).then((merged) => deserializeResource(merged)),
      [table, records]
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
                autoMerge(table, records, false)
                  .then((merged) => deserializeResource(merged))
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
      {typeof error === 'string' && <ErrorMessage>{error}</ErrorMessage>}
      <CompareRecords
        formRef={setForm}
        id={formId}
        merged={merged}
        records={records}
        table={table}
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
            ajax(
              `/api/specify/${table.name.toLowerCase()}/replace/${target.id}/`,
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
              for (const clone of clones)
                resourceEvents.trigger('deleted', clone);

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
  form,
  mergeResource,
}: {
  readonly form: HTMLFormElement | null;
  readonly mergeResource: SpecifyResource<SCHEMA>;
}): JSX.Element | null {
  return form === null ? null : (
    <SaveButton
      form={form}
      label={treeText.merge()}
      resource={mergeResource}
      // Prevent regular form submit in favor of our custom
      onSaving={(): false => {
        form.requestSubmit();
        return false;
      }}
    />
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
          selectedRows.map((id) => {
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
