import { commonText } from '../../localization/common';
import { whitespaceSensitive } from '../../localization/utils';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import type { RA, Writable, WritableArray } from '../../utils/types';
import { capitalize, mappedFind, toLowerCase } from '../../utils/utils';
import type { Tables } from '../DataModel/types';
import { raise, softFail } from '../Errors/Crash';
import { pathStartsWith } from '../WbPlanView/helpers';
import type { MappingPath } from '../WbPlanView/Mapper';
import {
  formatToManyIndex,
  formatTreeRank,
} from '../WbPlanView/mappingHelpers';
import type { WbMeta } from './CellMeta';
import type { UploadResult } from './resultsParser';
import { resolveValidationMessage } from './resultsParser';
import type { WbView } from './WbView';

/* eslint-disable functional/no-this-expression */
export class WbValidation {
  // eslint-disable-next-line functional/prefer-readonly-type
  public liveValidationStack: WritableArray<number> = [];

  // eslint-disable-next-line functional/prefer-readonly-type
  private liveValidationActive: boolean = false;

  // eslint-disable-next-line functional/prefer-readonly-type
  public validationMode: 'live' | 'off' | 'static';

  // eslint-disable-next-line functional/prefer-readonly-type
  public uploadResults: {
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
  } = {
    ambiguousMatches: [],
    recordCounts: {},
    newRecords: [],
  };

  public constructor(private readonly wbView: WbView) {
    this.stopLiveValidation();
    this.validationMode =
      this.wbView.dataset.rowresults === null ? 'off' : 'static';
  }

  toggleDataCheck(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (this.wbView.hot === undefined || target === null) return;

    this.validationMode =
      this.validationMode === 'live' ||
      (this.wbView.mappings?.lines ?? []).length === 0
        ? 'off'
        : 'live';

    this.uploadResults = {
      ambiguousMatches: [],
      recordCounts: {},
      newRecords: [],
    };
    this.wbView.cells.cellMeta = [];

    switch (this.validationMode) {
      case 'live': {
        this.liveValidationStack = Array.from(
          { length: this.wbView.hot.countRows() },
          (_, visualRow) => this.wbView.hot!.toPhysicalRow(visualRow)
        ).reverse();
        this.triggerLiveValidation();
        this.wbView.wbUtils.toggleCellTypes('newCells', 'remove');
        this.wbView.wbUtils.toggleCellTypes('invalidCells', 'remove');
        target.toggleAttribute('aria-pressed', true);
        break;
      }
      case 'off': {
        this.liveValidationStack = [];
        this.liveValidationActive = false;
        target.toggleAttribute('aria-pressed', false);
        break;
      }
    }

    this.wbView.hot.render();
    this.updateValidationButton();
  }

  public startValidateRow(physicalRow: number): void {
    if (this.validationMode !== 'live') return;
    this.liveValidationStack = this.liveValidationStack
      .filter((row) => row !== physicalRow)
      .concat(physicalRow);
    this.triggerLiveValidation();
  }

