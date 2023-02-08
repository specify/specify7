import { RA } from '../../utils/types';
import { AnySchema } from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { mergingText } from '../../localization/merging';
import { commonText } from '../../localization/common';
import { useAsyncState } from '../../hooks/useAsyncState';
import React from 'react';
import { fetchBlockers } from '../Forms/DeleteButton';
import { MergeRow } from './Header';
import { DeleteBlockers } from '../Forms/DeleteBlocked';

export function UsagesSection({
  resources,
}: {
  readonly resources: RA<SpecifyResource<AnySchema>>;
}): JSX.Element {
  return (
    <MergeRow header={mergingText.referencesToRecord()}>
      <td>{commonText.notApplicable()}</td>
      {resources.map((resource, index) => (
        <Usages key={index} resource={resource} />
      ))}
    </MergeRow>
  );
}

function Usages({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element {
  const [blockers, setBlockers] = useAsyncState(
    React.useCallback(async () => fetchBlockers(resource, true), [resource]),
    false
  );
  return (
    <td className="h-[theme(spacing.40)] flex-col !items-start overflow-auto">
      {blockers === undefined ? (
        commonText.loading()
      ) : (
        <DeleteBlockers
          resource={resource}
          blockers={[blockers, setBlockers]}
        />
      )}
    </td>
  );
}
