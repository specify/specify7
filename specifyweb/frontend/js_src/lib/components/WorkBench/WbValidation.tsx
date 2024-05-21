import { whitespaceSensitive } from '../../localization/utils';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import type { RA, Writable, WritableArray } from '../../utils/types';
import { capitalize, mappedFind, toLowerCase } from '../../utils/utils';
import type { Tables } from '../DataModel/types';
import { raise } from '../Errors/Crash';
import { pathStartsWith } from '../WbPlanView/helpers';
import type { MappingPath } from '../WbPlanView/Mapper';
import {
  formatToManyIndex,
  formatTreeRank,
} from '../WbPlanView/mappingHelpers';
import type { WbMeta } from './CellMeta';
import type { UploadResult } from './resultsParser';
import { resolveValidationMessage } from './resultsParser';
import type { Workbench } from './WbView';

type UploadResults = {
  readonly ambiguousMatches: WritableArray<
    WritableArray<{
      readonly physicalCols: RA<number>;
      readonly mappingPath: MappingPath;
      readonly ids: RA<number>;
      readonly key: string;
    }>
  >;
  readonly recordCounts: Partial<Record<Lowercase<keyof Tables>, number>>;
  readonly newRecords: Partial<
    WritableArray<
      WritableArray<
        WritableArray<
          Readonly<
            readonly [
              tableName: Lowercase<keyof Tables>,
              id: number,
              alternativeLabel: string | ''
            ]
          >
        >
      >
    >
  >;
};

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
    newRecords: [],
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
      newRecords: [],
    };
    this.workbench.cells.cellMeta = [];

    switch (this.validationMode) {
      case 'live': {
        this.liveValidationStack = Array.from(
          { length: this.workbench.hot.countRows() },
          (_, visualRow) => this.workbench.hot!.toPhysicalRow(visualRow)
        ).reverse();
        this.triggerLiveValidation();
        this.workbench.utils?.toggleCellTypes('newCells', 'remove');
        this.workbench.utils?.toggleCellTypes('invalidCells', 'remove');
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
    // See https://github.com/specify/specify7/issues/810
    let columns: RA<string> = initialColumns.filter(Boolean);
    if (typeof inferColumnsCallback === 'function') {
      if (columns.length === 0) columns = inferColumnsCallback();
      if (columns.length === 0) columns = this.workbench.dataset.columns;
    }
    // Convert to physicalCol and filter out unknown columns
    return columns
      .map((column) => this.workbench.dataset.columns.indexOf(column))
      .filter((physicalCol) => physicalCol !== -1);
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
    uploadStatus: keyof UploadResult['UploadResult']['record_result'],
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
    if (['NullRecord', 'PropagatedFailure', 'Matched'].includes(uploadStatus)) {
    } else if (uploadStatus === 'ParseFailures')
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
    else if (uploadStatus === 'NoMatch')
      setMetaCallback(
        'issues',
        wbText.noMatchErrorMessage(),
        recordResult.NoMatch.info.columns,
        resolveColumns
      );
    else if (uploadStatus === 'FailedBusinessRule')
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
    else if (uploadStatus === 'MatchedMultiple') {
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
    } else if (uploadStatus === 'Uploaded') {
      setMetaCallback(
        'isNew',
        true,
        recordResult.Uploaded.info.columns,
        undefined
      );
      const tableName = toLowerCase(recordResult.Uploaded.info.tableName);
      this.uploadResults.recordCounts[tableName] ??= 0;
      this.uploadResults.recordCounts[tableName]! += 1;
      this.uploadResults.newRecords[physicalRow] ??= [];
      this.resolveValidationColumns(
        recordResult.Uploaded.info.columns,
        undefined
      ).forEach((physicalCol) => {
        this.uploadResults.newRecords[physicalRow]![physicalCol] ??= [];
        this.uploadResults.newRecords[physicalRow]![physicalCol].push([
          tableName,
          recordResult.Uploaded.id,
          recordResult.Uploaded.info?.treeInfo
            ? `${recordResult.Uploaded.info.treeInfo.name} (${recordResult.Uploaded.info.treeInfo.rank})`
            : '',
        ]);
      });
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
    const uploadStatus = Object.keys(uploadResult.record_result)[0];
    const statusData = uploadResult.record_result[uploadStatus];

    const isTree = 'info' in statusData && statusData.info?.treeInfo !== null;
    const mappingPath = isTree
      ? [...initialMappingPath, formatTreeRank(statusData.info.treeInfo.rank)]
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
