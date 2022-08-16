/**
 * Workbench Plan Mapper root component
 *
 * @module
 */

import React from 'react';
import type { State } from 'typesafe-reducer';

import type { Tables } from '../datamodel';
import type { IR, RA } from '../types';
import type { UploadPlan } from '../uploadplanparser';
import {
  getLinesFromHeaders,
  getLinesFromUploadPlan,
} from '../wbplanviewlinesgetter';
import { goBack, savePlan } from '../wbplanviewutils';
import type { UploadResult } from '../wbuploadedparser';
import { useLiveState, useTitle } from './hooks';
import { ProtectedAction } from './permissiondenied';
import type { MappingLine } from './wbplanviewmapper';
import { WbPlanViewMapper } from './wbplanviewmapper';
import { BaseTableSelection } from './wbplanviewstate';

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

export type WbPlanViewProps = {
  readonly uploadPlan: UploadPlan | null;
  readonly headers: RA<string>;
  readonly isReadOnly: boolean;
  readonly dataset: Dataset;
};

/**
 * Workbench Plan Mapper root component
 */
export function WbPlanView({
  dataset,
  uploadPlan,
  headers,
  isReadOnly,
}: WbPlanViewProps): JSX.Element {
  useTitle(dataset.name);

  const [state, setState] = useLiveState<
    | State<'SelectBaseTable'>
    | State<
        'MappingState',
        {
          changesMade: boolean;
          baseTableName: keyof Tables;
          lines: RA<MappingLine>;
          mustMatchPreferences: IR<boolean>;
        }
      >
  >(
    React.useCallback(
      () =>
        uploadPlan
          ? {
              type: 'MappingState',
              changesMade: false,
              ...getLinesFromUploadPlan(headers, uploadPlan),
            }
          : {
              type: 'SelectBaseTable',
            },
      [uploadPlan, headers]
    )
  );

  return state.type === 'SelectBaseTable' ? (
    <ProtectedAction resource="/workbench/dataset" action="update">
      <BaseTableSelection
        onClose={(): void => goBack(dataset.id)}
        onSelectTemplate={(uploadPlan, headers): void =>
          setState({
            type: 'MappingState',
            changesMade: true,
            ...getLinesFromUploadPlan(headers, uploadPlan),
          })
        }
        onSelected={(baseTableName): void =>
          setState({
            type: 'MappingState',
            changesMade: true,
            baseTableName,
            lines: getLinesFromHeaders({
              headers,
              runAutoMapper: true,
              baseTableName,
            }),
            mustMatchPreferences: {},
          })
        }
        headers={headers}
      />
    </ProtectedAction>
  ) : (
    <WbPlanViewMapper
      isReadOnly={isReadOnly}
      changesMade={state.changesMade}
      baseTableName={state.baseTableName}
      lines={state.lines}
      mustMatchPreferences={state.mustMatchPreferences}
      dataset={dataset}
      onChangeBaseTable={(): void =>
        setState({
          type: 'SelectBaseTable',
        })
      }
      onSave={async (lines, mustMatchPreferences): Promise<void> => {
        return savePlan({
          dataset,
          baseTableName: state.baseTableName,
          lines,
          mustMatchPreferences,
        });
      }}
    />
  );
}
