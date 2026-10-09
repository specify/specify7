import React from 'react';

import { commonText } from '../../localization/common';
import { mergingText } from '../../localization/merging';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { MergeRow } from './Header';
import { useDeleteBlockersForResource } from '../DeleteBlockers/useDeleteBlockersForResource';
import { DeleteBlockers } from '../DeleteBlockers';
import { DeleteBlockerProvider } from '../DeleteBlockers/Context';

export function UsagesSection({
  resources,
}: {
  readonly resources: RA<SpecifyResource<AnySchema>>;
}): JSX.Element {
  return (
    <DeleteBlockerProvider>
      <MergeRow className="!items-start" header={mergingText.linkedRecords()}>
        <td className="!items-start">{commonText.notApplicable()}</td>
        {resources.map((resource, index) => (
          <Usages key={index} resource={resource} />
        ))}
      </MergeRow>
    </DeleteBlockerProvider>
  );
}

// REFACTOR: consider merging this with Molecules/LinkedRecords
function Usages({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element {
  const { blockers, onBlockersRequested: handleBlockersRequested } =
    useDeleteBlockersForResource(resource);

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
        <Button.Small className="w-full" onClick={handleBlockersRequested}>
          {mergingText.linkedRecords()}
        </Button.Small>
      ) : (
        <DeleteBlockers blockers={blockers} />
      )}
    </td>
  );
}
