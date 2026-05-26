import { ajax } from '../../utils/ajax';
import { getAppResourceUrl } from '../../utils/ajax/helpers';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { parseJavaClassName } from '../DataModel/resource';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { fetchContext as fetchSchema, getTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { fetchView } from '../FormParse';
import { cacheableUrl } from '../InitialContext';
import { xmlToSpec } from '../Syncer/xmlUtils';
import { dataEntryItems } from './spec';

const url = cacheableUrl(getAppResourceUrl('DataEntryTaskInit'));

export const fetchLegacyForms = f.store(
  async (): Promise<RA<SpecifyTable>> =>
    Promise.all([
      ajax<Element>(url, {
        headers: { Accept: 'text/xml' },
      }),
      fetchSchema,
    ])
      .then(async ([{ data }]) =>
        Promise.all(
          xmlToSpec(data, dataEntryItems()).items.map(async ({ viewName }) =>
            f.maybe(viewName, resolveTable)
          )
        )
      )
      .then(filterArray)
);

async function resolveTable(
  viewName: string
): Promise<SpecifyTable | undefined> {
  const table = getTable(viewName);
  if (typeof table === 'object') return table;
  const form = await fetchView(viewName);
  return typeof form === 'object'
    ? getTable(parseJavaClassName(form.class))
    : undefined;
}

export const defaultFormTablesConfig: RA<keyof Tables> = [
  'CollectionObject',
  'CollectingEvent',
  'Locality',
  'Taxon',
  'Agent',
  'Geography',
  'DNASequence',
  'ReferenceWork',
];

export const exportsForTests = {
  fetchLegacyForms,
};
