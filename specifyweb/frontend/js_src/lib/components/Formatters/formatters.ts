/**
 * Format a resource using resource formatters defined in Specify 6
 */

import type { LocalizedString } from 'typesafe-i18n';

import { formsText } from '../../localization/forms';
import { userText } from '../../localization/user';
import { ajax } from '../../utils/ajax';
import { getAppResourceUrl } from '../../utils/ajax/helpers';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { KEY, multiSortFunction, sortFunction } from '../../utils/utils';
import { fetchDistantRelated } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { fetchContext as fetchDomain } from '../DataModel/schema';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import {
  fetchContext as fetchSchema,
  genericTables,
} from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import {
  cachableUrl,
  contextUnlockedPromise,
  foreverFetch,
} from '../InitialContext';
import { hasPathPermission, hasTablePermission } from '../Permissions/helpers';
import { xmlToSpec } from '../Syncer/xmlUtils';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { aggregate } from './aggregate';
import { fieldFormat } from './fieldFormat';
import type { Aggregator, Formatter } from './spec';
import { formattersSpec } from './spec';

export const fetchFormatters: Promise<{
  readonly formatters: RA<Formatter>;
  readonly aggregators: RA<Aggregator>;
}> = contextUnlockedPromise.then(async (entrypoint) =>
  entrypoint === 'main'
    ? Promise.all([
        ajax<Element>(cachableUrl(getAppResourceUrl('DataObjFormatters')), {
          headers: { Accept: 'text/xml' },
        }).then(({ data }) => data),
        fetchSchema,
        fetchDomain,
      ]).then(([definitions]) => xmlToSpec(definitions, formattersSpec()))
    : foreverFetch()
);

export const naiveFormatter = (
  tableLabel: string,
  id: number | undefined
): LocalizedString =>
  id === undefined
    ? formsText.newResourceTitle({ tableName: tableLabel })
    : formsText.resourceFormatter({
        tableName: tableLabel,
        id,
      });

export async function format<SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA> | undefined,
  defaultFormatter: Formatter | string | undefined,
  tryBest: true,
  cycleDetection?: RA<SpecifyResource<AnySchema>>
): Promise<LocalizedString>;
export async function format<SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA> | undefined,
  defaultFormatter?: Formatter | string,
  tryBest?: false,
  cycleDetection?: RA<SpecifyResource<AnySchema>>
): Promise<LocalizedString | undefined>;
export async function format<SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA> | undefined,
  defaultFormatter?: Formatter | string,
  /*
   * Format a resource even if no formatter is present, or some permissions
   * are missing
   */
  tryBest = false,
  cycleDetection: RA<SpecifyResource<AnySchema>> = []
): Promise<LocalizedString | undefined> {
  if (typeof resource !== 'object' || resource === null || resource.deleted)
    return undefined;
  if (hasTablePermission(resource.specifyTable.name, 'read'))
    await resource.fetch();
  const resolvedDefaultFormatter =
    defaultFormatter ?? resource.specifyTable.getFormat();

  const { formatters } = await fetchFormatters;
  const { definition } = resolveFormatter(
    formatters,
    resolvedDefaultFormatter,
    resource.specifyTable
  );

  // Doesn't support switch fields that are in child objects
  const fields = await determineFields(definition, resource);

  const automaticFormatter = tryBest
    ? naiveFormatter(resource.specifyTable.label, resource.id)
    : undefined;

  return Promise.all(
    fields.map(async (field) =>
      formatField(field, resource, cycleDetection, tryBest)
    )
  ).then((values) => {
    const joined = values.reduce<string>(
      (result, { formatted, separator = '' }, index) =>
        `${result}${
          result.length === 0 && index !== 0 ? '' : separator
        }${formatted}`,
      ''
    );
    return joined.length === 0 ? automaticFormatter : localized(joined);
  });
}

/**
 * Decide which of the field definitions to apply
 */
async function determineFields<SCHEMA extends AnySchema>(
  { conditionField, fields }: Formatter['definition'],
  resource: SpecifyResource<SCHEMA>
): Promise<Formatter['definition']['fields'][number]['fields']> {
  if (fields.length === 0) return [];
  if (conditionField === undefined) return fields[0].fields;
  const result = await fetchPathAsString(resource, conditionField, false);
  if (result === undefined) return fields[0].fields;
  return (
    fields.find(({ value }) => (value ?? '') === result)?.fields ??
    fields[0].fields
  );
}

