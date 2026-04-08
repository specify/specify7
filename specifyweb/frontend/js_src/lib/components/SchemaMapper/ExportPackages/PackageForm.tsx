/**
 * PackageForm — Create/edit form for an Export Package (ExportDataSet).
 *
 * Fields:
 *  - Export Name (text, required)
 *  - File Name (text, required, must end with .zip)
 *  - Core Mapping selector (dropdown of Core-type SchemaMappings)
 *  - Metadata (optional resource picker)
 *  - Extensions section (list of Extension-type mappings with add/remove)
 *  - Collection selector
 *  - "Include in RSS feed?" checkbox
 *  - Frequency (number, required if RSS checked, > 0)
 *  - Save / Cancel buttons
 *  - Download Archive button (for saved packages)
 */

import React from 'react';

import { ajax } from '../../../utils/ajax';
import { csrfToken } from '../../../utils/ajax/csrfToken';
import { schema } from '../../DataModel/schema';
import { userInformation } from '../../InitialContext/userInformation';
import { Button } from '../../Atoms/Button';
import { Input, Label } from '../../Atoms/Form';
import type { MappingSummary } from '../types';

type PackageFormData = {
  exportname: string;
  filename: string;
  coremapping: number | null;
  metadata: number | null;
  includeinfeed: boolean;
  frequency: number;
  extensions: readonly number[];
};

const emptyForm: PackageFormData = {
  exportname: '',
  filename: '',
  coremapping: null,
  metadata: null,
  includeinfeed: false,
  frequency: 0,
  extensions: [],
};

