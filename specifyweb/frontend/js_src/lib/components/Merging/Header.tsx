import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
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
import { FormattedResource } from '../Molecules/FormattedResource';
import { TableIcon } from '../Molecules/TableIcon';
import { dialogClassNames } from '../Molecules/Dialog';

export function MergingHeader({
  merged,
  resources,
}: {
  readonly merged: SpecifyResource<AnySchema>;
  readonly resources: RA<SpecifyResource<AnySchema>>;
}): JSX.Element {
  return (
    <>
      <HeaderLine merged={merged} resources={resources} />
      <SummaryLines merged={merged} resources={resources} />
      <UsagesLine resources={resources} />
      <PreviewLine merged={merged} resources={resources} />
    </>
  );
}

const background = dialogClassNames.solidBackground;

export function MergeRow({
  header,
  children,
}: {
  readonly header: string;
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <tr>
      <th className={`sticky left-0 text-left ${background}`} scope="row">
        {header}
      </th>
      {children}
    </tr>
  );
}

function HeaderLine({
  merged,
  resources,
}: {
  readonly merged: SpecifyResource<AnySchema>;
  readonly resources: RA<SpecifyResource<AnySchema>>;
}): JSX.Element {
  return (
    <tr>
      <td className={background} />
      {[merged, ...resources].map((resource, index) => (
        <th className={`sticky top-0 ${background}`} key={index} scope="col">
          <TableIcon label name={resource.specifyModel.name} />
          <FormattedResource resource={resource} asLink={false} />
        </th>
      ))}
    </tr>
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
          {[merged, ...resources].map((resource, index) => (
            <td key={index}>
              <DateElement date={resource.get('timestampCreated')} flipDates />
            </td>
          ))}
        </MergeRow>
      )}
      {typeof modifiedField === 'object' && (
        <MergeRow header={modifiedField.label}>
          {[merged, ...resources].map((resource, index) => (
            <td key={index}>
              <DateElement date={resource.get('timestampModified')} flipDates />
            </td>
          ))}
        </MergeRow>
      )}
    </>
  );
}

function UsagesLine({
  resources,
}: {
  readonly resources: RA<SpecifyResource<AnySchema>>;
}): JSX.Element {
  return (
    <MergeRow header={queryText('referencesToRecord')}>
      <td>{commonText('notApplicable')}</td>
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
    React.useCallback(async () => fetchBlockers(resource), [resource]),
    false
  );
  return (
    <td className="flex-col !items-start">
      {blockers === undefined ? (
        commonText('loading')
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

// FEATURE: display number in dialog heading
function PreviewLine({
  merged,
  resources,
}: {
  readonly merged: SpecifyResource<AnySchema>;
  readonly resources: RA<SpecifyResource<AnySchema>>;
}): JSX.Element {
  return (
    <MergeRow header={queryText('preview')}>
      {[merged, ...resources].map((resource, index) => (
        <RecordPreview key={index} resource={resource} index={index} />
      ))}
    </MergeRow>
  );
}

function RecordPreview({
  resource,
  index,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly index: number;
}): JSX.Element {
  const [isOpen, _, handleClose, handleToggle] = useBooleanState(false);

  return (
    <>
      <Button.Gray aria-pressed={isOpen} onClick={handleToggle}>
        {index === 0
          ? queryText('previewMerged')
          : `${queryText('preview')} ${index}`}
      </Button.Gray>
      {isOpen && (
        <ResourceView
          dialog="nonModal"
          isDependent={false}
          isSubForm={false}
          mode="view"
          resource={resource}
          onAdd={undefined}
          onClose={handleClose}
          // FIXME: handle this case
          onDeleted={undefined}
          onSaved={undefined}
        />
      )}
    </>
  );
}
