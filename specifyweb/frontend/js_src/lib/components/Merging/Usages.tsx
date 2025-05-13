import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { mergingText } from '../../localization/merging';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { DeleteBlockers } from '../Forms/DeleteBlocked';
import { fetchBlockers } from '../Forms/DeleteButton';
import { MergeRow } from './Header';

export function UsagesSection({
  resources,
}: {
  readonly resources: RA<SpecifyResource<AnySchema>>;
}): JSX.Element {
  const [blockerLoaded, handleBlockersLoaded] = useBooleanState();
  return (
    <MergeRow className="!items-start" header={mergingText.linkedRecords()}>
      <td className="!items-start">{commonText.notApplicable()}</td>
      {resources.map((resource, index) => (
        <Usages
          blockersLoaded={blockerLoaded}
          key={index}
          resource={resource}
          onBlockersLoaded={handleBlockersLoaded}
        />
      ))}
    </MergeRow>
  );
}

function Usages({
  resource,
  blockersLoaded,
  onBlockersLoaded: handleBlockersLoaded,
}: {
  readonly blockersLoaded: boolean;
  readonly resource: SpecifyResource<AnySchema>;
  readonly onBlockersLoaded: () => void;
}): JSX.Element {
  const [loadBlockers, setLoadBlockers] = React.useState<boolean>(false);

  const [blockers, setBlockers] = useAsyncState(
    React.useCallback(
      async () =>
        loadBlockers
          ? fetchBlockers(resource, true).then((data) => {
              if (data.length > 0) handleBlockersLoaded();
              return data;
            })
          : undefined,
      [loadBlockers, resource, handleBlockersLoaded]
    ),
    false
  );
  return (
    <td
      className={`
        flex-col !items-start overflow-auto
        ${blockersLoaded ? 'h-[theme(spacing.40)]' : 'h-[theme(spacing.14)]'}
      `}
    >
      {loadBlockers ? (
        blockers === undefined ? (
          commonText.loading()
        ) : (
          <DeleteBlockers
            blockers={[blockers, setBlockers]}
            resource={resource}
          />
        )
      ) : (
        <Button.Small className="w-full" onClick={() => setLoadBlockers(true)}>
          {mergingText.linkedRecords()}
        </Button.Small>
      )}
    </td>
  );
}
