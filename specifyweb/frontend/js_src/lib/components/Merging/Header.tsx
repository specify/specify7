import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { DeleteBlocker } from '../Forms/DeleteBlocked';
import { DeleteBlockers } from '../Forms/DeleteBlocked';
import { fetchBlockers } from '../Forms/DeleteButton';
import { ResourceView } from '../Forms/ResourceView';
import { DateElement } from '../Molecules/DateElement';
import { dialogClassNames } from '../Molecules/Dialog';
import { FormattedResource } from '../Molecules/FormattedResource';
import { TableIcon } from '../Molecules/TableIcon';
import { MergeButton } from './Compare';
import { mergingText } from '../../localization/merging';

export function MergingHeader({
  merged,
  resources,
  onDeleted: handleDeleted,
}: {
  readonly merged: SpecifyResource<AnySchema>;
  readonly resources: RA<SpecifyResource<AnySchema>>;
  readonly onDeleted: (id: number) => void;
}): JSX.Element {
  return (
    <>
      <HeaderLine merged={merged} resources={resources} />
      <tbody>
        <SummaryLines merged={merged} resources={resources} />
        <UsagesLine resources={resources} />
        <PreviewLine
          merged={merged}
          resources={resources}
          onDeleted={handleDeleted}
        />
      </tbody>
    </>
  );
}

export const mergeCellBackground = dialogClassNames.solidBackground;
export const mergeHeaderClassName = `sticky top-0 ${mergeCellBackground} z-[20]`;

function HeaderLine({
  merged,
  resources,
}: {
  readonly merged: SpecifyResource<AnySchema>;
  readonly resources: RA<SpecifyResource<AnySchema>>;
}): JSX.Element {
  return (
    <thead>
      <tr>
        <td className={mergeCellBackground} />
        {[merged, ...resources].map((resource, index) => (
          <th
            className={`
              ${mergeHeaderClassName}
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
            <FormattedResource asLink={false} resource={resource} />
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
              <DateElement date={resource.get('timestampCreated')} flipDates />
            </td>
          ))}
        </MergeRow>
      )}
      {typeof modifiedField === 'object' && (
        <MergeRow header={modifiedField.label}>
          <td>{commonText.notApplicable()}</td>
          {resources.map((resource, index) => (
            <td key={index}>
              <DateElement date={resource.get('timestampModified')} flipDates />
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
          sticky left-0 text-left ${mergeCellBackground} z-[10]
        `}
        scope="row"
      >
        {header}
      </th>
      {children}
    </tr>
  );
}

function UsagesLine({
  resources,
}: {
  readonly resources: RA<SpecifyResource<AnySchema>>;
}): JSX.Element {
  return (
    <MergeRow header={mergingText.referencesToRecord()}>
      <td>{commonText.notApplicable()}</td>
      {resources.map((resource, index) => (
        <ResourceBlockers key={index} resource={resource} />
      ))}
    </MergeRow>
  );
}

function ResourceBlockers({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element {
  const [blockers] = useAsyncState<RA<DeleteBlocker>>(
    React.useCallback(async () => fetchBlockers(resource, true), [resource]),
    false
  );
  return (
    <td className="max-h-[theme(spacing.40)] flex-col !items-start">
      {blockers === undefined ? (
        commonText.loading()
      ) : (
        <DeleteBlockers
          blockers={blockers}
          resource={resource}
          onClose={undefined}
          onDeleted={f.void}
        />
      )}
    </td>
  );
}

function PreviewLine({
  merged,
  resources,
  onDeleted: handleDeleted,
}: {
  readonly merged: SpecifyResource<AnySchema>;
  readonly resources: RA<SpecifyResource<AnySchema>>;
  readonly onDeleted: (id: number) => void;
}): JSX.Element {
  return (
    <MergeRow header={mergingText.preview()}>
      {[merged, ...resources].map((resource, index) => (
        <RecordPreview
          index={index}
          key={index}
          resource={resource}
          merged={merged === resource ? undefined : merged}
          onDeleted={(): void => handleDeleted(resource.id)}
        />
      ))}
    </MergeRow>
  );
}

function RecordPreview({
  resource,
  merged,
  index,
  onDeleted: handleDeleted,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly merged: SpecifyResource<AnySchema> | undefined;
  readonly index: number;
  readonly onDeleted: () => void;
}): JSX.Element {
  const [isOpen, _, handleClose, handleToggle] = useBooleanState(false);

  const title =
    index === 0
      ? mergingText.previewMerged()
      : `${mergingText.preview()} ${index}`;
  return (
    <td className="!items-stretch">
      {typeof merged === 'object' && (
        <MergeButton field={undefined} from={resource} to={merged} />
      )}
      <Button.Gray
        aria-pressed={isOpen}
        onClick={handleToggle}
        className="flex-1"
      >
        {title}
      </Button.Gray>
      {isOpen && (
        <ResourceView
          title={(formatted) => `${title}: ${formatted}`}
          dialog="nonModal"
          isDependent={false}
          isSubForm={false}
          mode={index === 0 ? 'edit' : 'view'}
          resource={resource}
          onAdd={undefined}
          onClose={handleClose}
          onDeleted={handleDeleted}
          onSaved={undefined}
        />
      )}
    </td>
  );
}
