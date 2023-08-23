import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { mergingText } from '../../localization/merging';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceEvents } from '../DataModel/resource';
import { ResourceView } from '../Forms/ResourceView';
import { DateElement } from '../Molecules/DateElement';
import { dialogClassNames } from '../Molecules/Dialog';
import { FormattedResource } from '../Molecules/FormattedResource';
import { TableIcon } from '../Molecules/TableIcon';
import { MergeButton } from './CompareField';
import { UsagesSection } from './Usages';

export function MergingHeader({
  merged,
  resources,
  onDismiss: handleDismiss,
}: {
  readonly merged: SpecifyResource<AnySchema>;
  readonly resources: RA<SpecifyResource<AnySchema>>;
  readonly onDismiss: (ids: RA<number>) => void;
}): JSX.Element {
  return (
    <>
      <HeaderLine
        merged={merged}
        resources={resources}
        onDismiss={handleDismiss}
      />
      <tbody>
        <SummaryLines merged={merged} resources={resources} />
        <UsagesSection resources={resources} />
        <PreviewLine merged={merged} resources={resources} />
      </tbody>
    </>
  );
}

// "f.store" needed to resolve a circular dependency
export const mergeCellBackground = f.store(
  () => dialogClassNames.solidBackground
);
export const mergeHeaderClassName = f.store(
  () => `sticky top-0 ${mergeCellBackground()} z-[20]`
);

function HeaderLine({
  merged,
  resources,
  onDismiss: handleDismiss,
}: {
  readonly merged: SpecifyResource<AnySchema>;
  readonly resources: RA<SpecifyResource<AnySchema>>;
  readonly onDismiss: (ids: RA<number>) => void;
}): JSX.Element {
  return (
    <thead>
      <tr>
        <td className={mergeCellBackground()} />
        {[merged, ...resources].map((resource, index) => (
          <th
            className={`
              ${mergeHeaderClassName()}
              ${
                index === 0
                  ? 'font-extrabold text-black dark:text-white'
                  : 'font-normal'
              }
            `}
            key={index}
            scope="col"
          >
            <TableIcon label name={resource.specifyModel.name} />
            <span className="flex-1">
              <FormattedResource asLink={false} resource={resource} />
            </span>
            {index === 0 ? undefined : (
              <Button.Icon
                icon="x"
                title={mergingText.dismissFromMerging()}
                onClick={() => handleDismiss([resource.id])}
              />
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function SummaryLines({
  merged,
  resources,
}: {
  readonly merged: SpecifyResource<AnySchema>;
  readonly resources: RA<SpecifyResource<AnySchema>>;
}): JSX.Element {
  const createdField = merged.specifyModel.getField('timestampCreated');
  const modifiedField = merged.specifyModel.getField('timestampModified');
  return (
    <>
      {typeof createdField === 'object' && (
        <MergeRow header={createdField.label}>
          <td>{commonText.notApplicable()}</td>
          {resources.map((resource, index) => (
            <td key={index}>
              <DateElement date={resource.get('timestampCreated')} />
            </td>
          ))}
        </MergeRow>
      )}
      {typeof modifiedField === 'object' && (
        <MergeRow header={modifiedField.label}>
          <td>{commonText.notApplicable()}</td>
          {resources.map((resource, index) => (
            <td key={index}>
              <DateElement date={resource.get('timestampModified')} />
            </td>
          ))}
        </MergeRow>
      )}
    </>
  );
}

export function MergeRow({
  header,
  children,
}: {
  readonly header: string;
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <tr>
      <th
        className={`
          sticky left-0 text-left ${mergeCellBackground()} z-[10]
        `}
        scope="row"
      >
        {header}
      </th>
      {children}
    </tr>
  );
}

function PreviewLine({
  merged,
  resources,
}: {
  readonly merged: SpecifyResource<AnySchema>;
  readonly resources: RA<SpecifyResource<AnySchema>>;
}): JSX.Element {
  return (
    <MergeRow header={mergingText.preview()}>
      {[merged, ...resources].map((resource, index) => (
        <RecordPreview
          index={index}
          key={index}
          merged={merged === resource ? undefined : merged}
          resource={resource}
        />
      ))}
    </MergeRow>
  );
}

function RecordPreview({
  resource,
  merged,
  index,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly merged: SpecifyResource<AnySchema> | undefined;
  readonly index: number;
}): JSX.Element {
  const [isOpen, _, handleClose, handleToggle] = useBooleanState(false);

  const title =
    index === 0
      ? mergingText.newMergedRecord()
      : mergingText.duplicateRecord({ index });
  return (
    <td className="!items-stretch">
      {typeof merged === 'object' && (
        <MergeButton field={undefined} from={resource} to={merged} />
      )}
      <Button.BorderedGray
        aria-pressed={isOpen}
        className="flex-1"
        onClick={handleToggle}
      >
        {title}
      </Button.BorderedGray>
      {isOpen && (
        <ResourceView
          dialog="nonModal"
          isDependent={false}
          isSubForm={false}
          mode={index === 0 ? 'edit' : 'view'}
          resource={resource}
          title={(formatted) => `${title}: ${formatted}`}
          onAdd={undefined}
          onClose={handleClose}
          onDeleted={(): void =>
            void resourceEvents.trigger('deleted', resource)
          }
          onSaved={undefined}
          onSaving={(unsetUnloadProtect): false => {
            unsetUnloadProtect();
            handleClose();
            return false;
          }}
        />
      )}
    </td>
  );
}
