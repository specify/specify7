import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../../localization/common';
import { headerText } from '../../../localization/header';
import { csrfToken as csrfTokenValue } from '../../../utils/ajax/csrfToken';
import { Button } from '../../Atoms/Button';
import { Input, Label } from '../../Atoms/Form';
import { icons } from '../../Atoms/Icons';
import { userInformation } from '../../InitialContext/userInformation';
import { Dialog } from '../../Molecules/Dialog';
import { OverlayContext } from '../../Router/Router';
import type { MappingSummary } from '../types';

type ExportPackageRecord = {
  readonly id: number;
  readonly exportName: string;
  readonly fileName: string;
  readonly isRss: boolean;
  readonly frequency: number | undefined;
  readonly coreMappingId: number;
  readonly lastExported: string | undefined;
  readonly hasMetadata: boolean;
};

export function ExportPackagesOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);

  if (!userInformation.isadmin) {
    return (
      <Dialog
        buttons={
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        }
        header={headerText.exportPackages()}
        icon={icons.archive}
        onClose={handleClose}
      >
        <p>You do not have permission to access this tool.</p>
      </Dialog>
    );
  }

  return <ExportPackagesInner />;
}

function ExportPackagesInner(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  const [packages, setPackages] = React.useState<
    ReadonlyArray<ExportPackageRecord>
  >([]);
  const [mappings, setMappings] = React.useState<
    ReadonlyArray<MappingSummary>
  >([]);
  const [showCreate, setShowCreate] = React.useState(false);
  const [downloadingId, setDownloadingId] = React.useState<number | undefined>(
    undefined
  );
  const [downloadResult, setDownloadResult] = React.useState<
    { readonly id: number; readonly success: boolean; readonly message: string } | undefined
  >(undefined);
  const [deletingId, setDeletingId] = React.useState<number | undefined>(
    undefined
  );
  const [elapsed, setElapsed] = React.useState(0);

  // Elapsed time counter while downloading
  React.useEffect(() => {
    if (downloadingId === undefined) {
      setElapsed(0);
      return undefined;
    }
    setElapsed(0);
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [downloadingId]);

  const fetchAll = React.useCallback(() => {
    fetch('/export/list_export_datasets/', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    })
      .then(async (r) => r.json())
      .then(setPackages)
      .catch(() => {});
    fetch('/export/list_mappings/', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    })
      .then(async (r) => r.json())
      .then(setMappings)
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const csrfToken = csrfTokenValue ?? '';

  const coreMappings = mappings.filter((m) => m.mappingType === 'Core');

  const getMappingName = (id: number): string =>
    mappings.find((m) => m.id === id)?.name ?? `Mapping #${id}`;

  const elapsedRef = React.useRef(0);
  elapsedRef.current = elapsed;

  const handleDownload = React.useCallback(
    async (pkg: ExportPackageRecord) => {
      setDownloadingId(pkg.id);
      setDownloadResult(undefined);
      try {
        const response = await fetch(`/export/generate_dwca/${pkg.id}/`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'X-CSRFToken': csrfToken },
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(
            (err as { error?: string }).error ?? 'Export failed'
          );
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
          response.headers
            .get('Content-Disposition')
            ?.match(/filename="(.+)"/)?.[1] ?? pkg.fileName;
        a.style.display = 'none';
        document.body.append(a);
        a.click();
        // Delay cleanup so the browser can start the download
        setTimeout(() => {
          a.remove();
          URL.revokeObjectURL(url);
        }, 1000);
        setDownloadResult({
          id: pkg.id,
          success: true,
          message: `Downloaded ${pkg.fileName} (${elapsedRef.current}s)`,
        });
        fetchAll();
      } catch (error) {
        setDownloadResult({
          id: pkg.id,
          success: false,
          message:
            error instanceof Error ? error.message : 'Download failed',
        });
      } finally {
        setDownloadingId(undefined);
      }
    },
    [csrfToken, fetchAll]
  );

  const handleDelete = React.useCallback(
    async (id: number) => {
      await fetch(`/export/delete_dataset/${id}/`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'X-CSRFToken': csrfToken },
      });
      setDeletingId(undefined);
      fetchAll();
    },
    [csrfToken, fetchAll]
  );

  return (
    <>
      <Dialog
        buttons={
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        }
        header={headerText.exportPackages()}
        icon={icons.archive}
        onClose={handleClose}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            {'Each archive pairs a DwC mapping with a downloadable Darwin Core Archive (.zip) for GBIF or other aggregators.'}
          </p>

          {/* Package list */}
          {packages.length === 0 ? (
            <p className="text-gray-500">
              {'No archives configured yet. Click below to create one.'}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {packages.map((pkg) => (
                <div
                  className="flex flex-col gap-2 rounded border p-3"
                  key={pkg.id}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium">{pkg.exportName}</span>
                      <div className="text-sm text-gray-500">
                        {`Mapping: ${getMappingName(pkg.coreMappingId)}`}
                      </div>
                      {pkg.lastExported !== undefined && (
                        <div className="text-xs text-gray-400">
                          {`Last exported: ${new Date(pkg.lastExported).toLocaleDateString()}`}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button.Small
                        onClick={() => setDeletingId(pkg.id)}
                      >
                        {'Delete'}
                      </Button.Small>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button.Info
                      disabled={downloadingId !== undefined}
                      onClick={() => {
                        handleDownload(pkg).catch(console.error);
                      }}
                    >
                      {downloadingId === pkg.id
                        ? `Generating... ${elapsed}s`
                        : `Download ${pkg.fileName}`}
                    </Button.Info>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-500">
                    <input
                      checked={pkg.isRss}
                      type="checkbox"
                      onChange={() => {
                        fetch(`/export/update_dataset/${pkg.id}/`, {
                          method: 'PUT',
                          credentials: 'same-origin',
                          headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrfToken,
                          },
                          body: JSON.stringify({ isrss: !pkg.isRss }),
                        })
                          .then(() => fetchAll())
                          .catch(console.error);
                      }}
                    />
                    {'Publish to RSS feed (for GBIF harvesting)'}
                  </label>
                  <EmlButtons
                    csrfToken={csrfToken}
                    datasetId={pkg.id}
                    hasMetadata={pkg.hasMetadata ?? false}
                    onImported={fetchAll}
                  />
                  {downloadResult?.id === pkg.id && (
                    <p
                      className={`text-sm ${
                        downloadResult.success
                          ? 'text-green-700'
                          : 'text-red-600'
                      }`}
                    >
                      {downloadResult.message}
                      {downloadResult.success && (
                        <>
                          {' — '}
                          <a
                            className="text-blue-600 underline hover:text-blue-800"
                            href="https://www.gbif.org/tools/data-validator"
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            Validate on GBIF
                          </a>
                        </>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create button */}
          <Button.Info onClick={() => setShowCreate(true)}>
            {'New DwC Archive'}
          </Button.Info>

          {/* RSS actions — only shown if any archive is RSS-enabled */}
          {packages.some((p) => p.isRss) && (
            <RssSection csrfToken={csrfToken} />
          )}
        </div>
      </Dialog>

      {/* Create dialog */}
      {showCreate && (
        <CreateArchiveDialog
          coreMappings={coreMappings}
          csrfToken={csrfToken}
          onClose={() => {
            setShowCreate(false);
            fetchAll();
          }}
        />
      )}

      {/* Delete confirmation */}
      {deletingId !== undefined && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Danger
                onClick={() => {
                  handleDelete(deletingId).catch(console.error);
                }}
              >
                {commonText.delete()}
              </Button.Danger>
            </>
          }
          header={'Delete Archive' as LocalizedString}
          onClose={() => setDeletingId(undefined)}
        >
          <p>
            {`Delete "${packages.find((p) => p.id === deletingId)?.exportName ?? ''}"? This cannot be undone.`}
          </p>
        </Dialog>
      )}
    </>
  );
}

function CreateArchiveDialog({
  coreMappings,
  csrfToken,
  onClose,
}: {
  readonly coreMappings: ReadonlyArray<MappingSummary>;
  readonly csrfToken: string;
  readonly onClose: () => void;
}): JSX.Element {
  const [name, setName] = React.useState('');
  const [selectedMapping, setSelectedMapping] = React.useState<number | ''>('');
  const [saving, setSaving] = React.useState(false);

  const fileName = React.useMemo(() => {
    if (name.trim().length === 0) return '';
    return `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}.zip`;
  }, [name]);

  const canSave = name.trim().length > 0 && selectedMapping !== '';

  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Button.Info
            disabled={!canSave || saving}
            onClick={() => {
              if (!canSave) return;
              setSaving(true);
              fetch('/export/create_dataset/', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                  'Content-Type': 'application/json',
                  'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({
                  exportname: name.trim(),
                  filename: fileName,
                  coremapping_id: selectedMapping,
                  includeinfeed: false,
                  frequency: 0,
                  extensions: [],
                }),
              })
                .then(() => onClose())
                .catch(console.error)
                .finally(() => setSaving(false));
            }}
          >
            {saving ? 'Creating...' : 'Create'}
          </Button.Info>
        </>
      }
      header={'New DwC Archive' as LocalizedString}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <Label.Block>
          {'Archive Name'}
          <Input.Text
            placeholder="e.g. Botany Occurrence Export"
            required
            value={name}
            onValueChange={setName}
          />
        </Label.Block>
        {fileName.length > 0 && (
          <p className="text-sm text-gray-500">{`File: ${fileName}`}</p>
        )}
        <Label.Block>
          {'DwC Mapping'}
          <select
            className="w-full rounded border p-1"
            value={selectedMapping}
            onChange={(e) =>
              setSelectedMapping(
                e.target.value ? Number(e.target.value) : ''
              )
            }
          >
            <option value="">{'-- Select a mapping --'}</option>
            {coreMappings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Label.Block>
        <p className="text-xs text-gray-400">
          {'The mapping determines which Specify fields become which DwC columns in the archive. Configure mappings in DwC Mapping.'}
        </p>
      </div>
    </Dialog>
  );
}

function EmlButtons({
  csrfToken,
  datasetId,
  hasMetadata,
  onImported,
}: {
  readonly csrfToken: string;
  readonly datasetId: number;
  readonly hasMetadata: boolean;
  readonly onImported: () => void;
}): JSX.Element {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [status, setStatus] = React.useState<string | undefined>(undefined);
  const [pendingFile, setPendingFile] = React.useState<string | undefined>(
    undefined
  );
  const [preview, setPreview] = React.useState<
    { readonly raw?: string } | undefined
  >(undefined);
  const [showPreview, setShowPreview] = React.useState(false);

  const doImport = React.useCallback(
    (content: string) => {
      fetch(`/export/update_dataset/${datasetId}/`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({ eml_xml: content }),
      })
        .then((resp) => {
          if (resp.ok) {
            setStatus('EML imported');
            setTimeout(() => setStatus(undefined), 3000);
            onImported();
          } else {
            setStatus('Import failed');
          }
        })
        .catch(() => setStatus('Import failed'));
    },
    [csrfToken, datasetId, onImported]
  );

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400">{'Metadata:'}</span>
      {hasMetadata && (
        <Button.Small
          onClick={() => {
            setShowPreview(true);
            fetch(`/export/preview_eml/${datasetId}/`, {
              credentials: 'same-origin',
              headers: { Accept: 'application/json' },
            })
              .then(async (r) => r.json())
              .then(setPreview)
              .catch(() => setPreview(undefined));
          }}
        >
          {'View EML'}
        </Button.Small>
      )}
      {!hasMetadata && (
        <span className="italic text-gray-400">{'none'}</span>
      )}
      <Button.Small
        onClick={() =>
          window.open(
            'https://gbif-norway.github.io/eml-generator-js',
            '_blank'
          )
        }
      >
        {'Generate EML'}
      </Button.Small>
      <Button.Small onClick={() => fileRef.current?.click()}>
        {'Import EML'}
      </Button.Small>
      {status !== undefined && (
        <span
          className={
            status === 'EML imported' ? 'text-green-700' : 'text-red-600'
          }
        >
          {status}
        </span>
      )}
      <input
        accept=".xml"
        className="hidden"
        ref={fileRef}
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file === undefined) return;
          const reader = new FileReader();
          reader.onload = () => {
            const content = reader.result as string;
            const doc = new DOMParser().parseFromString(content, 'text/xml');
            if (doc.querySelector('parsererror') !== null) {
              setStatus('Invalid XML file');
              return;
            }
            if (hasMetadata) {
              setPendingFile(content);
            } else {
              doImport(content);
            }
          };
          reader.readAsText(file);
          event.target.value = '';
        }}
      />
      {/* Overwrite confirmation */}
      {pendingFile !== undefined && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Danger
                onClick={() => {
                  doImport(pendingFile);
                  setPendingFile(undefined);
                }}
              >
                {'Overwrite'}
              </Button.Danger>
            </>
          }
          header={'Replace EML?' as LocalizedString}
          onClose={() => setPendingFile(undefined)}
        >
          <p>
            {
              'This archive already has EML metadata attached. Importing a new file will replace it.'
            }
          </p>
        </Dialog>
      )}
      {/* Preview dialog */}
      {showPreview && (
        <Dialog
          buttons={
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          }
          header={'EML Metadata' as LocalizedString}
          onClose={() => {
            setShowPreview(false);
            setPreview(undefined);
          }}
        >
          {preview === undefined ? (
            <p className="text-gray-500">{'Loading...'}</p>
          ) : (
            <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded bg-gray-100 p-3 text-xs dark:bg-neutral-800">
              {(() => {
                try {
                  const raw = (preview as { raw?: string }).raw ?? '';
                  const doc = new DOMParser().parseFromString(raw, 'text/xml');
                  const serializer = new XMLSerializer();
                  const xml = serializer.serializeToString(doc);
                  // Simple pretty-print
                  let indent = 0;
                  return xml
                    .replace(/></g, '>\n<')
                    .split('\n')
                    .map((line) => {
                      if (line.startsWith('</')) indent = Math.max(0, indent - 1);
                      const result = '  '.repeat(indent) + line.trim();
                      if (
                        line.startsWith('<') &&
                        !line.startsWith('</') &&
                        !line.endsWith('/>') &&
                        !line.includes('</')
                      )
                        indent++;
                      return result;
                    })
                    .join('\n');
                } catch {
                  return (preview as { raw?: string }).raw ?? 'No EML data';
                }
              })()}
            </pre>
          )}
        </Dialog>
      )}
    </div>
  );
}

