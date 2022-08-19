/**
 * Entrypoint for the WorkBench
 * Handles most user interactions
 * Initializes the spreadsheet (using Handsontable library)
 *
 * @remarks
 * hot refers to Handsontable
 *
 * @module
 *
 */

import '../css/workbench.css';

import $ from 'jquery';
import React from 'react';
import _ from 'underscore';
import { Backbone } from './backbone';
import Handsontable from 'handsontable';
import Papa from 'papaparse';

import { Button, className, Link } from './components/basic';
import { getModel, schema } from './schema';
import { DataSetNameView } from './components/datasetmeta';
import { WbUploaded } from './components/wbuploadedview';
import { WBUtils } from './wbutils';
import {
  formatToManyIndex,
  formatTreeRank,
  getNameFromTreeRankName,
  mappingPathToString,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';
import { parseUploadPlan } from './uploadplanparser';
import { capitalize, clamp, mappedFind } from './helpers';
import { getTableFromMappingPath } from './wbplanviewnavigator';
import { getIcon, unknownIcon } from './icons';
import { wbText } from './localization/workbench';
import { commonText } from './localization/common';
import { showDialog } from './components/legacydialog';
import { dialogClassNames, loadingBar } from './components/modaldialog';
import { format } from './dataobjformatters';
import { iconClassName, legacyNonJsxIcons } from './components/icons';
import { LANGUAGE } from './localization/utils';
import { defined, filterArray } from './types';
import { crash } from './components/errorboundary';
import { getTreeDefinitionItems } from './treedefinitions';
import { serializeResource } from './datamodelutils';
import { fetchPickList } from './picklistmixins';
import { ajax } from './ajax';
import { ping } from './ping';
import { Http } from './ajaxUtils';
import {
  hasPermission,
  hasTablePermission,
  hasTreeAccess,
} from './permissionutils';
import { wbViewTemplate } from './components/wbviewtemplate';
import { legacyLoadingContext } from './components/contexts';
import { getCache, setCache } from './cache';
import { f } from './functools';
import { pathStartsWith } from './wbplanviewutils';
import { getUserPref } from './preferencesutils';
import { createBackboneView } from './components/reactbackboneextend';
import { WbStatus } from './components/wbstatus';

const metaKeys = [
  'isNew',
  'isModified',
  'isSearchResult',
  'issues',
  'originalValue',
];
const defaultMetaValues = Object.freeze([
  false,
  false,
  false,
  Object.freeze([]),
  undefined,
]);

// REFACTOR: when rewriting to React, add ErrorBoundaries for these two:
const WbUploadedView = createBackboneView(WbUploaded);
const WbStatusView = createBackboneView(WbStatus);

export const WBView = Backbone.View.extend({
  __name__: 'WbForm',
  tagName: 'section',
  className: `wbs-form ${className.containerFull}`,
  events: {
    'click .wb-upload': 'upload',
    'click .wb-validate': 'upload',
    'click .wb-data-check': 'toggleDataCheck',
    'click .wb-show-plan': 'showPlan',
    'click .wb-revert': 'revertChanges',
    'click .wb-save': 'saveClicked',
    'click .wb-delete-data-set': 'delete',
    'click .wb-export-data-set': 'export',
    'click .wb-change-data-set-owner': 'changeOwner',

    'click .wb-show-upload-view': 'displayUploadedView',
    'click .wb-unupload': 'unupload',
  },

  // Constructors & Renderers
  initialize({ dataset, refreshInitiatedBy, refreshInitiatorAborted }) {
    this.dataset = dataset;
    this.data = dataset.rows;
    if (this.data.length === 0) {
      this.data.push(Array.from(this.dataset.columns).fill(null));
    }

    this.mappings /* :
      | undefined
      | {
        baseTable: SpecifyModel;
        mustMatchTables: Set<keyof Tables>;
        lines: RA<SplitMappingsPath>;
        tableNames: RA<string>; // tableName of each column
        mappedHeaders: RR<number, string>; // path to an icon for each header
        coordinateColumns: RR<number, 'Lat'|'Long'>;
        defaultValues: RR<number, string>;
        treeRanks: IR<{
          readonly physicalCol: number;
          readonly rankId: number;
        }>
      }
    */ = undefined;
    this.stopLiveValidation();
    this.validationMode = this.dataset.rowresults == null ? 'off' : 'static';
    this.hasUnSavedChanges = false;
    this.sortConfigIsSet = false;
    this.undoRedoIsHandled = false;
    this.hotIsReady = false;
    this.hotPlugins = {};
    this.hotCommentsContainer = false;
    this.hotCommentsContainerRepositionCallback = undefined;

    // Meta data for each cell (indexed by physical columns)
    this.cellMeta = undefined;
    // Meta data for each cell (indexed by visual columns)
    this.indexedCellMeta = undefined;
    this.flushIndexedCellData = true;

    this.wbutils = new WBUtils({
      wbview: this,
      el: this.el,
    });
    this.wbstatus = undefined;

    this.datasetmeta = new DataSetNameView({
      dataset: this.dataset,
      el: this.el,
      getRowCount: () =>
        this.hot === undefined
          ? this.dataset.rows.length
          : this.hot.countRows() - this.hot.countEmptyRows(true),
    });

    /*
     * If this.isUploaded, render() will:
     * Add the "Uploaded" label next to DS Name
     * Disable cell editing
     * Disable adding/removing rows
     * Still allow column sort
     * Still allow column move
     *
     */
    this.isUploaded =
      this.dataset.uploadresult !== null && this.dataset.uploadresult.success;
    // Disallow all editing and some tools while this dialog is open
    this.uploadedView = undefined;
    // Disallow all editing and all tools while this dialog is open
    this.coordinateConverterView = undefined;

    this.refreshInitiatedBy = refreshInitiatedBy;
    this.refreshInitiatorAborted = refreshInitiatorAborted;
    this.uploadResults /*
      :{
        readonly ambiguousMatches: RA<{
          readonly physicalCols: RA<number>,
          readonly mappingPath: MappingPath,
          readonly ids: RA<number>,
          readonly key: string}>
      };
      recordCounts: IR<string>;
      newRecords: RA<
        RA<
          Readonly<[
            tableName: string,
            id: number,
            alternativeLabel: '' | string
          ]>
        >
      >
    */ = {
      ambiguousMatches: [],
      recordCounts: {},
      newRecords: {},
    };

    /*
     * Throttle cell count update depending on the DS size (between 10ms and 2s)
     * Even if throttling may not be needed for small Data Sets, wrapping the
     * function in _.throttle allows to not worry about calling it several
     * time in a very short amount of time.
     *
     */
    const throttleRate = Math.ceil(clamp(10, this.data.length / 10, 2000));
    this.updateCellInfoStats = _.throttle(
      this.updateCellInfoStats,
      throttleRate
    );
    this.handleResize = _.throttle(() => this.hot?.render(), throttleRate);
  },
  render() {
    this.$el.append(
      wbViewTemplate(
        this.isUploaded,
        Boolean(this.dataset.uploadplan),
        this.dataset.id
      )
    );
    this.$el.attr('aria-label', commonText('workBench'));

    /*
     * HOT Comments for last column overflow outside the viewport for a moment
     * before getting repositioned by the afterOnCellMouseOver event handler.
     *
     * Hiding overflow prevents scroll bar from flickering on cell mouse over
     *
     */
    document.body.classList.add('overflow-x-hidden');

    this.datasetmeta.render();

    if (this.dataset.uploaderstatus) this.openStatus();

    this.cellMeta = [];

    if (this.refreshInitiatedBy && this.refreshInitiatorAborted)
      this.operationAbortedMessage();

    const initDataModelIntegration = () =>
      this.fetchPickLists()
        .then((pickLists) =>
          this.hot.batch(() => {
            if (
              !this.isUploaded &&
              !(this.mappings?.lines.length > 0) &&
              hasPermission('/workbench/dataset', 'update')
            ) {
              const dialog = showDialog({
                header: wbText('noUploadPlanDialogHeader'),
                onClose: () => dialog.remove(),
                buttons: (
                  <>
                    <Button.DialogClose>
                      {commonText('close')}
                    </Button.DialogClose>
                    <Link.Blue
                      href={`/specify/workbench-plan/${this.dataset.id}/`}
                    >
                      {commonText('create')}
                    </Link.Blue>
                  </>
                ),
                content: wbText('noUploadPlanDialogText'),
              });
              this.$('.wb-validate, .wb-data-check')
                .prop('disabled', true)
                .prop('title', wbText('wbValidateUnavailable'));
            } else {
              this.$('.wb-validate, .wb-data-check').prop('disabled', false);
              this.$('.wb-show-upload-view')
                .prop('disabled', false)
                .prop('title', undefined);
            }

            /*
             * These methods update HOT's cells settings, which resets meta data
             * Thus, need to run them first
             */
            this.identifyDefaultValues();
            this.identifyPickLists(pickLists);

            if (this.dataset.rowresults) this.getValidationResults();

            // The rest goes in order of importance
            this.identifyMappedHeaders();
            // CHeck if any column is reordered
            if (
              this.dataset.visualorder?.some(
                (column, index) => column !== index
              )
            )
              this.hot.updateSettings({
                manualColumnMove: this.dataset.visualorder,
              });
            this.fetchSortConfig();
            this.wbutils.findLocalityColumns();
            this.identifyCoordinateColumns();
            this.identifyTreeRanks();
            this.wbutils.render();

            this.hotIsReady = true;

            this.hotCommentsContainer =
              document.getElementsByClassName('htComments')[0];
          })
        )
        .catch(crash);

    legacyLoadingContext(
      this.initHot().then(() => {
        if (this.dataset.uploadplan) {
          this.mappings = parseUploadPlan(this.dataset.uploadplan);

          this.mappings.tableNames = this.mappings.lines.map(
            ({ mappingPath }) =>
              getTableFromMappingPath(this.mappings.baseTable.name, mappingPath)
          );
        }
        return initDataModelIntegration().catch(crash);
      })
    );

    this.updateValidationButton();
    if (this.validationMode === 'static' && !this.isUploaded)
      this.wbutils.toggleCellTypes('invalidCells', 'remove');

    this.flushIndexedCellData = true;
    globalThis.window.addEventListener('resize', this.handleResize);

    return this;
  },
  // Initialize Handsontable
  async initHot() {
    return new Promise((resolve) =>
      /*
       * HOT and Backbone appear to conflict, unless HOT init is wrapped in
       * globalThis.setTimeout(...,0)
       */
      globalThis.setTimeout(() => {
        this.hot = new Handsontable(this.$('.wb-spreadsheet')[0], {
          data: this.data,
          columns: Array.from(
            // Last column is invisible and contains disambiguation metadata
            { length: this.dataset.columns.length + 1 },
            (_, physicalCol) => ({
              // Get data from nth column for nth column
              data: physicalCol,
            })
          ),
          colHeaders: (physicalCol) => {
            const tableIcon = this.mappings?.mappedHeaders?.[physicalCol];
            const isMapped = tableIcon !== undefined;
            const mappingCol = this.physicalColToMappingCol(physicalCol);
            const tableName =
              this.mappings?.tableNames[mappingCol] ??
              tableIcon?.split('/').slice(-1)?.[0]?.split('.')?.[0];
            const tableLabel = isMapped
              ? getModel(tableName)?.label ?? tableName ?? ''
              : '';
            return `<div class="flex gap-1 items-center pl-4">
              ${
                isMapped
                  ? `<img
                class="w-table-icon h-table-icon"
                alt="${tableLabel}"
                src="${tableIcon}"
              >`
                  : `<span
                class="text-red-600"
                aria-label="${wbText('unmappedColumn')}"
                title="${wbText('unmappedColumn')}"
              >${legacyNonJsxIcons.ban}</span>`
              }
              <span class="wb-header-name columnSorting">
                ${this.dataset.columns[physicalCol]}
              </span>
            </div>`;
          },
          hiddenColumns: {
            // Hide the disambiguation column
            columns: [this.dataset.columns.length],
            indicators: false,
            copyPasteEnabled: false,
          },
          hiddenRows: {
            rows: [],
            indicators: false,
            copyPasteEnabled: false,
          },
          /*
           * Number of blanks rows at the bottom of the spreadsheet.
           * (allows to add new rows easily)
           */
          minSpareRows: getUserPref('workBench', 'editor', 'minSpareRows'),
          comments: {
            displayDelay: 100,
          },
          /*
           * Need htCommentCell to apply default HOT comment box styles
           *
           * Since comments are only used for invalid cells, comment boxes
           * contain the styles of invalid cells
           *
           */
          commentedCellClassName: 'htCommentCell',
          placeholderCellClassName: 'htPlaceholder',
          /*
           * Disable default styles. The only type of front-end invalid cell
           * right now is non-existed value for a read-only picklist. The error
           * message for that case is handled separately
           */
          invalidCellClassName: '-',
          rowHeaders: true,
          autoWrapCol: getUserPref('workBench', 'editor', 'autoWrapCol'),
          autoWrapRow: getUserPref('workBench', 'editor', 'autoWrapRow'),
          enterBeginsEditing: getUserPref(
            'workBench',
            'editor',
            'enterBeginsEditing'
          ),
          enterMoves:
            getUserPref('workBench', 'editor', 'enterMoveDirection') === 'col'
              ? { col: 1, row: 0 }
              : { col: 0, row: 1 },
          tabMoves:
            getUserPref('workBench', 'editor', 'tabMoveDirection') === 'col'
              ? { col: 1, row: 0 }
              : { col: 0, row: 1 },
          manualColumnResize: true,
          manualColumnMove: true,
          outsideClickDeselects: false,
          multiColumnSorting: true,
          sortIndicator: true,
          language: LANGUAGE,
          contextMenu: {
            items: this.isUploaded
              ? {
                  // Display uploaded record
                  upload_results: {
                    disableSelection: true,
                    isCommand: false,
                    renderer: (_hot, wrapper) => {
                      const { endRow: visualRow, endCol: visualCol } =
                        this.wbutils.getSelectedRegions().slice(-1)[0];
                      const physicalRow = this.hot.toPhysicalRow(visualRow);
                      const physicalCol = this.hot.toPhysicalColumn(visualCol);

                      const createdRecords =
                        this.uploadResults.newRecords[physicalRow]?.[
                          physicalCol
                        ];

                      if (
                        createdRecords === undefined ||
                        !this.getCellMeta(physicalRow, physicalCol, 'isNew')
                      ) {
                        wrapper.textContent = wbText(
                          'noUploadResultsAvailable'
                        );
                        wrapper.parentElement.classList.add('htDisabled');
                        const span = document.createElement('span');
                        span.style.display = 'none';
                        return span;
                      }

                      wrapper.setAttribute(
                        'class',
                        `${wrapper.getAttribute('class')} flex flex-col !m-0
                        pb-1 wb-uploaded-view-context-menu`
                      );
                      wrapper.innerHTML = createdRecords
                        .map(([tableName, recordId, label]) => {
                          const tableLabel =
                            label === ''
                              ? defined(getModel(tableName)).label
                              : label;
                          const tableIcon = getIcon(tableName) ?? unknownIcon;

                          return `<a
                            class="link"
                            href="/specify/view/${tableName}/${recordId}/"
                            target="_blank"
                          >
                            <img class="${iconClassName}" src="${tableIcon}" alt="">
                            ${tableLabel}
                            <span
                              title="${commonText('opensInNewTab')}"
                              aria-label="${commonText('opensInNewTab')}"
                            >${legacyNonJsxIcons.link}</span>
                          </a>`;
                        })
                        .join('');

                      const div = document.createElement('div');
                      div.style.display = 'none';
                      return div;
                    },
                  },
                }
              : {
                  row_above: {
                    disabled: () =>
                      this.uploadedView ||
                      this.coordinateConverterView ||
                      !hasPermission('/workbench/dataset', 'update'),
                  },
                  row_below: {
                    disabled: () =>
                      this.uploadedView ||
                      this.coordinateConverterView ||
                      !hasPermission('/workbench/dataset', 'update'),
                  },
                  remove_row: {
                    disabled: () => {
                      // If readOnly
                      if (
                        this.uploadedView ||
                        this.coordinateConverterView ||
                        !hasPermission('/workbench/dataset', 'update')
                      )
                        return true;
                      // Or if called on the last row
                      const selectedRegions = this.wbutils.getSelectedRegions();
                      return (
                        selectedRegions.length === 1 &&
                        selectedRegions[0].startRow === this.data.length - 1 &&
                        selectedRegions[0].startRow ===
                          selectedRegions[0].endRow
                      );
                    },
                  },
                  disambiguate: {
                    name: wbText('disambiguate'),
                    disabled: () =>
                      this.uploadedView ||
                      this.coordinateConverterView ||
                      !this.isAmbiguousCell() ||
                      !hasPermission('/workbench/dataset', 'update'),
                    callback: (__, selection) =>
                      this.openDisambiguationDialog(selection),
                  },
                  separator_1: '---------',
                  fill_down: this.wbutils.fillCellsContextMenuItem(
                    wbText('fillDown'),
                    this.wbutils.fillDown,
                    () =>
                      this.uploadedView ||
                      this.coordinateConverterView ||
                      !hasPermission('/workbench/dataset', 'update')
                  ),
                  fill_up: this.wbutils.fillCellsContextMenuItem(
                    wbText('fillUp'),
                    this.wbutils.fillUp,
                    () =>
                      this.uploadedView ||
                      this.coordinateConverterView ||
                      !hasPermission('/workbench/dataset', 'update')
                  ),
                  separator_2: '---------',
                  undo: {
                    disabled: () =>
                      this.uploadedView ||
                      !this.hot.isUndoAvailable() ||
                      !hasPermission('/workbench/dataset', 'update'),
                  },
                  redo: {
                    disabled: () =>
                      this.uploadedView ||
                      !this.hot.isRedoAvailable() ||
                      !hasPermission('/workbench/dataset', 'update'),
                  },
                },
          },
          licenseKey: 'non-commercial-and-evaluation',
          stretchH: 'all',
          readOnly:
            this.isUploaded || !hasPermission('/workbench/dataset', 'update'),
          afterUndo: this.afterUndo.bind(this),
          afterRedo: this.afterRedo.bind(this),
          beforePaste: this.beforePaste.bind(this),
          beforeChange: this.beforeChange.bind(this),
          afterChange: this.afterChange.bind(this),
          beforeValidate: this.beforeValidate.bind(this),
          afterValidate: this.afterValidate.bind(this),
          beforeCreateRow: this.beforeCreateRow.bind(this),
          beforeRemoveRow: this.beforeRemoveRow.bind(this),
          beforeColumnSort: this.beforeColumnSort.bind(this),
          afterColumnSort: this.afterColumnSort.bind(this),
          beforeColumnMove: this.beforeColumnMove.bind(this),
          afterColumnMove: this.afterColumnMove.bind(this),
          afterRenderer: this.afterRenderer.bind(this),
          afterPaste: this.afterPaste.bind(this),
          afterOnCellMouseOver: this.afterOnCellMouseOver.bind(this),
          afterOnCellMouseOut: this.afterOnCellMouseOut.bind(this),
        });
        resolve();
      }, 0)
    );
  },
  stopLiveValidation() {
    this.liveValidationStack = [];
    this.liveValidationActive = false;
    this.validationMode = 'off';
  },
  remove() {
    this.hot.destroy();
    this.hot = undefined;
    this.wbutils.remove();
    this.datasetmeta.remove();
    this.uploadedView?.handleClose();
    this.wbstatus?.();
    this.stopLiveValidation();
    globalThis.removeEventListener('resize', this.handleResize);
    document.body.classList.remove('overflow-x-hidden');
    Backbone.View.prototype.remove.call(this);
  },
  // Match columns to respective table icons
  identifyMappedHeaders() {
    if (!this.mappings) return;

    this.mappings.mappedHeaders = Object.fromEntries(
      this.mappings.tableNames.map((tableName, mappingCol) => [
        this.mappingColToPhysicalCol(mappingCol),
        getIcon(tableName) ?? unknownIcon,
      ])
    );
  },
  identifyCoordinateColumns() {
    if (!this.mappings) return;

    const columnHandlers = {
      'locality.latitude1': 'Lat',
      'locality.longitude1': 'Long',
      'locality.latitude2': 'Lat',
      'locality.longitude2': 'Long',
    };

    this.mappings.coordinateColumns = Object.fromEntries(
      this.wbutils.localityColumns.flatMap((localityColumns) =>
        Object.entries(localityColumns)
          .filter(([fieldName]) => fieldName in columnHandlers)
          .map(([fieldName, headerName]) => [
            this.dataset.columns.indexOf(headerName),
            columnHandlers[fieldName],
          ])
      )
    );
  },
  identifyDefaultValues() {
    if (!this.mappings) return;

    this.mappings.defaultValues = Object.fromEntries(
      Object.entries(
        this.mappings.lines === undefined
          ? {}
          : extractDefaultValues(
              this.mappings.lines,
              wbText('emptyStringInline')
            )
      ).map(([headerName, defaultValue]) => [
        this.dataset.columns.indexOf(headerName),
        defaultValue,
      ])
    );

    this.hot.updateSettings({
      columns: (index) =>
        this.mappings.defaultValues[index] === undefined
          ? {}
          : { placeholder: this.mappings.defaultValues[index] },
    });
  },
  async fetchPickLists() {
    if (!this.mappings) return [];
    return Promise.all(
      this.mappings.tableNames
        .map((tableName, index) => ({
          tableName,
          fieldName: this.mappings.lines[index].mappingPath.slice(-1)[0],
          headerName: this.mappings.lines[index].headerName,
        }))
        .map(async ({ tableName, fieldName, headerName }) => {
          const pickList = getModel(tableName)
            ?.getField(fieldName)
            ?.getPickList();
          const definition =
            typeof pickList === 'string'
              ? await fetchPickList(pickList)
              : undefined;
          if (definition === undefined) return undefined;
          const serialized = serializeResource(definition);
          return {
            physicalCol: this.dataset.columns.indexOf(headerName),
            pickList: {
              readOnly: serialized.readOnly,
              items: serialized.pickListItems.map(({ title }) => title),
            },
          };
        })
    ).then((items) =>
      Object.fromEntries(filterArray(items).map(Object.values))
    );
  },
  identifyPickLists(pickLists) {
    this.hot.updateSettings({
      cells: (_physicalRow, physicalCol, _property) =>
        physicalCol in pickLists
          ? {
              type: 'autocomplete',
              source: pickLists[physicalCol].items,
              strict: pickLists[physicalCol].readOnly,
              allowInvalid: true,
              filter:
                getUserPref('workBench', 'editor', 'filterPickLists') ===
                'none',
              filteringCaseSensitive:
                getUserPref('workBench', 'editor', 'filterPickLists') ===
                'case-sensitive',
              sortByRelevance: false,
              trimDropdown: false,
            }
          : { type: 'text' },
    });
  },
  identifyTreeRanks() {
    if (!this.mappings) return;

    this.mappings.treeRanks = Object.values(
      this.mappings.lines
        .map((splitMappingPath, index) => ({
          ...splitMappingPath,
          index,
        }))
        .filter(
          ({ mappingPath, index }) =>
            valueIsTreeRank(mappingPath.slice(-2)[0]) &&
            mappingPath.slice(-1)[0] === 'name' &&
            hasTreeAccess(this.mappings.tableNames[index], 'read')
        )
        .map(({ mappingPath, headerName, index }) => ({
          mappingGroup: mappingPathToString(mappingPath.slice(0, -2)),
          tableName: this.mappings.tableNames[index],
          rankName: getNameFromTreeRankName(mappingPath.slice(-2)[0]),
          physicalCol: this.dataset.columns.indexOf(headerName),
        }))
        .map(({ mappingGroup, tableName, rankName, physicalCol }) => ({
          mappingGroup,
          physicalCol,
          rankId: Object.keys(
            defined(getTreeDefinitionItems(tableName))
          ).findIndex(({ name }) => name === rankName),
        }))
        .reduce((groupedRanks, { mappingGroup, ...rankMapping }) => {
          groupedRanks[mappingGroup] ??= [];
          groupedRanks[mappingGroup].push(rankMapping);
          return groupedRanks;
        }, {})
    );
  },
  fetchSortConfig() {
    if (!this.hot) return;
    const sortConfig = getCache(
      'workBenchSortConfig',
      `${schema.domainLevelIds.collection}_${this.dataset.id}`
    );
    if (!Array.isArray(sortConfig)) return;
    const visualSortConfig = sortConfig.map(({ physicalCol, ...rest }) => ({
      ...rest,
      column: this.hot.toVisualColumn(physicalCol),
    }));
    this.getHotPlugin('multiColumnSorting').sort(visualSortConfig);
  },

  // Hooks
  /*
   * After cell is rendered, we need to reApply metaData classes
   * NOTE:
   * .issues are handled automatically by the comments plugin.
   * This is why, afterRenderer only has to handle the isModified and isNew
   * cases
   * */
  afterRenderer(td, visualRow, visualCol, property, _value) {
    if (this.hot === undefined) {
      td.classList.add('text-gray-500');
      return;
    }
    const physicalRow = this.hot.toPhysicalRow(visualRow);
    const physicalCol =
      typeof property === 'number'
        ? property
        : this.hot.toPhysicalColumn(visualCol);
    if (physicalCol >= this.dataset.columns.length) return;
    const metaArray = this.cellMeta[physicalRow]?.[physicalCol];
    if (this.getCellMetaFromArray(metaArray, 'isModified'))
      this.runMetaUpdateEffects(td, 'isModified', true, visualRow, visualCol);
    if (this.getCellMetaFromArray(metaArray, 'isNew'))
      this.runMetaUpdateEffects(td, 'isNew', true, visualRow, visualCol);
    if (this.getCellMetaFromArray(metaArray, 'isSearchResult'))
      this.runMetaUpdateEffects(
        td,
        'isSearchResult',
        true,
        visualRow,
        visualCol
      );
    if (this.mappings?.mappedHeaders?.[physicalCol] === undefined)
      td.classList.add('text-gray-500');
    if (this.mappings?.coordinateColumns?.[physicalCol] !== undefined)
      td.classList.add('wb-coordinate-cell');
  },
  // Make HOT use defaultValues for validation if cell is empty
  beforeValidate(value, _visualRow, property) {
    if (value) return value;

    const visualCol = this.hot.propToCol(property);
    const physicalCol = this.hot.toPhysicalColumn(visualCol);

    return this.mappings?.defaultValues[physicalCol] === undefined
      ? value
      : this.mappings.defaultValues[physicalCol];
  },
  afterValidate(isValid, value, visualRow, property) {
    const visualCol = this.hot.propToCol(property);

    const physicalRow = this.hot.toPhysicalRow(visualRow);
    const physicalCol = this.hot.toPhysicalColumn(visualCol);
    const issues = this.getCellMeta(physicalRow, physicalCol, 'issues');
    /*
     * Don't duplicate picklistValidationFailed message if both front-end and
     * back-end identified the same issue.
     *
     * This is the only type of validation that is done on the front-end
     */
    const newIssues = f.unique([
      ...(isValid ? [] : [wbText('picklistValidationFailed', value)]),
      ...issues.filter(
        (issue) => !issue.endsWith(wbText('picklistValidationFailed', ''))
      ),
    ]);
    if (JSON.stringify(issues) !== JSON.stringify(newIssues))
      this.updateCellMeta(physicalRow, physicalCol, 'issues', newIssues);
  },
  afterUndo(data) {
    this.afterUndoRedo('undo', data);
  },
  afterRedo(data) {
    this.afterUndoRedo('redo', data);
  },
  /*
   * Any change to a row clears disambiguation results
   * Clearing disambiguation creates a separate point in the undo/redo stack
   * This runs undo twice when undoing a change that caused disambiguation
   * clear and similarly redoes the change twice
   *
   */
  afterUndoRedo(type, data) {
    if (
      this.undoRedoIsHandled ||
      data.actionType !== 'change' ||
      data.changes.length !== 1
    )
      return;

    const [visualRow, visualCol, newData, oldData] = data.changes[0];
    const physicalRow = this.hot.toPhysicalRow(visualRow);
    const physicalCol = this.hot.toPhysicalColumn(visualCol);
    if (physicalCol !== this.dataset.columns.length) return;

    const newValue = JSON.parse(newData || '{}').disambiguation;
    const oldValue = JSON.parse(oldData || '{}').disambiguation;

    /*
     * Disambiguation results are cleared when any cell in a row changes.
     * That change creates a separate point in the undo stack.
     * Thus, if HOT tries to undo disambiguation clearing, we need to
     * also need to undo the change that caused disambiguation clearing
     */
    if (
      type === 'undo' &&
      Object.keys(newValue ?? {}).length > 0 &&
      Object.keys(oldValue ?? {}).length === 0
    )
      // HOT doesn't seem to like calling undo from inside of afterUndo
      globalThis.setTimeout(() => {
        this.undoRedoIsHandled = true;
        this.hot.undo();
        this.undoRedoIsHandled = false;
        this.afterChangeDisambiguation(physicalRow);
      }, 0);
    else this.afterChangeDisambiguation(physicalRow);
  },
  beforePaste() {
    return (
      !this.uploadedView &&
      !this.isUploaded &&
      hasPermission('/workbench/dataset', 'update')
    );
  },
  /*
   * If copying values from a 1x3 area and pasting into the last cell, HOT
   * would create 2 invisible columns)
   *
   * This intercepts Paste to prevent creation of these columns
   *
   * This logic wasn't be put into beforePaste because it receives
   * arguments that are inconvenient to work with
   * */
  beforeChange(unfilteredChanges, source) {
    if (source !== 'CopyPaste.paste') return true;

    const filteredChanges = unfilteredChanges.filter(
      ([, property]) => property < this.dataset.columns.length
    );
    if (filteredChanges.length === unfilteredChanges.length) return true;
    this.hot.setDataAtCell(
      filteredChanges.map(([visualRow, property, _oldValue, newValue]) => [
        visualRow,
        this.hot.propToCol(property),
        newValue,
      ]),
      'CopyPaste.paste'
    );
    return false;
  },
  afterChange(unfilteredChanges, source) {
    if (
      ![
        'edit',
        'CopyPaste.paste',
        'CopyPaste.cut',
        'Autofill.fill',
        'UndoRedo.undo',
        'UndoRedo.redo',
      ].includes(source)
    )
      return;

    const changes = unfilteredChanges
      .map(([visualRow, property, oldValue, newValue]) => ({
        visualRow,
        visualCol: this.hot.propToCol(property),
        physicalRow: this.hot.toPhysicalRow(visualRow),
        physicalCol:
          typeof property === 'number'
            ? property
            : this.hot.toPhysicalColumn(this.hot.propToCol(property)),
        oldValue,
        newValue,
      }))
      .filter(
        ({ oldValue, newValue, visualCol }) =>
          /*
           * Ignore cases where value didn't change
           * (happens when double click a cell and then click on another cell)
           * */
          oldValue !== newValue &&
          // Or where value changed from null to empty
          (oldValue !== null || newValue !== '') &&
          // Or the column does not exist (that can happen on paste)
          visualCol < this.dataset.columns.length
      );

    if (changes.length === 0) return;

    const changedRows = new Set(
      changes
        // Ignore changes to unmapped columns
        .filter(
          ({ physicalCol }) => this.physicalColToMappingCol(physicalCol) !== -1
        )
        .sort(
          // REFACTOR: use sortFunction here
          ({ visualRow: visualRowLeft }, { visualRow: visualRowRight }) =>
            visualRowLeft > visualRowRight
        )
        .map(({ physicalRow }) => physicalRow)
    );

    /*
     * Don't clear disambiguation when afterChange is triggered by
     * this.hot.undo() from inside of this.afterUndoRedo()
     */
    if (!this.undoRedoIsHandled)
      changedRows.forEach((physicalRow) =>
        this.clearDisambiguation(physicalRow)
      );

    changes.forEach(
      ({
        visualRow,
        visualCol,
        physicalRow,
        physicalCol,
        oldValue,
        newValue,
      }) => {
        if (
          this.getCellMeta(physicalRow, physicalCol, 'originalValue') ===
          undefined
        )
          this.setCellMeta(
            physicalRow,
            physicalCol,
            'originalValue',
            oldValue ?? ''
          );
        this.recalculateIsModifiedState(physicalRow, physicalCol, {
          visualRow,
          visualCol,
        });
        if (
          this.wbutils.searchPreferences.search.liveUpdate &&
          this.wbutils.searchQuery !== undefined
        )
          this.updateCellMeta(
            physicalRow,
            physicalCol,
            'isSearchResult',
            this.wbutils.searchFunction(newValue),
            { visualRow, visualCol }
          );
      }
    );

    this.spreadSheetChanged();
    void this.updateCellInfoStats();

    if (this.dataset.uploadplan)
      changedRows.forEach((physicalRow) => this.startValidateRow(physicalRow));
  },
  /*
   * This may be called before full initialization of the workbench because
   * of the minSpareRows setting in HOT. Thus, be sure to check if
   * this.hotIsReady is true
   *
   * Also, I don't think this is ever called with amount > 1.
   * Even if multiple new rows where created at once (e.x on paste), HOT calls
   * this hook one row at a time
   *
   * Also, this function needs to be called before afterValidate, thus I used
   * beforeCreateRow, instead of afterCreateRow
   *
   */
  beforeCreateRow(visualRowStart, amount, source) {
    const addedRows = Array.from(
      { length: amount },
      (_, index) =>
        /*
         * If HOT is not yet fully initialized, we can assume that physical row
         * order and visual row order is the same
         */
        this.hot?.toPhysicalRow(visualRowStart + index) ??
        visualRowStart + index
      // REFACTOR: use sortFunction here
    ).sort();

    this.flushIndexedCellData = true;
    addedRows
      .filter((physicalRow) => physicalRow < this.cellMeta.length)
      .forEach((physicalRow) => this.cellMeta.splice(physicalRow, 0, []));
    if (this.hotIsReady && source !== 'auto') this.spreadSheetChanged();

    return true;
  },
  beforeRemoveRow(visualRowStart, amount, source) {
    // Get indexes of removed rows in reverse order
    const removedRows = Array.from({ length: amount }, (_, index) =>
      this.hot.toPhysicalRow(visualRowStart + index)
    )
      .filter((physicalRow) => physicalRow < this.cellMeta.length)
      // REFACTOR: use sortFunction here
      .sort()
      .reverse();

    removedRows.forEach((physicalRow) => {
      this.cellMeta.splice(physicalRow, 1);
      this.liveValidationStack.splice(physicalRow, 1);
    });

    this.flushIndexedCellData = true;

    if (this.hotIsReady && source !== 'auto') {
      this.spreadSheetChanged();
      void this.updateCellInfoStats();
    }

    return true;
  },
  /*
   * If a tree column is about to be sorted, overwrite the sort config by
   * finding all lower level ranks of that tree (within the same -to-many)
   * and sorting them in the same direction
   */
  beforeColumnSort(currentSortConfig, newSortConfig) {
    this.flushIndexedCellData = true;

    if (this.coordinateConverterView) return false;

    if (!this.mappings || this.sortConfigIsSet) return true;

    const findTreeColumns = (sortConfig, deltaSearchConfig) =>
      sortConfig
        .map(({ column: visualCol, sortOrder }) => ({
          sortOrder,
          visualCol,
          physicalCol: this.hot.toPhysicalColumn(visualCol),
        }))
        .map(({ physicalCol, ...rest }) => ({
          ...rest,
          rankGroup: this.mappings.treeRanks
            ?.map((rankGroup, groupIndex) => ({
              rankId: rankGroup.find(
                (mapping) => mapping.physicalCol === physicalCol
              )?.rankId,
              groupIndex,
            }))
            .find(({ rankId }) => rankId !== undefined),
        }))
        // Filter out columns that aren't tree ranks
        .filter(({ rankGroup }) => rankGroup !== undefined)
        /*
         * Filter out columns that didn't change
         * In the end, there should only be 0 or 1 columns
         *
         */
        .find(({ sortOrder, visualCol }) => {
          const deltaColumnState = deltaSearchConfig.find(
            ({ column }) => column === visualCol
          );
          return (
            deltaColumnState === undefined ||
            deltaColumnState.sortOrder !== sortOrder
          );
        });

    let changedTreeColumn = findTreeColumns(newSortConfig, currentSortConfig);
    let newSortOrderIsUnset = false;

    if (changedTreeColumn === undefined) {
      changedTreeColumn = findTreeColumns(currentSortConfig, newSortConfig);
      newSortOrderIsUnset = true;
    }

    if (changedTreeColumn === undefined) return true;

    /*
     * Filter out columns with higher rank than the changed column
     * (lower rankId corresponds to a higher tree rank)
     *
     */
    const columnsToSort = this.mappings.treeRanks[
      changedTreeColumn.rankGroup.groupIndex
    ]
      .filter(({ rankId }) => rankId >= changedTreeColumn.rankGroup.rankId)
      .map(({ physicalCol }) => this.hot.toVisualColumn(physicalCol));

    // Filter out columns that are about to be sorted
    const partialSortConfig = newSortConfig.filter(
      ({ column }) => !columnsToSort.includes(column)
    );

    const fullSortConfig = [
      ...partialSortConfig,
      ...(newSortOrderIsUnset
        ? []
        : columnsToSort.map((visualCol) => ({
            column: visualCol,
            sortOrder: changedTreeColumn.sortOrder,
          }))),
    ];

    this.sortConfigIsSet = true;
    this.getHotPlugin('multiColumnSorting').sort(fullSortConfig);
    this.sortConfigIsSet = false;

    return false;
  },
  // Cache sort config to preserve column sort order across sessions
  async afterColumnSort(_previousSortConfig, sortConfig) {
    const physicalSortConfig = sortConfig.map(
      ({ column: visualCol, ...rest }) => ({
        ...rest,
        physicalCol: this.hot.toPhysicalColumn(visualCol),
      })
    );
    setCache(
      'workBenchSortConfig',
      `${schema.domainLevelIds.collection}_${this.dataset.id}`,
      physicalSortConfig
    );
  },
  beforeColumnMove(_columnIndexes, _finalIndex, dropIndex) {
    return (
      // Don't allow moving columns when isReadOnly
      !this.uploadedView &&
      !this.coordinateConverterView &&
      // An ugly fix for jQuery's dialogs conflicting with HOT
      (dropIndex !== undefined || this.hotIsReady === false)
    );
  },
  // Save new visualOrder on the back end
  afterColumnMove(_columnIndexes, _finalIndex, dropIndex) {
    // An ugly fix for jQuery's dialogs conflicting with HOT
    if (dropIndex === undefined || !this.hotIsReady) return;

    this.flushIndexedCellData = true;

    const columnOrder = this.dataset.columns.map((_, visualCol) =>
      this.hot.toPhysicalColumn(visualCol)
    );

    if (
      this.dataset.visualorder == null ||
      columnOrder.some((i, index) => i !== this.dataset.visualorder[index])
    ) {
      this.dataset.visualorder = columnOrder;
      ping(
        `/api/workbench/dataset/${this.dataset.id}/`,
        {
          method: 'PUT',
          body: { visualorder: columnOrder },
        },
        { expectedResponseCodes: [Http.NO_CONTENT, Http.NOT_FOUND] }
      ).then(this.checkDeletedFail.bind(this));
    }
  },
  // Do not scroll the viewport to the last column after inserting a row
  afterPaste(data, coords) {
    const lastCoords = coords.slice(-1)[0];
    if (data.some((row) => row.length === this.dataset.columns.length))
      this.hot.scrollViewportTo(lastCoords.endRow, lastCoords.startCol);
  },
  /*
   * Reposition the comment box if it is overflowing
   * See https://github.com/specify/specify7/issues/932
   * */
  afterOnCellMouseOver(_event, coordinates, cell) {
    const physicalRow = this.hot.toPhysicalRow(coordinates.row);
    const physicalCol = this.hot.toPhysicalColumn(coordinates.col);

    // Make sure cell has comments
    if (this.getCellMeta(physicalRow, physicalCol, 'issues').length === 0)
      return;

    const cellContainerBoundingBox = cell.getBoundingClientRect();
    const oneRem = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );

    // Make sure box is overflowing horizontally
    if (globalThis.innerWidth > cellContainerBoundingBox.right + oneRem * 2)
      return;

    this.hotCommentsContainer.style.setProperty(
      '--offset-right',
      `${Math.round(globalThis.innerWidth - cellContainerBoundingBox.x)}px`
    );
    this.hotCommentsContainer.classList.add(
      'right-[var(--offset-right)]',
      '!left-[unset]'
    );
    if (this.hotCommentsContainerRepositionCallback) {
      globalThis.clearTimeout(this.hotCommentsContainerRepositionCallback);
      this.hotCommentsContainerRepositionCallback = undefined;
    }
  },
  /*
   * Revert comment box's position to original state if needed.
   * The 10ms delay helps prevent visual artifacts when the mouse pointer
   * moves between cells.
   */
  afterOnCellMouseOut() {
    if (this.hotCommentsContainerRepositionCallback)
      globalThis.clearTimeout(this.hotCommentsContainerRepositionCallback);
    if (
      this.hotCommentsContainer.style.getPropertyValue('--offset-right') !== ''
    )
      this.hotCommentsContainerRepositionCallback = globalThis.setTimeout(
        () =>
          this.hotCommentsContainer.classList.remove(
            'right-[var(--offset-right)]',
            '!left-[unset]'
          ),
        10
      );
  },
  // Meta Data
  getCellMeta(physicalRow, physicalCol, key) {
    const index = metaKeys.indexOf(key);
    return (
      this.cellMeta[physicalRow]?.[physicalCol]?.[index] ??
      defaultMetaValues[index]
    );
  },
  getCellMetaFromArray(metaCell, key) {
    const index = metaKeys.indexOf(key);
    return metaCell?.[index] ?? defaultMetaValues[index];
  },
  /*
   * This does not run visual side effects
   * For changing meta with side effects, use this.updateCellMeta
   */
  setCellMeta(physicalRow, physicalCol, key, value) {
    const currentValue = this.getCellMeta(physicalRow, physicalCol, key);

    const issuesChanged =
      key === 'issues' &&
      (currentValue.length !== value.length ||
        JSON.stringify(currentValue) !== JSON.stringify(value));
    const cellValueChanged = key === 'originalValue';
    const metaValueChanged =
      issuesChanged ||
      cellValueChanged ||
      (['isNew', 'isModified', 'isSearchResult'].includes(key) &&
        currentValue !== value);

    if (!metaValueChanged) return false;

    const index = metaKeys.indexOf(key);
    this.cellMeta[physicalRow] ??= [];
    this.cellMeta[physicalRow][physicalCol] ??= Array.from(defaultMetaValues);
    this.cellMeta[physicalRow][physicalCol][index] = value;

    this.flushIndexedCellData = true;

    return true;
  },
  // Figuring out if a cell was modified is more complicated then it might seem
  isCellModified(physicalRow, physicalCol) {
    // For now, only readOnly picklists are validated on the front-end
    const hasFrontEndValidationErrors = this.getCellMeta(
      physicalRow,
      physicalCol,
      'issues'
    ).some((issue) => issue.endsWith(wbText('picklistValidationFailed', '')));
    if (hasFrontEndValidationErrors)
      /*
       * Since isModified state has higher priority then issues, we need to
       * remove the isModified state if front end validation errors are to be
       * visible
       */
      return false;

    const originalCellValue = this.getCellMeta(
      physicalRow,
      physicalCol,
      'originalValue'
    );
    const cellValueChanged =
      originalCellValue !== undefined &&
      (originalCellValue?.toString() ?? '') !==
        (this.data[physicalRow][physicalCol]?.toString() ?? '');
    if (cellValueChanged) return true;

    /*
     * If cell was disambiguated, it should show up as changed, even if value
     * is unchanged
     */
    return this.cellWasDisambiguated(physicalRow, physicalCol);
  },
  // Updates cell's isModified meta state
  recalculateIsModifiedState(
    physicalRow,
    physicalCol,
    {
      // Can optionally provide this to improve performance
      visualRow = undefined,
      // Can optionally provide this to improve performance
      visualCol = undefined,
    } = {}
  ) {
    const isModified = this.isCellModified(physicalRow, physicalCol);
    this.updateCellMeta(physicalRow, physicalCol, 'isModified', isModified, {
      visualRow,
      visualCol,
    });
  },
  /**
   * Note: "cell" is undefined when setting meta for off-screen cell.
   * This is the case when rendering off-screen issues (which don't require a cell
   * reference)
   */
  runMetaUpdateEffects(cell, key, value, visualRow, visualCol) {
    const effects = {
      isNew: () =>
        cell?.classList[value ? 'add' : 'remove']('wb-no-match-cell'),
      isModified: () =>
        cell?.classList[value ? 'add' : 'remove']('wb-modified-cell'),
      isSearchResult: () =>
        cell?.classList[value ? 'add' : 'remove']('wb-search-match-cell'),
      issues: () => {
        if (value.length === 0)
          this.getHotPlugin('comments').removeCommentAtCell(
            visualRow,
            visualCol
          );
        else {
          this.getHotPlugin('comments').setCommentAtCell(
            visualRow,
            visualCol,
            value.join('\n')
          );
          this.getHotPlugin('comments').updateCommentMeta(
            visualRow,
            visualCol,
            {
              readOnly: true,
            }
          );
        }
      },
    };

    if (!(key in effects))
      throw new Error(
        `Tried to set unknown metaData record ${key}=${value} for cell
         ${visualRow}x${visualCol}`
      );
    effects[key]();
  },
  updateCellMeta(
    physicalRow,
    physicalCol,
    key,
    value,
    {
      // Can optionally provide this to improve performance
      cell: initialCell = undefined,
      // Can optionally provide this to improve performance
      visualRow: initialVisualRow = undefined,
      // Can optionally provide this to improve performance
      visualCol: initialVisualCol = undefined,
    } = {}
  ) {
    const isValueChanged = this.setCellMeta(
      physicalRow,
      physicalCol,
      key,
      value
    );
    if (!isValueChanged) return false;

    const visualRow = initialVisualRow ?? this.hot.toVisualRow(physicalRow);
    const visualCol = initialVisualCol ?? this.hot.toVisualColumn(physicalCol);
    const cell = initialCell ?? this.hot.getCell(visualRow, visualCol);
    this.runMetaUpdateEffects(cell, key, value, visualRow, visualCol);

    return true;
  },

  // Disambiguation
  getDisambiguation(physicalRow) {
    const cols = this.dataset.columns.length;
    const hidden = this.data[physicalRow][cols];
    const extra = hidden ? JSON.parse(hidden) : {};
    return extra.disambiguation || {};
  },
  isAmbiguousCell() {
    if (!this.mappings) return false;

    const [visualRow, visualCol] = this.wbutils.getSelectedLast();
    const physicalRow = this.hot.toPhysicalRow(visualRow);
    const physicalCol = this.hot.toPhysicalColumn(visualCol);
    const da = this.getDisambiguation(physicalRow);

    return (this.uploadResults.ambiguousMatches[physicalRow] ?? []).some(
      ({ physicalCols, mappingPath }) =>
        physicalCols.includes(physicalCol) &&
        typeof da[mappingPathToString(mappingPath)] !== 'number'
    );
  },
  cellWasDisambiguated(physicalRow, physicalCol) {
    const da = this.getDisambiguation(physicalRow);
    return Boolean(
      this.uploadResults.ambiguousMatches[physicalRow]?.find(
        ({ physicalCols, mappingPath }) =>
          physicalCols.includes(physicalCol) &&
          typeof da[mappingPathToString(mappingPath)] === 'number'
      )
    );
  },
  changeDisambiguation(physicalRow, changeFunction, source) {
    const cols = this.dataset.columns.length;
    const hidden = this.data[physicalRow][cols];
    const extra = hidden ? JSON.parse(hidden) : {};
    extra.disambiguation = changeFunction(extra.disambiguation || {});
    const visualRow = this.hot.toVisualRow(physicalRow);
    const visualCol = this.hot.toVisualColumn(cols);
    this.hot.setDataAtCell(visualRow, visualCol, JSON.stringify(extra), source);
    this.spreadSheetChanged();
    this.afterChangeDisambiguation(physicalRow);
  },
  afterChangeDisambiguation(physicalRow) {
    (this.uploadResults.ambiguousMatches[physicalRow] ?? [])
      .flatMap(({ physicalCols }) => physicalCols)
      .forEach((physicalCol) =>
        this.recalculateIsModifiedState(physicalRow, physicalCol)
      );
    void this.updateCellInfoStats();
  },
  clearDisambiguation(physicalRow) {
    const disambiguation = this.getDisambiguation(physicalRow);
    if (Object.keys(disambiguation).length === 0)
      // Nothing to clear
      return;
    this.changeDisambiguation(physicalRow, () => ({}), 'Disambiguation.Clear');
  },
  setDisambiguation(physicalRow, mappingPath, id) {
    this.changeDisambiguation(
      physicalRow,
      (disambiguations) => ({
        ...disambiguations,
        [mappingPathToString(mappingPath)]: id,
      }),
      'Disambiguation.Set'
    );
  },
  openDisambiguationDialog([
    {
      start: { col: visualCol, row: visualRow },
    },
  ]) {
    if (!this.mappings) return;

    const physicalRow = this.hot.toPhysicalRow(visualRow);
    const physicalCol = this.hot.toPhysicalColumn(visualCol);

    const matches = this.uploadResults.ambiguousMatches[physicalRow].find(
      ({ physicalCols }) => physicalCols.includes(physicalCol)
    );
    const tableName = getTableFromMappingPath(
      this.mappings.baseTable.name,
      matches.mappingPath
    );
    const model = getModel(tableName);
    const resources = new model.LazyCollection({
      filters: { id__in: matches.ids.join(',') },
    });

    const doDA = (selected) => {
      this.setDisambiguation(
        physicalRow,
        matches.mappingPath,
        Number.parseInt(selected)
      );
      this.startValidateRow(physicalRow);
    };
    const doAll = (selected) => {
      // Loop backwards so the live validation will go from top to bottom
      for (let visualRow = this.data.length - 1; visualRow >= 0; visualRow--) {
        const physicalRow = this.hot.toPhysicalRow(visualRow);
        if (
          !this.uploadResults.ambiguousMatches[physicalRow]?.find(
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
          Number.parseInt(selected)
        );
        this.startValidateRow(physicalRow);
      }
    };

    (hasTablePermission(model.name, 'read')
      ? resources.fetch({ limit: 0 })
      : Promise.resolve()
    ).then(() => {
      if (resources.length === 0) {
        const dialog = showDialog({
          header: wbText('noDisambiguationResultsDialogHeader'),
          content: wbText('noDisambiguationResultsDialogText'),
          buttons: commonText('close'),
          onClose: () => dialog.remove(),
        });
        return;
      }

      const content = $('<div class="contents">');
      resources.forEach((resource) => {
        const row = $(
          `<div class="py-1 flex items-center gap-2">
            <label class="contents">
              <input
                type="radio"
                class="da-option"
                name="disambiguate" value="${resource.id}"
              >
              <span class="label">${resource.id}</span>
            <label/>
          ${
            hasTablePermission(model.name, 'read')
              ? `<a
            href="${resource.viewUrl()}"
            target="_blank"
            title="${commonText('view')}"
            aria-label="${commonText('view')}"
          >
            <span
              title="${commonText('opensInNewTab')}"
              aria-label="${commonText('opensInNewTab')}"
            >${legacyNonJsxIcons.link}</span>
          </a>`
              : ''
          }
        </div>`
        ).appendTo(content);
        if (
          typeof model.getField('rankid') === 'object' &&
          hasTablePermission(model.name, 'read')
        )
          resource
            .rget('parent.fullname')
            .then((parentName) =>
              row
                .find('.label')
                .text(`${resource.get('fullname')} (in ${parentName})`)
            );
        else
          format(resource, undefined, true).then((formatted) =>
            row.find('.label').text(formatted)
          );
      });

      const dialog = showDialog({
        header: wbText('disambiguationDialogTitle'),
        onClose: () => {
          dialog.remove();
          globalThis.clearInterval(interval);
        },
        content,
        buttons: (
          <>
            <Button.DialogClose>{commonText('close')}</Button.DialogClose>
            <Button.Blue
              onClick={() => {
                const selected = $('input.da-option:checked', content).val();
                if (selected != null) {
                  doDA(selected);
                  dialog.remove();
                  globalThis.clearInterval(interval);
                }
              }}
            >
              {commonText('apply')}
            </Button.Blue>
            <Button.Blue
              id="applyAllButton"
              onClick={() => {
                const selected = $('input.da-option:checked', content).val();
                if (selected != null) {
                  doAll(selected);
                  dialog.remove();
                  globalThis.clearInterval(interval);
                }
              }}
            >
              {commonText('applyAll')}
            </Button.Blue>
          </>
        ),
      });

      let applyAllAvailable = true;
      const applyAllButton = content.find('#applyAllButton');

      const updateIt = () => {
        const newState = this.liveValidationStack.length === 0;
        if (newState !== applyAllAvailable) {
          applyAllAvailable = newState;
          applyAllButton.disabled = !newState;
          applyAllButton[newState ? 'removeAttribute' : 'setAttribute'](
            'title',
            wbText('applyAllUnavailable')
          );
        }
      };

      const interval = globalThis.setInterval(updateIt, 100);
    });
  },

  // Tools
  displayUploadedView(event) {
    if (!this.dataset.rowresults) return;

    if (this.uploadedView !== undefined) {
      this.uploadedView.handleClose();
      return;
    }

    if (this.liveValidationStack.length > 0) {
      const dialog = showDialog({
        header: commonText('results'),
        content: wbText('unavailableWhileValidating'),
        onClose: () => dialog.remove(),
        buttons: commonText('close'),
      });
      return;
    }

    const effects = [];
    const effectsCleanup = [];

    const elementsToDisable = [
      ...[
        'wb-data-check',
        'wb-replace-value',
        'wb-convert-coordinates',
        'wb-geolocate',
      ].map((className) => this.el.getElementsByClassName(className)[0]),
      ...Array.from(document.getElementsByClassName('wb-navigation-section'))
        .filter((element) =>
          ['modifiedCells', 'invalidCells'].includes(
            element.getAttribute('data-navigation-type')
          )
        )
        .flatMap((element) =>
          Array.from(element.getElementsByClassName('wb-cell-navigation'))
        ),
    ]
      .filter((element) => element !== undefined)
      .map((element) => [element, element.getAttribute('title')]);

    effects.push(() =>
      elementsToDisable.forEach(([element]) => {
        element.disabled = true;
        element.setAttribute('title', wbText('unavailableWhileViewingResults'));
      })
    );
    effectsCleanup.push(() =>
      elementsToDisable.forEach(([element, title]) => {
        element.disabled = false;
        element.setAttribute('title', title);
      })
    );

    const isReadOnly = this.hot.getSettings().readOnly;
    effects.push(() => this.hot.updateSettings({ readOnly: true }));
    effectsCleanup.push(() =>
      this.hot?.updateSettings({ readOnly: isReadOnly })
    );

    const initialHiddenRows = this.getHotPlugin('hiddenRows').getHiddenRows();
    const initialHiddenCols =
      this.getHotPlugin('hiddenColumns').getHiddenColumns();
    const rowsToInclude = new Set();
    const colsToInclude = new Set();
    Object.entries(this.cellMeta).forEach(([physicalRow, rowMeta]) =>
      rowMeta.forEach((metaArray, physicalCol) => {
        if (!this.getCellMetaFromArray(metaArray, 'isNew')) return;
        rowsToInclude.add(physicalRow | 0);
        colsToInclude.add(physicalCol);
      })
    );
    const rowsToHide = this.data
      .map((_, physicalRow) => physicalRow)
      .filter(
        (physicalRow) =>
          !rowsToInclude.has(physicalRow) &&
          !initialHiddenRows.includes(physicalRow)
      )
      .map(this.hot.toVisualRow);
    const colsToHide = this.dataset.columns
      .map((_, physicalCol) => physicalCol)
      .filter(
        (physicalCol) =>
          !colsToInclude.has(physicalCol) &&
          !initialHiddenCols.includes(physicalCol)
      )
      .map(this.hot.toVisualColumn);

    effects.push(() => {
      this.getHotPlugin('hiddenRows').hideRows(rowsToHide);
      this.getHotPlugin('hiddenColumns').hideColumns(colsToHide);
    });
    effectsCleanup.push(() => {
      if (this.hot === undefined) return;
      this.getHotPlugin('hiddenRows').showRows(
        rowsToHide.filter((visualRow) => !initialHiddenRows.includes(visualRow))
      );
      this.getHotPlugin('hiddenColumns').showColumns(
        colsToHide.filter((visualCol) => !initialHiddenCols.includes(visualCol))
      );
    });

    const newCellsAreHidden = this.el.classList.contains('wb-hide-new-cells');
    effects.push(() => this.wbutils.toggleCellTypes('newCells', 'remove'));
    effectsCleanup.push(() =>
      newCellsAreHidden
        ? this.wbutils.toggleCellTypes('newCells', 'add')
        : undefined
    );

    effects.push(() => {
      event.target.ariaPressed = true;
    });
    effectsCleanup.push(() => {
      event.target.ariaPressed = false;
    });

    effects.push(() => this.el.classList.add('wb-show-upload-results'));
    effectsCleanup.push(() =>
      this.el.classList.remove('wb-show-upload-results')
    );

    const uploadedViewWrapper = this.el.getElementsByClassName(
      'wb-uploaded-view-wrapper'
    )[0];
    effects.push(() => {
      uploadedViewWrapper.classList.remove('hidden');
      uploadedViewWrapper.classList.add('contents');
    });
    effectsCleanup.push(() => {
      uploadedViewWrapper.classList.remove('contents');
      uploadedViewWrapper.classList.add('hidden');
    });

    const runEffects = () =>
      [...effects, this.hot.render.bind(this.hot)].forEach((effect) =>
        effect()
      );
    const runCleanup = () =>
      // If WBView.remove() was called, this.hot would be undefined here
      [...effectsCleanup, this.hot?.render.bind(this.hot)].forEach(
        (effectCleanup) => effectCleanup?.()
      );

    const handleClose = () => {
      this.uploadedView.remove();
      this.uploadedView = undefined;
      runCleanup();
    };
    this.uploadedView = new WbUploadedView({
      recordCounts: this.uploadResults.recordCounts,
      isUploaded: this.isUploaded,
      onClose: handleClose,
    }).render();

    uploadedViewWrapper.append(this.uploadedView.el);
    this.uploadedView.handleClose = handleClose;

    runEffects();
  },
  // For debugging only
  showPlan() {
    const dataset = this.dataset;
    const planJson = JSON.stringify(dataset.uploadplan, null, 4);
    const textarea = $('<textarea cols="120" rows="50">').text(planJson)[0];
    const dialog = showDialog({
      header: wbText('dataMapper'),
      content: textarea,
      onClose: () => dialog.remove(),
      buttons: (
        <>
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
          <Button.Green
            onClick={() => {
              dataset.uploadplan =
                textarea.value.length === 0 ? null : JSON.parse(textarea.value);
              ping(
                `/api/workbench/dataset/${dataset.id}/`,
                {
                  method: 'PUT',
                  body: { uploadplan: dataset.uploadplan },
                },
                { expectedResponseCodes: [Http.NO_CONTENT, Http.NOT_FOUND] }
              )
                .then(this.checkDeletedFail.bind(this))
                .then(() => {
                  this.trigger('refresh');
                  dialog.remove();
                });
            }}
          >
            {commonText('save')}
          </Button.Green>
        </>
      ),
    });
  },
  changeOwner() {
    this.datasetmeta.changeOwner();
  },

  // Actions
  // aka Rollback
  unupload() {
    const dialog = showDialog({
      header: wbText('rollbackDialogHeader'),
      content: wbText('rollbackDialogText'),
      className: {
        container: dialogClassNames.narrowContainer,
      },
      onClose: () => dialog.remove(),
      buttons: (
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Button.Red
            onClick={() => {
              ping(`/api/workbench/unupload/${this.dataset.id}/`, {
                method: 'POST',
              }).then(() => this.openStatus('unupload'));
              dialog.remove();
            }}
          >
            {wbText('rollback')}
          </Button.Red>
        </>
      ),
    });
  },
  // BUG: disable the button if there is nothing to upload
  upload(event) {
    const mode = $(event.currentTarget).is('.wb-upload')
      ? 'upload'
      : 'validate';
    if (this.mappings?.lines.length > 0) {
      if (mode === 'upload') {
        const dialog = showDialog({
          header: wbText('startUploadDialogHeader'),
          content: wbText('startUploadDialogText'),
          onClose: () => dialog.remove(),
          buttons: (
            <>
              <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
              <Button.Blue
                onClick={() => {
                  this.startUpload(mode);
                  dialog.remove();
                }}
              >
                {wbText('upload')}
              </Button.Blue>
            </>
          ),
        });
      } else this.startUpload(mode);
    } else {
      const dialog = showDialog({
        content: wbText('noUploadPlanDialogText'),
        onClose: () => dialog.remove(),
        buttons: (
          <>
            <Button.DialogClose>{commonText('close')}</Button.DialogClose>
            <Link.Blue href={`/specify/workbench-plan/${this.dataset.id}/`}>
              {commonText('create')}
            </Link.Blue>
          </>
        ),
      });
    }
  },
  startUpload(mode) {
    this.stopLiveValidation();
    this.updateValidationButton();
    ping(
      `/api/workbench/${mode}/${this.dataset.id}/`,
      {
        method: 'POST',
      },
      { expectedResponseCodes: [Http.OK, Http.NOT_FOUND, Http.CONFLICT] }
    )
      .then((statusCode) => {
        this.checkDeletedFail(statusCode);
        this.checkConflictFail(statusCode);
      })
      .then(() => this.openStatus(mode));
  },
  openStatus(mode) {
    this.wbstatus = new WbStatusView({
      dataset: {
        ...this.dataset,
        // Create initial status if it doesn't exist yet
        uploaderstatus: {
          uploaderstatus:
            this.dataset.uploaderstatus === null
              ? {
                  operation: {
                    validate: 'validating',
                    upload: 'uploading',
                    unupload: 'unuploading',
                  }[mode],
                  taskid: '',
                }
              : this.dataset.uploaderstatus,
          taskstatus: 'PENDING',
          taskinfo: {
            current: 1,
            total: 1,
          },
        },
      },
      onFinished: (wasAborted) => {
        this.wbstatus.remove();
        this.wbstatus = undefined;
        this.trigger('refresh', mode, wasAborted);
      },
    }).render();
  },
  delete() {
    const dialog = showDialog({
      header: wbText('deleteDataSetDialogHeader'),
      content: wbText('deleteDataSetDialogText'),
      onClose: () => dialog.remove(),
      buttons: (
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Button.Red
            onClick={() => {
              ping(
                `/api/workbench/dataset/${this.dataset.id}/`,
                {
                  method: 'DELETE',
                },
                { expectedResponseCodes: [Http.NO_CONTENT, Http.NOT_FOUND] }
              ).then((status) => {
                this.$el.empty();
                dialog.remove();

                if (!this.checkDeletedFail(status))
                  showDialog({
                    header: wbText('dataSetDeletedDialogHeader'),
                    content: wbText('dataSetDeletedDialogText'),
                    buttons: (
                      <Link.Blue href="/specify/">
                        {commonText('close')}
                      </Link.Blue>
                    ),
                  });
              });
            }}
          >
            {commonText('delete')}
          </Button.Red>
        </>
      ),
    });
  },
  export() {
    const data = Papa.unparse({
      fields: this.dataset.columns,
      data: this.dataset.rows,
    });
    const wbName = this.dataset.name;
    const filename = wbName.endsWith('.csv') ? wbName : `${wbName}.csv`;
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = globalThis.URL.createObjectURL(blob);
    a.setAttribute('download', filename);
    a.click();
  },
  revertChanges() {
    const dialog = showDialog({
      header: wbText('revertChangesDialogHeader'),
      content: wbText('revertChangesDialogText'),
      onClose: () => dialog.remove(),
      buttons: (
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Button.Red onClick={() => this.trigger('refresh')}>
            {wbText('revert')}
          </Button.Red>
        </>
      ),
    });
  },
  saveClicked() {
    this.save();
  },
  save() {
    // Clear validation
    this.dataset.rowresults = null;
    this.stopLiveValidation();
    this.updateValidationButton();

    // Show saving progress bar
    const dialog = showDialog({
      header: wbText('savingDialogTitle'),
      onClose: () => dialog.remove(),
      content: loadingBar,
      buttons: undefined,
    });

    // Send data
    return ping(
      `/api/workbench/rows/${this.dataset.id}/`,
      {
        method: 'PUT',
        body: this.data,
      },
      { expectedResponseCodes: [Http.NO_CONTENT, Http.NOT_FOUND] }
    )
      .then((status) => this.checkDeletedFail(status))
      .then(() => {
        this.spreadSheetUpToDate();
        this.cellMeta = [];
        this.wbutils.searchCells({ key: 'SettingsChange' });
        this.hot.render();
      })
      .finally(() => dialog.remove());
  },

  // Validation
  toggleDataCheck(event) {
    this.validationMode = this.validationMode === 'live' ? 'off' : 'live';

    if (!(this.mappings?.lines.length > 0)) this.validationMode = 'off';

    this.uploadResults = {
      ambiguousMatches: [],
      recordCounts: {},
      newRecords: {},
    };
    this.cellMeta = [];

    switch (this.validationMode) {
      case 'live':
        this.liveValidationStack = Array.from(
          { length: this.hot.countRows() },
          (_, visualRow) => this.hot.toPhysicalRow(visualRow)
        ).reverse();
        this.triggerLiveValidation();
        this.wbutils.toggleCellTypes('newCells', 'remove');
        this.wbutils.toggleCellTypes('invalidCells', 'remove');
        event.target.ariaPressed = true;
        break;
      case 'static':
        this.getValidationResults();
        this.wbutils.toggleCellTypes('invalidCells', 'remove');
        this.liveValidationStack = [];
        this.liveValidationActive = false;
        event.target.ariaPressed = false;
        break;
      case 'off':
        this.liveValidationStack = [];
        this.liveValidationActive = false;
        event.target.ariaPressed = false;
        break;
    }

    this.hot.render();
    this.updateValidationButton();
  },
  startValidateRow(physicalRow) {
    if (this.validationMode !== 'live') return;
    this.liveValidationStack = this.liveValidationStack
      .filter((row) => row !== physicalRow)
      .concat(physicalRow);
    this.triggerLiveValidation();
  },
  triggerLiveValidation() {
    const pumpValidation = () => {
      this.updateValidationButton();
      if (this.liveValidationStack.length === 0) {
        this.liveValidationActive = false;
        return;
      }
      this.liveValidationActive = true;
      const physicalRow = this.liveValidationStack.pop();
      if (physicalRow === null) return;
      const rowData = this.hot.getSourceDataAtRow(physicalRow);
      ajax(`/api/workbench/validate_row/${this.dataset.id}/`, {
        method: 'POST',
        body: rowData,
        headers: { Accept: 'application/json' },
      })
        .then(({ data: result }) =>
          this.gotRowValidationResult(physicalRow, result)
        )
        .then(pumpValidation);
    };

    if (!this.liveValidationActive) {
      pumpValidation();
    }
  },
  updateValidationButton() {
    if (this.validationMode === 'live')
      this.$('.wb-data-check').text(
        `${wbText('dataCheckOn')}${
          this.liveValidationStack.length > 0
            ? ` (${this.liveValidationStack.length})`
            : ''
        }`()
      );
    else {
      this.$('.wb-data-check').text(wbText('dataCheck'));
    }
  },
  gotRowValidationResult(physicalRow, result) {
    if (this.validationMode !== 'live' || this.hot.isDestroyed) return;
    this.uploadResults.ambiguousMatches[physicalRow] = [];
    this.hot.batch(() =>
      this.applyRowValidationResults(physicalRow, result?.result)
    );
    this.updateCellInfoStats();
  },
  getHeadersFromMappingPath(mappingPathFilter, persevering = true) {
    if (!persevering)
      // Find all columns with the shared parent mapping path
      return this.mappings.lines
        .filter(({ mappingPath }) =>
          pathStartsWith(mappingPath, mappingPathFilter)
        )
        .map(({ headerName }) => headerName);
    return (
      mappedFind(mappingPathFilter, (_, index) => {
        const columns = this.mappings.lines
          .filter(({ mappingPath }) =>
            pathStartsWith(
              mappingPath,
              mappingPathFilter.slice(0, index === 0 ? undefined : -1 * index)
            )
          )
          .map(({ headerName }) => headerName);
        return columns.length > 0 ? columns : undefined;
      }) ?? []
    );
  },
  resolveValidationColumns(initialColumns, inferColumnsCallback = undefined) {
    // See https://github.com/specify/specify7/issues/810
    let columns = initialColumns.filter((column) => column);
    if (typeof inferColumnsCallback === 'function' && columns.length === 0)
      columns = inferColumnsCallback();
    if (columns.length === 0) columns = this.dataset.columns;
    // Convert to physicalCol and filter out unknown columns
    return columns
      .map((column) => this.dataset.columns.indexOf(column))
      .filter((physicalCol) => physicalCol !== -1);
  },
  applyRowValidationResults(physicalRow, result) {
    const rowMeta = this.dataset.columns.map(() => ({
      isNew: false,
      issues: [],
    }));

    const setMeta = (key, value, columns, inferColumnsCallback) =>
      this.resolveValidationColumns(columns, inferColumnsCallback).forEach(
        (physicalCol) => {
          if (key === 'issues')
            rowMeta[physicalCol][key].push(capitalize(value));
          else rowMeta[physicalCol][key] = value;
        }
      );

    if (result) this.parseRowValidationResults(result, setMeta, physicalRow);

    rowMeta.forEach((cellMeta, physicalCol) => {
      Object.entries(cellMeta).map(([key, value]) =>
        this.updateCellMeta(physicalRow, physicalCol, key, value)
      );
    });
  },
  parseRowValidationResults(
    result,
    setMetaCallback,
    physicalRow,
    initialMappingPath = []
  ) {
    const uploadResult = result.UploadResult;
    const uploadStatus = Object.keys(uploadResult.record_result)[0];
    const statusData = uploadResult.record_result[uploadStatus];

    const mappingPath = statusData.info?.treeInfo
      ? [...initialMappingPath, formatTreeRank(statusData.info.treeInfo.rank)]
      : initialMappingPath;

    const resolveColumns = this.getHeadersFromMappingPath.bind(
      this,
      mappingPath
    );

    if (['NullRecord', 'PropagatedFailure', 'Matched'].includes(uploadStatus)) {
    } else if (uploadStatus === 'ParseFailures')
      statusData.failures.forEach(([issue, column]) =>
        setMetaCallback('issues', issue, [column], resolveColumns)
      );
    else if (uploadStatus === 'NoMatch')
      setMetaCallback(
        'issues',
        wbText('noMatchErrorMessage'),
        statusData.info.columns,
        resolveColumns
      );
    else if (uploadStatus === 'FailedBusinessRule')
      setMetaCallback(
        'issues',
        statusData.message,
        statusData.info.columns,
        resolveColumns
      );
    else if (uploadStatus === 'MatchedMultiple') {
      this.uploadResults.ambiguousMatches[physicalRow] ??= [];
      this.uploadResults.ambiguousMatches[physicalRow].push({
        physicalCols: this.resolveValidationColumns(
          statusData.info.columns,
          resolveColumns
        ),
        mappingPath,
        ids: statusData.ids,
        key: statusData.key,
      });
      setMetaCallback(
        'issues',
        wbText('matchedMultipleErrorMessage'),
        statusData.info.columns,
        resolveColumns
      );
    } else if (uploadStatus === 'Uploaded') {
      setMetaCallback('isNew', true, statusData.info.columns, resolveColumns);
      const tableName = statusData.info.tableName.toLowerCase();
      this.uploadResults.recordCounts[tableName] ??= 0;
      this.uploadResults.recordCounts[tableName] += 1;
      this.uploadResults.newRecords[physicalRow] ??= {};
      this.resolveValidationColumns(statusData.info.columns, () =>
        resolveColumns(false)
      ).map((physicalCol) => {
        this.uploadResults.newRecords[physicalRow][physicalCol] ??= [];
        this.uploadResults.newRecords[physicalRow][physicalCol].push([
          tableName,
          statusData.id,
          statusData.info?.treeInfo
            ? `${statusData.info.treeInfo.name} (${statusData.info.treeInfo.rank})`
            : '',
        ]);
      });
    } else
      throw new Error(
        `Trying to parse unknown uploadStatus type "${uploadStatus}" at
        row ${this.hot.toVisualRow(physicalRow)}`
      );

    Object.entries(uploadResult.toOne).forEach(([fieldName, uploadResult]) =>
      this.parseRowValidationResults(
        uploadResult,
        setMetaCallback,
        physicalRow,
        fieldName === 'parent' && typeof statusData.info.treeInfo === 'object'
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
  },
  getValidationResults() {
    if (this.wbstatus !== undefined || !this.mappings) return;

    if (this.dataset.rowresults === null) {
      this.validationMode = 'off';
      this.updateValidationButton();
      return;
    }

    this.dataset.rowresults.forEach((result, physicalRow) => {
      this.applyRowValidationResults(physicalRow, result);
    });

    void this.updateCellInfoStats();
  },

  // Helpers
  /*
   * MappingCol is the index of the lines line corresponding to
   * a particular physicalCol. Since there can be unmapped columns, these
   * indexes do not line up and need to be converted like this:
   */
  physicalColToMappingCol(physicalCol) {
    return this.mappings?.lines.findIndex(
      ({ headerName }) => headerName === this.dataset.columns[physicalCol]
    );
  },
  mappingColToPhysicalCol(mappingCol) {
    return this.mappings
      ? this.dataset.columns.indexOf(this.mappings.lines[mappingCol].headerName)
      : undefined;
  },
  getHotPlugin(pluginName) {
    if (!this.hotPlugins[pluginName])
      this.hotPlugins[pluginName] = this.hot.getPlugin(pluginName);
    return this.hotPlugins[pluginName];
  },
  spreadSheetChanged() {
    if (this.hasUnSavedChanges) return;
    this.hasUnSavedChanges = true;

    this.$(
      '.wb-upload, .wb-validate, .wb-export-data-set, .wb-change-data-set-owner'
    )
      .prop('disabled', true)
      .prop('title', wbText('unavailableWhileEditing'));
    this.$('.wb-save').prop('disabled', false);
    this.$('.wb-revert').prop('disabled', false);
    this.$('.wb-show-upload-view')
      .prop('disabled', true)
      .prop('title', wbText('wbUploadedUnavailable'));
    this.options.onSetUnloadProtect(true);
  },
  // Check if AJAX failed because Data Set was deleted
  checkDeletedFail(statusCode) {
    if (statusCode === Http.NOT_FOUND)
      this.$el.empty().append(wbText('dataSetDeletedOrNotFound'));
    return statusCode === Http.NOT_FOUND;
  },
  // Check if AJAX failed because Data Set was modified by other session
  checkConflictFail(statusCode) {
    if (statusCode === Http.CONFLICT)
      /*
       * Upload/Validation/Un-Upload has been initialized by another session
       * Need to reload the page to display the new state
       */
      this.trigger('reload');
    return statusCode === Http.CONFLICT;
  },
  spreadSheetUpToDate() {
    if (!this.hasUnSavedChanges) return;
    this.hasUnSavedChanges = false;
    this.$(
      '.wb-upload, .wb-validate, .wb-export-data-set, .wb-change-data-set-owner'
    )
      .prop('disabled', false)
      .prop('title', '');
    this.$('.wb-save').prop('disabled', true);
    this.$('.wb-revert').prop('disabled', true);
    this.options.onSetUnloadProtect(false);
  },

  // MetaData
  async updateCellInfoStats() {
    const cellMeta = this.cellMeta.flat();

    const cellCounts = {
      newCells: cellMeta.reduce(
        (count, info) =>
          count + (this.getCellMetaFromArray(info, 'isNew') ? 1 : 0),
        0
      ),
      invalidCells: cellMeta.reduce(
        (count, info) =>
          count +
          (this.getCellMetaFromArray(info, 'issues').length > 0 ? 1 : 0),
        0
      ),
      searchResults: cellMeta.reduce(
        (count, info) =>
          count + (this.getCellMetaFromArray(info, 'isSearchResult') ? 1 : 0),
        0
      ),
      modifiedCells: cellMeta.reduce(
        (count, info) =>
          count + (this.getCellMetaFromArray(info, 'isModified') ? 1 : 0),
        0
      ),
    };

    // Update navigation information
    Object.values(
      this.el.getElementsByClassName('wb-navigation-total')
    ).forEach((navigationTotalElement) => {
      const navigationContainer = navigationTotalElement.closest(
        '.wb-navigation-section'
      );
      const navigationType = navigationContainer.getAttribute(
        'data-navigation-type'
      );
      navigationTotalElement.textContent = cellCounts[navigationType];

      if (cellCounts[navigationType] === 0) {
        const currentPositionElement =
          navigationContainer.getElementsByClassName(
            'wb-navigation-position'
          )?.[0];
        if (typeof currentPositionElement === 'object')
          currentPositionElement.textContent = '0';
      }
    });

    const uploadButton = this.$el.find('.wb-upload');
    if (
      !uploadButton.attr('disabled') ||
      uploadButton.attr('title') === wbText('uploadUnavailableWhileHasErrors')
    ) {
      const hasErrors = cellCounts.invalidCells > 0;
      uploadButton.prop('disabled', hasErrors);
      uploadButton.attr(
        'title',
        hasErrors ? wbText('uploadUnavailableWhileHasErrors') : undefined
      );
    }

    if (this.refreshInitiatedBy) this.operationCompletedMessage(cellCounts);
  },
  operationCompletedMessage(cellCounts) {
    if (!this.refreshInitiatedBy) return;

    const messages = {
      validate:
        cellCounts.invalidCells === 0
          ? {
              header: wbText('validationNoErrorsDialogHeader'),
              message: wbText('validationNoErrorsDialogText'),
            }
          : {
              header: wbText('validationErrorsDialogHeader'),
              message: wbText('validationErrorsDialogText'),
            },
      upload:
        cellCounts.invalidCells === 0
          ? {
              header: wbText('uploadNoErrorsDialogHeader'),
              message: wbText('uploadNoErrorsDialogText'),
            }
          : {
              header: wbText('uploadErrorsDialogHeader'),
              message: wbText('uploadErrorsDialogText'),
            },
      unupload: {
        header: wbText('dataSetRollbackDialogHeader'),
        message: wbText('dataSetRollbackDialogText'),
      },
    };

    const dialog = showDialog({
      header: messages[this.refreshInitiatedBy].header,
      content: messages[this.refreshInitiatedBy].message,
      onClose: () => dialog.remove(),
      buttons: commonText('close'),
    });

    this.refreshInitiatedBy = undefined;
    this.refreshInitiatorAborted = false;
  },
  operationAbortedMessage() {
    if (!this.refreshInitiatedBy || !this.refreshInitiatorAborted) return;

    const dialog = showDialog({
      header:
        this.refreshInitiatedBy === 'validate'
          ? wbText('validationCanceledDialogHeader')
          : this.refreshInitiatedBy === 'unupload'
          ? wbText('rollbackCanceledDialogHeader')
          : wbText('uploadCanceledDialogHeader'),
      content:
        this.refreshInitiatedBy === 'validate'
          ? wbText('validationCanceledDialogText')
          : this.refreshInitiatedBy === 'unupload'
          ? wbText('rollbackCanceledDialogText')
          : wbText('uploadCanceledDialogText'),
      onClose: () => dialog.remove(),
      buttons: commonText('close'),
    });
    this.refreshInitiatedBy = undefined;
    this.refreshInitiatorAborted = false;
  },
  /*
   * Returns this.cellMeta, but instead of indexing by physical row/col,
   * indexes by visual row/col
   *
   * This is used for navigation among cells.
   *
   * Also, if navigation direction is set to ColByCol, the resulting array
   * is transposed.
   *
   * this.flushIndexedCellData is set to true whenever visual indexes change
   *
   */
  getCellMetaObject() {
    if (this.flushIndexedCellData) {
      const resolveIndex = (visualRow, visualCol, first) =>
        (this.wbutils.searchPreferences.navigation.direction === 'rowFirst') ===
        first
          ? visualRow
          : visualCol;

      const indexedCellMeta = [];
      Object.entries(this.cellMeta).forEach(([physicalRow, metaRow]) =>
        Object.entries(metaRow).forEach(([physicalCol, cellMeta]) => {
          const visualRow = this.hot.toVisualRow(physicalRow | 0);
          const visualCol = this.hot.toVisualColumn(physicalCol | 0);
          indexedCellMeta[resolveIndex(visualRow, visualCol, true)] ??= [];
          indexedCellMeta[resolveIndex(visualRow, visualCol, true)][
            resolveIndex(visualRow, visualCol, false)
          ] = cellMeta;
        })
      );
      this.indexedCellMeta = indexedCellMeta;
    }
    this.flushIndexedCellData = false;
    return this.indexedCellMeta;
  },
});

const extractDefaultValues = (splitMappingPaths, emptyStringReplacement) =>
  Object.fromEntries(
    splitMappingPaths
      .map(({ headerName, columnOptions }) => [
        headerName,
        columnOptions.default === ''
          ? emptyStringReplacement
          : columnOptions.default,
      ])
      .filter(([, defaultValue]) => defaultValue !== null)
  );