  triggerLiveValidation() {
    const pumpValidation = (): void => {
      this.updateValidationButton();
      if (this.liveValidationStack.length === 0) {
        this.liveValidationActive = false;
        return;
      }
      this.liveValidationActive = true;
      const physicalRow = this.liveValidationStack.pop();
      if (physicalRow === undefined || this.wbView.hot === undefined) return;
      const rowData = this.wbView.hot.getSourceDataAtRow(physicalRow);
      ajax<{
        readonly result: UploadResult;
      } | null>(`/api/workbench/validate_row/${this.wbView.dataset.id}/`, {
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
      pumpValidation();
    }
  }

  updateValidationButton(): void {
    this.wbView.el.querySelector('.wb-data-check')!.textContent =
      this.validationMode === 'live'
        ? this.liveValidationStack.length > 0
          ? commonText.countLine({
              resource: wbText.dataCheckOn(),
              count: this.liveValidationStack.length,
            })
          : wbText.dataCheckOn()
        : wbText.dataCheck();
  }

  gotRowValidationResult(physicalRow: number, result: UploadResult): void {
    if (
      this.validationMode !== 'live' ||
      this.wbView.hot?.isDestroyed !== false
    )
      return;
    this.uploadResults.ambiguousMatches[physicalRow] = [];
    this.wbView.hot.batch(() =>
      this.applyRowValidationResults(physicalRow, result)
    );
    this.wbView.cells.updateCellInfoStats().catch(softFail);
  }

  getHeadersFromMappingPath(
    mappingPathFilter: RA<string>,
    tryBest = true
  ): RA<string> {
    if (this.wbView.mappings === undefined) return [];
    if (!tryBest)
      // Find all columns with the shared parent mapping path
      return this.wbView.mappings.lines
        .filter(({ mappingPath }) =>
          pathStartsWith(mappingPath, mappingPathFilter)
        )
        .map(({ headerName }) => headerName);
    return (
      mappedFind(mappingPathFilter, (_, index) => {
        const columns = this.wbView
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

  resolveValidationColumns(
    initialColumns: RA<string>,
    inferColumnsCallback: (() => RA<string>) | undefined = undefined
  ) {
    // See https://github.com/specify/specify7/issues/810
    let columns: RA<string> = initialColumns.filter(Boolean);
    if (typeof inferColumnsCallback === 'function') {
      if (columns.length === 0) columns = inferColumnsCallback();
      if (columns.length === 0) columns = this.wbView.dataset.columns;
    }
    // Convert to physicalCol and filter out unknown columns
    return columns
      .map((column) => this.wbView.dataset.columns.indexOf(column))
      .filter((physicalCol) => physicalCol !== -1);
  }

  applyRowValidationResults(physicalRow: number, result: UploadResult) {
    const rowMeta: WritableArray<Partial<Writable<WbMeta>>> =
      this.wbView.dataset.columns.map(() => ({
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
        this.wbView.cells.updateCellMeta(physicalRow, physicalCol, key, value)
      );
    });
  }

  parseRowValidationResults(
    result: UploadResult,
    setMetaCallback: <KEY extends keyof WbMeta>(
      key: KEY,
      value: KEY extends 'issues' ? string : WbMeta[KEY],
      columns: RA<string>,
      inferColumnsCallback: (() => RA<string>) | undefined
    ) => void,
    physicalRow: number,
    initialMappingPath: MappingPath | undefined = []
  ) {
    const uploadResult = result.UploadResult;
    const uploadStatus = Object.keys(uploadResult.record_result)[0];
    const statusData = uploadResult.record_result[uploadStatus];
    const data = uploadResult.record_result;

    const isTree = 'info' in statusData && statusData.info?.treeInfo !== null;
    const mappingPath = isTree
      ? [...initialMappingPath, formatTreeRank(statusData.info.treeInfo.rank)]
      : initialMappingPath;

    const resolveColumns = this.getHeadersFromMappingPath.bind(
      this,
      mappingPath
    );

    // Ignore these statuses
    if (['NullRecord', 'PropagatedFailure', 'Matched'].includes(uploadStatus)) {
    } else if (uploadStatus === 'ParseFailures')
      data.ParseFailures.failures.forEach((line) => {
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
        data.NoMatch.info.columns,
        resolveColumns
      );
    else if (uploadStatus === 'FailedBusinessRule')
      setMetaCallback(
        'issues',
        whitespaceSensitive(
          resolveValidationMessage(
            data.FailedBusinessRule.message,
            data.FailedBusinessRule.payload ?? {}
          )
        ),
        data.FailedBusinessRule.info.columns,
        resolveColumns
      );
    else if (uploadStatus === 'MatchedMultiple') {
      this.uploadResults.ambiguousMatches[physicalRow] ??= [];
      this.uploadResults.ambiguousMatches[physicalRow].push({
        physicalCols: this.resolveValidationColumns(
          data.MatchedMultiple.info.columns,
          resolveColumns
        ),
        mappingPath,
        ids: data.MatchedMultiple.ids,
        key: data.MatchedMultiple.key,
      });
      setMetaCallback(
        'issues',
        whitespaceSensitive(wbText.matchedMultipleErrorMessage()),
        data.MatchedMultiple.info.columns,
        resolveColumns
      );
    } else if (uploadStatus === 'Uploaded') {
      setMetaCallback('isNew', true, data.Uploaded.info.columns, undefined);
      const tableName = toLowerCase(data.Uploaded.info.tableName);
      this.uploadResults.recordCounts[tableName] ??= 0;
      this.uploadResults.recordCounts[tableName]! += 1;
      this.uploadResults.newRecords[physicalRow] ??= [];
      this.resolveValidationColumns(data.Uploaded.info.columns, undefined).map(
        (physicalCol) => {
          this.uploadResults.newRecords[physicalRow]![physicalCol] ??= [];
          this.uploadResults.newRecords[physicalRow]![physicalCol].push([
            tableName,
            data.Uploaded.id,
            data.Uploaded.info?.treeInfo
              ? `${data.Uploaded.info.treeInfo.name} (${data.Uploaded.info.treeInfo.rank})`
              : '',
          ]);
        }
      );
    } else
      raise(
        new Error(
          `Trying to parse unknown uploadStatus type "${uploadStatus}" at
        row ${this.wbView.hot?.toVisualRow(physicalRow) ?? ''}`
        )
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

  getValidationResults(): void {
    if (this.wbView.actions.status !== undefined || !this.wbView.mappings)
      return;

    if (this.wbView.dataset.rowresults === null) {
      this.validationMode = 'off';
      this.updateValidationButton();
      return;
    }

    this.wbView.dataset.rowresults.forEach((result, physicalRow) => {
      this.applyRowValidationResults(physicalRow, result);
    });

    void this.wbView.cells.updateCellInfoStats();
  }

  stopLiveValidation(): void {
    this.liveValidationStack = [];
    this.liveValidationActive = false;
    this.validationMode = 'off';
  }
}

/* eslint-enable functional/no-this-expression */
