/**
 * Workbench Plan Mapper root component
 *
 * @module
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { useErrorContext } from '../../hooks/useErrorContext';
import { useLiveState } from '../../hooks/useLiveState';
import type { IR, RA } from '../../utils/types';
import type { Tables } from '../DataModel/types';
import { useTitle } from '../Molecules/AppTitle';
import { ProtectedAction } from '../Permissions/PermissionDenied';
import type { UploadResult } from '../WorkBench/resultsParser';
import { savePlan } from './helpers';
import { getLinesFromHeaders, getLinesFromUploadPlan } from './linesGetter';
import type { MappingLine, ReadonlySpec } from './Mapper';
import { Mapper } from './Mapper';
import { BaseTableSelection } from './State';
import type { UploadPlan } from './uploadPlanParser';

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

export type DatasetBriefBase = {
  readonly id: number;
  readonly name: LocalizedString;
  readonly timestampcreated: string;
  readonly timestampmodified: string;
};

export type DatasetBriefPlan = DatasetBrief & {
  readonly uploadplan: UploadPlan | null;
};

export type DatasetBase = DatasetBriefBase & {
  readonly createdbyagent: string;
  readonly importedfilename: string;
  readonly modifiedbyagent: string | null;
  readonly remarks: string;
};

export type DatasetBrief = DatasetBriefBase & {
  readonly uploadresult: {
    readonly success: boolean;
    readonly timestamp: string;
    readonly recordsetid: number;
  } | null;
  readonly uploaderstatus: Status | null;
};

export type Dataset = DatasetBase &
  DatasetBrief & {
    readonly columns: RA<string>;
    readonly rowresults: RA<UploadResult> | null;
    readonly rows: RA<RA<string>>;
    readonly uploadplan: UploadPlan | null;
    readonly visualorder: RA<number> | null;
    readonly isupdate: boolean
  };

/**
 * Workbench Plan Mapper root component
 */
export function WbPlanView({
  dataset,
  uploadPlan,
  headers,
  readonlySpec
}: {
  readonly uploadPlan: UploadPlan | null;
  readonly headers: RA<string>;
  readonly dataset: Dataset;
  readonly readonlySpec?: ReadonlySpec
  }): JSX.Element {
  useTitle(dataset.name);

  const [state, setState] = useLiveState<
    | State<
        'MappingState',
        {
          readonly changesMade: boolean;
          readonly baseTableName: keyof Tables;
          readonly lines: RA<MappingLine>;
          readonly mustMatchPreferences: IR<boolean>;
        }
      >
    | State<'SelectBaseTable'>
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
  useErrorContext('state', state);

  const navigate = useNavigate();
  return state.type === 'SelectBaseTable' ? (
    <ProtectedAction action="update" resource="/workbench/dataset">
      <BaseTableSelection
        headers={headers}
        onClose={(): void => navigate(`/specify/workbench/${dataset.id}/`)}
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
    </ProtectedAction>
  ) : (
    <Mapper
      baseTableName={state.baseTableName}
      changesMade={state.changesMade}
      dataset={dataset}
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
        }).then(() => navigate(`/specify/workbench/${dataset.id}/`))
      }
      readonlySpec={readonlySpec}
    />
  );
}
