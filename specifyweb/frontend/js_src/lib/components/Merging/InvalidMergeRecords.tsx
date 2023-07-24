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
            className="min-h-[theme(spacing.8)]"
          >
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
  modelName,
  recordsToIgnore,
  onDismiss: handleDismiss,
}: {
  readonly modelName: keyof Tables;
  readonly recordsToIgnore: RA<SerializedResource<AnySchema>>;
  readonly onDismiss: (ids: RA<number>) => void;
}) {
  const handleClose = React.useContext(OverlayContext);
  return (
    <Dialog
      header={recordMergingTableSpec[modelName]?.dialogHeader!}
      icon={dialogIcons.warning}
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Button.Small
            onClick={() =>
              handleDismiss(
                recordsToIgnore.map((record) => record.id as number)
              )
            }
          >
            {mergingText.mergeRest()}
          </Button.Small>
        </>
      }
      onClose={handleClose}
    >
      <InvalidMergeRecords
        resources={recordsToIgnore as RA<SerializedResource<AnySchema>>}
        header={recordMergingTableSpec[modelName]?.dialogText}
      />
    </Dialog>
  );
}
