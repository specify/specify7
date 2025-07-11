import React from 'react';

import { useDeleteBlockers } from '../../hooks/useDeleteBlockers';
import { commonText } from '../../localization/common';
import { mergingText } from '../../localization/merging';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { DeleteBlockers } from '../Forms/DeleteBlocked';
import { MergeRow } from './Header';

export function UsagesSection({
  resources,
}: {
  readonly resources: RA<SpecifyResource<AnySchema>>;
}): JSX.Element {
  return (
    <MergeRow className="!items-start" header={mergingText.linkedRecords()}>
      <td className="!items-start">{commonText.notApplicable()}</td>
      {resources.map((resource, index) => (
        <Usages key={index} resource={resource} />
      ))}
    </MergeRow>
  );
}

// REFACTOR: consider merging this with Molecules/LinkedRecords
function Usages({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element {
  const { blockers, setBlockers, fetchBlockers } = useDeleteBlockers(
    resource,
    true
  );

  const hasBlockers = Array.isArray(blockers) && blockers.length > 0;

  return (
    <td
      className={`
        flex-col !items-start overflow-auto
        ${hasBlockers ? 'h-[theme(spacing.40)]' : 'h-[theme(spacing.14)]'}
      `}
    >
      {blockers === undefined ? (
        commonText.loading()
      ) : blockers === false ? (
        <Button.Small className="w-full" onClick={(): void => fetchBlockers()}>
          {mergingText.linkedRecords()}
        </Button.Small>
      ) : (
        <DeleteBlockers
          blockers={[blockers, setBlockers]}
          resource={resource}
        />
      )}
    </td>
  );
}
