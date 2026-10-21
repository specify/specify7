import { whitespaceSensitive } from '../../localization/utils';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import type { RA, Writable, WritableArray } from '../../utils/types';
import { capitalize, mappedFind } from '../../utils/utils';
import type { Tables } from '../DataModel/types';
import { raise } from '../Errors/Crash';
import { pathStartsWith } from '../WbPlanView/helpers';
import type { MappingPath } from '../WbPlanView/Mapper';
import {
  formatToManyIndex,
  formatTreeRank,
} from '../WbPlanView/mappingHelpers';
import { ATTACHMENTS_COLUMN } from './attachmentHelpers';
import type { WbCellCounts, WbMeta } from './CellMeta';
import type { UploadResult } from './resultsParser';
import {
  resolveAttachmentValidationMessage,
  resolveValidationMessage,
} from './resultsParser';
import type { Workbench } from './WbView';

type Records = WritableArray<
  WritableArray<
    WritableArray<
      Readonly<
        readonly [
          tableName: Lowercase<keyof Tables>,
          id: number,
          alternativeLabel: string | '',
        ]
      >
    >
  >
>;

// Just to make things manageable
type RecordCountsKey = 'Deleted' | 'MatchedAndChanged' | 'Updated' | 'Uploaded';

export type RecordCounts = Partial<
  Record<RecordCountsKey, Partial<Record<Lowercase<keyof Tables>, number>>>
>;

export const RecordCountPriority: RA<RecordCountsKey> = [
  'Updated',
  'Uploaded',
  'MatchedAndChanged',
  'Deleted',
];

type UploadResults = {
  readonly ambiguousMatches: WritableArray<
    WritableArray<{
      readonly physicalCols: RA<number>;
      readonly mappingPath: MappingPath;
      readonly ids: RA<number>;
      readonly key: string;
    }>
  >;
  readonly recordCounts: RecordCounts;
  // Updated + MatchedAndChanged + New
  readonly interestingRecords: Records;
};

type KeysOfUnion<T> = T extends unknown ? keyof T : never;

type UploadStatus = Extract<
  KeysOfUnion<UploadResult['UploadResult']['record_result']>,
  string
>;

const getRecordResultEntry = (
  recordResult: UploadResult['UploadResult']['record_result']
): readonly [UploadStatus, unknown] | undefined =>
  Object.entries(recordResult)[0] as [UploadStatus, unknown] | undefined;

const hasUploadInfo = (
  value: unknown
): value is {
  readonly info: {
    readonly treeInfo: {
      readonly rank: string;
      readonly name: string;
    } | null;
  };
} => typeof value === 'object' && value !== null && 'info' in value;

/* eslint-disable functional/no-this-expression */
export class WbValidation {
  // eslint-disable-next-line functional/prefer-readonly-type
  public liveValidationStack: WritableArray<number> = [];

  // eslint-disable-next-line functional/prefer-readonly-type
  private liveValidationActive: boolean = false;

  // eslint-disable-next-line functional/prefer-readonly-type
  public validationMode: 'live' | 'off' | 'static';

  // eslint-disable-next-line functional/prefer-readonly-type
  public uploadResults: UploadResults = {
    ambiguousMatches: [],
    recordCounts: {},
    interestingRecords: [],
  };

  public constructor(private readonly workbench: Workbench) {
    this.stopLiveValidation();
    this.validationMode =
      this.workbench.dataset.rowresults === null ? 'off' : 'static';
  }

  public toggleDataCheck(): void {
    if (!this.workbench?.hot) return;
    this.validationMode =
      this.validationMode === 'live' ||
      (this.workbench.mappings?.lines ?? []).length === 0
        ? 'off'
        : 'live';

    this.uploadResults = {
      ambiguousMatches: [],
      recordCounts: {},
      interestingRecords: [],
    };
    this.workbench.cells.cellMeta = [];

    switch (this.validationMode) {
      case 'live': {
        this.liveValidationStack = Array.from(
          { length: this.workbench.hot.countRows() },
          (_, visualRow) => this.workbench.hot!.toPhysicalRow(visualRow)
        ).reverse();
        this.triggerLiveValidation();
        const toRemove: RA<keyof WbCellCounts> = [
          'newCells',
          'updatedCells',
          'deletedCells',
          'matchedAndChangedCells',
        ];
        toRemove.forEach((key) =>
          this.workbench.utils?.toggleCellTypes(key, 'remove')
        );
        break;
      }
      case 'off': {
        this.liveValidationStack = [];
        this.liveValidationActive = false;
        break;
      }
    }

    this.workbench.hot.render();
  }

