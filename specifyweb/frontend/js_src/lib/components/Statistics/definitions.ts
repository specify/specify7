import { State } from 'typesafe-reducer';
import { statsSpec } from '../Statistics/StatsSpec';
import { IR, RA } from '../../utils/types';
import { statsText } from '../../localization/stats';

type CustomStat = State<
  'CustomStat',
  {
    readonly queryId: number;
  }
>;
type DefaultStat = State<
  'DefaultStat',
  {
    readonly categoryName: keyof typeof statsSpec;
    readonly itemName: string;
  }
>;

export type StatLayout = IR<IR<RA<CustomStat | DefaultStat>>>;

export const defaultStatLayout: StatLayout = {
  collection: {
    [statsText('holdings')]: [
      {
        type: 'DefaultStat',
        categoryName: 'holdings',
        itemName: 'specimens',
      },
      {
        type: 'CustomStat',
        queryId: 45,
      },
    ],
  },
};
