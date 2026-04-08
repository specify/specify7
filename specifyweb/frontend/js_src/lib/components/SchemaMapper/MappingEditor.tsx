import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { ajax } from '../../utils/ajax';
import { csrfToken } from '../../utils/ajax/csrfToken';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { autoMapFields } from './autoMap';
import { MappingRow } from './MappingList';
import { findDuplicateTerms, MappingToolbar } from './Toolbar';
import { TermDropdown } from './TermDropdown';
import { OCCURRENCE_ID_IRI } from './types';
import type { DwcTerm, MappingField, MappingRecord } from './types';
import { fetchSchemaTerms } from './vocabulary';
import type { SchemaTerms, Vocabulary } from './vocabulary';

type ApiMappingDetail = {
  readonly id: number;
  readonly name: string;
  readonly mappingType: string;
  readonly isDefault: boolean;
  readonly queryId: number;
  readonly vocabulary: string;
  readonly totalFields: number;
  readonly unmappedFields: number;
};

type ApiQueryField = {
  readonly id: number;
  readonly position: number;
  readonly stringid: string;
  readonly fieldname: string;
};

type ApiMappingFieldAssignment = {
  readonly fieldid: number;
  readonly term: string | undefined;
  readonly isstatic: boolean;
  readonly staticvalue: string | undefined;
};

