import React from 'react';

import { csrfToken } from '../../utils/ajax/csrfToken';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { LoadingContext } from '../Core/Contexts';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';
import { cloneMapping } from './CloneMapping';
import { MappingEditor } from './MappingEditor';
import { MappingList } from './MappingList';
import { NewMappingDialog } from './NewMappingDialog';
import type { MappingRecord } from './types';

type ApiMappingRecord = {
  readonly id: number;
  readonly name: string;
  readonly mappingType: string;
  readonly isDefault: boolean;
  readonly queryId: number;
  readonly vocabulary: string;
  readonly totalFields: number;
  readonly unmappedFields: number;
};

function toMappingRecord(raw: ApiMappingRecord): MappingRecord {
  return {
    id: raw.id,
    name: raw.name,
    mappingType: raw.mappingType === "Core" ? 'Core' : 'Extension',
    isDefault: raw.isDefault,
    queryId: raw.queryId,
    vocabulary: raw.vocabulary ?? 'dwc',
    totalFields: raw.totalFields ?? 0,
    unmappedFields: raw.unmappedFields ?? 0,
  };
}

export function SchemaMapperOverlay(): JSX.Element | null {
  const handleClose = React.useContext(OverlayContext);

  if (!userInformation.isadmin) {
    return (
      <Dialog
        buttons={
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        }
        header={headerText.schemaMapper()}
        icon={icons.documentSearch}
        onClose={handleClose}
      >
        <p>You do not have permission to access this tool.</p>
      </Dialog>
    );
  }

  return <SchemaMapperOverlayInner />;
}

