import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { fetchCollection } from '../DataModel/collection';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { deserializeResource } from '../DataModel/serializers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { SearchDialog } from '../SearchDialog';

const defaultPreviewSize = 4;

export function GenericFormatterPreview({
  table,
  doFormatting,
}: {
  readonly table: SpecifyTable | undefined;
  readonly doFormatting: (
    resources: RA<SpecifyResource<AnySchema>>
  ) => Promise<RA<string>>;
}): JSX.Element {
  const [resources, setResources] = useAsyncState<
    RA<SpecifyResource<AnySchema>>
  >(
    // Use last 4 records as a preview by default
    React.useCallback(
      async () =>
        table === undefined
          ? undefined
          : fetchCollection(table.name, {
              limit: defaultPreviewSize,
              orderBy: '-id',
            }).then(({ records }) => records.map(deserializeResource)),
      [table]
    ),
    false
  );

  const [formatted] = useAsyncState(
    React.useCallback(
      async () => (resources === undefined ? false : doFormatting(resources)),
      [resources, doFormatting]
    ),
    false
  );

  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const templateResource = React.useMemo(() => new table!.Resource(), [table]);

  return (
    <div
      // Setting width prevents dialog resizing when output is loaded
      className="flex w-[min(40rem,50vw)] flex-col gap-2"
    >
      {resourcesText.preview()}
      <div>
        <Button.Green onClick={handleOpen}>{commonText.search()}</Button.Green>
      </div>
      {typeof formatted === 'object' ? (
        formatted.map((formatted, index) => (
          <div
            className="rounded bg-[color:var(--form-background)] p-2"
            key={index}
          >
            <output>{formatted}</output>
          </div>
        ))
      ) : formatted === undefined ? (
        <p>{commonText.loading()}</p>
      ) : undefined}
      {isOpen && (
        <SearchDialog
          extraFilters={undefined}
          forceCollection={undefined}
          multiple
          templateResource={templateResource}
          onClose={handleClose}
          onSelected={setResources}
        />
      )}
    </div>
  );
}
