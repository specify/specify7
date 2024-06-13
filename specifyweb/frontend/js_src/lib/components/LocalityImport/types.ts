import type { State } from 'typesafe-reducer';

import type { IR, RA } from '../../utils/types';
import type { Tables } from '../DataModel/types';

export type LocalityImportHeader = Exclude<
  Lowercase<
    | keyof Tables['GeoCoordDetail']['fields']
    | keyof Tables['Locality']['fields']
  >,
  'locality'
>;

export type LocalityImportParseError = {
  readonly message: string;
  readonly field: string;
  readonly payload: IR<unknown>;
  readonly rowNumber: number;
};

export type LocalityImportTaskStatus =
  | 'ABORTED'
  | 'FAILED'
  | 'PARSED'
  | 'PARSING'
  | 'PENDING'
  | 'PROGRESS'
  | 'SUCCEEDED';

export type LocalityImportState =
  | State<
      'ABORTED',
      { readonly taskstatus: 'ABORTED'; readonly taskinfo: string }
    >
  | State<
      'FAILED',
      {
        readonly taskstatus: 'FAILED';
        readonly taskinfo: {
          readonly errors: RA<LocalityImportParseError>;
        };
      }
    >
  | State<
      'PARSED',
      {
        readonly taskstatus: 'PARSED';
        readonly taskinfo: {
          readonly localities: number;
          readonly geocoorddetails: number;
        };
      }
    >
  | State<
      'PARSING',
      {
        readonly taskstatus: 'PARSING';
        readonly taskinfo: {
          readonly current: number;
          readonly total: number;
        };
      }
    >
  | State<
      'PENDING',
      { readonly taskstatus: 'PENDING'; readonly taskinfo: 'None' }
    >
  | State<
      'PROGRESS',
      {
        readonly taskstatus: 'PROGRESS';
        readonly taskinfo: {
          readonly current: number;
          readonly total: number;
        };
      }
    >
  | State<
      'SUCCEEDED',
      {
        readonly taskstatus: 'SUCCEEDED';
        readonly taskinfo: {
          readonly recordsetid: number;
          readonly localities: RA<number>;
          readonly geocoorddetails: RA<number>;
        };
      }
    >;
