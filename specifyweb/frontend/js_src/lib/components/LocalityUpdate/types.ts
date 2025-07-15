import type { State } from 'typesafe-reducer';

import type { IR, RA } from '../../utils/types';
import type { Tables } from '../DataModel/types';

export type LocalityUpdateHeader = Exclude<
  Lowercase<
    | keyof Tables['GeoCoordDetail']['fields']
    | keyof Tables['Locality']['fields']
  >,
  'locality'
>;

export type LocalityUpdateParseError = {
  readonly message: string;
  readonly field: string;
  readonly payload: IR<unknown>;
  readonly rowNumber: number;
};

export type LocalityUpdateTaskStatus =
  | 'ABORTED'
  | 'FAILED'
  | 'PARSE_FAILED'
  | 'PARSED'
  | 'PARSING'
  | 'PENDING'
  | 'PROGRESS'
  | 'SUCCEEDED';

export type LocalityUpdateState =
  | State<
      'ABORTED',
      { readonly taskstatus: 'ABORTED'; readonly taskinfo: string }
    >
  | State<
      'FAILED',
      {
        readonly taskstatus: 'FAILED';
        readonly taskinfo: {
          readonly error: string;
          readonly traceback: string;
        };
      }
    >
  | State<
      'PARSE_FAILED',
      {
        readonly taskstatus: 'PARSE_FAILED';
        readonly taskinfo: {
          readonly errors: RA<LocalityUpdateParseError>;
        };
      }
    >
  | State<
      'PARSED',
      {
        readonly taskstatus: 'PARSED';
        readonly taskinfo: {
          readonly rows: RA<{
            readonly locality: object;
            readonly geocoorddetail: object | null;
          }>;
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
