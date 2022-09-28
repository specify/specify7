import React from 'react';
import type { State } from 'typesafe-reducer';

import { useAsyncState } from '../../hooks/useAsyncState';
import { ajax } from '../../utils/ajax';
import type { IR, RA, RR } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';
import { formatNumber } from '../Atoms/Internationalization';
import { addMissingFields, serializeResource } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import { schema } from '../DataModel/schema';
import type { SpQueryField, Tables } from '../DataModel/types';
import { makeQueryField } from '../QueryBuilder/fromTree';

/** Fetch statistics from the QueryBuilderAPI. */
export function useStatAjaxHelper(
  tableName: keyof Tables,
  fields: RA<
    Partial<SerializedResource<SpQueryField>> & { readonly path: string }
  >
): string | undefined {
  const [countReturn] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<{
          readonly count: number;
        }>('/stored_query/ephemeral/', {
          method: 'POST',
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Accept: 'application/json',
          },
          body: keysToLowerCase(
            addMissingFields('SpQuery', {
              name: 'get Stat',
              contextName: tableName,
              contextTableId: schema.models[tableName].tableId,
              countOnly: true,
              selectDistinct: false,
              fields: fields.map(({ path, ...field }) =>
                serializeResource(makeQueryField(tableName, path, field))
              ),
            })
          ),
        }).then(({ data }) => formatNumber(data.count)),
      [tableName, fields]
    ),
    false
  );
  return countReturn;
}

export type BackendStatsResult = {
  readonly holdings: RR<
    'familiesRepresented' | 'generaRepresented' | 'speciesRepresented',
    number
  >;
  readonly preparation: IR<RR<'lots' | 'total', number>>;
  readonly localityGeography: RR<'countries', number>;
  readonly typeSpecimen: IR<number>;
};

export type QueryBuildStatType = State<
  'Querybuildstat',
  {
    readonly tableName: keyof Tables;
    readonly fields: RA<
      Partial<SerializedResource<SpQueryField>> & { readonly path: string }
    >;
  }
>;

export type BackendStatType = State<
  'Backendstat',
  { readonly value: number | string | undefined }
>;

export type Spec = BackendStatType | QueryBuildStatType;
