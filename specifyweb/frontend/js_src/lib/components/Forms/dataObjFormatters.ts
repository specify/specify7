/**
 * Format a resource using resource formatters defined in Specify 6
 */

import type { LocalizedString } from 'typesafe-i18n';

import { formsText } from '../../localization/forms';
import { userText } from '../../localization/user';
import { ajax } from '../../utils/ajax';
import { hijackBackboneAjax } from '../../utils/ajax/backboneAjax';
import { Http } from '../../utils/ajax/definitions';
import { f } from '../../utils/functools';
import { resolveParser } from '../../utils/parser/definitions';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { KEY, sortFunction } from '../../utils/utils';
import { backboneFieldSeparator } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { LiteralField } from '../DataModel/specifyField';
import type { Collection, SpecifyTable } from '../DataModel/specifyTable';
import { genericTables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { fieldFormat } from '../Formatters/fieldFormat';
import {
  cachableUrl,
  contextUnlockedPromise,
  foreverFetch,
} from '../InitialContext';
import { hasPathPermission, hasTablePermission } from '../Permissions/helpers';
import { formatUrl } from '../Router/queryString';
import { toSimpleXmlNode, xmlToJson } from '../Syncer/xmlToJson';
import {
  getAttribute,
  getBooleanAttribute,
  getParsedAttribute,
} from '../Syncer/xmlUtils';

export type Formatter = {
  readonly name: string | undefined;
  readonly title: string | undefined;
  readonly className: string | undefined;
  readonly isDefault: boolean;
  readonly switchFieldName: string | undefined;
  readonly fields: RA<{
    readonly value: string | undefined;
    readonly fields: RA<{
      readonly fieldName: string;
      readonly separator: string;
      readonly formatter: string;
      readonly fieldFormatter: string | undefined;
    }>;
  }>;
};

export type Aggregator = {
  readonly name: string | undefined;
  readonly title: string | undefined;
  readonly className: string | undefined;
  readonly isDefault: boolean;
  readonly separator: string;
  readonly format: string;
};

/*
 * Use toSimpleXmlNode(xmlToJson())
 * also see parseXml function in codeMirrorLinters.ts
 */
export const fetchFormatters: Promise<{
  readonly formatters: RA<Formatter>;
  readonly aggregators: RA<Aggregator>;
}> = contextUnlockedPromise.then(async (entrypoint) =>
  entrypoint === 'main'
    ? ajax<Document>(
        cachableUrl(
          formatUrl('/context/app.resource', { name: 'DataObjFormatters' })
        ),
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'text/xml' },
        }
      ).then(({ data: definitions }) => ({
        formatters: filterArray(
          Array.from(
            definitions.getElementsByTagName('format'),
            (formatter) => {
              const formatterNode = toSimpleXmlNode(xmlToJson(formatter));
              const switchElement = formatterNode.children.switch[0];
              if (switchElement === undefined) return undefined;
              const isSingle =
                getBooleanAttribute(switchElement, 'single') ?? true;
              const field = getParsedAttribute(switchElement, 'field');
              const fields = Array.from(
                switchElement.children.fields,
                (fields) => ({
                  value: getAttribute(fields, 'value'),
                  fields: Array.from(fields.children.field, (field) => ({
                    fieldName: field.text?.trim() ?? '',
                    separator: getAttribute(field, 'sep') ?? '',
                    formatter: getParsedAttribute(field, 'formatter') ?? '',
                    fieldFormatter: getParsedAttribute(field, 'format'),
                  })).filter(({ fieldName }) => fieldName.length > 0),
                })
              ).filter(({ fields }) => fields.length > 0);
              // External DataObjFormatters are not supported
              if (fields.length === 0) return undefined;
              return {
                name: getParsedAttribute(formatterNode, 'name'),
                title: getParsedAttribute(formatterNode, 'title'),
                className: getParsedAttribute(formatterNode, 'class'),
                isDefault:
                  getBooleanAttribute(formatterNode, 'default') ?? false,
                fields,
                switchFieldName:
                  typeof field === 'string' && !isSingle ? field : undefined,
              };
            }
          )
        ),
        aggregators: filterArray(
          Array.from(
            definitions.getElementsByTagName('aggregator'),
            (aggregator) => {
              const aggregatorNode = toSimpleXmlNode(xmlToJson(aggregator));
              return {
                name: getParsedAttribute(aggregatorNode, 'name'),
                title: getParsedAttribute(aggregatorNode, 'title'),
                className: getParsedAttribute(aggregatorNode, 'class'),
                isDefault:
                  getParsedAttribute(aggregatorNode, 'default') === 'true',
                separator: getAttribute(aggregatorNode, 'separator') ?? '',
                format: getAttribute(aggregatorNode, 'format') ?? '',
              };
            }
          )
        ),
      }))
    : foreverFetch<{
        readonly formatters: RA<Formatter>;
        readonly aggregators: RA<Aggregator>;
      }>()
);

