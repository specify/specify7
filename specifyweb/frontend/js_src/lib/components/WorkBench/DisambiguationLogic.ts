import type { IR } from '../../utils/types';
import { removeKey } from '../../utils/utils';
import type { MappingPath } from '../WbPlanView/Mapper';
import { mappingPathToString } from '../WbPlanView/mappingHelpers';
import { getSelectedLast } from './hotHelpers';
import type { Workbench } from './WbView';

/* eslint-disable functional/no-this-expression */
export class Disambiguation {
  public constructor(private readonly workbench: Workbench) {}

  public getDisambiguation(physicalRow: number): IR<number> {
    const cols = this.workbench.dataset.columns.length;
    const hiddenColumn = this.workbench.data[physicalRow][cols];
    const extra =
      typeof hiddenColumn === 'string' && hiddenColumn.length > 0
        ? JSON.parse(hiddenColumn)
        : {};
    return extra.disambiguation ?? {};
  }

  public isAmbiguousCell(): boolean {
    if (
      this.workbench.mappings === undefined ||
      this.workbench.hot === undefined
    )
      return false;

    const [visualRow, visualCol] = getSelectedLast(this.workbench.hot);
    const physicalRow = this.workbench.hot.toPhysicalRow(visualRow);
    const physicalCol = this.workbench.hot.toPhysicalColumn(visualCol);
    const disambiguation = this.getDisambiguation(physicalRow);

    return (
      this.workbench.validation?.uploadResults.ambiguousMatches[physicalRow] ??
      []
    ).some(
      ({ physicalCols, mappingPath }) =>
        physicalCols.includes(physicalCol) &&
        typeof disambiguation[mappingPathToString(mappingPath)] !== 'number'
    );
  }

  public cellWasDisambiguated(
    physicalRow: number,
    physicalCol: number
  ): boolean {
    const da = this.getDisambiguation(physicalRow);
    return Boolean(
      this.workbench.validation?.uploadResults.ambiguousMatches[
        physicalRow
      ]?.find(
        ({ physicalCols, mappingPath }) =>
          physicalCols.includes(physicalCol) &&
          typeof da[mappingPathToString(mappingPath)] === 'number'
      )
    );
  }

  private changeDisambiguation(
    physicalRow: number,
    changeFunction: (oldValue: IR<number>) => IR<number>,
    source: 'Disambiguation.Clear' | 'Disambiguation.Set'
  ): void {
    if (this.workbench.hot === undefined) return;
    const cols = this.workbench.dataset.columns.length;
    const hidden = this.workbench.data[physicalRow][cols];
    const extra = hidden ? JSON.parse(hidden) : {};
    extra.disambiguation = changeFunction(extra.disambiguation || {});
    const visualRow = this.workbench.hot.toVisualRow(physicalRow);
    const visualCol = this.workbench.hot.toVisualColumn(cols);
    this.workbench.hot.setDataAtCell(
      visualRow,
      visualCol,
      JSON.stringify(extra),
      source
    );
    this.workbench.spreadsheetChanged();
    this.afterChangeDisambiguation(physicalRow);
  }

  public afterChangeDisambiguation(physicalRow: number): void {
    (
      this.workbench.validation?.uploadResults.ambiguousMatches[physicalRow] ??
      []
    )
      .flatMap(({ physicalCols }) => physicalCols)
      .forEach((physicalCol) =>
        this.workbench.cells?.recalculateIsModifiedState(
          physicalRow,
          physicalCol
        )
      );
    this.workbench.cells?.updateCellInfoStats();
  }

  public clearDisambiguation(physicalRow: number): void {
    const disambiguation = this.getDisambiguation(physicalRow);
    if (Object.keys(disambiguation).length === 0)
      // Nothing to clear
      return;
    this.changeDisambiguation(
      physicalRow,
      (row) => removeKey(row, 'disambiguation'),
      'Disambiguation.Clear'
    );
  }

  public setDisambiguation(
    physicalRow: number,
    mappingPath: MappingPath,
    id: number
  ): void {
    this.changeDisambiguation(
      physicalRow,
      (disambiguations) => ({
        ...disambiguations,
        [mappingPathToString(mappingPath)]: id,
      }),
      'Disambiguation.Set'
    );
  }
}

/* eslint-enable functional/no-this-expression */
