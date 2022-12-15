import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { treeText } from '../../localization/tree';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import { fetchResource } from '../DataModel/resource';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { Dialog } from '../Molecules/Dialog';
import { CompareRecords } from './Compare';

export function RecordMerging({
  model,
  selectedRows,
  onMerged: handleMerged,
}: {
  readonly model: SpecifyModel;
  readonly selectedRows: ReadonlySet<number>;
  readonly onMerged: () => void;
}): JSX.Element | null {
  const [isOpen, _, handleClose, handleToggle] = useBooleanState();

  return model.name === 'Agent' ? (
    <>
      <Button.Small disabled={selectedRows.size === 0} onClick={handleToggle}>
        {queryText('mergeRecords')}
      </Button.Small>
      {isOpen && (
        <MergingDialog
          model={model}
          selectedRows={selectedRows}
          onClose={handleClose}
          onMerged={handleMerged}
        />
      )}
    </>
  ) : null;
}

function MergingDialog({
  model,
  selectedRows,
  onClose: handleClose,
  onMerged: handleMerged,
}: {
  readonly model: SpecifyModel;
  readonly selectedRows: ReadonlySet<number>;
  readonly onClose: () => void;
  readonly onMerged: () => void;
}): JSX.Element | null {
  const records = useResources(model, selectedRows);
  const [showMatching = false, setShowMatching] = useCachedState(
    'merging',
    'showMatchingFields'
  );

  const id = useId('merging-dialog');
  return records === undefined ? null : (
    <Dialog
      buttons={
        <>
          <Label.Inline>
            <Input.Checkbox
              checked={!showMatching}
              onValueChange={(checked): void => setShowMatching(!checked)}
            />
            {queryText('showConflictingFieldsOnly')}
          </Label.Inline>
          <span className="-ml-2 flex-1" />
          <Button.BorderedGray onClick={handleClose}>
            {commonText('cancel')}
          </Button.BorderedGray>
          <Submit.Blue form={id('form')}>{treeText('merge')}</Submit.Blue>
        </>
      }
      header={queryText('mergeRecords')}
      onClose={handleClose}
    >
      <Form
        onSubmit={(): void => {
          // FIXME: complete this. use the oldest resource as base (to preserve timestampCreated)
          handleMerged();
        }}
        className="overflow-hidden"
      >
        <table
          className={`
            grid-table grid-cols-[auto,repeat(var(--columns),minmax(0,1fr))] gap-2
            overflow-auto
          `}
          style={
            {
              '--columns': records.length + 1,
            } as React.CSSProperties
          }
        >
          <CompareRecords
            model={model}
            records={records}
            showMatching={showMatching}
          />
        </table>
      </Form>
    </Dialog>
  );
}

function useResources(
  model: SpecifyModel,
  selectedRows: ReadonlySet<number>
): RA<SerializedResource<AnySchema>> | undefined {
  return useAsyncState(
    React.useCallback(
      async () =>
        Promise.all(
          Array.from(selectedRows, async (id) => fetchResource(model.name, id))
        ),
      [model, selectedRows]
    ),
    true
  )[0];
}