export function MappingEditor({
  mappingId,
  onClose: handleClose,
}: {
  readonly mappingId: number;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [mapping, setMapping] = React.useState<MappingRecord | undefined>(
    undefined
  );
  const [fields, setFields] = React.useState<
    ReadonlyArray<MappingField> | undefined
  >(undefined);
  const [schemaTerms, setSchemaTerms] = React.useState<
    SchemaTerms | undefined
  >(undefined);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [saveWarning, setSaveWarning] = React.useState<string | undefined>(
    undefined
  );
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const saveSuccessTimerRef = React.useRef<ReturnType<typeof setTimeout>>();
  React.useEffect(() => () => clearTimeout(saveSuccessTimerRef.current), []);
  const [editingName, setEditingName] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState('');

  const commitRename = React.useCallback(() => {
    const trimmed = nameDraft.trim();
    if (
      trimmed.length > 0 &&
      mapping !== undefined &&
      trimmed !== mapping.name &&
      !mapping.isDefault
    ) {
      fetch(`/export/update_mapping/${mapping.id}/`, {
        credentials: 'same-origin',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken ?? '',
        },
        body: JSON.stringify({ name: trimmed }),
      })
        .then(() =>
          setMapping((prev) =>
            prev === undefined ? prev : { ...prev, name: trimmed }
          )
        )
        .catch(console.error);
    }
    setEditingName(false);
  }, [nameDraft, mapping]);

  // Fetch the mapping detail, its query fields, and the schema terms
  React.useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      const [mappingsResponse, termsData] = await Promise.all([
        ajax<ReadonlyArray<ApiMappingDetail>>('/export/list_mappings/', {
          headers: { Accept: 'application/json' },
        }),
        fetchSchemaTerms(),
      ]);

      if (cancelled) return;

      const raw = mappingsResponse.data.find((m) => m.id === mappingId);
      if (raw === undefined) {
        setError('Mapping not found');
        return;
      }
      const record: MappingRecord = {
        id: raw.id,
        name: raw.name,
        mappingType: raw.mappingType === 'Core' ? 'Core' : 'Extension',
        isDefault: raw.isDefault,
        queryId: raw.queryId,
        vocabulary: raw.vocabulary ?? 'dwc',
        totalFields: raw.totalFields ?? 0,
        unmappedFields: raw.unmappedFields ?? 0,
      };
      setMapping(record);
      setSchemaTerms(termsData);

      // Fetch query fields
      const qid = raw.queryId;
      const fieldsResponse = await ajax<{
        readonly objects: ReadonlyArray<ApiQueryField>;
      }>(`/api/specify/spqueryfield/?query=${qid}&limit=0`, {
        headers: { Accept: 'application/json' },
      });

      if (cancelled) return;

      // Read term assignments directly from the SpQueryField records
      // (term, isstatic, staticvalue are columns on spqueryfield)
      const mappedFields: ReadonlyArray<MappingField> =
        fieldsResponse.data.objects.map((qf) => {
          const rec = qf as Record<string, unknown>;
          return {
            id: qf.id,
            position: qf.position,
            stringId: qf.stringid,
            fieldName: qf.fieldname,
            term: (rec.term as string | null) ?? undefined,
            isStatic: (rec.isstatic as boolean) ?? false,
            staticValue: (rec.staticvalue as string | null) ?? undefined,
          };
        });
      setFields(mappedFields);
    }

    load().catch((caughtError) =>
      setError(
        caughtError instanceof Error ? caughtError.message : 'Load failed'
      )
    );

    return () => {
      cancelled = true;
    };
  }, [mappingId]);

  // Filter terms to the mapping's vocabulary (stored on SchemaMapping)
  const allTerms: Readonly<Record<string, DwcTerm>> = React.useMemo(() => {
    if (schemaTerms === undefined || mapping === undefined) return {};
    const vocabKey = mapping.vocabulary ?? 'dwc';
    const vocab = schemaTerms.vocabularies[vocabKey]
      ?? Object.values(schemaTerms.vocabularies)[0];
    if (vocab === undefined) return {};
    const result: Record<string, DwcTerm> = {};
    for (const [iri, term] of Object.entries(vocab.terms)) {
      // #7722: Filter out occurrenceID — it's always on the locked row
      if (iri === OCCURRENCE_ID_IRI) continue;
      result[iri] = {
        iri,
        label: term.name,
        definition: term.description,
        comments: '',
        examples: '',
      };
    }
    return result;
  }, [schemaTerms]);

  const firstVocabulary: Vocabulary | undefined = React.useMemo(() => {
    if (schemaTerms === undefined) return undefined;
    const vocabs = Object.values(schemaTerms.vocabularies);
    return vocabs.length > 0 ? vocabs[0] : undefined;
  }, [schemaTerms]);

  // Compute duplicate term IRIs for visual highlighting (#7731)
  const duplicateTerms: ReadonlyArray<string> = React.useMemo(
    () => (fields === undefined ? [] : findDuplicateTerms(fields)),
    [fields]
  );

  const handleTermChange = React.useCallback(
    (fieldId: number, newTerm: string | undefined) => {
      // #7722: Prevent adding a second occurrenceID term
      if (
        newTerm === OCCURRENCE_ID_IRI &&
        fields?.some((f) => f.id !== fieldId && f.term === OCCURRENCE_ID_IRI)
      ) {
        return;
      }
      setFields((prev) =>
        prev?.map((f) => (f.id === fieldId ? { ...f, term: newTerm } : f))
      );
    },
    [fields]
  );

  const handleAutoMap = React.useCallback(() => {
    if (fields === undefined || firstVocabulary === undefined) return;
    setFields(autoMapFields(fields, firstVocabulary));
  }, [fields, firstVocabulary]);

  const handleSave = React.useCallback(async () => {
    if (fields === undefined) return;
    setSaving(true);
    setError(undefined);
    setSaveWarning(undefined);
    try {
      // Validate occurrenceID uniqueness before saving (Core mappings only)
      if (mapping?.mappingType === 'Core') {
        const validationResponse = await ajax<{
          readonly valid: boolean;
          readonly duplicates: ReadonlyArray<string>;
          readonly totalDuplicates: number;
        }>(`/export/validate_occurrence_ids/${mappingId}/`, {
          headers: { Accept: 'application/json' },
        }).catch(() => undefined);

        if (validationResponse?.data !== undefined && !validationResponse.data.valid) {
          const count = validationResponse.data.totalDuplicates;
          setSaveWarning(
            `Warning: ${count} duplicate occurrenceID values found. You may need to add a condition for current determination or use an aggregator for preparations.`
          );
          setSaving(false);
          return;
        }
      }

      await ajax(`/export/save_mapping_fields/${mappingId}/`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: {
          fields: fields.map((f) => ({
            fieldid: f.id,
            term: f.term ?? null,
            isstatic: f.isStatic,
            staticvalue: f.staticValue ?? null,
          })),
        },
      });
      setSaveSuccess(true);
      clearTimeout(saveSuccessTimerRef.current);
      saveSuccessTimerRef.current = setTimeout(() => setSaveSuccess(false), 3000);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'Save failed'
      );
    } finally {
      setSaving(false);
    }
  }, [fields, mappingId, mapping]);

  if (error !== undefined) {
    return (
      <Dialog
        buttons={
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        }
        header={headerText.mappingEditor()}
        icon={icons.documentSearch}
        onClose={handleClose}
      >
        <p className="text-red-600">{error}</p>
      </Dialog>
    );
  }

  if (mapping === undefined || fields === undefined) {
    return <LoadingScreen />;
  }

  const isCore = mapping.mappingType === 'Core';

  return (
    <Dialog
      buttons={
        <>
          <Button.Secondary onClick={handleClose}>
            {headerText.backToList()}
          </Button.Secondary>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        </>
      }
      header={
        (
          <span className="flex items-center gap-2">
            {`${headerText.mappingEditor()} — `}
            {editingName ? (
              <input
                autoFocus
                className="rounded border px-1 py-0.5"
                value={nameDraft}
                onBlur={commitRename}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') {
                    setNameDraft(mapping.name);
                    setEditingName(false);
                  }
                }}
              />
            ) : (
              <span
                className="cursor-pointer rounded px-1 hover:bg-gray-200 dark:hover:bg-neutral-700"
                title="Click to rename"
                onClick={() => {
                  setNameDraft(mapping.name);
                  setEditingName(true);
                }}
              >
                {mapping.name}
                <span className="ml-1 text-gray-400">{'✎'}</span>
              </span>
            )}
          </span>
        ) as unknown as LocalizedString
      }
      icon={icons.documentSearch}
      onClose={handleClose}
    >
      <div className="flex flex-col gap-4 overflow-visible pb-40">
        <MappingToolbar
          fields={fields}
          isRunning={saving}
          onSave={() => {
            handleSave().catch(console.error);
          }}
        />
        <div className="flex gap-2">
          <Button.Info
            disabled={firstVocabulary === undefined || fields.length === 0}
            onClick={handleAutoMap}
          >
            {headerText.autoMapFields()}
          </Button.Info>
        </div>
        {saveSuccess && (
          <p className="rounded bg-green-50 p-2 text-sm text-green-700 dark:bg-green-900 dark:text-green-200">
            {'Saved successfully.'}
          </p>
        )}
        {saveWarning !== undefined && (
          <p className="rounded bg-yellow-50 p-2 text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            {saveWarning}
          </p>
        )}
        <a
          className="text-sm text-blue-600 underline hover:text-blue-800"
          href={`/specify/query/${mapping.queryId}/`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {'Edit backing query in Query Builder'}
        </a>
        {fields.length === 0 ? (
          <p className="text-gray-500">
            {'No fields in this mapping yet. Click the link above to open the Query Builder and add the Specify fields you want to export, then re-open this editor to assign DwC terms.'}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {fields.map((field) => {
              const isLocked = isCore && field.term === OCCURRENCE_ID_IRI;
              const isDuplicate =
                field.term !== undefined &&
                duplicateTerms.includes(field.term);
              // Terms used by OTHER fields — exclude from this field's dropdown
              const usedByOthers = fields
                .filter((f) => f.id !== field.id && f.term !== undefined)
                .map((f) => f.term!);
              return (
                <MappingRow
                  field={field}
                  isDuplicate={isDuplicate}
                  isLocked={isLocked}
                  key={field.id}
                  onRemove={undefined}
                >
                  {!isLocked && (
                    <TermDropdown
                      selectedIri={field.term}
                      usedTerms={usedByOthers}
                      vocabularyTerms={allTerms}
                      onChange={(iri) => handleTermChange(field.id, iri)}
                    />
                  )}
                  {isDuplicate && (
                    <span
                      className="flex-shrink-0 text-red-600"
                      title="Duplicate — each DwC term can only be used once"
                    >
                      {'⚠'}
                    </span>
                  )}
                </MappingRow>
              );
            })}
          </div>
        )}
      </div>
    </Dialog>
  );
}
