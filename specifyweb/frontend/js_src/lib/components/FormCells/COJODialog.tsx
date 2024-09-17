import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { localized } from '../../utils/types';
import { DataEntry } from '../Atoms/DataEntry';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpecifyTable } from '../DataModel/specifyTable';
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
}: {
  readonly parentResource: SpecifyResource<CollectionObjectGroup> | undefined;
}): JSX.Element | null {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const COJOChildrentables = [
    tables.CollectionObject,
    tables.CollectionObjectGroup,
  ];
  const [state, setState] = React.useState<'Add' | 'Search' | undefined>(
    undefined
  );
  const [resource, setResource] = React.useState<
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
    if (resource !== undefined) {
      const createdResource = new resource.Resource();
      setNewResource(createdResource);
    }
  }, [resource]);
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
            {COJOChildrentables.map((table) => (
              <div className="flex items-center gap-2" key={table.name}>
                <TableIcon label name={table.name} />
                {localized(table.label)}
                <DataEntry.Add
                  onClick={(): void => {
                    setState('Add');
                    setResource(table);
                  }}
                />
                <DataEntry.Search
                  aria-pressed="true"
                  onClick={(): void => {
                    setState('Search');
                    setResource(table);
                  }}
                />
              </div>
            ))}
          </div>
        </Dialog>
      )}
      {state === 'Add' && newResource !== undefined ? (
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
            parentResource?.set('cojo', newResource as never);
            setState(undefined);
            handleClose();
          }}
          onSaving={undefined}
        />
      ) : undefined}
      {state === 'Search' && resource !== undefined ? (
        <SearchDialog
          extraFilters={undefined}
          forceCollection={undefined}
          multiple={false}
          searchView={undefined}
          table={resource as SpecifyTable<CollectionObject>}
          onClose={(): void => setState(undefined)}
          onSelected={([selectedResource]): void => {
            // @ts-expect-error Need to refactor this to use generics
            void newResource.set('cojo', selectedResource);
            setState(undefined);
            handleClose();
          }}
        />
      ) : undefined}
    </>
  );
}
