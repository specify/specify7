import React from 'react';

import { deserializeResource } from '../../hooks/resource';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { treeText } from '../../localization/tree';
import { Button } from '../Atoms/Button';
import { Form, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { fetchResource } from '../DataModel/resource';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { DateElement } from '../Molecules/DateElement';
import { Dialog } from '../Molecules/Dialog';
import { autoMerge } from './autoMerge';
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
      <Button.Small disabled={selectedRows.size !== 2} onClick={handleToggle}>
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
  const records = React.useMemo(() => Array.from(selectedRows), [selectedRows]);
  const left = useResource(model, records[0]);
  const right = useResource(model, records[1]);
  const merged = useMerged(model, left, right);

  const id = useId('merging-dialog');
  return left === undefined ||
    right === undefined ||
    merged === undefined ? null : (
    <Dialog
      buttons={
        <>
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
        className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]"
        onSubmit={(): void => {
          // FIXME: complete this
          handleMerged();
        }}
      >
        <div>
          {/* FEATURE: show record usages */}
          <ResourceSummary model={model} record={left} />
          {/* FEATURE: add a button to preview a given record in a form */}
        </div>
        {/* FEATURE: add an all-left and all-right button */}
        <div />
        <div>{queryText('mergedRecord')}</div>
        <div />
        <div>
          <ResourceSummary model={model} record={right} />
        </div>
        {/* BUG: hide timestamp modified/created/version */}
        {/* FEATURE: look for other fields to hide */}
        {/* FEATURE: allow for any number of records to merge*/}
        {/* FEATURE: freeze the first column - labels */}
        {/* FEATURE: add merge util to user tools */}
        {/* FEATURE: add merge util to form meta */}
        <CompareRecords
          left={left}
          merged={merged}
          model={model}
          right={right}
        />
      </Form>
    </Dialog>
  );
}

function useResource(
  model: SpecifyModel,
  id: number
): SerializedResource<AnySchema> | undefined {
  const [resource] = useAsyncState(
    React.useCallback(async () => fetchResource(model.name, id), [model, id]),
    true
  );
  return resource;
}

function useMerged(
  model: SpecifyModel,
  left: SerializedResource<AnySchema> | undefined,
  right: SerializedResource<AnySchema> | undefined
): SpecifyResource<AnySchema> | undefined {
  return React.useMemo(
    () =>
      left === undefined || right === undefined
        ? undefined
        : deserializeResource(autoMerge(model, [left, right])),
    [model, left, right]
  );
}

function ResourceSummary({
  record,
  model,
}: {
  readonly record: SerializedResource<AnySchema>;
  readonly model: SpecifyModel;
}): JSX.Element {
  const createdField = model.getField('timestampCreated');
  const modifiedField = model.getField('timestampModified');
  return (
    <>
      {typeof createdField === 'object' && (
        <Label.Block>
          {createdField.label}
          <DateElement date={record.timestampCreated as string} />
        </Label.Block>
      )}
      {typeof modifiedField === 'object' && (
        <Label.Block>
          {modifiedField.label}
          <DateElement date={record.timestampModified as string} />
        </Label.Block>
      )}
    </>
  );
}