export function PackageForm({
  datasetId,
  onClose,
}: {
  readonly datasetId: number | undefined;
  readonly onClose: () => void;
}): JSX.Element {
  const [form, setForm] = React.useState<PackageFormData>(emptyForm);
  const [mappings, setMappings] = React.useState<
    readonly MappingSummary[] | undefined
  >(undefined);
  const [saving, setSaving] = React.useState(false);
  const [exportSuccess, setExportSuccess] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);

  // EML import state
  const [emlFile, setEmlFile] = React.useState<{
    readonly name: string;
    readonly content: string;
  } | undefined>(undefined);
  const [emlError, setEmlError] = React.useState<string | undefined>(undefined);
  const emlInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch available schema mappings
  React.useEffect(() => {
    ajax<readonly MappingSummary[]>('/export/list_mappings/', {
      headers: { Accept: 'application/json' },
    })
      .then((response) => setMappings(response.data))
      .catch(console.error);
  }, []);

  // Load existing dataset when editing (datasetId is provided)
  React.useEffect(() => {
    if (datasetId === undefined) return;
    let cancelled = false;
    ajax<{
      readonly exportname: string;
      readonly filename: string;
      readonly coremapping_id: number | null;
      readonly metadata: number | null;
      readonly includeinfeed: boolean;
      readonly frequency: number;
      readonly extensions: readonly number[];
    }>(`/export/get_dataset/${datasetId}/`, {
      headers: { Accept: 'application/json' },
    })
      .then((response) => {
        if (cancelled) return;
        const data = response.data;
        // Clear "Copy of" names so the user must enter unique names (clone flow)
        const hasCopyPrefix = data.exportname.startsWith('Copy of');
        setForm({
          exportname: hasCopyPrefix ? '' : data.exportname,
          filename: hasCopyPrefix ? '' : data.filename,
          coremapping: data.coremapping_id,
          metadata: data.metadata,
          includeinfeed: data.includeinfeed,
          frequency: data.frequency,
          extensions: data.extensions,
        });
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [datasetId]);

  const coreMappings = React.useMemo(
    () => mappings?.filter((m) => m.mappingType === 'Core') ?? [],
    [mappings]
  );

  const extensionMappings = React.useMemo(
    () => mappings?.filter((m) => m.mappingType === 'Extension') ?? [],
    [mappings]
  );

  const isNew = datasetId === undefined;
  const filenameValid = form.filename.endsWith('.zip');
  const frequencyValid = !form.includeinfeed || form.frequency > 0;
  const canSave =
    form.exportname.trim().length > 0 &&
    filenameValid &&
    form.coremapping !== null &&
    frequencyValid;

  const handleSave = React.useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = {
        exportname: form.exportname,
        filename: form.filename,
        coremapping_id: form.coremapping,
        metadata: form.metadata,
        includeinfeed: form.includeinfeed,
        frequency: form.frequency,
        extensions: [...form.extensions],
        ...(emlFile !== undefined ? { eml_xml: emlFile.content } : {}),
      };

      if (isNew) {
        await ajax('/export/create_dataset/', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: payload,
        });
      } else {
        await ajax(`/export/update_dataset/${datasetId}/`, {
          method: 'PUT',
          headers: { Accept: 'application/json' },
          body: payload,
        });
      }
      onClose();
    } catch (caughtError) {
      console.error('Failed to save export package:', caughtError);
    } finally {
      setSaving(false);
    }
  }, [canSave, isNew, datasetId, form, onClose]);

  const addExtension = React.useCallback(
    (mappingId: number) => {
      if (!form.extensions.includes(mappingId)) {
        setForm((prev) => ({
          ...prev,
          extensions: [...prev.extensions, mappingId],
        }));
      }
    },
    [form.extensions]
  );

  const removeExtension = React.useCallback((mappingId: number) => {
    setForm((prev) => ({
      ...prev,
      extensions: prev.extensions.filter((id) => id !== mappingId),
    }));
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-xl font-semibold">
        {isNew ? 'New Export Package' : 'Edit Export Package'}
      </h2>

      {/* Export Name */}
      <Label.Block>
        Export Name
        <Input.Text
          required
          value={form.exportname}
          onValueChange={(exportname) =>
            setForm((prev) => ({ ...prev, exportname }))
          }
        />
      </Label.Block>

      {/* File Name */}
      <Label.Block>
        File Name
        <Input.Text
          placeholder="my_export.zip"
          required
          value={form.filename}
          onValueChange={(filename) =>
            setForm((prev) => ({ ...prev, filename }))
          }
        />
        {form.filename.length > 0 && !filenameValid && (
          <span className="text-sm text-red-600">
            Filename must end with .zip
          </span>
        )}
      </Label.Block>

      {/* Core Mapping */}
      <Label.Block>
        Core Mapping
        <select
          className="w-full rounded border p-1"
          value={form.coremapping ?? ''}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              coremapping: event.target.value
                ? Number(event.target.value)
                : null,
            }))
          }
        >
          <option value="">-- Select core mapping --</option>
          {coreMappings.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </Label.Block>

      {/* Collection (read-only) */}
      <Label.Block>
        Collection
        <Input.Text
          value={
            userInformation.availableCollections.find(
              ({ id }) => id === schema.domainLevelIds.collection
            )?.collectionName ?? ''
          }
          readOnly
        />
      </Label.Block>

      {/* Extensions */}
      <fieldset className="rounded border p-3">
        <legend className="font-medium">Extensions</legend>
        {form.extensions.length === 0 ? (
          <p className="text-sm text-gray-500">No extensions added.</p>
        ) : (
          <ul className="mb-2 space-y-1">
            {form.extensions.map((extId) => {
              const mapping = extensionMappings.find((m) => m.id === extId);
              return (
                <li
                  key={extId}
                  className="flex items-center justify-between rounded bg-gray-100 px-2 py-1"
                >
                  <span>{mapping?.name ?? `Mapping #${extId}`}</span>
                  <Button.Small onClick={() => removeExtension(extId)}>
                    Remove
                  </Button.Small>
                </li>
              );
            })}
          </ul>
        )}
        {extensionMappings.length > 0 && (
          <select
            className="rounded border p-1"
            value=""
            onChange={(event) => {
              if (event.target.value) {
                addExtension(Number(event.target.value));
              }
            }}
          >
            <option value="">-- Add extension --</option>
            {extensionMappings
              .filter((m) => !form.extensions.includes(m.id))
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
        )}
      </fieldset>

      {/* Metadata (EML) */}
      <fieldset className="rounded border p-3">
        <legend className="font-medium">Metadata (EML)</legend>
        <div className="flex flex-col gap-2">
          <a
            className="text-sm text-blue-600 underline hover:text-blue-800"
            href="https://gbif-norway.github.io/eml-generator-js"
            rel="noopener noreferrer"
            target="_blank"
          >
            Generate EML on GBIF
          </a>
          <div className="flex items-center gap-2">
            <Button.Small
              onClick={() => emlInputRef.current?.click()}
            >
              Import EML
            </Button.Small>
            <input
              accept=".xml"
              className="hidden"
              ref={emlInputRef}
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file !== undefined) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const content = reader.result as string;
                    const doc = new DOMParser().parseFromString(
                      content,
                      'text/xml'
                    );
                    if (doc.querySelector('parsererror') !== null) {
                      setEmlError(
                        'Invalid XML: the imported file is not well-formed.'
                      );
                      setEmlFile(undefined);
                      return;
                    }
                    setEmlError(undefined);
                    setEmlFile({
                      name: file.name,
                      content,
                    });
                  };
                  reader.readAsText(file);
                }
              }}
            />
            {emlFile !== undefined && (
              <span className="text-sm text-green-700 dark:text-green-400">
                {`EML loaded: ${emlFile.name}`}
              </span>
            )}
            {emlError !== undefined && (
              <span className="text-sm text-red-600">
                {emlError}
              </span>
            )}
          </div>
        </div>
      </fieldset>

      {/* Include in RSS feed */}
      <Label.Inline>
        <Input.Checkbox
          checked={form.includeinfeed}
          onValueChange={(includeinfeed) =>
            setForm((prev) => ({ ...prev, includeinfeed }))
          }
        />
        Include in RSS feed?
      </Label.Inline>

      {/* Frequency */}
      {form.includeinfeed && (
        <Label.Block>
          Update Frequency (hours)
          <Input.Integer
            min={1}
            required
            value={form.frequency}
            onValueChange={(frequency) =>
              setForm((prev) => ({ ...prev, frequency: frequency ?? 0 }))
            }
          />
          {!frequencyValid && (
            <span className="text-sm text-red-600">
              Frequency must be greater than 0 when RSS is enabled.
            </span>
          )}
        </Label.Block>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <Button.Info disabled={!canSave || saving} onClick={handleSave}>
          {saving ? 'Saving...' : 'Save'}
        </Button.Info>
        <Button.Secondary onClick={onClose}>Cancel</Button.Secondary>
        {!isNew && (
          <Button.Success
            disabled={downloading}
            onClick={() => {
              setDownloading(true);
              fetch(`/export/generate_dwca/${datasetId}/`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                  'X-CSRFToken': csrfToken ?? '',
                },
              })
                .then(async (response) => {
                  if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(
                      (err as { error?: string }).error ??
                        'Export failed'
                    );
                  }
                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download =
                    response.headers
                      .get('Content-Disposition')
                      ?.match(/filename="(.+)"/)?.[1] ?? 'export.zip';
                  a.click();
                  URL.revokeObjectURL(url);
                  setExportSuccess(true);
                })
                .catch(console.error)
                .finally(() => setDownloading(false));
            }}
          >
            {downloading ? 'Generating...' : 'Download Archive'}
          </Button.Success>
        )}
      </div>
      {downloading && (
        <p className="text-sm text-gray-500">Building archive...</p>
      )}
      {exportSuccess && (
        <p className="text-sm text-green-700 dark:text-green-400">
          {'Export successful! Validate your archive with the '}
          <a
            className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
            href="https://www.gbif.org/tools/data-validator"
            rel="noopener noreferrer"
            target="_blank"
          >
            GBIF Data Validator
          </a>
        </p>
      )}
    </div>
  );
}
