import type { RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpQuery } from '../DataModel/types';
import type { MainState } from './reducer';

export const queryBuilderResumeKind = 'query-builder';

export type QueryBuilderResumePayload = {
  readonly query: Pick<
    SerializedResource<SpQuery>,
    'countOnly' | 'searchSynonymy' | 'selectDistinct' | 'smushed'
  >;
  readonly selectedRows: RA<number>;
  readonly state: MainState;
};

export function queryBuilderFlagsFromQuery(
  query: SerializedResource<SpQuery>
): QueryBuilderResumePayload['query'] {
  return {
    countOnly: query.countOnly,
    searchSynonymy: query.searchSynonymy,
    selectDistinct: query.selectDistinct,
    smushed: query.smushed,
  };
}

export function restoreQueryBuilderState(
  baseState: MainState,
  snapshot: QueryBuilderResumePayload | undefined
): MainState {
  return snapshot === undefined ||
    snapshot.state.baseTableName !== baseState.baseTableName
    ? baseState
    : {
        ...snapshot.state,
        baseTableName: baseState.baseTableName,
      };
}

export function queryBuilderFlagsRequireSave(
  query: SerializedResource<SpQuery>,
  snapshot: QueryBuilderResumePayload | undefined
): boolean {
  if (snapshot === undefined) return false;
  const flags = queryBuilderFlagsFromQuery(query);
  return (
    flags.countOnly !== snapshot.query.countOnly ||
    flags.searchSynonymy !== snapshot.query.searchSynonymy ||
    flags.selectDistinct !== snapshot.query.selectDistinct ||
    flags.smushed !== snapshot.query.smushed
  );
}
