import type { State } from 'typesafe-reducer';

import type { IR, RA } from '../../utils/types';

type CustomStat = State<
  'CustomStat',
  {
    readonly queryId: number;
  }
>;
type DefaultStat = State<
  'DefaultStat',
  {
    readonly pageName: string;
    readonly categoryName: string;
    readonly itemName: string;
  }
>;

export type StatLayout = RA<{
  readonly label: string;
  readonly categories: RA<{
    readonly label: string;
    readonly items: RA<CustomStat | DefaultStat>;
  }>;
}>;
