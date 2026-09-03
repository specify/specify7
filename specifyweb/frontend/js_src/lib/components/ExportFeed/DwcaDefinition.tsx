import React from 'react';

import { useSearchParameter } from '../../hooks/navigation';
import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { dwcaText } from '../../localization/dwca';
import { queryText } from '../../localization/query';
import { resourcesText } from '../../localization/resources';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { ErrorMessage } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input, Label, Select } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { fetchCollection } from '../DataModel/collection';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { fetchResource } from '../DataModel/resource';
import type { SpecifyTable } from '../DataModel/specifyTable';
import {
  deserializeResource,
  serializeResource,
} from '../DataModel/serializers';
import { fetchContext as fetchTables, tables } from '../DataModel/tables';
import type { SpQuery, SpQueryField } from '../DataModel/types';
import { getField } from '../DataModel/helpers';
import { userInformation } from '../InitialContext/userInformation';
import { getFieldBlockerKey, useSaveBlockers } from '../DataModel/saveBlockers';
import { createQuery } from '../QueryBuilder';
import { QueryBuilder } from '../QueryBuilder/Wrapped';
import { parseQueryFields } from '../QueryBuilder/helpers';
import type { QueryField } from '../QueryBuilder/helpers';
import { Dialog, dialogClassNames, LoadingScreen } from '../Molecules/Dialog';
import darwinCore from './data/darwinCoreOccurrence.json';
import gbifCores from './data/gbifCores.json';
import { defaultTemplates, type DwcaTemplate } from './data/defaultTemplates';
import { coreTermPatterns, occurrenceIdTerm } from './data/coreTermPatterns';
import gbifExtensions from './data/gbifExtensions.json';

type ExtensionDefinition = (typeof gbifExtensions)[number];
type CoreDefinition = typeof darwinCore | (typeof gbifCores)[number];
type Definition = CoreDefinition | ExtensionDefinition;
type Mapping = {
  readonly extension: boolean;
  readonly coreRowType: string;
  readonly baseTable: SpecifyTable;
  readonly extensionDefinition: Definition | undefined;
  readonly rowType: string;
  readonly fileName: string;
  readonly query: SpecifyResource<SpQuery>;
  readonly fields: RA<SerializedResource<SpQueryField>>;
  readonly terms: RA<string | undefined>;
};

type TermDefinition = {
  readonly name: string;
  readonly title?: string;
  readonly description?: string;
  readonly vocabulary?: string;
  readonly iri?: string;
  readonly group?: string;
  readonly required?: boolean;
};

const customTermOption = '__custom__';
const customRowTypeOption = '__custom_row_type__';
const customExtensionOption = '__custom_extension__';
const dwcaTabParameter = 'dwcaTab';
const coreDefinitions: readonly CoreDefinition[] = [
  darwinCore,
  ...gbifCores.filter(
    ({ rowType }) => rowType !== 'http://rs.tdwg.org/dwc/terms/Occurrence'
  ),
];
const coreIdentifierTerms: Readonly<Record<string, string>> = {
  'http://rs.tdwg.org/dwc/terms/Event': 'http://rs.tdwg.org/dwc/terms/eventID',
  'http://rs.tdwg.org/dwc/terms/Taxon': 'http://rs.tdwg.org/dwc/terms/taxonID',
};
const getCoreIdentifierTerm = (rowType: string): string =>
  coreIdentifierTerms[rowType] ?? occurrenceIdTerm;

export function getBaseTableForCore(coreRowType: string): SpecifyTable {
  switch (coreRowType) {
    case 'http://rs.tdwg.org/dwc/terms/Event':
      return tables.CollectingEvent;
    case 'http://rs.tdwg.org/dwc/terms/Taxon':
      return tables.Taxon;
    default:
      return tables.CollectionObject;
  }
}

type MappingTabMapping = Pick<Mapping, 'extension' | 'rowType'> &
  Partial<Pick<Mapping, 'extensionDefinition'>>;

function slugifyTabValue(value: string): string {
  return (
    value
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'custom'
  );
}

