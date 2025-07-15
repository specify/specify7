import React from 'react';

import { commonText } from '../../localization/common';
import { mergingText } from '../../localization/merging';
import type { RA } from '../../utils/types';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { dialogIcons } from '../Atoms/Icons';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import { deserializeResource } from '../DataModel/serializers';
import type { Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { FormattedResource } from '../Molecules/FormattedResource';
import { TableIcon } from '../Molecules/TableIcon';
import { OverlayContext } from '../Router/Router';
import { recordMergingTableSpec } from './definitions';

function InvalidMergeRecords({
  resources,
  specificText = '',
}: {
  readonly tableName: keyof Tables;
  readonly resources: RA<SerializedResource<AnySchema>>;
  readonly specificText?: string;
}): JSX.Element {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <h3 className={className.headerPrimary}>
        {mergingText.recordNotBeMergedReason()}
      </h3>
      <p>{specificText}</p>
      <Ul className="gap-2">
        {resources.map((resource) => (
          <FormattedMemoizedResource
            key={resource.id as number}
            resource={resource}
          />
        ))}
      </Ul>
    </div>
  );
}

function FormattedMemoizedResource({
  resource,
}: {
  readonly resource: SerializedResource<AnySchema>;
}): JSX.Element {
  const deserializedResource = React.useMemo(
    () => deserializeResource(resource),
    [resource]
  );
  return (
    <li
      className="flex min-h-[theme(spacing.8)] flex-1 items-center gap-2"
      key={resource.id as number}
    >
      <TableIcon label name={deserializedResource.specifyTable.name} />
      <FormattedResource resource={deserializedResource} />
    </li>
  );
}

export function InvalidMergeRecordsDialog({
  tableName,
  recordsToIgnore,
  onDismiss: handleDismiss,
}: {
  readonly tableName: keyof Tables;
  readonly recordsToIgnore: RA<SerializedResource<AnySchema>>;
  readonly onDismiss?: (ids: RA<number>) => void;
}) {
  const handleClose = React.useContext(OverlayContext);
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          {typeof handleDismiss === 'function' && (
            <Button.Small
              onClick={() =>
                handleDismiss(
                  recordsToIgnore.map((record) => record.id as number)
                )
              }
            >
              {mergingText.mergeOthers()}
            </Button.Small>
          )}
        </>
      }
      header={mergingText.someCannotBeMerged()}
      icon={dialogIcons.warning}
      onClose={handleClose}
    >
      <InvalidMergeRecords
        resources={recordsToIgnore}
        specificText={recordMergingTableSpec[tableName]?.unmergable?.message}
        tableName={tableName}
      />
    </Dialog>
  );
}