export const getMainTableFields = (tableName: keyof Tables): RA<LiteralField> =>
  genericTables[tableName].literalFields
    .filter(
      ({ type, overrides }) =>
        type === 'java.lang.String' &&
        !overrides.isHidden &&
        !overrides.isReadOnly
    )
    .sort(sortFunction(({ isRequired }) => isRequired, true));

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
  formatterName: string | undefined,
  tryBest: true
): Promise<LocalizedString>;
export async function format<SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA> | undefined,
  formatterName?: string,
  tryBest?: false
): Promise<LocalizedString | undefined>;
export async function format<SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA> | undefined,
  formatterName?: string,
  /*
   * Format a resource even if no formatter is present, or some permissions
   * are missing
   */
  tryBest: boolean = false
): Promise<LocalizedString | undefined> {
  if (typeof resource !== 'object' || resource === null) return undefined;
  if (hasTablePermission(resource.specifyTable.name, 'read')) {
    /*
     * Handle the case for when the resource has been deleted from the database
     * instead of throwing a NOT FOUND Error.
     * This will use the 'naive' formatter for the resource
     */
    await hijackBackboneAjax(
      [Http.NOT_FOUND],
      async () => resource.fetch(),
      () => f.void()
    );
  }
  const resolvedFormatterName =
    formatterName ?? resource.specifyTable.getFormat();

  const { formatters } = await fetchFormatters;
  const formatter = resolveFormatter(
    formatters,
    resolvedFormatterName,
    resource.specifyTable
  );

  // Doesn't support switch fields that are in child objects
  const fields =
    typeof formatter.switchFieldName === 'string'
      ? (formatter.fields.find(
          ({ value }) =>
            (value?.toString() ?? '') ===
            (resource.get(formatter.switchFieldName ?? '') ?? '').toString()
        )?.fields ?? formatter.fields[0].fields)
      : formatter.fields[0].fields;

  const automaticFormatter = tryBest
    ? naiveFormatter(resource.specifyTable.label, resource.id)
    : undefined;

  /*
   * Don't format resource if all relevant fields are empty, or formatter has
   * no fields
   */
  const isEmptyResource = fields
    .map(({ fieldName }) =>
      resource.get(fieldName.split(backboneFieldSeparator)[0])
    )
    .every((value) => value === undefined || value === null || value === '');

  return isEmptyResource
    ? (automaticFormatter ?? undefined)
    : Promise.all(
        fields.map(async (field) => formatField(field, resource, tryBest))
      ).then(
        (values) =>
          values.reduce<string>(
            (result, { formatted, separator = '' }, index) =>
              `${result}${
                result.length === 0 && index !== 0 ? '' : separator
              }${formatted}`,
            ''
          ) as LocalizedString
      );
}

async function formatField(
  {
    fieldName,
    formatter,
    separator,
    fieldFormatter,
  }: Formatter['fields'][number]['fields'][number],
  resource: SpecifyResource<AnySchema>,
  tryBest: boolean
): Promise<{ readonly formatted: string; readonly separator?: string }> {
  if (typeof fieldFormatter === 'string' && fieldFormatter === '')
    return { formatted: '' };

  const fields = resource.specifyTable.getFields(fieldName);
  if (fields === undefined) {
    console.error(`Tried to get unknown field: ${fieldName}`);
    return { formatted: '' };
  }
  const field = fields.at(-1)!;
  if (field.isRelationship) {
    console.error(`Unexpected formatting of a relationship field ${fieldName}`);
    return { formatted: '' };
  }

  const hasPermission = hasPathPermission(fields, 'read');

  const formatted = hasPermission
    ? await (
        resource.rgetPromise(fieldName) as Promise<
          SpecifyResource<AnySchema> | string | undefined
        >
      ).then(async (value) =>
        formatter.length > 0 && typeof value === 'object'
          ? ((await format(value, formatter)) ?? '')
          : fieldFormat(
              field,
              value as string | undefined,
              resolveParser(field, undefined, resource)
            )
      )
    : tryBest
      ? naiveFormatter(resource.specifyTable.name, resource.id)
      : userText.noPermission();

  return { formatted, separator: formatted ? separator : '' };
}

const resolveFormatter = (
  formatters: RA<Formatter>,
  formatterName: string | undefined,
  model: SpecifyTable
): Formatter =>
  formatters.find(({ name }) => name === formatterName) ??
  findDefaultFormatter(formatters, model.longName) ??
  autoGenerateFormatter(model);

const findDefaultFormatter = (
  formatters: RA<Formatter>,
  modelLongNmae: string
): Formatter | undefined =>
  formatters
    .filter(({ className }) => className === modelLongNmae)
    .sort(sortFunction(({ isDefault }) => isDefault, true))?.[KEY];

const autoGenerateFormatter = (model: SpecifyTable): Formatter => ({
  name: model.name,
  title: model.name,
  className: model.longName,
  isDefault: true,
  switchFieldName: undefined,
  fields: [
    {
      value: undefined,
      fields: filterArray([
        getMainTableFields(model.name).map((field) => ({
          fieldName: field.name,
          separator: '',
          formatter: '',
          fieldFormatter: 'true',
        }))[0],
      ]),
    },
  ],
});

export async function aggregate(
  collection: Collection<AnySchema>
): Promise<string> {
  const { aggregators } = await fetchFormatters;

  const aggregatorName = collection.table.specifyTable.getAggregator();

  const aggregator =
    aggregators.find(({ name }) => name === aggregatorName) ??
    aggregators.find(
      ({ className, isDefault }) =>
        className === collection.table.specifyTable.longName && isDefault
    );

  if (aggregator === undefined) softFail(new Error('Aggregator not found'));

  if (!collection.isComplete()) console.error('Collection is incomplete');

  return Promise.all(
    collection.models.map(async (resource) =>
      format(resource, aggregator?.format)
    )
  ).then((formatted) =>
    filterArray(formatted).join(aggregator?.separator ?? ', ')
  );
}