  public startValidateRow(physicalRow: number): void {
    if (this.validationMode !== 'live') return;
    this.liveValidationStack = this.liveValidationStack
      .filter((row) => row !== physicalRow)
      .concat(physicalRow);
    this.triggerLiveValidation();
  }

  private async triggerLiveValidation(): Promise<void> {
    const pumpValidation = async (): Promise<void> => {
      if (this.liveValidationStack.length === 0) {
        this.liveValidationActive = false;
        return;
      }
      this.liveValidationActive = true;
      const physicalRow = this.liveValidationStack.pop();
      if (physicalRow === undefined || this.workbench.hot === undefined) return;
      const rowData = this.workbench.hot.getSourceDataAtRow(physicalRow);
      await ajax<{
        readonly result: UploadResult;
      } | null>(`/api/workbench/validate_row/${this.workbench.dataset.id}/`, {
        method: 'POST',
        body: rowData,
        headers: { Accept: 'application/json' },
      })
        .then(({ data: result }) => {
          const uploads = result?.result;
          if (typeof uploads === 'object' && uploads !== null)
            this.gotRowValidationResult(physicalRow, uploads);
        })
        .then(pumpValidation);
    };

    if (!this.liveValidationActive) {
      return pumpValidation();
    }
  }

  private gotRowValidationResult(
    physicalRow: number,
    result: UploadResult
  ): void {
    if (
      this.validationMode !== 'live' ||
      this.workbench.hot?.isDestroyed !== false
    )
      return;
    this.uploadResults.ambiguousMatches[physicalRow] = [];
    this.workbench.hot.batch(() =>
      this.applyRowValidationResults(physicalRow, result)
    );
    this.workbench.cells?.updateCellInfoStats();
  }

  private getHeadersFromMappingPath(
    mappingPathFilter: RA<string>,
    tryBest = true
  ): RA<string> {
    if (this.workbench.mappings === undefined) return [];
    if (!tryBest)
      // Find all columns with the shared parent mapping path
      return this.workbench.mappings.lines
        .filter(({ mappingPath }) =>
          pathStartsWith(mappingPath, mappingPathFilter)
        )
        .map(({ headerName }) => headerName);
    return (
      mappedFind(mappingPathFilter, (_, index) => {
        const columns = this.workbench
          .mappings!.lines.filter(({ mappingPath }) =>
            pathStartsWith(
              mappingPath,
              mappingPathFilter.slice(0, index === 0 ? undefined : -1 * index)
            )
          )
          .map(({ headerName }) => headerName);
        return columns.length > 0 ? columns : undefined;
      }) ?? []
    );
  }

  private resolveValidationColumns(
    initialColumns: RA<string>,
    inferColumnsCallback: (() => RA<string>) | undefined = undefined
  ): RA<number> {
    const resolvePhysicalColumns = (columns: RA<string>): RA<number> =>
      columns
        .map((column) => this.workbench.dataset.columns.indexOf(column))
        .filter((physicalCol) => physicalCol !== -1);

    const normalizeColumns = (columns: RA<string>): RA<string> =>
      columns.map((column) =>
        column.startsWith('_ATTACHMENT_') &&
        this.workbench.dataset.columns.includes(ATTACHMENTS_COLUMN)
          ? ATTACHMENTS_COLUMN
          : column
      );

    // See https://github.com/specify/specify7/issues/810
    let columns: RA<string> = normalizeColumns(initialColumns.filter(Boolean));
    let physicalColumns = resolvePhysicalColumns(columns);

    if (
      typeof inferColumnsCallback === 'function' &&
      physicalColumns.length === 0
    ) {
      columns = normalizeColumns(inferColumnsCallback());
      physicalColumns = resolvePhysicalColumns(columns);
      if (physicalColumns.length === 0)
        physicalColumns = resolvePhysicalColumns(
          this.workbench.dataset.columns
        );
    }

    return physicalColumns;
  }

