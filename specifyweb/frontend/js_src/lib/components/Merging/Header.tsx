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

function HeaderLine({
  merged,
  resources,
}: {
  readonly merged: SpecifyResource<AnySchema>;
  readonly resources: RA<SpecifyResource<AnySchema>>;
}): JSX.Element {
  return (
    <tr>
      <td />
      <th scope="col">
        <FormattedResource resource={merged} />
      </th>
      {resources.map((resource, index) => (
        <th key={index} scope="col">
          <FormattedResource resource={resource} />
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
        <tr>
          <th scope="row">{createdField.label}</th>
          {[merged, ...resources].map((resource, index) => (
            <td key={index}>
              <DateElement date={resource.get('timestampCreated')} />
            </td>
          ))}
        </tr>
      )}
      {typeof modifiedField === 'object' && (
        <tr>
          <th scope="row">{modifiedField.label}</th>
          {[merged, ...resources].map((resource, index) => (
            <td key={index}>
              <DateElement date={resource.get('timestampModified')} />
            </td>
          ))}
        </tr>
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
    <tr>
      <th scope="row">{queryText('referencesToRecord')}</th>
      <td>{commonText('notApplicable')}</td>
      {resources.map((resource, index) => (
        <ResourceBlockers key={index} resource={resource} />
      ))}
    </tr>
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

function PreviewLine({
  merged,
  resources,
}: {
  readonly merged: SpecifyResource<AnySchema>;
  readonly resources: RA<SpecifyResource<AnySchema>>;
}): JSX.Element {
  return (
    <tr>
      <th scope="row">{queryText('preview')}</th>
      {[merged, ...resources].map((resource, index) => (
        <RecordPreview key={index} resource={resource} />
      ))}
    </tr>
  );
}

function RecordPreview({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element {
  const [isOpen, _, handleClose, handleToggle] = useBooleanState(false);

  return (
    <>
      <Button.Gray aria-pressed={isOpen} onClick={handleToggle}>
        {queryText('preview')}
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
