import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import type { RA } from '../../utils/types';
import { removeItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { fetchCollection } from '../DataModel/collection';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { deserializeResource } from '../DataModel/serializers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { ResourceView } from '../Forms/ResourceView';
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

  const [previewIndex, setPreviewIndex] = React.useState<number | undefined>(
    undefined
  );
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
            className="flex gap-2 rounded bg-[color:var(--form-background)] p-2"
            key={index}
          >
            {typeof resources?.[index] === 'object' && (
              <Link.Icon
                href={resources[index].viewUrl()}
                icon="eye"
                title={commonText.view()}
                onClick={(event): void => {
                  event.preventDefault();
                  setPreviewIndex(index);
                }}
              />
            )}
            <output>{formatted}</output>
          </div>
        ))
      ) : formatted === undefined ? (
        <p>{commonText.loading()}</p>
      ) : undefined}
      {typeof previewIndex === 'number' &&
        typeof resources?.[previewIndex] === 'object' && (
          <ResourceView
            dialog="modal"
            isDependent={false}
            isSubForm={false}
            resource={resources[previewIndex]}
            onAdd={undefined}
            onClose={(): void => setPreviewIndex(undefined)}
            onDeleted={(): void =>
              setResources(removeItem(resources, previewIndex))
            }
            onSaved={undefined}
          />
        )}
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
