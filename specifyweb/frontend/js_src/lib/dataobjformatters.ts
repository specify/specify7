/**
 * Format a resource using resource formatters defined in Specify 6
 */

import { ajax } from './ajax';
import type { Tables } from './datamodel';
import type { AnySchema } from './datamodelutils';
import { f } from './functools';
import {
  getAttribute,
  getBooleanAttribute,
  getParsedAttribute,
  KEY,
  sortFunction,
} from './helpers';
import {
  cachableUrl,
  contextUnlockedPromise,
  foreverFetch,
} from './initialcontext';
import type { SpecifyResource } from './legacytypes';
import { commonText } from './localization/common';
import { hasTablePermission, mappingPathToTableNames } from './permissionutils';
import { formatUrl } from './querystring';
import { schema } from './schema';
import type { LiteralField } from './specifyfield';
import type { Collection } from './specifymodel';
import type { RA } from './types';
import { defined, filterArray } from './types';
import { fieldFormat, resolveParser } from './uiparse';

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
          headers: { Accept: 'application/xml' },
        }
      ).then(({ data: definitions }) => ({
        formatters: filterArray(
          Array.from(
            definitions.getElementsByTagName('format'),
            (formatter) => {
              const switchElement = formatter.getElementsByTagName('switch')[0];
              if (switchElement === undefined) return undefined;
              const isSingle =
                getBooleanAttribute(switchElement, 'single') ?? true;
              const field = getParsedAttribute(switchElement, 'field');
              const fields = Array.from(
                switchElement.getElementsByTagName('fields'),
                (fields) => ({
                  value: getAttribute(fields, 'value'),
                  fields: Array.from(
                    fields.getElementsByTagName('field'),
                    (field) => ({
                      fieldName: field.textContent?.trim() ?? '',
                      separator: getAttribute(field, 'sep') ?? '',
                      formatter: getParsedAttribute(field, 'formatter') ?? '',
                      fieldFormatter: getParsedAttribute(field, 'format'),
                    })
                  ).filter(({ fieldName }) => fieldName.length > 0),
                })
              ).filter(({ fields }) => fields.length > 0);
              // External DataObjFormatters are not supported
              if (fields.length === 0) return undefined;
              return {
                name: getParsedAttribute(formatter, 'name'),
                title: getParsedAttribute(formatter, 'title'),
                className: getParsedAttribute(formatter, 'class'),
                isDefault: getBooleanAttribute(formatter, 'default') ?? false,
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
            (aggregator) => ({
              name: getParsedAttribute(aggregator, 'name'),
              title: getParsedAttribute(aggregator, 'title'),
              className: getParsedAttribute(aggregator, 'class'),
              isDefault: getParsedAttribute(aggregator, 'default') === 'true',
              separator: getAttribute(aggregator, 'separator') ?? '',
              format: getAttribute(aggregator, 'format') ?? '',
            })
          )
        ),
      }))
    : foreverFetch<{
        readonly formatters: RA<Formatter>;
        readonly aggregators: RA<Aggregator>;
      }>()
);

export const getMainTableFields = (tableName: keyof Tables): RA<LiteralField> =>
  schema.models[tableName].literalFields
    .filter(
      ({ type, overrides }) =>
        type === 'java.lang.String' &&
        !overrides.isHidden &&
        !overrides.isReadOnly
    )
    .sort(sortFunction(({ isRequired }) => isRequired, true));

export const naiveFormatter = (resource: SpecifyResource<AnySchema>): string =>
  `${resource.specifyModel.label}${
    resource.isNew() ? '' : ` #${resource.id}/`
  }`;

export async function format<SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA> | undefined,
  formatterName?: string,
  /*
   * Format a resource even if no formatter is present, or some permissions
   * are missing
   */
  tryBest = false
): Promise<string | undefined> {
  if (typeof resource !== 'object' || resource === null) return undefined;
  if (hasTablePermission(resource.specifyModel.name, 'read'))
    await resource.fetch();
  const resolvedFormatterName =
    formatterName ?? resource.specifyModel.getFormat();

  const { formatters } = await fetchFormatters;
  const formatter = formatters.find(
    ({ name }) => name === resolvedFormatterName
  ) ??
    formatters
      .filter(({ className }) => className === resource.specifyModel.longName)
      .sort(sortFunction(({ isDefault }) => isDefault, true))?.[KEY] ?? {
      // If formatter does not exist, generate one on the fly
      isDefault: true,
      switchFieldName: undefined,
      fields: [
        {
          value: undefined,
          fields: filterArray([
            getMainTableFields(resource.specifyModel.name).map((field) => ({
              fieldName: field.name,
              separator: '',
              formatter: '',
              fieldFormatter: 'true',
            }))[0],
          ]),
        },
      ],
    };

  // Doesn't support switch fields that are in child objects
  const fields =
    typeof formatter.switchFieldName === 'string'
      ? formatter.fields.find(
          ({ value }) =>
            (value?.toString() ?? '') ===
            (resource.get(formatter.switchFieldName ?? '') ?? '').toString()
        )?.fields ?? formatter.fields[0].fields
      : formatter.fields[0].fields;

  const automaticFormatter = tryBest ? naiveFormatter(resource) : undefined;

  /*
   * Don't format resource if all relevant fields are empty, or formatter has
   * no fields
   */
  return fields
    .map(({ fieldName }) => resource.get(fieldName.split('.')[0]))
    .every((value) => value === undefined || value === null || value === '')
    ? automaticFormatter ?? undefined
    : Promise.all(
        fields.map(
          async ({ fieldName, formatter, separator, fieldFormatter }) => {
            const field = defined(
              resource.specifyModel.getField(fieldName) as LiteralField
            );
            const formatted =
              typeof fieldFormatter === 'string' && fieldFormatter === ''
                ? ''
                : await f.var(
                    mappingPathToTableNames(
                      resource.specifyModel.name,
                      fieldName.split('.'),
                      true
                    ).find(
                      (tableName) => !hasTablePermission(tableName, 'read')
                    ),
                    (noAccessTable) =>
                      typeof noAccessTable === 'string'
                        ? tryBest
                          ? naiveFormatter(resource)
                          : commonText('noPermission')
                        : (
                            resource.rgetPromise(fieldName) as Promise<
                              SpecifyResource<AnySchema> | string | undefined
                            >
                          ).then(async (value) =>
                            formatter.length > 0 && typeof value === 'object'
                              ? (await format(value, formatter)) ?? ''
                              : fieldFormat(
                                  field,
                                  resolveParser(field),
                                  value as string | undefined
                                )
                          )
                  );
            return formatted === '' ? '' : `${separator}${formatted}`;
          }
        )
      ).then((values) => values.join(''));
}

export async function aggregate(
  collection: Collection<AnySchema>
): Promise<string> {
  const { aggregators } = await fetchFormatters;

  const aggregatorName = collection.model.specifyModel.getAggregator();

  const aggregator =
    aggregators.find(({ name }) => name === aggregatorName) ??
    aggregators.find(
      ({ className, isDefault }) =>
        className === collection.model.specifyModel.longName && isDefault
    );

  if (aggregator === undefined) throw new Error('Aggregator not found');

  if (!collection.isComplete()) console.error('Collection is incomplete');

  return Promise.all(
    collection.models.map(async (resource) =>
      format(resource, aggregator.format)
    )
  ).then((formatted) => filterArray(formatted).join(aggregator.separator));
}