export function getMappingTabValue(mapping: MappingTabMapping): string {
  if (!mapping.extension) return 'core';
  return slugifyTabValue(
    mapping.extensionDefinition?.name ??
      mapping.rowType.split(/[\/#]/).at(-1) ??
      ''
  );
}

export function getMappingTabValues(
  mappings: ReadonlyArray<MappingTabMapping>
): RA<string> {
  const occurrences = new Map<string, number>();
  return mappings.map((mapping) => {
    const base = getMappingTabValue(mapping);
    const occurrence = occurrences.get(base) ?? 0;
    occurrences.set(base, occurrence + 1);
    return occurrence === 0 ? base : `${base}-${occurrence + 1}`;
  });
}

function getMappingTabIndex(
  mappings: ReadonlyArray<MappingTabMapping>,
  tabValues: ReadonlyArray<string>,
  tabValue: string | undefined
): number {
  if (tabValue === undefined) return -1;
  const index = tabValues.indexOf(tabValue);
  if (index >= 0) return index;

  // Keep links generated by the previous URL format working.
  const oldPrefix = 'extension:';
  if (!tabValue.startsWith(oldPrefix)) return -1;
  const rowType = tabValue.slice(oldPrefix.length);
  return mappings.findIndex(
    (mapping) => mapping.extension && mapping.rowType === rowType
  );
}

export function getMappingTerm(
  mapping: {
    readonly extension: boolean;
    readonly rowType?: string;
    readonly fields: ReadonlyArray<{ readonly stringId: string }>;
    readonly terms: RA<string | undefined>;
  },
  field: Partial<Pick<QueryField, 'id' | 'sourceIndex' | 'sourceStringId'>> &
    Partial<Pick<QueryField, 'mappingPath'>>
): string | undefined {
  const fieldIndex = getMappingFieldIndex(mapping, field);
  return !mapping.extension && fieldIndex === 0
    ? getCoreIdentifierTerm(mapping.rowType ?? darwinCore.rowType)
    : mapping.terms[fieldIndex];
}

function getMappingFieldIndex(
  mapping: {
    readonly fields: ReadonlyArray<{ readonly stringId: string }>;
  },
  field: Partial<Pick<QueryField, 'id' | 'sourceIndex' | 'sourceStringId'>> &
    Partial<Pick<QueryField, 'mappingPath'>>
): number {
  if (field.sourceStringId !== undefined) {
    const exactIndex = mapping.fields.findIndex(
      ({ stringId }) =>
        stringId.toLowerCase() === field.sourceStringId!.toLowerCase()
    );
    if (exactIndex >= 0) return exactIndex;
  }
  if (field.mappingPath !== undefined) {
    const pathKey = JSON.stringify(field.mappingPath).toLowerCase();
    const pathIndex = mapping.fields.findIndex(
      (candidate) => fieldTermKey(candidate) === pathKey
    );
    if (pathIndex >= 0) return pathIndex;
  }
  return field.sourceIndex ?? field.id ?? -1;
}

export function updateMappingTerm(
  mapping: Mapping,
  field: Pick<QueryField, 'sourceIndex' | 'sourceStringId'> &
    Partial<Pick<QueryField, 'mappingPath'>>,
  term: string | undefined
): Mapping {
  const fieldIndex = getMappingFieldIndex(mapping, field);
  if (fieldIndex < 0 || fieldIndex >= mapping.fields.length) return mapping;
  return {
    ...mapping,
    terms: replaceItem(mapping.terms, fieldIndex, term),
  };
}

export function getSerializedMappingTerm(
  mapping: {
    readonly fields: ReadonlyArray<{ readonly stringId: string }>;
    readonly terms: RA<string | undefined>;
  },
  field: { readonly stringId: string },
  fallbackIndex: number
): string | undefined {
  const fieldIndex = mapping.fields.findIndex(
    ({ stringId }) => stringId.toLowerCase() === field.stringId.toLowerCase()
  );
  const resolvedIndex = fieldIndex >= 0 ? fieldIndex : fallbackIndex;
  return mapping.terms[resolvedIndex];
}

const groupLabel = (group: string | undefined): string => {
  const label = group?.split('#').at(-1) ?? '';
  return label === '' ? '' : label[0].toUpperCase() + label.slice(1);
};

function getTermNameParts(name: string): RA<string> {
  return name.split(/[\/#]/).filter((part) => part !== '');
}

export function getTermDisplayLabel(
  term: Pick<TermDefinition, 'name' | 'title'>,
  terms: ReadonlyArray<Pick<TermDefinition, 'name' | 'title'>>
): string {
  const title = term.title ?? term.name;
  const duplicateTitles = terms.filter(
    (candidate) => (candidate.title ?? candidate.name) === title
  );
  if (duplicateTitles.length < 2) return title;

  const parts = getTermNameParts(term.name);
  const qualifier = Array.from({ length: parts.length }, (_, index) =>
    parts.slice(-(index + 1)).join('/')
  ).find((candidate) =>
    duplicateTitles.every(
      (candidateTerm) =>
        candidateTerm.name === term.name ||
        getTermNameParts(candidateTerm.name)
          .slice(candidate.split('/').length * -1)
          .join('/') !== candidate
    )
  );

  return dwcaText.dwcaTermWithQualifier({
    title,
    qualifier: qualifier ?? term.name,
  });
}

export const defaultRowTypes = Array.from(
  new Set(gbifExtensions.map(({ rowType }) => rowType))
);

export const defaultCoreRowTypes = Array.from(
  new Set(coreDefinitions.map(({ rowType }) => rowType))
);

export const getExtensionDefinitionForRowType = (
  rowType: string
): ExtensionDefinition | undefined =>
  gbifExtensions.find((extension) => extension.rowType === rowType);

export const getCoreDefinitionForRowType = (
  rowType: string
): CoreDefinition | undefined =>
  coreDefinitions.find((core) => core.rowType === rowType);

export function isExtensionApplicableToCore(
  extension: Pick<ExtensionDefinition, 'subject'>,
  coreRowType: string
): boolean {
  const subject = extension.subject.trim();
  if (subject === '') return true;
  const core = getCoreDefinitionForRowType(coreRowType);
  if (core === undefined) return true;
  return subject.split(/\s+/).includes(`dwc:${core.name}`);
}

const getRowTypeOptionLabel = (rowType: string): string =>
  rowType === darwinCore.rowType
    ? darwinCore.title
    : (getCoreDefinitionForRowType(rowType)?.title ??
      getExtensionDefinitionForRowType(rowType)?.title ??
      rowType);

function TermInfoDialog({
  term,
  extension,
  onClose,
}: {
  readonly term: TermDefinition;
  readonly extension: boolean;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      className={{ container: dialogClassNames.narrowContainer }}
      header={localized(term.title ?? term.name)}
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      onClose={onClose}
    >
      <dl className="grid gap-2">
        <div>
          <dt className="font-semibold">{dwcaText.dwcaTerm()}</dt>
          <dd>{term.title ?? term.name}</dd>
        </div>
        <div>
          <dt className="font-semibold">{dwcaText.dwcaVocabulary()}</dt>
          <dd>
            {term.vocabulary === undefined ? (
              extension ? (
                dwcaText.dwcaExtension()
              ) : (
                dwcaText.dwcaDefinition()
              )
            ) : (
              <Link.NewTab href={term.vocabulary}>
                {localized(term.vocabulary)}
              </Link.NewTab>
            )}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">{dwcaText.dwcaGroup()}</dt>
          <dd>{groupLabel(term.group) || dwcaText.dwcaNoGroupSpecified()}</dd>
        </div>
        <div>
          <dt className="font-semibold">{dwcaText.dwcaIri()}</dt>
          <dd className="break-all">
            <Link.NewTab href={term.iri ?? term.name}>
              {localized(term.iri ?? term.name)}
            </Link.NewTab>
          </dd>
        </div>
        <div>
          <dt className="font-semibold">{dwcaText.dwcaRequired()}</dt>
          <dd>{term.required === true ? queryText.yes() : commonText.no()}</dd>
        </div>
        <div>
          <dt className="font-semibold">{dwcaText.dwcaDescription()}</dt>
          <dd>{term.description || dwcaText.dwcaNoDescriptionAvailable()}</dd>
        </div>
      </dl>
    </Dialog>
  );
}

export function getTemplateMapping(
  template: DwcaTemplate,
  mapping: Pick<Mapping, 'extension' | 'rowType'>,
  coreRowType?: string
): Mapping | undefined {
  if (
    !template.targets.some(
      (target) =>
        target.extension === mapping.extension &&
        target.rowType === mapping.rowType
    )
  )
    return undefined;
  if (
    coreRowType !== undefined &&
    !isTemplateApplicableToCore(template, coreRowType)
  )
    return undefined;
  return parseDefinition(template.definition).find(
    (candidate) =>
      candidate.extension === mapping.extension &&
      candidate.rowType === mapping.rowType
  );
}

export function isTemplateApplicableToCore(
  template: DwcaTemplate,
  coreRowType: string
): boolean {
  if (template.coreRowTypes !== undefined)
    return template.coreRowTypes.includes(coreRowType);
  return template.targets.some((target) =>
    target.extension
      ? isExtensionApplicableToCore(
          getExtensionDefinitionForRowType(target.rowType) ?? { subject: '' },
          coreRowType
        )
      : target.rowType === coreRowType
  );
}

const getFields = (
  query: SpecifyResource<SpQuery>
): RA<SerializedResource<SpQueryField>> => {
  const fields =
    (query.get('fields') as unknown) ??
    (serializeResource(query) as unknown as { readonly fields?: unknown })
      .fields;
  return Array.isArray(fields)
    ? fields.map((field) =>
        serializeResource(field as unknown as SpecifyResource<SpQueryField>)
      )
    : [];
};

const normalizeStringId = (stringId: string, table: SpecifyTable): string =>
  stringId.includes('.')
    ? stringId
    : `${table.tableId}.${table.name.toLowerCase()}.${stringId}`;

/*
 * QueryBuilder writes the current relationship names into stringId. Older
 * DwCA XML can contain the same field with only relationship table IDs (for
 * example `1,9-determinations,4.taxon.Kingdom`). Match those representations
 * by their resolved query path as well as by their serialized stringId.
 */
function fieldTermKey(
  field: Pick<SerializedResource<SpQueryField>, 'stringId'> &
    Partial<SerializedResource<SpQueryField>>
): string {
  try {
    const [parsed] = parseQueryFields([
      field as SerializedResource<SpQueryField>,
    ]);
    return parsed === undefined
      ? field.stringId.toLowerCase()
      : JSON.stringify(parsed.mappingPath).toLowerCase();
  } catch {
    return field.stringId.toLowerCase();
  }
}

function fieldShapesEqual(
  left: RA<SerializedResource<SpQueryField>>,
  right: RA<SerializedResource<SpQueryField>>
): boolean {
  try {
    const shape = (fields: RA<SerializedResource<SpQueryField>>) =>
      parseQueryFields(fields).map(
        ({ mappingPath, sortType, isDisplay, filters }) => ({
          mappingPath,
          sortType,
          isDisplay,
          filters,
        })
      );
    return JSON.stringify(shape(left)) === JSON.stringify(shape(right));
  } catch {
    return false;
  }
}

function availableTermNames(
  extension: boolean,
  definition: Definition | undefined,
  coreRowType: string
): ReadonlySet<string> {
  return new Set(
    (extension
      ? [
          (getCoreDefinitionForRowType(coreRowType) ?? darwinCore).fields.find(
            ({ name }) => name === getCoreIdentifierTerm(coreRowType)
          ),
          ...(definition?.fields ?? []),
        ]
      : (definition ?? darwinCore).fields
    )
      .map((term) => term?.name)
      .filter((name): name is string => name !== undefined)
  );
}

export function updateMappingFields(
  mapping: Mapping,
  newFields: RA<SerializedResource<SpQueryField>>
): Mapping {
  const oldMetadata = new Map<string, RA<string | undefined>>();
  mapping.fields.forEach((field, index) => {
    const key = fieldTermKey(field);
    oldMetadata.set(key, [
      ...(oldMetadata.get(key) ?? []),
      mapping.terms[index],
    ]);
  });
  const oldStringIds = new Map(
    mapping.fields.map((field, index) => [
      field.stringId.toLowerCase(),
      mapping.terms[index],
    ])
  );
  const availableTerms = availableTermNames(
    mapping.extension,
    mapping.extensionDefinition,
    mapping.coreRowType
  );
  const fields = [...newFields];
  if (!mapping.extension) {
    const automaticTerms = autoMapCoreFields(fields, availableTerms);
    const occurrenceIndex = fields.findIndex(
      (field, index) =>
        (oldStringIds.get(field.stringId.toLowerCase()) ??
          oldMetadata.get(fieldTermKey(field))?.[0] ??
          automaticTerms[index]) === getCoreIdentifierTerm(mapping.coreRowType)
    );
    if (occurrenceIndex > 0) {
      const [occurrence] = fields.splice(occurrenceIndex, 1);
      fields.unshift(occurrence);
    }
  }
  const autoMapped = autoMapCoreFields(fields, availableTerms);
  const usedTerms = new Set<string>();
  const terms = fields.map((field, index) => {
    const key = fieldTermKey(field);
    const oldTerm = oldStringIds.get(field.stringId.toLowerCase());
    const pathTerms = oldMetadata.get(key);
    const pathTerm = pathTerms?.[0];
    if (pathTerms !== undefined) oldMetadata.set(key, pathTerms.slice(1));
    const candidateTerm = oldTerm ?? pathTerm ?? autoMapped[index];
    if (candidateTerm === undefined) return undefined;
    // Pick-list terms may only be mapped once. Custom terms are intentionally
    // left untouched, even when they are not present in the catalogs.
    if (availableTerms.has(candidateTerm)) {
      if (usedTerms.has(candidateTerm)) return undefined;
      usedTerms.add(candidateTerm);
    }
    return candidateTerm;
  });
  const updatedMapping = {
    ...mapping,
    query: mapping.query.set('fields', fields),
    fields,
    terms,
  };
  return mapping.extension
    ? updatedMapping
    : ensureIdentifierTerm(updatedMapping);
}

function autoMapCoreFields(
  fields: RA<SerializedResource<SpQueryField>>,
  availableTerms: ReadonlySet<string>
): RA<string | undefined> {
  const usedTerms = new Set<string>();
  const terms = fields.map((field) => {
    const stringId = field.stringId.toLowerCase();
    const match = Object.entries(coreTermPatterns).find(
      ([term, patterns]) =>
        availableTerms.has(term) &&
        !usedTerms.has(term) &&
        patterns.some((pattern) => stringId.includes(pattern))
    )?.[0];
    if (match !== undefined) usedTerms.add(match);
    return match;
  });
  return terms;
}

function newMapping(
  extension: boolean,
  definition: Definition | undefined,
  coreRowType = darwinCore.rowType
): Mapping {
  const baseTable = getBaseTableForCore(coreRowType);
  const query = createQuery(
    definition?.name ?? (extension ? 'extension' : 'core'),
    baseTable
  );
  return ensureIdentifierTerm({
    extension,
    coreRowType,
    baseTable,
    extensionDefinition: definition,
    rowType: extension
      ? (definition?.rowType ?? '')
      : (definition?.rowType ?? coreRowType),
    fileName: definition
      ? `${definition.name}.csv`
      : extension
        ? ''
        : 'core.csv',
    query,
    fields: [],
    terms: [],
  });
}

function mappingFromQuery(
  mapping: Mapping,
  query: SpecifyResource<SpQuery>
): Mapping {
  const fields = getFields(query);
  return ensureIdentifierTerm(
    updateMappingFields(
      {
        ...mapping,
        // A seed query is a complete replacement. Do not let terms from the
        // previous mapping attach to the new query by array position.
        fields: [],
        terms: [],
        query: query
          .set('fields', fields)
          .set('contextTableId', mapping.baseTable.tableId),
      },
      fields
    )
  );
}

const isCoreIdentifierField = (
  mapping: Pick<Mapping, 'extension' | 'rowType' | 'baseTable'>,
  field: SerializedResource<SpQueryField>
): boolean => {
  const stringId = field.stringId.toLowerCase();
  const pattern = `${mapping.baseTable.name.toLowerCase()}.guid`;
  return stringId === pattern || stringId.endsWith(`.${pattern}`);
};

export function ensureIdentifierTerm(mapping: Mapping): Mapping {
  const identifierIndex = mapping.fields.findIndex((field) =>
    isCoreIdentifierField(mapping, field)
  );
  const identifierStringId = `${mapping.baseTable.tableId}.${mapping.baseTable.name.toLowerCase()}.guid`;
  const identifierTerm = getCoreIdentifierTerm(mapping.coreRowType);
  const fields =
    identifierIndex >= 0
      ? [
          {
            ...mapping.fields[identifierIndex]!,
            stringId: identifierStringId,
            isDisplay: true,
          },
          ...mapping.fields.filter((_, index) => index !== identifierIndex),
        ]
      : [
          serializeResource(
            new tables.SpQueryField.Resource({
              stringId: identifierStringId,
              isRelFld: false,
              operStart: 8,
              startValue: '',
              isNot: false,
              isDisplay: true,
              position: 0,
              sortType: 0,
              isStrict: false,
            })
          ),
          ...mapping.fields,
        ];
  const positionedFields = fields.map((field, position) => ({
    ...field,
    position,
  }));
  const terms = [
    identifierTerm,
    ...mapping.terms
      .filter((_, index) => index !== identifierIndex)
      .map((term) => (term === identifierTerm ? undefined : term)),
  ];
  return {
    ...mapping,
    query: mapping.query.set('fields', positionedFields),
    fields: positionedFields,
    terms,
  };
}

function ExtensionDialog({
  extensions,
  coreRowType,
  queries,
  onAdd,
  onClose,
}: {
  readonly extensions: RA<ExtensionDefinition>;
  readonly coreRowType: string;
  readonly queries: RA<SerializedResource<SpQuery>>;
  readonly onAdd: (
    extension: ExtensionDefinition | undefined,
    query?: SpecifyResource<SpQuery>,
    template?: DwcaTemplate
  ) => void;
  readonly onClose: () => void;
}): JSX.Element {
  const [extensionName, setExtensionName] = React.useState('');
  const [queryName, setQueryName] = React.useState('');
  const extension = extensions.find(({ name }) => name === extensionName);
  const isFromScratch = extensionName === customExtensionOption;
  const templates =
    extension === undefined
      ? []
      : defaultTemplates.filter(
          (template) =>
            isTemplateApplicableToCore(template, coreRowType) &&
            template.targets.some(
              ({ extension: isExtension, rowType }) =>
                isExtension && rowType === extension.rowType
            )
        );
  return (
    <Dialog
      className={{ container: dialogClassNames.normalContainer }}
      icon={icons.plus}
      header={localized(`${commonText.add()} ${dwcaText.dwcaExtension()}`)}
      buttons={
        <div className="flex gap-2">
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Button.Success
            disabled={
              (!isFromScratch && extension === undefined) ||
              (!isFromScratch && queryName === '')
            }
            onClick={(): void => {
              if (extension === undefined && !isFromScratch) return;
              if (isFromScratch) {
                onAdd(undefined);
                onClose();
                return;
              }
              const query = queries.find(
                ({ id }) => id.toString() === queryName
              );
              onAdd(
                extension,
                query === undefined ? undefined : deserializeResource(query),
                templates.find(
                  (template) => queryName === `template:${template.name}`
                )
              );
              onClose();
            }}
          >
            <span className="flex items-center gap-1">
              {icons.plus}
              {commonText.add()}
            </span>
          </Button.Success>
        </div>
      }
      onClose={onClose}
    >
      <div className="flex flex-col gap-3">
        <Label.Block>
          {dwcaText.dwcaExtension()}
          <Select
            value={localized(extensionName)}
            onValueChange={(value): void => {
              setExtensionName(value);
              setQueryName(value === customExtensionOption ? '' : 'empty');
            }}
          >
            <option value="">
              {dwcaText.dwcaChoose({ item: dwcaText.dwcaExtension() })}
            </option>
            <option value={customExtensionOption}>
              {dwcaText.dwcaStartFromScratch()}
            </option>
            {extensions.map(({ name, title }) => (
              <option key={name} value={name}>
                {title}
              </option>
            ))}
          </Select>
        </Label.Block>
        {extension !== undefined && (
          <Label.Block>
            {queryText.query()} {resourcesText.definition()}
            <Select value={localized(queryName)} onValueChange={setQueryName}>
              <option value="">
                {dwcaText.dwcaChoose({ item: queryText.query() })}
              </option>
              <option value="empty">{dwcaText.dwcaStartFromScratch()}</option>
              {templates.map((template) => (
                <option
                  key={`template:${template.name}`}
                  value={`template:${template.name}`}
                >
                  {template.name}
                </option>
              ))}
              {queries.map((query) => (
                <option key={query.id} value={query.id.toString()}>
                  {query.name}
                </option>
              ))}
            </Select>
          </Label.Block>
        )}
        {extension !== undefined &&
          templates.length === 0 &&
          queries.length === 0 && (
            <p>
              {dwcaText.dwcaNoDefaultOrSaved({
                default: resourcesText.default(),
                query: queryText.query(),
                extension: dwcaText.dwcaExtension(),
              })}
            </p>
          )}
      </div>
    </Dialog>
  );
}

export function parseDefinition(data: string | null): RA<Mapping> {
  if (typeof data !== 'string' || data.trim() === '') return [];
  const root = new DOMParser().parseFromString(data, 'text/xml');
  if (root.querySelector('parsererror')) return [];
  const core = Array.from(root.documentElement.children).find(
    ({ tagName }) => tagName === 'core'
  );
  const extensions = Array.from(root.documentElement.children).filter(
    ({ tagName }) => tagName === 'extension'
  );
  const coreRowType = core?.getAttribute('rowType') ?? darwinCore.rowType;
  const baseTable = getBaseTableForCore(coreRowType);
  return [core, ...extensions]
    .filter((stanza): stanza is Element => stanza !== undefined)
    .map((stanza, index) => {
      const queryNode = stanza.querySelector('queries > query');
      const extension = stanza.tagName === 'extension';
      const table = baseTable;
      const fieldNodes = Array.from(queryNode?.children ?? []).filter(
        ({ tagName }) => tagName === 'field' || tagName === 'id'
      );
      const fields = fieldNodes.map(
        (field, position) =>
          new tables.SpQueryField.Resource({
            stringId: normalizeStringId(
              field.getAttribute('stringId') ?? '',
              table
            ),
            isRelFld: field.getAttribute('isRelFld') === 'true',
            operStart: Number(field.getAttribute('oper') ?? 0),
            startValue: field.getAttribute('value') ?? '',
            isNot: field.getAttribute('isNot') === 'true',
            formatName: field.getAttribute('formatName'),
            isDisplay: field.tagName === 'id' || field.hasAttribute('term'),
            // QueryBuilder uses position to establish the persistent field
            // ID used by the term mapper. Without it every imported field
            // defaults to position 0 and those IDs become unreliable.
            position,
            sortType: 0,
            isStrict: false,
          })
      );
      const query = createQuery(
        queryNode?.getAttribute('name') ??
          `${stanza.tagName.toLowerCase()}-${index}`,
        table
      );
      query.set('contextTableId', baseTable.tableId);
      query.set('fields', fields);
      const rowType = stanza.getAttribute('rowType') ?? '';
      const extensionDefinition = extension
        ? getExtensionDefinitionForRowType(rowType)
        : getCoreDefinitionForRowType(rowType);
      const explicitTerms = fieldNodes.map(
        (field) => field.getAttribute('term') ?? undefined
      );
      const serializedFields = fields.map(serializeResource);
      const automaticTerms = autoMapCoreFields(
        serializedFields,
        availableTermNames(extension, extensionDefinition, coreRowType)
      );
      return ensureIdentifierTerm({
        extension,
        coreRowType,
        baseTable,
        extensionDefinition,
        rowType,
        fileName: extensionDefinition
          ? `${extensionDefinition.name}.csv`
          : extension
            ? (queryNode?.getAttribute('name') ?? `${index}.csv`)
            : 'core.csv',
        query,
        fields: serializedFields,
        // Legacy definitions often omitted terms for recognizable fields.
        // Populate only missing terms; explicit and custom values remain intact.
        terms: explicitTerms.map(
          (term, fieldIndex) => term ?? automaticTerms[fieldIndex]
        ),
      });
    });
}

function prettyXml(data: string): string {
  const document = new DOMParser().parseFromString(data, 'text/xml');
  if (document.querySelector('parsererror')) return data;
  const indent = '  ';
  const format = (element: Element, depth: number): void => {
    const children = Array.from(element.children);
    if (children.length === 0) return;
    const hasText = Array.from(element.childNodes).some(
      (node) =>
        node.nodeType === Node.TEXT_NODE && (node.nodeValue ?? '').trim() !== ''
    );
    children.forEach((child) => format(child, depth + 1));
    if (hasText) return;
    Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .forEach((node) => element.removeChild(node));
    children.forEach((child) =>
      element.insertBefore(
        document.createTextNode(`\n${indent.repeat(depth + 1)}`),
        child
      )
    );
    element.appendChild(document.createTextNode(`\n${indent.repeat(depth)}`));
  };
  format(document.documentElement, 0);
  return new XMLSerializer().serializeToString(document);
}

export function serializeDefinition(mappings: RA<Mapping>): string {
  const document = new DOMParser().parseFromString('<archive />', 'text/xml');
  const root = document.documentElement;
  mappings.forEach((mapping) => {
    const stanza = document.createElement(
      mapping.extension ? 'extension' : 'core'
    );
    stanza.setAttribute('rowType', mapping.rowType);
    const queries = document.createElement('queries');
    const query = document.createElement('query');
    query.setAttribute('name', mapping.fileName);
    query.setAttribute('contextTableId', String(mapping.baseTable.tableId));
    let displayIndex = 0;
    let idIndex = -1;
    mapping.fields.forEach((field, index) => {
      const term = getSerializedMappingTerm(mapping, field, index);
      const isId =
        field.isDisplay === true &&
        term === getCoreIdentifierTerm(mapping.coreRowType);
      const node = document.createElement(isId ? 'id' : 'field');
      node.setAttribute('stringId', field.stringId);
      node.setAttribute('oper', String(field.operStart));
      node.setAttribute('value', field.startValue);
      node.setAttribute('isNot', String(field.isNot));
      node.setAttribute('isRelFld', String(field.isRelFld));
      if (field.formatName !== null)
        node.setAttribute('formatName', field.formatName ?? '');
      if (typeof term === 'string' && term.length > 0)
        node.setAttribute('term', term);
      query.append(node);
      if (field.isDisplay === true) {
        if (isId) idIndex = displayIndex;
        displayIndex += 1;
      }
    });
    queries.append(query);
    stanza.append(queries);
    const id = document.createElement(mapping.extension ? 'coreid' : 'id');
    id.setAttribute('index', String(idIndex));
    stanza.append(id);
    root.append(stanza);
  });
  return prettyXml(new XMLSerializer().serializeToString(root));
}

function TermPicker({
  mapping,
  field,
  fieldIndex,
  onChange: handleChange,
}: {
  readonly mapping: Mapping;
  readonly field: QueryField;
  readonly fieldIndex: number;
  readonly onChange: (mapping: Mapping) => void;
}): JSX.Element | null {
  const [isEditing, setIsEditing] = React.useState(false);
  const [showInfo, setShowInfo] = React.useState(false);
  const mappingFieldIndex = getMappingFieldIndex(mapping, {
    ...field,
    id: fieldIndex,
  });
  const isIdentifier = mappingFieldIndex === 0;
  const terms = mapping.extension
    ? [
        (
          getCoreDefinitionForRowType(mapping.coreRowType) ?? darwinCore
        ).fields.find(
          ({ name }) => name === getCoreIdentifierTerm(mapping.coreRowType)
        )!,
        ...(mapping.extensionDefinition?.fields ?? []).filter(
          ({ name }) => name !== getCoreIdentifierTerm(mapping.coreRowType)
        ),
      ]
    : (mapping.extensionDefinition?.fields ?? darwinCore.fields);
  const value = getMappingTerm(mapping, field) ?? '';
  const options: RA<TermDefinition> = terms.map(
    ({ name, title, description, vocabulary, iri, group, required }) => ({
      name,
      title: title ?? name,
      description,
      vocabulary,
      iri,
      group,
      required,
    })
  );
  const selectedTerm = options.find(({ name }) => name === value);
  const isCustomTerm = value !== '' && selectedTerm === undefined;
  const groupedOptions = new Map<string, RA<TermDefinition>>();
  options.forEach((option) => {
    const label = groupLabel(option.group) || dwcaText.dwcaUnspecifiedGroup();
    groupedOptions.set(label, [...(groupedOptions.get(label) ?? []), option]);
  });
  return (
    <div className="w-72 shrink-0">
      {isEditing || isCustomTerm ? (
        <Input.Text
          aria-label={dwcaText.dwcaTerm()}
          autoFocus={isEditing}
          value={value}
          onBlur={(): void => {
            if (value === '') {
              handleChange(updateMappingTerm(mapping, field, undefined));
              setIsEditing(false);
            }
          }}
          onValueChange={(term): void =>
            handleChange(updateMappingTerm(mapping, field, term || undefined))
          }
        />
      ) : (
        <div className="flex items-center gap-1">
          <Select
            aria-label={dwcaText.dwcaVocabulary()}
            disabled={!field.isDisplay || isIdentifier}
            value={value}
            onValueChange={(term): void => {
              if (isIdentifier) return;
              if (term === customTermOption) {
                setIsEditing(true);
                handleChange(updateMappingTerm(mapping, field, undefined));
              } else
                handleChange(
                  updateMappingTerm(mapping, field, term || undefined)
                );
            }}
          >
            <option value={customTermOption}>{resourcesText.custom()}</option>
            <option value="">
              {dwcaText.dwcaChoose({ item: dwcaText.dwcaTerm() })}
            </option>
            {value !== '' && selectedTerm === undefined && (
              <option value={value}>{value}</option>
            )}
            {[...groupedOptions].map(([label, group]) => (
              <optgroup key={label} label={label}>
                {group.map(({ name, title }) => (
                  <option
                    key={name}
                    value={name}
                    disabled={mapping.terms.some(
                      (term, termIndex) =>
                        termIndex !== mappingFieldIndex && term === name
                    )}
                  >
                    {getTermDisplayLabel({ name, title }, options)}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
          <Button.Icon
            icon="informationCircle"
            aria-label={dwcaText.dwcaDescription()}
            title={
              selectedTerm?.description ?? dwcaText.dwcaNoDescriptionAvailable()
            }
            disabled={selectedTerm === undefined}
            onClick={(): void => setShowInfo(true)}
          />
        </div>
      )}
      {showInfo && selectedTerm !== undefined && (
        <TermInfoDialog
          term={selectedTerm}
          extension={mapping.extension}
          onClose={(): void => setShowInfo(false)}
        />
      )}
    </div>
  );
}

function QueryMapping({
  mapping,
  hasMappingsToReset,
  onCoreChange,
  onChange: handleChange,
  onRemove,
  onTemplate,
}: {
  readonly mapping: Mapping;
  readonly hasMappingsToReset: boolean;
  readonly onCoreChange: (rowType: string) => void;
  readonly onChange: (mapping: Mapping) => void;
  readonly onRemove?: () => void;
  readonly onTemplate?: (template: DwcaTemplate) => void;
}): JSX.Element {
  const queryBuilderInitialized = React.useRef(false);
  React.useEffect(() => {
    queryBuilderInitialized.current = false;
  }, [mapping.query]);
  const [queries] = useAsyncState(
    React.useCallback(
      () =>
        fetchCollection('SpQuery', {
          limit: 0,
          domainFilter: false,
          contextTableId: mapping.baseTable.tableId,
          specifyUser: userInformation.id,
        }),
      [mapping.baseTable.tableId]
    ),
    false
  );
  const fields = mapping.fields;
  const collectionObjectQueries =
    queries?.records.filter(
      (query) => query.contextTableId === mapping.baseTable.tableId
    ) ?? [];
  const rowTypeDefaults = mapping.extension
    ? defaultRowTypes
    : defaultCoreRowTypes;
  const isCustomRowType =
    mapping.rowType !== '' && !rowTypeDefaults.includes(mapping.rowType);
  const [isEditingRowType, setIsEditingRowType] = React.useState(false);
  const [pendingCoreRowType, setPendingCoreRowType] = React.useState<
    string | undefined
  >();
  const isIdentifierField = (field: QueryField): boolean =>
    (field.sourceIndex ?? field.id) === 0;
  const handleRowTypeChange = (rowType: string): void => {
    const extensionDefinition = mapping.extension
      ? getExtensionDefinitionForRowType(rowType)
      : getCoreDefinitionForRowType(rowType);
    const previousDefaultFileName =
      mapping.extensionDefinition === undefined
        ? ''
        : `${mapping.extensionDefinition.name}.csv`;
    const fileName =
      mapping.extension &&
      extensionDefinition !== undefined &&
      (mapping.fileName === '' || mapping.fileName === previousDefaultFileName)
        ? `${extensionDefinition.name}.csv`
        : mapping.fileName;
    const next = {
      ...mapping,
      coreRowType: mapping.extension ? mapping.coreRowType : rowType,
      baseTable: mapping.extension
        ? mapping.baseTable
        : getBaseTableForCore(rowType),
      rowType,
      fileName,
      extensionDefinition,
    };
    handleChange(updateMappingFields(next, mapping.fields));
  };
  const availableTemplates = defaultTemplates.filter(
    (template) =>
      isTemplateApplicableToCore(template, mapping.coreRowType) &&
      template.targets.some(
        ({ extension, rowType }) =>
          extension === mapping.extension && rowType === mapping.rowType
      )
  );
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
      <div className="flex flex-wrap gap-3">
        <Label.Block>
          {resourcesText.fileName()}
          <Input.Text
            required
            value={mapping.fileName}
            onValueChange={(fileName): void =>
              handleChange({ ...mapping, fileName })
            }
          />
        </Label.Block>
        <Label.Block>
          {dwcaText.dwcaRowType()}
          {isCustomRowType || (isEditingRowType && mapping.rowType === '') ? (
            <Input.Text
              aria-label={dwcaText.dwcaRowType()}
              autoFocus={isEditingRowType}
              required
              value={mapping.rowType}
              onBlur={(): void => {
                if (mapping.rowType === '') setIsEditingRowType(false);
              }}
              onValueChange={(rowType): void => handleRowTypeChange(rowType)}
            />
          ) : (
            <Select
              aria-label={dwcaText.dwcaRowType()}
              required
              value={mapping.rowType}
              onValueChange={(rowType): void => {
                if (rowType === customRowTypeOption) {
                  setIsEditingRowType(true);
                  handleChange({ ...mapping, rowType: '' });
                } else if (
                  !mapping.extension &&
                  rowType !== mapping.rowType &&
                  hasMappingsToReset
                ) {
                  setPendingCoreRowType(rowType);
                } else {
                  setIsEditingRowType(false);
                  if (!mapping.extension) onCoreChange(rowType);
                  else handleRowTypeChange(rowType);
                }
              }}
            >
              <option value="">
                {dwcaText.dwcaChoose({ item: dwcaText.dwcaRowType() })}
              </option>
              {rowTypeDefaults.map((rowType) => (
                <option key={rowType} value={rowType}>
                  {getRowTypeOptionLabel(rowType)}
                </option>
              ))}
              <option value={customRowTypeOption}>
                {resourcesText.custom()}
              </option>
            </Select>
          )}
        </Label.Block>
        {onTemplate !== undefined && (
          <Label.Block>
            {dwcaText.dwcaStartFromTemplate()}
            <Select
              disabled={availableTemplates.length === 0}
              value={localized('')}
              onValueChange={(name): void => {
                const template = defaultTemplates.find(
                  (candidate) => candidate.name === name
                );
                if (template !== undefined) onTemplate(template);
              }}
            >
              <option value="">
                {availableTemplates.length === 0
                  ? dwcaText.dwcaNoTemplatesAvailable()
                  : dwcaText.dwcaChooseATemplate()}
              </option>
              {availableTemplates.map((template) => (
                <option key={template.name} value={template.name}>
                  {template.name}
                </option>
              ))}
            </Select>
          </Label.Block>
        )}
        {queries !== undefined && (
          <Label.Block>
            {dwcaText.dwcaSeedFromSaved({
              query: queryText.query().toLowerCase(),
            })}
            <Select
              value={localized('')}
              onValueChange={(value): void => {
                const id = Number(value);
                if (!Number.isInteger(id)) return;
                void fetchResource('SpQuery', id).then((resource) => {
                  if (resource === undefined) return;
                  const query = deserializeResource(
                    resource as SerializedResource<SpQuery>
                  );
                  handleChange(mappingFromQuery(mapping, query));
                });
              }}
            >
              <option value="">
                {dwcaText.dwcaSelect({ item: queryText.query().toLowerCase() })}
              </option>
              {collectionObjectQueries.map((query) => (
                <option key={query.id} value={query.id}>
                  {query.name}
                </option>
              ))}
            </Select>
          </Label.Block>
        )}
        {onRemove !== undefined && (
          <Button.Danger className="ml-auto self-end" onClick={onRemove}>
            {localized(`${commonText.remove()} ${dwcaText.dwcaExtension()}`)}
          </Button.Danger>
        )}
      </div>
      <QueryBuilder
        key={mapping.query.cid}
        defaultBasicView
        forceCollection={undefined}
        isEmbedded
        query={mapping.query}
        recordSet={undefined}
        renderFieldPrefix={(field): JSX.Element => (
          <TermPicker
            field={field}
            fieldIndex={field.id}
            mapping={mapping}
            onChange={handleChange}
          />
        )}
        onChange={({ fields: newFields }): void => {
          /*
           * QueryBuilder emits changes for its pending empty state and then
           * for its initial state. Neither callback is a user edit. The
           * second callback can also rewrite legacy XML stringIds, so compare
           * resolved query paths rather than serialized IDs.
           */
          if (!queryBuilderInitialized.current) {
            if (
              newFields.length === 0 ||
              fieldShapesEqual(mapping.fields, newFields)
            ) {
              if (newFields.length > 0) queryBuilderInitialized.current = true;
              return;
            }
            queryBuilderInitialized.current = true;
          }
          handleChange(updateMappingFields(mapping, newFields));
        }}
        canRemoveField={(field): boolean => !isIdentifierField(field)}
        isFieldReadOnly={isIdentifierField}
      />
      {fields.length === 0 && (
        <p>{dwcaText.dwcaAddField({ query: queryText.query() })}</p>
      )}
      {pendingCoreRowType !== undefined && (
        <Dialog
          buttons={
            <>
              <Button.Warning
                onClick={(): void => {
                  onCoreChange(pendingCoreRowType);
                  setPendingCoreRowType(undefined);
                }}
              >
                {commonText.change()}
              </Button.Warning>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
            </>
          }
          header={dwcaText.dwcaChangeCoreConfirmation()}
          isOpen
          onClose={(): void => setPendingCoreRowType(undefined)}
        >
          {dwcaText.dwcaChangeCoreConfirmationDescription()}
        </Dialog>
      )}
    </div>
  );
}

export function DwcaDefinitionEditor(props: AppResourceTabProps): JSX.Element {
  const [isDataModelLoaded = false] = useAsyncState(
    React.useCallback(() => fetchTables.then(() => true), []),
    false
  );
  return isDataModelLoaded ? (
    <DwcaDefinitionEditorLoaded {...props} />
  ) : (
    <LoadingScreen />
  );
}

function DwcaDefinitionEditorLoaded({
  appResource,
  data,
  onChange: handleChange,
}: AppResourceTabProps): JSX.Element {
  const [mappings, setMappings] = React.useState<RA<Mapping>>(() => {
    const parsed = parseDefinition(data);
    return parsed.some(({ extension }) => !extension)
      ? parsed
      : [newMapping(false, darwinCore), ...parsed];
  });
  const [tabValue, setTabValue] = useSearchParameter(dwcaTabParameter);
  const tabValues = React.useMemo(
    () => getMappingTabValues(mappings),
    [mappings]
  );
  const tabIndex = getMappingTabIndex(mappings, tabValues, tabValue);
  const tab = Math.max(0, tabIndex);
  const coreRowType =
    mappings.find(({ extension }) => !extension)?.rowType ?? darwinCore.rowType;
  const baseTable = getBaseTableForCore(coreRowType);
  const [showExtensionPicker, setShowExtensionPicker] = React.useState(false);
  const [queries] = useAsyncState(
    React.useCallback(
      () =>
        fetchCollection('SpQuery', {
          limit: 0,
          domainFilter: false,
          contextTableId: baseTable.tableId,
          specifyUser: userInformation.id,
        }),
      [baseTable.tableId]
    ),
    false
  );
  const appResourceDataField = React.useMemo(
    () => getField(appResource.specifyTable, 'spAppResourceDatas'),
    [appResource.specifyTable]
  );
  const [, setSaveBlockers] = useSaveBlockers(
    appResource,
    appResourceDataField
  );
  const missingRequiredTerms = React.useMemo(
    () =>
      mappings.flatMap((mapping) => {
        const identifierTerm = getCoreIdentifierTerm(mapping.coreRowType);
        const missingIdentifier = mapping.terms.includes(identifierTerm)
          ? []
          : [dwcaText.dwcaOccurrenceId()];
        if (!mapping.extension) return missingIdentifier;
        const required = (mapping.extensionDefinition?.fields ?? []).filter(
          ({ required }) => required === true
        );
        return [
          ...missingIdentifier,
          ...required
            .filter(({ name }) => !mapping.terms.includes(name))
            .map(({ title, name }) =>
              dwcaText.dwcaRequiredTerm({ title: title ?? name, name })
            ),
        ];
      }),
    [mappings]
  );
  React.useEffect(() => {
    setSaveBlockers(
      missingRequiredTerms.length === 0
        ? []
        : [
            dwcaText.dwcaMapRequiredTerms({
              terms: missingRequiredTerms.join(', '),
            }),
          ],
      getFieldBlockerKey(appResourceDataField, 'dwca-required-terms')
    );
  }, [appResourceDataField, missingRequiredTerms, setSaveBlockers]);
  const hasDuplicateFileNames = React.useMemo(() => {
    const fileNames = mappings
      .map(({ fileName }) => fileName.trim().toLowerCase())
      .filter((fileName) => fileName !== '');
    return new Set(fileNames).size !== fileNames.length;
  }, [mappings]);
  React.useEffect(() => {
    setSaveBlockers(
      hasDuplicateFileNames ? [dwcaText.dwcaFileNamesMustBeUnique()] : [],
      getFieldBlockerKey(appResourceDataField, 'dwca-file-names')
    );
  }, [appResourceDataField, hasDuplicateFileNames, setSaveBlockers]);
  React.useEffect(() => {
    if (tabValue === undefined) return;
    if (tabIndex === -1) setTabValue(undefined);
    else if (tabValues[tabIndex] !== tabValue) setTabValue(tabValues[tabIndex]);
  }, [setTabValue, tabIndex, tabValues, tabValue]);
  const update = (next: RA<Mapping>): void => {
    const selectedCoreRowType =
      next.find(({ extension }) => !extension)?.rowType ?? darwinCore.rowType;
    const selectedBaseTable = getBaseTableForCore(selectedCoreRowType);
    const normalized = next.map((mapping) =>
      mapping.coreRowType === selectedCoreRowType &&
      mapping.baseTable.tableId === selectedBaseTable.tableId
        ? mapping
        : {
            ...mapping,
            coreRowType: selectedCoreRowType,
            baseTable: selectedBaseTable,
            query: mapping.query.set(
              'contextTableId',
              selectedBaseTable.tableId
            ),
          }
    );
    setMappings(normalized);
    if (tabValue !== undefined) {
      const nextActive = normalized[tab] ?? normalized[0];
      const nextTabValue =
        getMappingTabValues(normalized)[
          nextActive === undefined ? -1 : normalized.indexOf(nextActive)
        ];
      if (nextTabValue !== tabValue) setTabValue(nextTabValue);
    }
    handleChange(serializeDefinition(normalized));
  };
  const availableExtensions = gbifExtensions.filter(
    (extension) =>
      isExtensionApplicableToCore(extension, coreRowType) &&
      !mappings.some(
        (mapping) => mapping.extensionDefinition?.rowType === extension.rowType
      )
  );
  const active = (mappings[tab] ?? mappings[0])!;
  const hasMappingsToReset =
    mappings.length > 1 ||
    (mappings.find(({ extension }) => !extension)?.fields.length ?? 0) > 1;
  const handleCoreChange = (rowType: string): void => {
    const nextCore = newMapping(
      false,
      getCoreDefinitionForRowType(rowType),
      rowType
    );
    update([nextCore]);
    setTabValue('core');
    setShowExtensionPicker(false);
  };
  const handleAddExtension = (
    extension: ExtensionDefinition | undefined,
    query?: SpecifyResource<SpQuery>,
    template?: DwcaTemplate
  ): void => {
    const base = newMapping(true, extension, coreRowType);
    if (extension === undefined) {
      const next = [...mappings, base];
      update(next);
      setTabValue(getMappingTabValues(next).at(-1));
      return;
    }
    if (query !== undefined) {
      const mapping = mappingFromQuery(base, query);
      const next = [...mappings, mapping];
      update(next);
      setTabValue(getMappingTabValues(next).at(-1));
    } else if (template !== undefined) {
      const parsed = parseDefinition(template.definition).find(
        (candidate) =>
          candidate.extension && candidate.rowType === extension.rowType
      );
      const mapping =
        parsed === undefined
          ? base
          : ensureIdentifierTerm({
              ...parsed,
              coreRowType,
              baseTable,
              query: parsed.query.set('contextTableId', baseTable.tableId),
              extensionDefinition: extension,
            });
      const next = [...mappings, mapping];
      update(next);
      setTabValue(getMappingTabValues(next).at(-1));
    } else {
      const next = [...mappings, base];
      update(next);
      setTabValue(getMappingTabValues(next).at(-1));
    }
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {missingRequiredTerms.length > 0 && (
        <ErrorMessage>
          Map the required terms before saving:{' '}
          {missingRequiredTerms.join(', ')}
        </ErrorMessage>
      )}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {mappings.map((mapping, index) => (
          <Button.Small
            key={index}
            aria-pressed={tab === index}
            variant={tab === index ? className.infoButton : undefined}
            onClick={(): void => {
              const nextTabValue = tabValues[index];
              if (nextTabValue !== tabValue) setTabValue(nextTabValue);
            }}
          >
            {localized(
              mapping.extension
                ? (mapping.extensionDefinition?.title ??
                    dwcaText.dwcaExtension())
                : dwcaText.dwcaCore()
            )}
          </Button.Small>
        ))}
        <Button.Small
          aria-label={localized(
            `${commonText.add()} ${dwcaText.dwcaExtension()}`
          )}
          title={localized(`${commonText.add()} ${dwcaText.dwcaExtension()}`)}
          onClick={(): void => setShowExtensionPicker((shown) => !shown)}
        >
          {icons.plus}
        </Button.Small>
      </div>
      {showExtensionPicker && availableExtensions.length > 0 && (
        <ExtensionDialog
          extensions={availableExtensions}
          queries={
            queries?.records.filter(
              (query) => query.contextTableId === baseTable.tableId
            ) ?? []
          }
          coreRowType={coreRowType}
          onAdd={handleAddExtension}
          onClose={(): void => setShowExtensionPicker(false)}
        />
      )}
      <QueryMapping
        key={tab}
        mapping={active}
        hasMappingsToReset={hasMappingsToReset}
        onCoreChange={handleCoreChange}
        onChange={(next): void => update(replaceItem(mappings, tab, next))}
        onRemove={
          active.extension
            ? (): void => update(mappings.filter((_, index) => index !== tab))
            : undefined
        }
        onTemplate={(template): void => {
          const replacement = getTemplateMapping(template, active, coreRowType);
          if (replacement === undefined) return;
          update([
            ...mappings.slice(0, tab),
            {
              ...replacement,
              coreRowType,
              baseTable,
              query: replacement.query.set('contextTableId', baseTable.tableId),
            },
            ...mappings.slice(tab + 1),
          ]);
        }}
      />
    </div>
  );
}