function SchemaMapperOverlayInner(): JSX.Element | null {
  const handleClose = React.useContext(OverlayContext);
  const loading = React.useContext(LoadingContext);

  const [mappings, setMappings] = React.useState<
    ReadonlyArray<MappingRecord> | undefined
  >(undefined);
  const [showNewDialog, setShowNewDialog] = React.useState(false);
  const [editingMappingId, setEditingMappingId] = React.useState<
    number | undefined
  >(undefined);
  const [deletingMappingId, setDeletingMappingId] = React.useState<
    number | undefined
  >(undefined);

  const fetchMappings = React.useCallback(async () => {
    const response = await fetch(`/export/list_mappings/?_=${Date.now()}`, {
        credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      setMappings([]);
      return;
    }
    const data = (await response.json()) as ReadonlyArray<ApiMappingRecord>;
    setMappings(data.map(toMappingRecord));
  }, []);

  React.useEffect(() => {
    fetchMappings().catch(console.error);
  }, [fetchMappings]);

  const coreMappings = React.useMemo(
    () => mappings?.filter((m) => m.mappingType === 'Core') ?? [],
    [mappings]
  );

  const extensionMappings = React.useMemo(
    () => mappings?.filter((m) => m.mappingType === 'Extension') ?? [],
    [mappings]
  );

  const handleClone = React.useCallback(
    async (id: number) => {
      const cloned = await cloneMapping(id);
      await fetchMappings();
      setEditingMappingId(cloned.id);
    },
    [fetchMappings]
  );

  const [deleteError, setDeleteError] = React.useState<string | undefined>(
    undefined
  );

  const handleDelete = React.useCallback(
    async (id: number) => {
      setDeleteError(undefined);
      const response = await fetch(`/export/delete_mapping/${id}/`, {
        credentials: 'same-origin',
        method: 'DELETE',
        headers: {
          'X-CSRFToken': csrfToken ?? '',
        },
      });
      if (response.ok) {
        await fetchMappings();
        setDeletingMappingId(undefined);
      } else {
        const data = await response.json().catch(() => ({}));
        setDeleteError(
          data.message ?? 'Failed to delete mapping.'
        );
      }
    },
    [fetchMappings]
  );

  const handleCreateFromScratch = React.useCallback(
    async (type: 'Core' | 'Extension', _vocabularyKey: string, name: string) => {
      const response = await fetch('/export/create_mapping/', {
        credentials: 'same-origin',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken ?? '',
        },
        body: JSON.stringify({
          name,
          mappingtype: type, query_context_table_id: 1,
        }),
      });
      if (response.ok) {
        const created = (await response.json()) as ApiMappingRecord;
        await fetchMappings();
        setShowNewDialog(false);
        setEditingMappingId(created.id);
      }
    },
    [fetchMappings]
  );

  const handleCreateFromQuery = React.useCallback(
    async (
      type: 'Core' | 'Extension',
      name: string,
      queryId: number
    ) => {
      const response = await fetch('/export/create_mapping_from_query/', {
        credentials: 'same-origin',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken ?? '',
        },
        body: JSON.stringify({
          name,
          mappingtype: type,
          query_id: queryId,
        }),
      });
      if (response.ok) {
        const created = (await response.json()) as ApiMappingRecord;
        await fetchMappings();
        setShowNewDialog(false);
        setEditingMappingId(created.id);
      }
    },
    [fetchMappings]
  );

  const handleCloneExisting = React.useCallback(
    async (mappingId: number) => {
      const cloned = await cloneMapping(mappingId);
      await fetchMappings();
      setShowNewDialog(false);
      setEditingMappingId(cloned.id);
    },
    [fetchMappings]
  );

  const handleRename = React.useCallback(
    async (id: number, newName: string) => {
      await fetch(`/export/update_mapping/${id}/`, {
        credentials: 'same-origin',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken ?? '',
        },
        body: JSON.stringify({ name: newName }),
      });
      await fetchMappings();
    },
    [fetchMappings]
  );

  if (editingMappingId !== undefined) {
    return (
      <MappingEditor
        mappingId={editingMappingId}
        onClose={() => {
          setEditingMappingId(undefined);
          fetchMappings().catch(console.error);
        }}
      />
    );
  }

  if (mappings === undefined) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Dialog
        buttons={
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        }
        header={headerText.schemaMapper()}
        icon={icons.documentSearch}
        onClose={handleClose}
      >
        <div className="flex flex-col gap-4">
          <section>
            <h3 className="text-lg font-semibold">
              {headerText.coreMappings()}
            </h3>
            {coreMappings.length === 0 ? (
              <p className="text-gray-500">{headerText.noCoreMappings()}</p>
            ) : (
              <MappingList
                mappings={coreMappings}
                onClone={(id) => {
                  loading(handleClone(id));
                }}
                onDelete={(id) => setDeletingMappingId(id)}
                onEdit={(id) => setEditingMappingId(id)}
                onRename={(id, name) => {
                  loading(handleRename(id, name));
                }}
              />
            )}
          </section>
          <section>
            <h3 className="text-lg font-semibold">
              {headerText.extensionMappings()}
            </h3>
            {extensionMappings.length === 0 ? (
              <p className="text-gray-500">
                {headerText.noExtensionMappings()}
              </p>
            ) : (
              <MappingList
                mappings={extensionMappings}
                onClone={(id) => {
                  loading(handleClone(id));
                }}
                onDelete={(id) => setDeletingMappingId(id)}
                onEdit={(id) => setEditingMappingId(id)}
                onRename={(id, name) => {
                  loading(handleRename(id, name));
                }}
              />
            )}
          </section>
          <Button.Info onClick={() => setShowNewDialog(true)}>
            {headerText.newMapping()}
          </Button.Info>
        </div>
      </Dialog>
      {showNewDialog && (
        <NewMappingDialog
          existingMappings={mappings}
          onClose={() => setShowNewDialog(false)}
          onCloneExisting={(id) => {
            loading(handleCloneExisting(id));
          }}
          onCreateFromQuery={(type, name, queryId) => {
            loading(handleCreateFromQuery(type, name, queryId));
          }}
          onCreateFromScratch={(type, vocabularyKey, name) => {
            loading(handleCreateFromScratch(type, vocabularyKey, name));
          }}
        />
      )}
      {deletingMappingId !== undefined && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>
                {commonText.cancel()}
              </Button.DialogClose>
              {deleteError === undefined && (
                <Button.Danger
                  onClick={() => {
                    loading(handleDelete(deletingMappingId));
                  }}
                >
                  {commonText.delete()}
                </Button.Danger>
              )}
            </>
          }
          header={commonText.delete()}
          onClose={() => {
            setDeletingMappingId(undefined);
            setDeleteError(undefined);
          }}
        >
          {deleteError !== undefined ? (
            <div className="flex flex-col gap-2">
              <p className="text-red-600">{deleteError}</p>
              <a
                className="text-sm text-blue-600 underline hover:text-blue-800"
                href="/specify/overlay/export-packages/"
                rel="noopener noreferrer"
              >
                {'Go to Export Packages to remove them'}
              </a>
            </div>
          ) : (
            <p>
              {`Are you sure you want to delete the mapping "${mappings.find((m) => m.id === deletingMappingId)?.name ?? ''}"? This will also delete the backing query and cannot be undone.`}
            </p>
          )}
        </Dialog>
      )}
    </>
  );
}
