import React from 'react';
import type { State } from 'typesafe-reducer';

import { useAsyncState } from '../../hooks/useAsyncState';
import { ajax } from '../../utils/ajax';
import type { IR, RA } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';
import { formatNumber } from '../Atoms/Internationalization';
import { serializeResource } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import { schema } from '../DataModel/schema';
import type { SpQuery, SpQueryField, Tables } from '../DataModel/types';
import { makeQueryField } from '../QueryBuilder/fromTree';
import { addMissingFields } from '../DataModel/addMissingFields';
import { useBooleanState } from '../../hooks/useBooleanState';
import { FrontEndStatsResultDialog } from './ResultsDialog';
import { Button } from '../Atoms/Button';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { deserializeResource } from '../../hooks/resource';

/** Fetch statistics from the QueryBuilderAPI. */
export function useFrontEndStatsQuery(
  tableName: keyof Tables,
  fields: RA<
    Partial<SerializedResource<SpQueryField>> & { readonly path: string }
  >
): SpecifyResource<SpQuery> {
  return React.useMemo(
    () =>
      deserializeResource(
        addMissingFields('SpQuery', {
          name: 'get Stat',
          contextName: tableName,
          contextTableId: schema.models[tableName].tableId,
          countOnly: false,
          selectDistinct: false,
          fields: fields.map(({ path, ...field }, index) =>
            serializeResource(
              makeQueryField(tableName, path, { ...field, position: index })
            )
          ),
        })
      ),
    [tableName, fields]
  );
}
export function useFrontEndStat(
  query: SpecifyResource<SpQuery>
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
          body: keysToLowerCase({
            ...serializeResource(query),
            countOnly: true,
          }),
        }).then(({ data }) => formatNumber(data.count)),
      [query]
    ),
    false
  );
  return countReturn;
}

export type BackendStatsResult = {
  readonly holdings: {
    readonly familiesRepresented: number;
    readonly generaRepresented: number;
    readonly speciesRepresented: number;
  };
  readonly preparations: IR<{
    readonly lots: number;
    readonly total: number;
  }>;
  readonly localityGeography: { readonly countries: number };
  readonly typeSpecimens: IR<number>;
};

export type QueryBuildStat = State<
  'Querybuildstat',
  {
    readonly tableName: keyof Tables;
    readonly fields: RA<
      Partial<SerializedResource<SpQueryField>> & { readonly path: string }
    >;
  }
>;

export type BackendStat = State<
  'Backendstat',
  { readonly value: number | string | undefined }
>;

export type StatItemSpec = BackendStat | QueryBuildStat;

export function FrontEndStatsResult({
  statValue,
  query,
  statLabel,
}: {
  readonly statValue: string | undefined;
  readonly query: SpecifyResource<SpQuery>;
  readonly statLabel: string;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.LikeLink onClick={handleOpen}>{statValue}</Button.LikeLink>
      {isOpen && (
        <FrontEndStatsResultDialog
          query={query}
          onClose={handleClose}
          statLabel={statLabel}
        />
      )}
    </>
  );
}