async function formatField(
  {
    field: fields,
    formatter,
    separator,
    aggregator,
    fieldFormatter,
    formatFieldValue = true,
  }: Formatter['definition']['fields'][number]['fields'][number] & {
    readonly formatFieldValue?: boolean;
  },
  parentResource: SpecifyResource<AnySchema>,
  cycleDetection: RA<SpecifyResource<AnySchema>> = [],
  tryBest: boolean = false
): Promise<{ readonly formatted: string; readonly separator?: string }> {
  const isCycle = cycleDetection.some(
    (resource) =>
      resource.id === parentResource.id &&
      resource.specifyTable === parentResource.specifyTable
  );
  const cycleDetector = [...cycleDetection, parentResource];

  let formatted: string | undefined = undefined;
  const hasPermission = hasPathPermission(fields ?? [], 'read');

  if (hasPermission) {
    const data = await fetchDistantRelated(parentResource, fields);
    if (data === undefined) return { formatted: '' };
    const { resource, field } = data;
    if (field === undefined || resource === undefined) return { formatted: '' };
    formatted = field.isRelationship
      ? isCycle
        ? ''
        : await (relationshipIsToMany(field)
            ? aggregate(
                await resource.rgetCollection(field.name),
                aggregator,
                cycleDetector
              )
            : format(
                await resource.rgetPromise(field.name),
                formatter,
                false,
                cycleDetector
              ))
      : formatFieldValue
        ? await fieldFormat(
            field,
            resource.get(field.name) as string | undefined,
            undefined,
            fieldFormatter
          )
        : ((resource.get(field.name) as string | null) ?? undefined);
  } else
    formatted = tryBest
      ? naiveFormatter(parentResource.specifyTable.name, parentResource.id)
      : userText.noPermission();

  return {
    formatted: formatted?.toString() ?? '',
    separator: (formatted ?? '') === '' ? '' : separator,
  };
}

/**
 * Climb the resource along the path, and convert the final result to a string
 * (either using formatter, aggregator or toString())
 */
export async function fetchPathAsString(
  baseResource: SpecifyResource<AnySchema>,
  field: RA<LiteralField | Relationship> | undefined,
  formatFieldValue: boolean = true
): Promise<string | undefined> {
  const value = await formatField(
    {
      field,
      formatter: undefined,
      separator: localized(''),
      aggregator: undefined,
      fieldFormatter: undefined,
      formatFieldValue,
    },
    baseResource
  );
  return value.formatted;
}

const resolveFormatter = (
  formatters: RA<Formatter>,
  defaultFormatter: Formatter | string | undefined,
  table: SpecifyTable
): Formatter =>
  (typeof defaultFormatter === 'object' ? defaultFormatter : undefined) ??
  formatters.find(({ name }) => name === defaultFormatter) ??
  findDefaultFormatter(formatters, table) ??
  autoGenerateFormatter(table);

const findDefaultFormatter = (
  formatters: RA<Formatter>,
  table: SpecifyTable
): Formatter | undefined =>
  formatters
    .filter((formatter) => formatter.table === table)
    .sort(sortFunction(({ isDefault }) => isDefault, true))?.[KEY];

const autoGenerateFormatter = (table: SpecifyTable): Formatter => ({
  name: table.name,
  title: table.label,
  table,
  isDefault: true,
  definition: {
    isSingle: false,
    conditionField: undefined,
    external: undefined,
    fields: [
      {
        value: undefined,
        fields: getMainTableFields(table.name)
          /*
           * Selecting just one field, because then don't have to worry about
           * separator
           */
          .slice(0, 1)
          .map((field) => ({
            field: [field],
            separator: localized(''),
            formatter: undefined,
            aggregator: undefined,
            fieldFormatter: undefined,
          })),
      },
    ],
  },
});

/**
 * Finds the most "Interesting" fields in a table (sorted by priority).
 * If you need only at most x fields, do .slice(0,x) on the result.
 *
 * @remarks
 * This does not consider relationships. For some tables, relationships
 * are more interesting than fields.
 */
export const getMainTableFields = (tableName: keyof Tables): RA<LiteralField> =>
  genericTables[tableName].literalFields
    .filter(
      ({ type, isRequired, isHidden, isReadOnly }) =>
        type === 'java.lang.String' && !isReadOnly && (isRequired || !isHidden)
    )
    .sort(
      multiSortFunction(
        ({ name }) => name.toLowerCase().includes('name'),
        true,
        ({ isRequired }) => isRequired,
        true,
        (field) => typeof field.getFormat() === 'string',
        true,
        ({ overrides, isVirtual }) =>
          !isVirtual && !overrides.isHidden && !overrides.isReadOnly,
        true
      )
    );

export const exportsForTests = { formatField };
