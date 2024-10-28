import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { DataEntry } from '../Atoms/DataEntry';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Collection, SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import type {
  CollectionObject,
  CollectionObjectGroup,
} from '../DataModel/types';
import { ResourceView } from '../Forms/ResourceView';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { SearchDialog } from '../SearchDialog';

export function COJODialog({
  parentResource,
  collection,
}: {
  readonly parentResource: SpecifyResource<CollectionObjectGroup> | undefined;
  readonly collection: Collection<AnySchema> | undefined;
}): JSX.Element | null {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const COJOChildrenTables = [
    tables.CollectionObject,
    tables.CollectionObjectGroup,
  ];
  const [state, setState] = React.useState<'Add' | 'Search' | undefined>(
    undefined
  );
  const [resourceTable, setResourceTable] = React.useState<
    | SpecifyTable<CollectionObject>
    | SpecifyTable<CollectionObjectGroup>
    | undefined
  >(undefined);
  const [newResource, setNewResource] = React.useState<
    | SpecifyResource<CollectionObject>
    | SpecifyResource<CollectionObjectGroup>
    | undefined
  >(undefined);

  React.useEffect(() => {
    if (resourceTable !== undefined) {
      const createdResource = new resourceTable.Resource() as
        | SpecifyResource<CollectionObject>
        | SpecifyResource<CollectionObjectGroup>;
      setNewResource(createdResource);
    }
  }, [resourceTable]);

  const handleCOJOCreation = (
    selectedResource?:
      | SpecifyResource<CollectionObject>
      | SpecifyResource<CollectionObjectGroup>
  ): void => {
    if (parentResource === undefined) return;

    const resourceToUse = selectedResource ?? newResource;

    if (resourceToUse === undefined) return;

    void resourceToUse?.save();

    const newCOJO = new tables.CollectionObjectGroupJoin.Resource();
    const field =
      resourceToUse.specifyTable.name === 'CollectionObject'
        ? 'childCo'
        : 'childCog';

    const resourceUrl = resourceToUse.url();
    const parentResourceUrl = parentResource.url();

    newCOJO.set(field, resourceUrl as never);
    newCOJO.set('parentCog', parentResourceUrl as never);
    collection?.add(newCOJO);
  };

  const handleStates = (): void => {
    setState(undefined);
    setResourceTable(undefined);
    handleClose();
  };

  return (
    <>
      <DataEntry.Add onClick={handleOpen} />
      {isOpen && (
        <Dialog
          buttons={commonText.cancel()}
          dimensionsKey="COGChildren"
          header={formsText.addCOGChildren()}
          onClose={handleClose}
        >
          <div className="flex flex-col gap-4">
            {COJOChildrenTables.map((table) => (
              <div className="flex items-center gap-2" key={table.name}>
                <TableIcon label name={table.name} />
                {table.label}
                <DataEntry.Add
                  onClick={(): void => {
                    setState('Add');
                    setResourceTable(table);
                  }}
                />
                <DataEntry.Search
                  aria-pressed="true"
                  onClick={(): void => {
                    setState('Search');
                    setResourceTable(table);
                  }}
                />
              </div>
            ))}
          </div>
        </Dialog>
      )}
      {state === 'Add' &&
      newResource !== undefined &&
      parentResource !== undefined ? (
        <ResourceView
          dialog="nonModal"
          isDependent={false}
          isSubForm={false}
          resource={newResource as SpecifyResource<CollectionObject>}
          onAdd={undefined}
          onClose={(): void => {
            setState(undefined);
            handleClose();
          }}
          onDeleted={undefined}
          onSaved={(): void => {
            handleCOJOCreation();
            handleStates();
          }}
          onSaving={undefined}
        />
      ) : undefined}
      {state === 'Search' && parentResource !== undefined ? (
        <SearchDialog
          extraFilters={undefined}
          forceCollection={undefined}
          multiple
          searchView={undefined}
          table={resourceTable as SpecifyTable<CollectionObject>}
          onClose={(): void => setState(undefined)}
          onSelected={(selectedResources): void => {
            selectedResources.forEach((selectedResource) => {
              handleCOJOCreation(selectedResource);
            });
            handleStates();
          }}
        />
      ) : undefined}
    </>
  );
}
