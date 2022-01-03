/**
 * Workbench Plan Mapper root component
 *
 * @module
 */

import '../../css/wbplanview.css';

import React from 'react';

import type { RA } from '../types';
import type { UploadPlan } from '../uploadplantomappingstree';
import { reducer } from '../wbplanviewreducer';
import type { UploadResult } from '../wbuploadedparser';
import { stateReducer } from './wbplanviewstate';

// General definitions
export type Status = {
  readonly uploaderstatus: {
    readonly operation: 'validating' | 'uploading' | 'unuploading';
    readonly taskid: string;
  };
} & (
  | {
      readonly taskstatus: 'PENDING' | 'FAILURE';
      readonly taskinfo: 'None';
    }
  | {
      readonly taskstatus: 'PROGRESS';
      readonly taskinfo: {
        readonly total: number;
        readonly current: number;
      };
    }
);

export type DatasetBrief = {
  readonly id: number;
  readonly name: string;
  readonly uploadresult: {
    readonly success: boolean;
    readonly timestamp: string;
    readonly recordsetid: number;
  } | null;
  readonly uploaderstatus: Status | null;
  readonly timestampcreated: string;
  readonly timestampmodified: string;
};

export type Dataset = DatasetBrief & {
  readonly columns: RA<string>;
  readonly createdbyagent: string;
  readonly importedfilename: string;
  readonly modifiedbyagent: string | null;
  readonly remarks: string | null;
  readonly rowresults: RA<UploadResult> | null;
  readonly rows: RA<RA<string>>;
  readonly uploadplan: UploadPlan | null;
  readonly visualorder: null | RA<number>;
};

export type WbPlanViewProps = WbPlanViewConstructorProps & {
  readonly uploadPlan: UploadPlan | null;
  readonly headers: RA<string>;
  readonly setUnloadProtect: () => void;
  readonly removeUnloadProtect: () => void;
  readonly readonly: boolean;
};

export type WbPlanViewConstructorProps = {
  readonly dataset: Dataset;
};

/**
 * Workbench Plan Mapper root component
 */
export function WbPlanView(props: WbPlanViewProps): JSX.Element {
  const [state, dispatch] = React.useReducer(reducer, { type: 'LoadingState' });

  React.useEffect(() => {
    if (props.uploadPlan)
      dispatch({
        type: 'OpenMappingScreenAction',
        uploadPlan: props.uploadPlan,
        headers: props.headers,
        changesMade: false,
      });
    else
      dispatch({
        type: 'OpenBaseTableSelectionAction',
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return stateReducer(<i />, {
    ...state,
    props,
    dispatch,
  });
}