  private applyRowValidationResults(
    physicalRow: number,
    result: UploadResult
  ): void {
    const rowMeta: WritableArray<Partial<Writable<WbMeta>>> =
      this.workbench.dataset.columns.map(() => ({
        isNew: false,
        issues: [],
      }));

    const setMeta = <KEY extends keyof WbMeta>(
      key: KEY,
      value: KEY extends 'issues' ? string : WbMeta[KEY],
      columns: RA<string>,
      inferColumnsCallback: (() => RA<string>) | undefined
    ): void =>
      this.resolveValidationColumns(columns, inferColumnsCallback).forEach(
        (physicalCol) => {
          if (key === 'issues')
            (rowMeta[physicalCol][key] as WritableArray<string>).push(
              capitalize(value as string)
            );
          else rowMeta[physicalCol][key as 'isNew'] = value as boolean;
        }
      );

    this.parseRowValidationResults(result, setMeta, physicalRow);

    rowMeta.forEach((cellMeta, physicalCol) => {
      // To make errors discovered by live validation visible, isModified must be unset
      if (cellMeta.issues?.length !== 0 && this.validationMode === 'live')
        cellMeta.isModified = false;
      Object.entries(cellMeta).map(([key, value]) =>
        this.workbench.cells?.updateCellMeta(
          physicalRow,
          physicalCol,
          key,
          value
        )
      );
    });
  }

  private resolveUploadStatus(
    uploadStatus: UploadStatus,
    recordResult: UploadResult['UploadResult']['record_result'],
    physicalRow: number,
    mappingPath: MappingPath,
    setMetaCallback: <KEY extends keyof WbMeta>(
      key: KEY,
      value: KEY extends 'issues' ? string : WbMeta[KEY],
      columns: RA<string>,
      inferColumnsCallback: (() => RA<string>) | undefined
    ) => void
  ): void {
    const resolveColumns = this.getHeadersFromMappingPath.bind(
      this,
      mappingPath
    );

    // Ignore these statuses
    if (
      ['NullRecord', 'PropagatedFailure', 'Matched', 'NoChange'].includes(
        uploadStatus
      )
    ) {
    } else if ('ParseFailures' in recordResult)
      recordResult.ParseFailures.failures.forEach((line) => {
        const [issueMessage, payload, column] =
          line.length === 2 ? [line[0], {}, line[1]] : line;
        setMetaCallback(
          'issues',
          whitespaceSensitive(
            resolveValidationMessage(issueMessage, payload ?? {})
          ),
          [column],
          resolveColumns
        );
      });
    else if ('NoMatch' in recordResult)
      setMetaCallback(
        'issues',
        wbText.noMatchErrorMessage(),
        recordResult.NoMatch.info.columns,
        resolveColumns
      );
    else if ('FailedBusinessRule' in recordResult)
      setMetaCallback(
        'issues',
        whitespaceSensitive(
          resolveValidationMessage(
            recordResult.FailedBusinessRule.message,
            recordResult.FailedBusinessRule.payload ?? {}
          )
        ),
        recordResult.FailedBusinessRule.info.columns,
        resolveColumns
      );
    else if ('MatchedMultiple' in recordResult) {
      this.uploadResults.ambiguousMatches[physicalRow] ??= [];
      this.uploadResults.ambiguousMatches[physicalRow].push({
        physicalCols: this.resolveValidationColumns(
          recordResult.MatchedMultiple.info.columns,
          resolveColumns
        ),
        mappingPath,
        ids: recordResult.MatchedMultiple.ids,
        key: recordResult.MatchedMultiple.key,
      });
      setMetaCallback(
        'issues',
        whitespaceSensitive(wbText.matchedMultipleErrorMessage()),
        recordResult.MatchedMultiple.info.columns,
        resolveColumns
      );
    } else if ('AttachmentFailure' in recordResult)
      setMetaCallback(
        'issues',
        whitespaceSensitive(
          resolveAttachmentValidationMessage(
            recordResult.AttachmentFailure.message
          )
        ),
        recordResult.AttachmentFailure.info.columns,
        resolveColumns
      );
    // TODO: Discuss if MatchedAndChanged needs to shown. or whatever.
    else if (
      'Uploaded' in recordResult ||
      'Updated' in recordResult ||
      'MatchedAndChanged' in recordResult ||
      'Deleted' in recordResult
    ) {
      const [statusKey, statusData, metaKey] =
        'Uploaded' in recordResult
          ? (['Uploaded', recordResult.Uploaded, 'isNew'] as const)
          : 'Updated' in recordResult
            ? (['Updated', recordResult.Updated, 'isUpdated'] as const)
            : 'MatchedAndChanged' in recordResult
              ? ([
                  'MatchedAndChanged',
                  recordResult.MatchedAndChanged,
                  'isMatchedAndChanged',
                ] as const)
              : (['Deleted', recordResult.Deleted, 'isDeleted'] as const);

      setMetaCallback(metaKey, true, statusData.info.columns, undefined);

      const tableName = statusData.info.tableName.toLowerCase() as Lowercase<
        keyof Tables
      >;
      this.uploadResults.recordCounts[statusKey] ??= {};
      this.uploadResults.recordCounts[statusKey]![tableName]! ??= 0;
      this.uploadResults.recordCounts[statusKey]![tableName]! += 1;

      if (statusKey === 'Deleted') return; // Not sure if there is any value in showing deleted id's itself, right?

      const writable = this.uploadResults.interestingRecords;
      writable[physicalRow] ??= [];
      this.resolveValidationColumns(statusData.info.columns, undefined).forEach(
        (physicalCol) => {
          writable[physicalRow]![physicalCol] ??= [];
          writable[physicalRow]![physicalCol].push([
            tableName,
            statusData.id,
            statusData.info?.treeInfo
              ? `${statusData.info.treeInfo!.name} (${statusData.info.treeInfo!.rank})`
              : '',
          ]);
        }
      );
    } else
      raise(
        new Error(
          `Trying to parse unknown uploadStatus type "${uploadStatus}" at
        row ${this.workbench.hot?.toVisualRow(physicalRow) ?? ''}`
        )
      );
  }

