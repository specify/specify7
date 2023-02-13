import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { parseJavaClassName } from '../DataModel/resource';
import { fetchContext as fetchSchema, getModel } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { fetchView } from '../FormParse';
import { cachableUrl } from '../InitialContext';
import { formatUrl } from '../Router/queryString';
import { xmlToSpec } from '../Syncer/xmlUtils';
import { useFormModels } from './Edit';
import { dataEntryItems } from './spec';

export function useDataEntryForms(): RA<FormEntry> | undefined {
  const [tables] = useFormModels();
  const isLegacy = tables === 'legacy';
  const [rawForms] = useAsyncState(
    React.useCallback(
      () => (isLegacy ? fetchLegacyForms() : undefined),
      [isLegacy]
    ),
    true
  );
  return tables === 'legacy'
    ? rawForms
    : tables.map((table) => ({
        table,
      }));
}

type FormEntry = {
  readonly icon?: string;
  readonly title?: string;
  readonly table: SpecifyModel;
};

const url = cachableUrl(
  formatUrl('/context/app.resource', { name: 'DataEntryTaskInit' })
);
const fetchLegacyForms = f.store(
  async (): Promise<RA<FormEntry>> =>
    Promise.all([
      ajax<Element>(url, {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { Accept: 'text/xml' },
      }),
      fetchSchema,
    ])
      .then(async ([{ data }]) =>
        Promise.all(
          xmlToSpec(data, dataEntryItems()).items.map(
            async ({ viewName, ...rest }) => {
              if (viewName === undefined) return undefined;
              const table = await resolveTable(viewName);
              return table === undefined
                ? undefined
                : {
                    ...rest,
                    table,
                  };
            }
          )
        )
      )
      .then((entries) => filterArray(entries))
);

async function resolveTable(
  viewName: string
): Promise<SpecifyModel | undefined> {
  const model = getModel(viewName);
  if (typeof model === 'object') return model;
  const form = await fetchView(viewName);
  return typeof form === 'object'
    ? getModel(parseJavaClassName(form.class))
    : undefined;
}

export const exportsForTests = {
  fetchLegacyForms,
};
