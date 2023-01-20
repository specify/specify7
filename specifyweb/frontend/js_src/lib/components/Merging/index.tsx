import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { treeText } from '../../localization/tree';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import type { RA } from '../../utils/types';
import { removeKey, sortFunction } from '../../utils/utils';
import { ErrorMessage } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import { fetchResource } from '../DataModel/resource';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { CompareRecords } from './Compare';
import { mergingText } from '../../localization/merging';
import { hijackBackboneAjax } from '../../utils/ajax/backboneAjax';
import { deserializeResource } from '../../hooks/resource';
import { autoMerge } from './autoMerge';
import { useLiveState } from '../../hooks/useLiveState';

const recordMergingTables = new Set<keyof Tables>(['Agent']);

export function RecordMerging({
  model,
  selectedRows,
  onDeleted: handleDeleted,
  onDismiss: handleDismiss,
}: {
  readonly model: SpecifyModel;
  readonly selectedRows: ReadonlySet<number>;
  readonly onDeleted: (id: number) => void;
  readonly onDismiss: (id: number) => void;
}): JSX.Element | null {
  const [isOpen, _, handleClose, handleToggle] = useBooleanState();

  return recordMergingTables.has(model.name) ? (
    <>
      <Button.Small disabled={selectedRows.size < 2} onClick={handleToggle}>
        {mergingText.mergeRecords()}
      </Button.Small>
      {isOpen && (
        <MergingDialog
          ids={selectedRows}
          model={model}
          onClose={handleClose}
          onDeleted={handleDeleted}
          onDismiss={handleDismiss}
        />
      )}
    </>
  ) : null;
}

export function MergingDialog({
  model,
  ids,
  onClose: handleClose,
  onDismiss: handleDismiss,
  onDeleted: handleDeleted = handleDismiss,
}: {
  readonly model: SpecifyModel;
  readonly ids: ReadonlySet<number>;
  readonly onClose: () => void;
  readonly onDeleted: ((id: number) => void) | undefined;
  readonly onDismiss: (id: number) => void;
}): JSX.Element | null {
  const records = useResources(model, ids);

  // Close the dialog when resources are deleted/unselected
  React.useEffect(
    () => (ids.size < 2 ? handleClose() : undefined),
    [ids.size, handleClose]
  );

  const id = useId('merging-dialog');
  const loading = React.useContext(LoadingContext);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [merged, setMerged] = useLiveState(
    React.useCallback(
      () =>
        records === undefined
          ? undefined
          : deserializeResource(autoMerge(model, records, true)),
      [model, records]
    )
  );
  return records === undefined || merged === undefined ? null : (
    <MergeDialogContainer
      onClose={handleClose}
      buttons={
        <>
          <Button.Blue
            onClick={(): void =>
              setMerged(deserializeResource(autoMerge(model, records, false)))
            }
          >
            {mergingText.autoMerge()}
          </Button.Blue>
          <ToggleMergeView />
          <span className="-ml-2 flex-1" />
          <Button.BorderedGray onClick={handleClose}>
            {commonText.cancel()}
          </Button.BorderedGray>
          <Submit.Blue form={id('form')}>{treeText.merge()}</Submit.Blue>
        </>
      }
    >
      {typeof error === 'string' && <ErrorMessage>{error}</ErrorMessage>}
      <CompareRecords
        formId={id('form')}
        model={model}
        merged={merged}
        records={records}
        onDeleted={handleDeleted}
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
              [Http.OK],
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
                  },
                  {
                    expectedResponseCodes: [Http.NO_CONTENT, Http.NOT_ALLOWED],
                    errorMode: 'dismissible',
                  }
                );
                if (response.status === Http.NOT_ALLOWED) {
                  setError(response.data);
                  return;
                }
                handleDeleted(clone.id);
              }
              setError(undefined);
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
  selectedRows: ReadonlySet<number>
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
          Array.from(selectedRows, (id) => {
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
