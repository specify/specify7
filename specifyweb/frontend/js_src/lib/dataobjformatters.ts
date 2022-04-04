import { ajax } from './ajax';
import type { AnySchema } from './datamodelutils';
import { cachableUrl, contextUnlockedPromise } from './initialcontext';
import type { SpecifyResource } from './legacytypes';
import type { LiteralField } from './specifyfield';
import type { Collection } from './specifymodel';
import type { RA } from './types';
import { defined, filterArray } from './types';
import { fieldFormat, resolveParser } from './uiparse';
import { getAttribute } from './parseformcells';

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
  /*
   * Readonly ending: string;
   * readonly count: string;
   * readonly orderFieldName: string | undefined;
   */
};

export const fetchFormatters: Promise<{
  readonly formatters: RA<Formatter>;
  readonly aggregators: RA<Aggregator>;
}> = contextUnlockedPromise
  .then(async () =>
    ajax<Document>(
      cachableUrl('/context/app.resource?name=DataObjFormatters'),
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { Accept: 'application/xml' },
      }
    )
  )
  .then(({ data: definitions }) => ({
    formatters: filterArray(
      Array.from(definitions.getElementsByTagName('format'), (formatter) => {
        const switchElement = formatter.getElementsByTagName('switch')[0];
        if (typeof switchElement === 'undefined') return undefined;
        const isSingle =
          getAttribute(switchElement, 'single')?.trim() !== 'false';
        const field = getAttribute(switchElement, 'field')?.trim();
        const fields = Array.from(
          switchElement.getElementsByTagName('fields'),
          (fields) => ({
            value: getAttribute(fields, 'value'),
            fields: Array.from(
              fields.getElementsByTagName('field'),
              (field) => ({
                fieldName: field.textContent?.trim() ?? '',
                separator: getAttribute(field, 'sep') ?? '',
                formatter: getAttribute(field, 'formatter')?.trim() ?? '',
                fieldFormatter: getAttribute(field, 'format')?.trim(),
              })
            ).filter(({ fieldName }) => fieldName.length > 0),
          })
        ).filter(({ fields }) => fields.length > 0);
        // External DataObjFormatters are not supported
        if (fields.length === 0) return undefined;
        return {
          name: getAttribute(formatter, 'name')?.trim(),
          title: getAttribute(formatter, 'title')?.trim(),
          className: getAttribute(formatter, 'class')?.trim(),
          isDefault: getAttribute(formatter, 'default')?.trim() === 'true',
          fields,
          switchFieldName:
            typeof field === 'string' && !isSingle ? field : undefined,
        };
      })
    ),
    aggregators: filterArray(
      Array.from(
        definitions.getElementsByTagName('aggregator'),
        (aggregator) => {
          return {
            name: getAttribute(aggregator, 'name')?.trim(),
            title: getAttribute(aggregator, 'title')?.trim(),
            className: getAttribute(aggregator, 'class')?.trim(),
            isDefault: getAttribute(aggregator, 'default')?.trim() === 'true',
            separator: getAttribute(aggregator, 'separator') ?? '',
            format: getAttribute(aggregator, 'format') ?? '',
          };
        }
      )
    ),
  }));

export async function format<SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA> | undefined,
  formatterName?: string
): Promise<string | undefined> {
  if (typeof resource !== 'object' || resource === null) return undefined;
  await resource.fetchPromise();
  const resolvedFormatterName =
    formatterName ?? resource.specifyModel.getFormat();

  const { formatters } = await fetchFormatters;
  const formatter =
    formatters.find(({ name }) => name === resolvedFormatterName) ??
    formatters.find(
      ({ className, isDefault }) =>
        className === resource.specifyModel.longName && isDefault
    );
  if (typeof formatter === 'undefined') return undefined;

  // Doesn't support switch fields that are in child objects
  const fields =
    typeof formatter.switchFieldName === 'string'
      ? formatter.fields.find(
          ({ value }) =>
            (value ?? '') ===
            (resource.get(formatter.switchFieldName ?? '') ?? '')
        )?.fields ?? formatter.fields[0].fields
      : formatter.fields[0].fields;

  return Promise.all(
    fields.map(async ({ fieldName, formatter, separator, fieldFormatter }) => {
      const formatted = await (
        resource.rgetPromise(fieldName) as Promise<
          string | SpecifyResource<AnySchema> | undefined
        >
      ).then(async (value) => {
        if (formatter.length > 0 && typeof value === 'object')
          return (await format(value, formatter)) ?? '';
        else {
          const field = defined(
            resource.specifyModel.getField(fieldName) as LiteralField
          );
          return fieldFormat(
            field,
            defined(resolveParser(field)),
            value as string | undefined
          );
        }
      });
      return `${separator}${
        typeof fieldFormatter === 'string' && fieldFormatter === ''
          ? ''
          : formatted
      }`;
    })
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

  if (typeof aggregator === 'undefined')
    throw new Error('Aggregator not found');

  if (!collection.isComplete()) throw new Error('Collection is incomplete');

  return Promise.all(
    collection.models.map(async (resource) =>
      format(resource, aggregator.format)
    )
  ).then((formatted) => formatted.join(aggregator.separator));
}
