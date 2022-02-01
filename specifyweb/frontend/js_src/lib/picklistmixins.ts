import { ajax } from './ajax';
import type { PickListInfo, PickListItemSimple } from './components/combobox';
import type { Tables } from './datamodel';
import type { AnySchema } from './datamodelutils';
import { format } from './dataobjformatters';
import * as queryString from './querystring';
import { getModel } from './schema';
import type { RA } from './types';
import { defined } from './types';

/** User defined picklist */
export const getUserDefined = async ({
  pickList,
}: PickListInfo): Promise<RA<PickListItemSimple>> =>
  pickList.rgetCollection('pickListItems').then(({ models }) =>
    models.map((model) => ({
      value: model.get('value'),
      title: model.get('title'),
    }))
  );

/** From table picklist */
export async function getFromTable({
  pickList,
  limit,
}: PickListInfo): Promise<RA<PickListItemSimple>> {
  const model = defined(getModel(pickList.get('tableName')));
  const collection = new model.LazyCollection({ domainfilter: true });
  return collection.fetchPromise({ limit }).then(async ({ models }) =>
    Promise.all(
      models.map(async (model) =>
        format(model, pickList.get('formatter') ?? undefined).then((title) => ({
          value: model.url(),
          title: title ?? model.url(),
        }))
      )
    )
  );
}

// TODO: move this back into specifyApi.ts
const fetchRows = async <SCHEMA extends AnySchema>(
  table: SCHEMA['tableName'],
  {
    fields,
    limit,
    distinct,
  }: {
    readonly fields: RA<keyof SCHEMA['fields']>;
    readonly limit: number;
    readonly distinct: boolean;
  }
): Promise<RA<RA<string>>> =>
  ajax<RA<RA<string>>>(
    queryString.format(`/api/specify_rows/${table.toLowerCase()}/`, {
      fields: fields.join(',').toLowerCase(),
      limit: limit.toString(),
      distinct: distinct ? 'true' : 'false',
    }),
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Accept: 'application/json' },
    }
  ).then(({ data }) => data);

/** From field picklist */
export async function getFromField({
  pickList,
  limit,
}: PickListInfo): Promise<RA<PickListItemSimple>> {
  return fetchRows<AnySchema>(
    defined(pickList.get('tableName') ?? undefined) as keyof Tables,
    {
      limit,
      fields: [pickList.get('fieldName') ?? ''],
      distinct: true,
    }
  ).then((rows) =>
    rows.map((row) => row[0] ?? '').map((value) => ({ value, title: value }))
  );
}
