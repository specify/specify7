import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { f } from '../../utils/functools';
import type { GetOrSet, RA } from '../../utils/types';
import { removeItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import { fetchCollection } from '../DataModel/collection';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { deserializeResource } from '../DataModel/serializers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { ResourceLink } from '../Molecules/ResourceLink';
import { SearchDialog } from '../SearchDialog';

const defaultPreviewSize = 4;

export function useResourcePreview(
  table: SpecifyTable,
  isAggregator: boolean = false
): {
  readonly resources: GetOrSet<RA<SpecifyResource<AnySchema>> | undefined>;
  readonly children: (
    callback: (
      resource: SpecifyResource<AnySchema>,
      index: number
    ) => React.ReactNode | undefined
  ) => JSX.Element;
} {
  const getSetResources = useAsyncState<RA<SpecifyResource<AnySchema>>>(
    // Use last 4 records as a preview by default
    React.useCallback(
      async () =>
        fetchCollection(
          table.name,
          {
            limit: defaultPreviewSize,
            // REFACTOR: set to true after scoping re-implementation
            domainFilter: false,
          },
          {
            orderBy: [
              ...(table.getField('timestampModified') === undefined
                ? []
                : ['-timestampModified']),
              '-id',
            ].join(','),
          }
        ).then(({ records }) => records.map(deserializeResource)),
      [table]
    ),
    false
  );
  const [resources, setResources] = getSetResources;

  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const loading = React.useContext(LoadingContext);

  return {
    resources: getSetResources,
    children: (children) => (
      <div
        // Setting width prevents dialog resizing when output is loaded
        className={`flex ${
          isAggregator ? 'w-[min(40rem,50vw)] break-all' : ''
        } flex-col gap-2`}
      >
        <span className="font-bold">{resourcesText.preview()}</span>
        {resourcesText.previewExplainer()}
        <div>
          <Button.Secondary onClick={handleOpen}>
            {commonText.search()}
          </Button.Secondary>
        </div>
        {typeof resources === 'object' ? (
          resources.map((resource, index) => {
            const output = children(resource, index);

            return output === undefined ? undefined : (
              <div
                className="flex gap-2 rounded bg-[color:var(--form-background)] p-2"
                key={index}
              >
                <ResourceLink
                  component={Link.Icon}
                  props={{
                    icon: 'eye',
                  }}
                  resource={resource}
                  resourceView={{
                    onDeleted: (): void =>
                      setResources(removeItem(resources, index)),
                  }}
                />
                <output className="whitespace-pre-wrap">{output}</output>
              </div>
            );
          })
        ) : (
          <p>{commonText.loading()}</p>
        )}
        {isOpen && (
          <SearchDialog
            extraFilters={undefined}
            forceCollection={undefined}
            multiple
            onlyUseQueryBuilder
            table={table}
            onClose={handleClose}
            onSelected={(selected): void =>
              void loading(
                Promise.all(
                  selected.map(async (resource) => resource.fetch())
                ).then(setResources)
              )
            }
          />
        )}
      </div>
    ),
  };
}

export function ResourcePreview({
  table,
  doFormatting,
  isAggregator,
}: {
  readonly table: SpecifyTable;
  readonly doFormatting: (
    resources: RA<SpecifyResource<AnySchema>>
  ) => Promise<RA<React.ReactNode>> | RA<React.ReactNode>;
  readonly isAggregator?: boolean;
}): JSX.Element | null {
  const {
    resources: [resources],
    children,
  } = useResourcePreview(table, isAggregator);
  const [formatted] = useAsyncState(
    React.useCallback(
      async () => f.maybe(resources, doFormatting),
      [resources, doFormatting]
    ),
    false
  );
  return children((_, index) =>
    formatted === undefined ? commonText.loading() : formatted[index]
  );
}
