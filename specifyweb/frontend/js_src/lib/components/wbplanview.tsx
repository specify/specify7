/**
 * Workbench Plan Mapper root component
 *
 * @module
 */

import '../../css/wbplanview.css';

import React from 'react';

import type { RA } from '../types';
import type { UploadPlan } from '../uploadplantomappingstree';
import type { OpenMappingScreenAction } from '../wbplanviewreducer';
import { reducer } from '../wbplanviewreducer';
import type { UploadResult } from '../wbuploadedparser';
import { useId } from './common';
import { getInitialWbPlanViewState, stateReducer } from './wbplanviewstate';

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
  id: number;
  name: string;
  uploadresult: {
    success: boolean;
    timestamp: string;
    recordsetid: number;
  } | null;
  uploaderstatus: Status | null;
  timestampcreated: string;
  timestampmodified: string;
};

export type Dataset = DatasetBrief & {
  columns: RA<string>;
  createdbyagent: string;
  importedfilename: string;
  modifiedbyagent: string;
  remarks: string | null;
  rowresults: RA<UploadResult> | null;
  rows: RA<RA<string>>;
  uploadplan: UploadPlan | null;
  visualorder: null | RA<number>;
};

// See: https://stackoverflow.com/a/30741722/8584605
export const handlePromiseReject = (error: unknown) =>
  setTimeout(() => {
    throw error;
  }, 0);

export type WbPlanViewProps = WbPlanViewWrapperProps &
  PublicWbPlanViewProps & {
    readonly uploadPlan: UploadPlan | null;
    readonly headers: RA<string>;
    readonly setUnloadProtect: () => void;
    readonly readonly: boolean;
  };

export type PartialWbPlanViewProps = {
  readonly removeUnloadProtect: () => void;
};

export type WbPlanViewWrapperProps = PartialWbPlanViewProps &
  PublicWbPlanViewProps & {
    readonly setUnloadProtect: () => void;
  };

export type PublicWbPlanViewProps = {
  dataset: Dataset;
};

/**
 * Workbench Plan Mapper root component
 */
export function WbPlanView(props: WbPlanViewProps): JSX.Element {
  const [state, dispatch] = React.useReducer(
    reducer,
    {
      uploadPlan: props.uploadPlan,
      headers: props.headers,
      changesMade: false,
    } as OpenMappingScreenAction,
    getInitialWbPlanViewState
  );

  // Set/unset unload protect
  const changesMade = 'changesMade' in state ? state.changesMade : false;
  React.useEffect(() => {
    if (!changesMade) props.removeUnloadProtect();
    else props.setUnloadProtect();
  }, [changesMade]);

  const id = useId('wbplanview');

  return stateReducer(<i />, {
    ...state,
    props,
    dispatch,
    id,
  });
}
