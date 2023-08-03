import { RA } from '../../utils/types';
import { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import { Ul } from '../Atoms';
import { FormattedResource } from '../Molecules/FormattedResource';
import { deserializeResource } from '../DataModel/helpers';
import React from 'react';
import { OverlayContext } from '../Router/Router';
import { Dialog } from '../Molecules/Dialog';
import { recordMergingTableSpec } from './definitions';
import { dialogIcons } from '../Atoms/Icons';
import { Button } from '../Atoms/Button';
import { commonText } from '../../localization/common';
import { mergingText } from '../../localization/merging';
import { Tables } from '../DataModel/types';
import { TableIcon } from '../Molecules/TableIcon';
import { className } from '../Atoms/className';

function InvalidMergeRecords({
  resources,
  tableName,
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
        {resources.map((resource, index) => (
          <li
            key={(resource.id as number) ?? index}
            className="flex min-h-[theme(spacing.8)] flex-1 items-center gap-2"
          >
            <TableIcon label={true} name={tableName} />
            <FormattedMemoizedResource resource={resource} />
          </li>
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
  return <FormattedResource resource={deserializedResource} />;
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
      header={mergingText.someCannotBeMerged()}
      icon={dialogIcons.warning}
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
      onClose={handleClose}
    >
      <InvalidMergeRecords
        resources={recordsToIgnore}
        specificText={recordMergingTableSpec[tableName]?.dialogSpecificText}
        tableName={tableName}
      />
    </Dialog>
  );
}