function RssSection({
  csrfToken,
}: {
  readonly csrfToken: string;
}): JSX.Element {
  const [updating, setUpdating] = React.useState(false);
  const [message, setMessage] = React.useState<string | undefined>(undefined);
  const [copied, setCopied] = React.useState(false);

  return (
    <div className="mt-2 flex flex-col gap-2">
      <p className="text-xs text-gray-500">
        {'Archives marked with RSS are published to an RSS feed that GBIF can harvest automatically.'}
      </p>
      <div className="flex gap-2">
        <Button.Small
          onClick={() => {
            const url = `${window.location.origin}/export/rss/`;
            navigator.clipboard
              .writeText(url)
              .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              })
              .catch(console.error);
          }}
        >
          {copied ? 'Copied!' : 'Copy RSS URL'}
        </Button.Small>
        <Button.Small
          disabled={updating}
          onClick={() => {
            setUpdating(true);
            setMessage(undefined);
            fetch('/export/force_update_packages/', {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 'X-CSRFToken': csrfToken },
            })
              .then(() => setMessage('RSS feed update started.'))
              .catch(() => setMessage('Failed to update RSS feed.'))
              .finally(() => setUpdating(false));
          }}
        >
          {updating ? 'Updating...' : 'Rebuild RSS Feed'}
        </Button.Small>
      </div>
      {message !== undefined && (
        <p className="text-xs text-green-700">{message}</p>
      )}
    </div>
  );
}
