import { RA } from '../../utils/types';
import { Tables } from '../DataModel/types';

export type APIDeleteBlockerPage = {
  readonly table: Lowercase<keyof Tables>;
  readonly field: string;
  readonly ids: RA<number>;
  readonly limit: number;
  readonly complete: boolean;
  readonly anchor: null | number;
  readonly backwards: boolean;
};

export type APIDeleteBlockers = {
  readonly results: RA<APIDeleteBlockerPage>;
  readonly next: RA<APIDeleteBlockerPage>;
};

export type BlockerPageCacheKey = string;
