import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { treeText } from '../../localization/tree';
import type { GetOrSet } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Form, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import { fetchResource } from '../DataModel/resource';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { DateElement } from '../Molecules/DateElement';
import { Dialog } from '../Molecules/Dialog';
import { autoMerge } from './autoMerge';
import { CompareRecords } from './Compare';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { deserializeResource } from '../../hooks/resource';

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
          <ResourceSummary model={model} record={left} />
        </div>
        <div />
        <div />
        <div />
        <div>
          <ResourceSummary model={model} record={right} />
        </div>
        <CompareRecords
          left={left}
          merged={merged}
          model={model}
          right={right}
        />
      </Form>
      {/* FEATURE: show record usages */}
      {/* FEATURE: add a button to preview a given record in a form */}
      {/* FEATURE: exclude certain fields from comparison */}
      {/* FEATURE: add an all-left and all-right button */}
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
): GetOrSet<SpecifyResource<AnySchema>> | undefined {
  const getSet = useTriggerState(
    React.useMemo(
      () =>
        left === undefined || right === undefined
          ? undefined
          : deserializeResource(autoMerge(model, [left, right])),
      [model, left, right]
    )
  );
  return getSet[0] === undefined
    ? undefined
    : (getSet as GetOrSet<SpecifyResource<AnySchema>>);
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
