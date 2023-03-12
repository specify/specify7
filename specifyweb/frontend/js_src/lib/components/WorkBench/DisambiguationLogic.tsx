import React from 'react';

import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import type { IR } from '../../utils/types';
import type { AnySchema } from '../DataModel/helperTypes';
import type { Collection } from '../DataModel/specifyTable';
import { strictGetTable } from '../DataModel/tables';
import { Dialog } from '../Molecules/Dialog';
import { hasTablePermission } from '../Permissions/helpers';
import type { MappingPath } from '../WbPlanView/Mapper';
import { mappingPathToString } from '../WbPlanView/mappingHelpers';
import { getTableFromMappingPath } from '../WbPlanView/navigator';
import { DisambiguationDialog } from './Disambiguation';
import { getSelectedLast } from './hotHelpers';
import type { WbView } from './WbView';

/* eslint-disable functional/no-this-expression */
export class Disambiguation {
  public constructor(private readonly wbView: WbView) {}

  private getDisambiguation(physicalRow: number): IR<number> {
    const cols = this.wbView.dataset.columns.length;
    const hiddenColumn = this.wbView.data[physicalRow][cols];
    const extra =
      typeof hiddenColumn === 'string' && hiddenColumn.length > 0
        ? JSON.parse(hiddenColumn)
        : {};
    return extra.disambiguation ?? {};
  }

  public isAmbiguousCell(): boolean {
    if (this.wbView.mappings === undefined || this.wbView.hot === undefined)
      return false;

    const [visualRow, visualCol] = getSelectedLast(this.wbView.hot);
    const physicalRow = this.wbView.hot.toPhysicalRow(visualRow);
    const physicalCol = this.wbView.hot.toPhysicalColumn(visualCol);
    const disambiguation = this.getDisambiguation(physicalRow);

    return (
      this.wbView.validation.uploadResults.ambiguousMatches[physicalRow] ?? []
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
      this.wbView.validation.uploadResults.ambiguousMatches[physicalRow]?.find(
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
    if (this.wbView.hot === undefined) return;
    const cols = this.wbView.dataset.columns.length;
    const hidden = this.wbView.data[physicalRow][cols];
    const extra = hidden ? JSON.parse(hidden) : {};
    extra.disambiguation = changeFunction(extra.disambiguation || {});
    const visualRow = this.wbView.hot.toVisualRow(physicalRow);
    const visualCol = this.wbView.hot.toVisualColumn(cols);
    this.wbView.hot.setDataAtCell(
      visualRow,
      visualCol,
      JSON.stringify(extra),
      source
    );
    this.wbView.actions.spreadSheetChanged();
    this.afterChangeDisambiguation(physicalRow);
  }

  public afterChangeDisambiguation(physicalRow: number): void {
    (this.wbView.validation.uploadResults.ambiguousMatches[physicalRow] ?? [])
      .flatMap(({ physicalCols }) => physicalCols)
      .forEach((physicalCol) =>
        this.wbView.cells.recalculateIsModifiedState(physicalRow, physicalCol)
      );
    void this.wbView.cells.updateCellInfoStats();
  }

  clearDisambiguation(physicalRow: number): void {
    const disambiguation = this.getDisambiguation(physicalRow);
    if (Object.keys(disambiguation).length === 0)
      // Nothing to clear
      return;
    this.changeDisambiguation(physicalRow, () => ({}), 'Disambiguation.Clear');
  }

  private setDisambiguation(
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

  public openDisambiguationDialog() {
    if (this.wbView.mappings === undefined || this.wbView.hot === undefined)
      return;

    const [visualRow, visualCol] = getSelectedLast(this.wbView.hot);
    const physicalRow = this.wbView.hot.toPhysicalRow(visualRow);
    const physicalCol = this.wbView.hot.toPhysicalColumn(visualCol);

    const matches = this.wbView.validation.uploadResults.ambiguousMatches[
      physicalRow
    ].find(({ physicalCols }) => physicalCols.includes(physicalCol));
    if (matches === undefined) return;
    const tableName = getTableFromMappingPath(
      this.wbView.mappings.baseTable.name,
      matches.mappingPath
    );
    const table = strictGetTable(tableName);
    const resources = new table.LazyCollection({
      filters: { id__in: matches.ids.join(',') },
    }) as Collection<AnySchema>;

    (hasTablePermission(table.name, 'read')
      ? resources.fetch({ limit: 0 })
      : Promise.resolve(resources)
    ).then(({ models }) => {
      if (models.length === 0) {
        const dialog = this.wbView.options.display(
          <Dialog
            buttons={commonText.close()}
            header={wbText.noDisambiguationResults()}
            onClose={() => dialog()}
          >
            {wbText.noDisambiguationResultsDescription()}
          </Dialog>
        );
        return;
      }

      // Re-enable this once live validation is available again:
      /*
       * Disable "Apply All" if validation is still in progress.
       * This is because we don't know all matches until validation is done
       */
      /*
       *Let applyAllAvailable = true;
       *const applyAllButton = content.find('#applyAllButton');
       *
       *const updateIt = () => {
       *  const newState = this.liveValidationStack.length === 0;
       *  if (newState !== applyAllAvailable) {
       *    applyAllAvailable = newState;
       *    applyAllButton.disabled = !newState;
       *    applyAllButton[newState ? 'removeAttribute' : 'setAttribute'](
       *      'title',
       *      wbText.applyAllUnavailable()
       *    );
       *  }
       *};
       *
       *const interval = globalThis.setInterval(updateIt, 100);
       * // onClose: globalThis.clearInterval(interval);
       */

      const dialog = this.wbView.options.display(
        <DisambiguationDialog
          matches={resources.models}
          onClose={() => dialog()}
          onSelected={(selected) => {
            this.setDisambiguation(
              physicalRow,
              matches.mappingPath,
              selected.id
            );
            this.wbView.validation.startValidateRow(physicalRow);
          }}
          onSelectedAll={(selected): void =>
            // Loop backwards so the live validation will go from top to bottom
            this.wbView.hot?.batch(() => {
              for (
                let visualRow = this.wbView.data.length - 1;
                visualRow >= 0;
                visualRow--
              ) {
                const physicalRow = this.wbView.hot!.toPhysicalRow(visualRow);
                if (
                  !this.wbView.validation.uploadResults.ambiguousMatches[
                    physicalRow
                  ]?.find(
                    ({ key, mappingPath }) =>
                      key === matches.key &&
                      typeof this.getDisambiguation(physicalRow)[
                        mappingPathToString(mappingPath)
                      ] !== 'number'
                  )
                )
                  continue;
                this.setDisambiguation(
                  physicalRow,
                  matches.mappingPath,
                  selected.id
                );
                this.wbView.validation.startValidateRow(physicalRow);
              }
            })
          }
        />
      );
    });
  }
}

/* eslint-enable functional/no-this-expression */
