/**
 * Format a resource using resource formatters defined in Specify 6
 */

import type { LocalizedString } from 'typesafe-i18n';

import { formsText } from '../../localization/forms';
import { userText } from '../../localization/user';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { KEY, multiSortFunction, sortFunction } from '../../utils/utils';
import { fetchDistantRelated } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { fetchContext as fetchDomain } from '../DataModel/schema';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { fetchContext as fetchSchema, tables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import {
  cachableUrl,
  contextUnlockedPromise,
  foreverFetch,
} from '../InitialContext';
import { hasPathPermission, hasTablePermission } from '../Permissions/helpers';
import { formatUrl } from '../Router/queryString';
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
        ajax<Element>(
          cachableUrl(
            formatUrl('/context/app.resource', { name: 'DataObjFormatters' })
          ),
          {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { Accept: 'text/xml' },
          }
        ).then(({ data }) => data),
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
  tryBest: true
): Promise<LocalizedString>;
export async function format<SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA> | undefined,
  defaultFormatter?: Formatter | string,
  tryBest?: false
): Promise<LocalizedString | undefined>;
export async function format<SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA> | undefined,
  defaultFormatter?: Formatter | string,
  /*
   * Format a resource even if no formatter is present, or some permissions
   * are missing
   */
  tryBest = false
): Promise<LocalizedString | undefined> {
  if (typeof resource !== 'object' || resource === null) return undefined;
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

  /*
   * Don't format resource if all relevant fields are empty, or formatter has
   * no fields
   */
  const isEmptyResource = fields
    .map(({ field }) =>
      field?.[0] === undefined
        ? undefined
        : field[0].isRelationship && field[0].isDependent()
        ? resource.getDependentResource(field[0].name)
        : resource.get(field[0].name)
    )
    .every((value) => value === undefined || value === null || value === '');
  return isEmptyResource
    ? automaticFormatter ?? undefined
    : Promise.all(
        fields.map(async (field) => formatField(field, resource, tryBest))
      ).then((values) => (values ?? '').join('') as LocalizedString);
}

/**
 * Decide which of the field definitions to apply
 */
async function determineFields<SCHEMA extends AnySchema>(
  { conditionField, fields }: Formatter['definition'],
  resource: SpecifyResource<SCHEMA>
): Promise<Formatter['definition']['fields'][number]['fields']> {
  if (conditionField === undefined) return fields[0].fields;
  const result = await fetchPathAsString(resource, conditionField);
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
  }: Formatter['definition']['fields'][number]['fields'][number],
  parentResource: SpecifyResource<AnySchema>,
  tryBest: boolean
): Promise<string | undefined> {
  let formatted: string | undefined = undefined;
  const hasPermission = hasPathPermission(fields ?? [], 'read');
  if (hasPermission) {
    const data = await fetchDistantRelated(parentResource, fields);
    if (data === undefined) return undefined;
    const { resource, field } = data;
    if (field === undefined || resource === undefined) return undefined;

    formatted = field.isRelationship
      ? await (relationshipIsToMany(field)
          ? aggregate(await resource.rgetCollection(field.name), aggregator)
          : format(
              await resource.rgetPromise(field.name),
              formatter,
              tryBest as false
            ))
      : await fieldFormat(
          field,
          resource.get(field.name) as string | undefined,
          undefined,
          fieldFormatter
        );
  } else {
    formatted = tryBest
      ? naiveFormatter(parentResource.specifyTable.name, parentResource.id)
      : userText.noPermission();
  }

  return formatted === undefined || formatted === ''
    ? ''
    : `${separator}${formatted}`;
}

export async function fetchPathAsString(
  baseResource: SpecifyResource<AnySchema>,
  field: RA<LiteralField | Relationship> | undefined
): Promise<string | undefined> {
  const value = await formatField(
    {
      field,
      formatter: undefined,
      separator: '',
      aggregator: undefined,
      fieldFormatter: undefined,
    },
    baseResource,
    false
  );
  return value?.toString();
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

const autoGenerateFields = 2;
const autoGenerateFormatter = (table: SpecifyTable): Formatter => ({
  name: table.name,
  title: table.name,
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
          .slice(0, autoGenerateFields)
          .map((field) => ({
            field: [field],
            separator: '',
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
 */
export const getMainTableFields = (tableName: keyof Tables): RA<LiteralField> =>
  tables[tableName].literalFields
    .filter(
      ({ type, isHidden, isReadOnly }) =>
        type === 'java.lang.String' && !isHidden && !isReadOnly
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