  private parseRowValidationResults(
    result: UploadResult,
    setMetaCallback: <KEY extends keyof WbMeta>(
      key: KEY,
      value: KEY extends 'issues' ? string : WbMeta[KEY],
      columns: RA<string>,
      inferColumnsCallback: (() => RA<string>) | undefined
    ) => void,
    physicalRow: number,
    initialMappingPath: MappingPath | undefined = []
  ): void {
    const uploadResult = result.UploadResult;
    const recordResultEntry = getRecordResultEntry(uploadResult.record_result);
    if (recordResultEntry === undefined) return;

    const [uploadStatus, statusData] = recordResultEntry;

    const info = hasUploadInfo(statusData) ? statusData.info : undefined;

    const isTree = info?.treeInfo !== null && info !== undefined;
    const mappingPath = isTree
      ? [...initialMappingPath, formatTreeRank(info.treeInfo!.rank)]
      : initialMappingPath;

    this.resolveUploadStatus(
      uploadStatus,
      uploadResult.record_result,
      physicalRow,
      mappingPath,
      setMetaCallback
    );

    Object.entries(uploadResult.toOne).forEach(([fieldName, uploadResult]) =>
      this.parseRowValidationResults(
        uploadResult,
        setMetaCallback,
        physicalRow,
        fieldName === 'parent' && isTree
          ? mappingPath.slice(0, -1)
          : [...mappingPath, fieldName]
      )
    );

    Object.entries(uploadResult.toMany).forEach(([fieldName, uploadResults]) =>
      uploadResults.forEach((uploadResult, toManyIndex) =>
        this.parseRowValidationResults(
          uploadResult,
          setMetaCallback,
          physicalRow,
          [...mappingPath, fieldName, formatToManyIndex(toManyIndex + 1)]
        )
      )
    );
  }

  public getValidationResults(): void {
    if (this.workbench.mappings === undefined) return;

    if (this.workbench.dataset.rowresults === null) {
      this.validationMode = 'off';
      return;
    }

    this.workbench.hot?.batch(() => {
      this.workbench.dataset.rowresults?.forEach((result, physicalRow) => {
        this.applyRowValidationResults(physicalRow, result);
      });
    });

    this.workbench.cells?.updateCellInfoStats();
  }

  public stopLiveValidation(): void {
    this.liveValidationStack = [];
    this.liveValidationActive = false;
    this.validationMode = 'off';
  }
}

/* eslint-enable functional/no-this-expression */
