import { RA } from '../../utils/types';
import { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import { H2, Ul } from '../Atoms';
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

function InvalidMergeRecords({
  resources,
  header = '',
}: {
  readonly resources: RA<SerializedResource<AnySchema>>;
  readonly header?: string;
}): JSX.Element {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <H2>{header}</H2>
      <Ul className="gap-2">
        {resources.map((resource, index) => (
          <li
            key={(resource.id as number) ?? index}
            className="flex flex min-h-[theme(spacing.8)] flex-1 items-center gap-2"
          >
            <TableIcon label={true} name={resource._tableName} />
            <FormattedResource
              resource={deserializeResource(resource)}
            ></FormattedResource>
          </li>
        ))}
      </Ul>
    </div>
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
      header={recordMergingTableSpec[tableName]?.dialogHeader!}
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
        header={recordMergingTableSpec[tableName]?.dialogText}
      />
    </Dialog>
  );
}
