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
import { fetchCollection } from '../DataModel/collection';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { deserializeResource } from '../DataModel/serializers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { ResourceLink } from '../Molecules/ResourceLink';
import { SearchDialog } from '../SearchDialog';

const defaultPreviewSize = 4;

export function useResourcePreview(table: SpecifyTable): {
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
            domainFilter: false, // REFACTOR: set to true after scoping reimplementation
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

  return {
    resources: getSetResources,
    children: (children) => (
      <div
        // Setting width prevents dialog resizing when output is loaded
        className="flex flex-col gap-2"
      >
        {resourcesText.preview()}
        <div>
          <Button.Success onClick={handleOpen}>
            {commonText.search()}
          </Button.Success>
        </div>
        {typeof resources === 'object' ? (
          resources.map((resource, index) => {
            const output = children(resource, index);

            return output === undefined ? undefined : (
              <div
                className="flex gap-2 rounded bg-[color:var(--form-background)] p-2"
                key={index}
              >
                {output !== undefined && (
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
                )}
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
            table={table}
            onClose={handleClose}
            onSelected={setResources}
          />
        )}
      </div>
    ),
  };
}

export function ResourcePreview({
  table,
  doFormatting,
}: {
  readonly table: SpecifyTable;
  readonly doFormatting: (
    resources: RA<SpecifyResource<AnySchema>>
  ) => Promise<RA<React.ReactNode>>;
}): JSX.Element | null {
  const {
    resources: [resources],
    children,
  } = useResourcePreview(table);
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
