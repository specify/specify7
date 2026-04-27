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
import { Button } from '../../Atoms/Button';
import { Input, Label } from '../../Atoms/Form';

type MappingSummary = {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly mappingtype: string;
};

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

  // Fetch available schema mappings
  React.useEffect(() => {
    ajax<readonly MappingSummary[]>('/export/mappings/', {
      headers: { Accept: 'application/json' },
    })
      .then((response) => setMappings(response.data))
      .catch(console.error);
  }, []);

  const coreMappings = React.useMemo(
    () => mappings?.filter((m) => m.mappingtype === 'core') ?? [],
    [mappings]
  );

  const extensionMappings = React.useMemo(
    () => mappings?.filter((m) => m.mappingtype === 'extension') ?? [],
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
      // For now, POST to a save endpoint (to be wired up to Django REST or
      // the resource API in a follow-up).  This is a placeholder that logs
      // the intended payload.
      console.info('Save export package:', { datasetId, ...form });
      onClose();
    } catch (error) {
      console.error('Failed to save export package:', error);
    } finally {
      setSaving(false);
    }
  }, [canSave, datasetId, form, onClose]);

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
          <Input.Number
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
            onClick={() => {
              ajax(`/export/generate_dwca/${datasetId}/`, {
                method: 'POST',
                headers: { Accept: 'application/json' },
              }).catch(console.error);
            }}
          >
            Download Archive
          </Button.Success>
        )}
      </div>
    </div>
  );
}
