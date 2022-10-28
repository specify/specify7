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

export type StatLayout = IR<IR<RA<CustomStat | DefaultStat>>>;
