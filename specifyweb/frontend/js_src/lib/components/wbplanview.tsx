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
import { savePlan } from '../wbplanviewutils';
import type { UploadResult } from '../wbuploadedparser';
import { useLiveState, useTitle } from './hooks';
import { goTo } from './navigation';
import type { MappingLine } from './wbplanviewmapper';
import { WbPlanViewMapper } from './wbplanviewmapper';
import { BaseTableSelection } from './wbplanviewstate';

// General definitions
export type Status = {
  readonly uploaderstatus: {
    readonly operation: 'unuploading' | 'uploading' | 'validating';
    readonly taskid: string;
  };
} & (
  | {
      readonly taskstatus: 'FAILURE' | 'PENDING';
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
  readonly visualorder: RA<number> | null;
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
    State<
        'MappingState',
        {
          readonly changesMade: boolean;
          readonly baseTableName: keyof Tables;
          readonly lines: RA<MappingLine>;
          readonly mustMatchPreferences: IR<boolean>;
        }
      > | State<'SelectBaseTable'>
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
    <BaseTableSelection
      headers={headers}
      onClose={(): void => goTo(`/workbench/${dataset.id}/`)}
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
      onSelectTemplate={(uploadPlan, headers): void =>
        setState({
          type: 'MappingState',
          changesMade: true,
          ...getLinesFromUploadPlan(headers, uploadPlan),
        })
      }
    />
  ) : (
    <WbPlanViewMapper
      baseTableName={state.baseTableName}
      changesMade={state.changesMade}
      dataset={dataset}
      isReadOnly={isReadOnly}
      lines={state.lines}
      mustMatchPreferences={state.mustMatchPreferences}
      onChangeBaseTable={(): void =>
        setState({
          type: 'SelectBaseTable',
        })
      }
      onSave={async (lines, mustMatchPreferences): Promise<void> =>
        savePlan({
          dataset,
          baseTableName: state.baseTableName,
          lines,
          mustMatchPreferences,
        }).then(() => goTo(`/workbench/${dataset.id}/`))
      }
    />
  );
}
