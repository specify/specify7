'use strict';

require('../css/workbench.css');

const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('./backbone.js');
const Q = require('q');
const Handsontable = require('handsontable').default;
const Papa = require('papaparse');

require('handsontable/dist/handsontable.full.css');

const schema = require('./schema.js');
const app = require('./specifyapp.js');
const userInfo = require('./userinfo.js');
const DataSetMeta = require('./datasetmeta.js').default;
const navigation = require('./navigation.js');
const NotFoundView = require('./notfoundview.js');
const WBUploadedView = require('./components/wbuploadedview').default;
const dataModelStorage = require('./wbplanviewmodel').default;
const WBStatus = require('./components/wbstatus').default;
const WBUtils = require('./wbutils.js');
const {
  valueIsTreeRank,
  mappingPathToString,
  getNameFromTreeRankName,
  formatReferenceItem,
  formatTreeRank,
} = require('./wbplanviewmappinghelper');
const {
  mappingsTreeToArrayOfSplitMappings,
} = require('./wbplanviewtreehelper');
const { uploadPlanToMappingsTree } = require('./uploadplantomappingstree');
const { extractDefaultValues } = require('./wbplanviewhelper');
const { getTableFromMappingPath } = require('./wbplanviewnavigator');
const fetchDataModelPromise = require('./wbplanviewmodelfetcher').default;
const { capitalize } = require('./wbplanviewhelper');
const icons = require('./icons.js');
const formatObj = require('./dataobjformatters.js').format;
const template = require('./templates/wbview.html');
const cache = require('./cache');
const wbText = require('./localization/workbench').default;
const commonText = require('./localization/common').default;

const getDefaultCellMeta = () => ({
  // The value in this cell would be used to create a new record
  isNew: false,
  // This cell has been modified since last change
  isModified: false,
  // Whether the cells matches search query
  isSearchResult: false,
  // List of strings representing the validation errors
  issues: [],
});

const WBView = Backbone.View.extend({
  __name__: 'WbForm',
  tagName: 'section',
  className: 'wbs-form content-no-shadow',
  events: {
    'click .wb-upload': 'upload',
    'click .wb-validate': 'upload',
    'click .wb-data-check': 'toggleDataCheck',
    'click .wb-plan': 'openPlan',
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
    this.originalData = this.data.map((row) => Array.from(row));
    if (this.data.length < 1) {
      this.data.push(Array(this.dataset.columns.length).fill(null));
    }

    this.mappings = undefined;
    this.validationMode = this.dataset.rowresults == null ? 'off' : 'static';
    this.liveValidationStack = [];
    this.liveValidationActive = false;
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

    this.datasetmeta = new DataSetMeta({
      dataset: this.dataset,
      el: this.el,
      getRowCount: () =>
        typeof this.hot === 'undefined'
          ? this.dataset.rows.length
          : this.hot.countRows() - this.hot.countEmptyRows(true),
    });

    /*
     * Add the "Uploaded" label next to DS Name
     * Disable cell editing
     * Disable adding/removing rows
     * Allow column sort
     * Allow column move
     * */
    this.isUploaded =
      this.dataset.uploadresult !== null && this.dataset.uploadresult.success;
    // Disallow all editing while this dialog is open
    this.uploadedView = undefined;
    // Disallow all editing while this dialog is open
    this.coordinateConverterView = undefined;

    this.refreshInitiatedBy = refreshInitiatedBy;
    this.refreshInitiatorAborted = refreshInitiatorAborted;
    this.uploadResults = {
      ambiguousMatches: [],
      recordCounts: {},
      newRecords: {},
    };

    /*
     * Throttle cell count update depending on the DS size (between 10ms and 2s)
     * Even if throttling may not be needed for small Data Sets, wrapping the
     * function in _.throttle allows to not worry about calling it several
     * time in a very short amount of time.
     * */
    const throttleRate = Math.ceil(
      Math.min(2000, Math.max(10, this.data.length / 10))
    );
    this.updateCellInfoStats = _.throttle(
      this.updateCellInfoStats,
      throttleRate
    );
    this.handleResize = _.throttle(() => this.hot?.render(), throttleRate);
  },
  render() {
    this.$el.append(
      template({
        is_uploaded: this.isUploaded,
        is_manager: userInfo.usertype === 'Manager',
        wbText,
        commonText,
      })
    );

    document.body.classList.add('overflow-x-hidden');

    this.datasetmeta.render();

    if (this.dataset.uploaderstatus) this.openStatus();

    this.cellMeta = Array.from({ length: this.dataset.rows.length }, () =>
      Array.from({ length: this.dataset.columns.length }, getDefaultCellMeta)
    );

    if (this.refreshInitiatedBy && this.refreshInitiatorAborted)
      this.operationAbortedMessage();

    const initDataModelIntegration = () =>
      this.hot.batch(() => {
        if (!this.isUploaded && !(this.mappings?.arrayOfMappings.length > 0)) {
          $(`<div>
              ${wbText('noUploadPlanDialogHeader')}
              <p>${wbText('noUploadPlanDialogMessage')}</p>
          </div>`).dialog({
            title: wbText('noUploadPlanDialogTitle'),
            modal: true,
            buttons: {
              [commonText('close')]: function () {
                $(this).dialog('close');
              },
              [commonText('create')]: this.openPlan.bind(this),
            },
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

        // These methods update HOT's cells settings, which resets meta data
        // Thus, need to run them first
        this.identifyDefaultValues();
        this.identifyPickLists();

        if (this.dataset.rowresults) this.getValidationResults();

        // The rest goes in order of importance
        this.identifyMappedHeaders();
        if (this.dataset.visualorder?.some((column, index) => column !== index))
          this.hot.updateSettings({
            manualColumnMove: this.dataset.visualorder,
          });
        this.fetchSortConfig();
        this.wbutils.findLocalityColumns();
        this.identifyCoordinateColumns();
        this.identifyTreeRanks();

        this.trigger('loaded');
        this.hotIsReady = true;

        this.hotCommentsContainer =
          document.getElementsByClassName('htComments')[0];
      });

    this.initHot().then(() => {
      if (this.dataset.uploadplan) {
        fetchDataModelPromise().then(() => {
          this.mappings = uploadPlanToMappingsTree(
            this.dataset.columns,
            this.dataset.uploadplan
          );
          this.mappings.arrayOfMappings = mappingsTreeToArrayOfSplitMappings(
            this.mappings.mappingsTree
          );

          this.mappings.tableNames = this.mappings.arrayOfMappings.map(
            ({ mappingPath }) =>
              getTableFromMappingPath({
                baseTableName: this.mappings.baseTableName,
                mappingPath: mappingPath.slice(0, -1),
              })
          );

          initDataModelIntegration();
        });
      } else initDataModelIntegration();
    });

    this.updateValidationButton();
    if (this.validationMode === 'static')
      this.wbutils.toggleCellTypes('invalidCells', 'remove');

    this.flushIndexedCellData = true;
    window.addEventListener('resize', this.handleResize);

    return this;
  },
  initHot() {
    return new Promise((resolve) =>
      setTimeout(() => {
        this.hot = new Handsontable(this.$('.wb-spreadsheet')[0], {
          data: this.data,
          columns: Array.from(
            { length: this.dataset.columns.length + 1 },
            (_, physicalCol) => ({
              data: physicalCol,
            })
          ),
          colHeaders: (physicalCol) => {
            const tableIcon = this.mappings?.mappedHeaders?.[physicalCol];
            const isMapped = typeof tableIcon !== 'undefined';
            const tableName =
              tableIcon?.split('/').slice(-1)?.[0]?.split('.')?.[0] ||
              tableIcon;
            return `<div class="wb-col-header">
              ${
                isMapped
                  ? `<img
                      class="wb-header-icon"
                      alt="${tableName}"
                      src="${tableIcon}"
                    >`
                  : `<img
                      class="wb-header-icon"
                      alt="Unmapped Header"
                      src="/static/img/stop_sign.svg"
                    >`
              }
              <span class="wb-header-name columnSorting">
                  ${this.dataset.columns[physicalCol]}
              </span>
            </div>`;
          },
          hiddenColumns: {
            // hide the disambiguation column
            columns: [this.dataset.columns.length],
            indicators: false,
            copyPasteEnabled: false,
          },
          hiddenRows: {
            rows: [],
            indicators: false,
            copyPasteEnabled: false,
          },
          minSpareRows: 1,
          comments: {
            displayDelay: 100,
          },
          commentedCellClassName: 'htCommentCell wb-invalid-cell',
          invalidCellClassName: '-',
          rowHeaders: true,
          autoWrapCol: false,
          autoWrapRow: false,
          manualColumnResize: true,
          manualColumnMove: true,
          outsideClickDeselects: false,
          multiColumnSorting: true,
          sortIndicator: true,
          contextMenu: {
            items: this.isUploaded
              ? {
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
                        typeof createdRecords === 'undefined' ||
                        this.cellMeta[physicalRow]?.[physicalCol]?.isNew !==
                          true
                      ) {
                        wrapper.textContent = wbText(
                          'noUploadResultsAvailable'
                        );
                        wrapper.style.whiteSpace = 'white-space';
                        wrapper.parentElement.classList.add('htDisabled');
                        const span = document.createElement('span');
                        span.style.display = 'none';
                        return span;
                      }

                      wrapper.classList.add('wb-uploaded-view-context-menu');
                      wrapper.innerHTML = createdRecords
                        .map(([tableName, recordId, label]) => {
                          const tableLabel =
                            label === ''
                              ? dataModelStorage.tables[tableName].label
                              : label;
                          const tableIcon = icons.getIcon(tableName);

                          return `<a
                            href="/specify/view/${tableName}/${recordId}/"
                            target="_blank"
                          >
                            <div
                              class="table-icon table-icon-image"
                              role="img"
                              style="background-image: url('${tableIcon}')"
                              title="${tableLabel}"
                              aria-label="${tableLabel}"
                            ></div>
                            ${tableLabel}
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
                      this.uploadedView || this.coordinateConverterView,
                  },
                  row_below: {
                    disabled: () =>
                      this.uploadedView || this.coordinateConverterView,
                  },
                  remove_row: {
                    disabled: () => {
                      // If readonly
                      if (this.uploadedView || this.coordinateConverterView)
                        return true;
                      // or if called on the last row
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
                      !this.isAmbiguousCell(),
                    callback: (__, selection) =>
                      this.disambiguateCell(selection),
                  },
                  separator_1: '---------',
                  fill_down: this.wbutils.fillCellsContextMenuItem(
                    wbText('fillDown'),
                    this.wbutils.fillDown,
                    () => this.uploadedView || this.coordinateConverterView
                  ),
                  fill_up: this.wbutils.fillCellsContextMenuItem(
                    wbText('fillUp'),
                    this.wbutils.fillUp,
                    () => this.uploadedView || this.coordinateConverterView
                  ),
                  separator_2: '---------',
                  undo: {
                    disabled: () =>
                      this.uploadedView || !this.hot.isUndoAvailable(),
                  },
                  redo: {
                    disabled: () =>
                      this.uploadedView || !this.hot.isRedoAvailable(),
                  },
                },
          },
          licenseKey: 'non-commercial-and-evaluation',
          stretchH: 'all',
          readOnly: this.isUploaded,
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
  remove() {
    this.hot.destroy();
    this.liveValidationStack = [];
    this.liveValidationActive = false;
    this.validationMode = 'off';
    window.removeEventListener('resize', this.handleResize);
    document.body.classList.remove('overflow-x-hidden');
    Backbone.View.prototype.remove.call(this);
  },
  identifyMappedHeaders() {
    if (!this.mappings) return;

    this.mappings.mappedHeaders = Object.fromEntries(
      this.mappings.tableNames.map((tableName, index) => [
        // physicalCol
        this.dataset.columns.indexOf(
          this.mappings.arrayOfMappings[index].headerName
        ),
        icons.getIcon(tableName),
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
        typeof this.mappings.arrayOfMappings === 'undefined'
          ? {}
          : extractDefaultValues(this.mappings.arrayOfMappings, true)
      ).map(([headerName, defaultValue]) => [
        this.dataset.columns.indexOf(headerName),
        defaultValue,
      ])
    );

    this.hot.updateSettings({
      columns: (index) =>
        typeof this.mappings.defaultValues[index] === 'undefined'
          ? {}
          : { placeholder: this.mappings.defaultValues[index] },
    });
  },
  identifyPickLists() {
    if (!this.mappings) return;
    const pickLists = Object.fromEntries(
      this.mappings.tableNames
        .map((tableName, index) => ({
          tableName,
          fieldName:
            this.mappings.arrayOfMappings[index].mappingPath.slice(-1)[0],
          headerName: this.mappings.arrayOfMappings[index].headerName,
        }))
        .map(({ tableName, fieldName, headerName }) => ({
          physicalCol: this.dataset.columns.indexOf(headerName),
          pickList:
            dataModelStorage.tables[tableName].fields[fieldName].pickList,
        }))
        .filter(({ pickList }) => typeof pickList !== 'undefined')
        .map(Object.values)
    );
    this.hot.updateSettings({
      cells: (_physicalRow, physicalCol, _prop) =>
        physicalCol in pickLists
          ? {
              type: 'autocomplete',
              source: pickLists[physicalCol].items,
              strict: pickLists[physicalCol].readOnly,
              allowInvalid: true,
              filter: false,
              trimDropdown: false,
            }
          : { type: 'text' },
    });
  },
  identifyTreeRanks() {
    if (!this.mappings) return;

    this.mappings.treeRanks = Object.values(
      this.mappings.arrayOfMappings
        .map((splitMappingPath, index) => ({
          ...splitMappingPath,
          index,
        }))
        .filter(
          ({ mappingPath }) =>
            valueIsTreeRank(mappingPath.slice(-2)[0]) &&
            mappingPath.slice(-1)[0] === 'name'
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
          rankId: Object.keys(dataModelStorage.ranks[tableName]).indexOf(
            rankName
          ),
        }))
        .reduce((groupedRanks, { mappingGroup, ...rankMapping }) => {
          groupedRanks[mappingGroup] ??= [];
          groupedRanks[mappingGroup].push(rankMapping);
          return groupedRanks;
        }, {})
    );
  },
  async fetchSortConfig() {
    const currentCollection = await cache.getCurrentCollectionId();
    const sortConfig = cache.get(
      'workbench-sort-config',
      `${currentCollection}_${this.dataset.id}`
    );
    if (!Array.isArray(sortConfig)) return;
    const visualSortConfig = sortConfig.map(({ physicalCol, ...rest }) => ({
      ...rest,
      column: this.hot.toVisualColumn(physicalCol),
    }));
    this.getHotPlugin('multiColumnSorting').sort(visualSortConfig);
  },

  // Hooks
  afterRenderer(td, visualRow, visualCol, _prop, _value) {
    if (typeof this.hot === 'undefined') {
      td.classList.add('wb-cell-unmapped');
      return;
    }
    const physicalRow = this.hot.toPhysicalRow(visualRow);
    const physicalCol = this.hot.toPhysicalColumn(visualCol);
    if (physicalCol >= this.dataset.columns.length) return;
    const cellProperties = this.cellMeta[physicalRow][physicalCol];
    if (cellProperties.isModified)
      this.updateCellMeta(physicalRow, physicalCol, 'isModified', true, {
        cell: td,
        forceReRender: true,
        visualRow,
        visualCol,
      });
    if (cellProperties.isNew)
      this.updateCellMeta(physicalRow, physicalCol, 'isNew', true, {
        cell: td,
        forceReRender: true,
        visualRow,
        visualCol,
      });
    if (cellProperties.isSearchResult)
      this.updateCellMeta(physicalRow, physicalCol, 'isSearchResult', true, {
        cell: td,
        forceReRender: true,
        visualRow,
        visualCol,
      });
    if (typeof this.mappings?.mappedHeaders?.[physicalCol] === 'undefined')
      td.classList.add('wb-cell-unmapped');
    if (typeof this.mappings?.coordinateColumns?.[physicalCol] !== 'undefined')
      td.classList.add('wb-coordinate-cell');
  },
  beforeValidate(value, _visualRow, prop) {
    if (value) return value;

    const visualCol = this.hot.propToCol(prop);
    const physicalCol = this.hot.toPhysicalColumn(visualCol);

    return typeof this.mappings?.defaultValues[physicalCol] === 'undefined'
      ? value
      : this.mappings.defaultValues[physicalCol];
  },
  afterValidate(isValid, value, visualRow, prop) {
    const visualCol = this.hot.propToCol(prop);

    const physicalRow = this.hot.toPhysicalRow(visualRow);
    const physicalCol = this.hot.toPhysicalColumn(visualCol);
    const issues = this.cellMeta[physicalRow]?.[physicalCol]?.['issues'] ?? [];
    const newIssues = [
      ...new Set([
        ...(isValid ? [] : [wbText('picklistValidationFailed')(value)]),
        ...issues.filter(
          (issue) => !issue.endsWith(wbText('picklistValidationFailed')(''))
        ),
      ]),
    ];
    if (JSON.stringify(issues) !== JSON.stringify(newIssues))
      this.updateCellMeta(physicalRow, physicalCol, 'issues', newIssues);
  },
  afterUndo(data) {
    this.afterUndoRedo('undo', data);
  },
  afterRedo(data) {
    this.afterUndoRedo('redo', data);
  },
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
     * Disambiguation results are cleared when value in that row changes.
     * That change creates a separate point in the undo stack.
     * Thus, if HOT tries to undo disambiguation clearing, we need to
     * also undo the change that caused the clearing in the first place
     * */
    if (
      type === 'undo' &&
      Object.keys(newValue ?? {}).length !== 0 &&
      Object.keys(oldValue ?? {}).length === 0
    )
      setTimeout(() => {
        this.undoRedoIsHandled = true;
        this.hot.undo();
        this.undoRedoIsHandled = false;
        this.afterChangeDisambiguation(physicalRow);
      }, 0);
    else this.afterChangeDisambiguation(physicalRow);
  },
  beforePaste() {
    return !this.uploadedView && !this.isUploaded;
  },
  beforeChange(unfilteredChanges, source) {
    if (source !== 'CopyPaste.paste') return true;
    /*
     * This logic shouldn't be put into beforePaste because it receives
     * arguments that are inconvenient to work with
     * */

    const filteredChanges = unfilteredChanges.filter(
      ([, prop]) => prop < this.dataset.columns.length
    );
    if (filteredChanges.length === unfilteredChanges.length) return true;
    this.hot.setDataAtCell(
      filteredChanges.map(([visualRow, prop, _oldValue, newValue]) => [
        visualRow,
        this.hot.propToCol(prop),
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
      .map(([visualRow, prop, oldValue, newValue]) => ({
        visualRow,
        visualCol: this.hot.propToCol(prop),
        physicalRow: this.hot.toPhysicalRow(visualRow),
        physicalCol: this.hot.toPhysicalColumn(this.hot.propToCol(prop)),
        oldValue,
        newValue,
      }))
      .filter(
        ({ oldValue, newValue, visualCol }) =>
          // Ignore cases when value didn't change
          oldValue !== newValue &&
          // or when value changed from null to empty
          (oldValue !== null || newValue !== '') &&
          // or the column does not exist
          visualCol < this.dataset.columns.length
      );

    if (changes.length === 0) return;

    const changedRows = new Set(
      changes
        // Ignore changes to unmapped columns
        .filter(
          ({ physicalCol }) =>
            this.mappings?.arrayOfMappings.findIndex(
              ({ headerName }) =>
                this.dataset.columns.indexOf(headerName) === physicalCol
            ) !== -1
        )
        .sort(
          ({ visualRow: visualRowLeft }, { visualRow: visualRowRight }) =>
            visualRowLeft > visualRowRight
        )
        .map(({ physicalRow }) => physicalRow)
    );

    if (!this.undoRedoIsHandled)
      changedRows.forEach((physicalRow) =>
        this.clearDisambiguation(physicalRow)
      );

    changes.forEach(
      ({ physicalRow, physicalCol, newValue, visualRow, visualCol }) => {
        this.recalculateIsModifiedState(physicalRow, physicalCol, {
          visualRow,
          visualCol,
        });
        if (
          this.wbutils.searchPreferences.search.liveUpdate &&
          this.wbutils.searchQuery !== ''
        )
          this.updateCellMeta(
            physicalRow,
            physicalCol,
            'isSearchResult',
            this.wbutils.searchFunction(this.wbutils.searchQuery, newValue),
            { visualRow, visualCol }
          );
      }
    );

    this.spreadSheetChanged();
    void this.updateCellInfoStats();

    if (this.dataset.uploadplan)
      changedRows.forEach((physicalRow) => this.startValidateRow(physicalRow));
  },
  beforeCreateRow(visualRowStart, amount, source) {
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
     * */

    const addedRows = Array.from(
      { length: amount },
      (_, index) =>
        /*
         * If HOT is not yet initialized, we can assume that physical row order
         * and visual row order is the same
         */
        this.hot?.toPhysicalRow(visualRowStart + index) ??
        visualRowStart + index
    ).sort();

    this.flushIndexedCellData = true;
    addedRows.forEach((physicalRow) => {
      this.cellMeta = [
        ...this.cellMeta.slice(0, physicalRow),
        this.dataset.columns.map(getDefaultCellMeta),
        ...this.cellMeta.slice(physicalRow),
      ];
    });
    if (this.hotIsReady && source !== 'auto') this.spreadSheetChanged();

    return true;
  },
  beforeRemoveRow(visualRowStart, amount, source) {
    const removedRows = Array.from({ length: amount }, (_, index) =>
      this.hot.toPhysicalRow(visualRowStart + index)
    );
    this.liveValidationStack = this.liveValidationStack.filter(
      (physicalRow) => !removedRows.includes(physicalRow)
    );

    this.flushIndexedCellData = true;
    this.cellMeta = this.cellMeta.filter(
      (_, physicalRow) => !removedRows.includes(physicalRow)
    );

    if (this.hotIsReady && source !== 'auto') {
      this.spreadSheetChanged();
      void this.updateCellInfoStats();
    }

    return true;
  },
  beforeColumnSort(currentSortConfig, newSortConfig) {
    this.flushIndexedCellData = true;

    /*
     * If a tree column is about to be sorted, overwrite the sort config by
     * finding all lower level ranks of that tree and sorting them in the same
     * direction
     * */

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
            .filter(({ rankId }) => typeof rankId !== 'undefined')?.[0],
        }))
        // Filter out columns that aren't tree ranks
        .filter(({ rankGroup }) => typeof rankGroup !== 'undefined')
        /*
         * Filter out columns that didn't change
         * In the end, there should only be 0 or 1 columns
         * */
        .filter(({ sortOrder, visualCol }) => {
          const deltaColumnState = deltaSearchConfig.find(
            ({ column }) => column === visualCol
          );
          return (
            typeof deltaColumnState === 'undefined' ||
            deltaColumnState.sortOrder !== sortOrder
          );
        })[0];

    let changedTreeColumn = findTreeColumns(newSortConfig, currentSortConfig);
    let newSortOrderIsUnset = false;

    if (typeof changedTreeColumn === 'undefined') {
      changedTreeColumn = findTreeColumns(currentSortConfig, newSortConfig);
      newSortOrderIsUnset = true;
    }

    if (typeof changedTreeColumn === 'undefined') return true;

    /*
     * Filter out columns with higher rank than the changed column
     * (lower rankId corresponds to a higher tree rank)
     * */
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
  async afterColumnSort(_previousSortConfig, sortConfig) {
    const currentCollection = await cache.getCurrentCollectionId();
    const physicalSortConfig = sortConfig.map(
      ({ column: visualCol, ...rest }) => ({
        ...rest,
        physicalCol: this.hot.toPhysicalColumn(visualCol),
      })
    );
    cache.set(
      'workbench-sort-config',
      `${currentCollection}_${this.dataset.id}`,
      physicalSortConfig,
      {
        overwrite: true,
      }
    );
  },
  beforeColumnMove(_columnIndexes, _finalIndex, dropIndex) {
    return (
      // Don't allow moving columns when readOnly
      !this.uploadedView &&
      !this.coordinateConverterView &&
      // An ugly fix for jQuery dialogs conflicting with HOT
      (typeof dropIndex !== 'undefined' || this.hotIsReady === false)
    );
  },
  afterColumnMove(_columnIndexes, _finalIndex, dropIndex) {
    if (typeof dropIndex === 'undefined' || !this.hotIsReady) return;

    this.flushIndexedCellData = true;

    const columnOrder = this.dataset.columns.map((_, visualCol) =>
      this.hot.toPhysicalColumn(visualCol)
    );

    if (
      this.dataset.visualorder == null ||
      columnOrder.some((i, j) => i !== this.dataset.visualorder[j])
    ) {
      this.dataset.visualorder = columnOrder;
      $.ajax(`/api/workbench/dataset/${this.dataset.id}/`, {
        type: 'PUT',
        data: JSON.stringify({ visualorder: columnOrder }),
        dataType: 'json',
        processData: false,
      }).fail(this.checkDeletedFail.bind(this));
    }
  },
  afterPaste(data, coords) {
    const lastCoords = coords.slice(-1)[0];
    if (data.some((row) => row.length === this.dataset.columns.length))
      // Do not scroll the viewport to the last column after inserting a row
      this.hot.scrollViewportTo(lastCoords.endRow, lastCoords.startCol);
  },
  // Reposition the comment box if it is overflowing
  afterOnCellMouseOver(_event, coordinates, cell) {
    const physicalRow = this.hot.toPhysicalRow(coordinates.row);
    const physicalCol = this.hot.toPhysicalColumn(coordinates.col);

    // Make sure cell has comments
    if (this.cellMeta[physicalRow]?.[physicalCol]?.issues.length === 0) return;

    const cellContainerBoundingBox = cell.getBoundingClientRect();
    const oneRem = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );

    // Make sure box is overflowing horizontally
    if (window.innerWidth > cellContainerBoundingBox.right + oneRem) return;

    this.hotCommentsContainer.style.setProperty(
      '--offset-right',
      `${Math.round(window.innerWidth - cellContainerBoundingBox.x)}px`
    );
    this.hotCommentsContainer.classList.add('repositioned');
    if (this.hotCommentsContainerRepositionCallback) {
      clearTimeout(this.hotCommentsContainerRepositionCallback);
      this.hotCommentsContainerRepositionCallback = undefined;
    }
  },
  /*
   * Revert comment box's position to original state if needed.
   * The 10ms delay helps prevent visual artifacts when the mouse pointer
   * moves between cells.
   * */
  afterOnCellMouseOut() {
    if (this.hotCommentsContainerRepositionCallback)
      clearTimeout(this.hotCommentsContainerRepositionCallback);
    if (
      this.hotCommentsContainer.style.getPropertyValue('--offset-right') !== ''
    )
      this.hotCommentsContainerRepositionCallback = setTimeout(
        () => this.hotCommentsContainer.classList.remove('repositioned'),
        10
      );
  },
  cellIsModified(physicalRow, physicalCol) {
    // For now, only readonly picklists are validated on the front-end
    const hasFrontEndValidationErrors = this.cellMeta[physicalRow][
      physicalCol
    ].issues.some((issue) =>
      issue.endsWith(wbText('picklistValidationFailed')(''))
    );
    if (hasFrontEndValidationErrors) return false;

    const cellValueChanged =
      `${this.originalData[physicalRow]?.[physicalCol] ?? ''}` !==
      `${this.data[physicalRow][physicalCol] ?? ''}`;
    if (cellValueChanged) return true;

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
    const isModified = this.cellIsModified(physicalRow, physicalCol);
    if (this.cellMeta[physicalRow][physicalCol]['isModified'] !== isModified)
      this.updateCellMeta(physicalRow, physicalCol, 'isModified', isModified, {
        visualRow,
        visualCol,
      });
  },
  updateCellMeta(
    physicalRow,
    physicalCol,
    key,
    value,
    {
      // Can optionally specify this to improve the performance
      cell: initialCell = undefined,
      /*
       * Whether to try fetch cell and reRender it if there was meta value
       * change.
       * This is set to false only in WbUtils.searchCells when it knows
       * for sure that cell is outside the viewport
       * */
      render = true,
      /*
       * Whether to run the effect even if meta value did not change
       * Used inside of afterRenderer to apply meta styles to newly created
       * cell
       * */
      forceReRender = false,
      // Can optionally provide this to improve performance
      visualRow: initialVisualRow = undefined,
      // Can optionally provide this to improve performance
      visualCol: initialVisualCol = undefined,
    } = {}
  ) {
    const visualRow = initialVisualRow ?? this.hot.toVisualRow(physicalRow);
    const visualCol = initialVisualCol ?? this.hot.toVisualColumn(physicalCol);
    const cell =
      render && typeof initialCell === 'undefined'
        ? this.hot.getCell(visualRow, visualCol)
        : initialCell;

    // Current value of the meta property
    const currentValue = this.cellMeta[physicalRow][physicalCol][key];
    // The value for which to run the sideEffect
    let effectValue = value;
    // The value to store in the metaObject
    let metaValue = value;

    // side effects
    const effects = {
      isNew: (value) =>
        cell?.classList[value === true ? 'add' : 'remove']('wb-no-match-cell'),
      isModified: (value) =>
        cell?.classList[value === true ? 'add' : 'remove']('wb-modified-cell'),
      isSearchResult: (value) =>
        cell?.classList[value === true ? 'add' : 'remove'](
          'wb-search-match-cell'
        ),
      issues: (value) => {
        cell?.classList[value.length === 0 ? 'remove' : 'add'](
          'wb-invalid-cell'
        );
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

    const valueIsChanged =
      (['isNew', 'isModified', 'isSearchResult'].includes(key) &&
        currentValue !== metaValue) ||
      (key === 'issues' &&
        (currentValue.length !== metaValue.length ||
          JSON.stringify(currentValue) !== JSON.stringify(metaValue)));

    // Do not run the side effect if state is already in it's correct position,
    // unless asked to forceReRender
    if (render && (forceReRender || valueIsChanged)) effects[key](effectValue);

    this.cellMeta[physicalRow][physicalCol][key] = metaValue;

    if (valueIsChanged) this.flushIndexedCellData = true;
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
  disambiguateCell([
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
    const tableName = getTableFromMappingPath({
      baseTableName: this.mappings.baseTableName,
      mappingPath: matches.mappingPath,
    });
    const model = schema.getModel(tableName);
    const resources = new model.LazyCollection({
      filters: { id__in: matches.ids.join(',') },
    });

    const doDA = (selected) => {
      this.setDisambiguation(
        physicalRow,
        matches.mappingPath,
        parseInt(selected, 10)
      );
      this.startValidateRow(physicalRow);
    };
    const doAll = (selected) => {
      // loop backwards so the live validation will go from top to bottom
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
          parseInt(selected, 10)
        );
        this.startValidateRow(physicalRow);
      }
    };

    const content = $('<div class="da-container">');
    resources.fetch({ limit: 0 }).done(() => {
      if (resources.length < 1) {
        $(`<div>
            ${wbText('noDisambiguationResultsDialogHeader')}
            <p>${wbText('noDisambiguationResultsDialogMessage')}</p>
        </div>`).dialog({
          title: wbText('noDisambiguationResultsDialogTitle'),
          modal: true,
          close() {
            $(this).remove();
          },
          buttons: [
            {
              text: commonText('close'),
              click() {
                $(this).dialog('close');
              },
            },
          ],
        });
        return;
      }

      resources.forEach((resource) => {
        const row = $(
          `<label class="da-row">
            <input
              type="radio"
              class="da-option"
              name="disambiguate" value="${resource.id}"
            >
            <span class="label">${resource.id}</span>
            <a
              href="${resource.viewUrl()}"
              target="_blank"
            >ℹ️</a>
          <label/>`
        ).appendTo(content);
        if (model.getField('rankid')) {
          resource
            .rget('parent.fullname')
            .done((parentName) =>
              row
                .find('.label')
                .text(`${resource.get('fullname')} (in ${parentName})`)
            );
        } else {
          formatObj(resource).done((formatted) =>
            row.find('.label').text(formatted)
          );
        }
      });

      const dialog = $('<div>')
        .append(content)
        .dialog({
          title: wbText('disambiguationDialogTitle'),
          minWidth: 400,
          minHeight: 300,
          modal: true,
          close() {
            $(this).remove();
            clearInterval(interval);
          },
          buttons: [
            {
              text: commonText('close'),
              click() {
                $(this).dialog('close');
              },
            },
            {
              text: commonText('apply'),
              click() {
                const selected = $('input.da-option:checked', this).val();
                if (selected != null) {
                  doDA(selected);
                  $(this).dialog('close');
                }
              },
            },
            {
              id: 'applyAllButton',
              text: commonText('applyAll'),
              click() {
                const selected = $('input.da-option:checked', this).val();
                if (selected != null) {
                  doAll(selected);
                  $(this).dialog('close');
                }
              },
            },
          ],
        });

      let applyAllAvailable = true;
      const applyAllButton = dialog.parent().find('#applyAllButton');

      const updateIt = () => {
        const newState = this.liveValidationStack.length === 0;
        if (newState !== applyAllAvailable) {
          applyAllAvailable = newState;
          applyAllButton.button('option', 'disabled', !newState);
          applyAllButton[0][newState ? 'removeAttribute' : 'setAttribute'](
            'title',
            wbText('applyAllUnavailable')
          );
        }
      };

      const interval = setInterval(updateIt, 100);
    });
  },

  // Tools
  displayUploadedView() {
    if (!this.dataset.rowresults) return;

    if (typeof this.uploadedView !== 'undefined') {
      this.uploadedView.onClose();
      return;
    }

    if (this.liveValidationStack.length !== 0) {
      const dialog = $(`<div>
        ${wbText('unavailableWhileValidating')}
      </div>`).dialog({
        title: wbText('results'),
        modal: false,
        close: () => dialog.dialog('destroy'),
        buttons: [
          {
            text: commonText('close'),
            click: () => dialog.dialog('destroy'),
          },
        ],
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
      .filter((element) => typeof element !== 'undefined')
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
      this.hot.updateSettings({ readOnly: isReadOnly })
    );

    const initialHiddenRows = this.getHotPlugin('hiddenRows').getHiddenRows();
    const initialHiddenCols =
      this.getHotPlugin('hiddenColumns').getHiddenColumns();
    const rowsToInclude = new Set();
    const colsToInclude = new Set();
    this.cellMeta.forEach((rowMeta, physicalRow) =>
      rowMeta.forEach(({ isNew }, physicalCol) => {
        if (!isNew) return;
        rowsToInclude.add(physicalRow);
        colsToInclude.add(physicalCol);
      })
    );
    const rowsToHide = Array.from(
      { length: this.data.length },
      (_, physicalRow) => physicalRow
    )
      .filter(
        (physicalRow) =>
          !rowsToInclude.has(physicalRow) &&
          !initialHiddenRows.includes(physicalRow)
      )
      .map(this.hot.toVisualRow);
    const colsToHide = Array.from(
      { length: this.dataset.columns.length },
      (_, physicalCol) => physicalCol
    )
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

    const runEffects = () =>
      [...effects, this.hot.render.bind(this.hot)].forEach((effect) =>
        effect()
      );
    const runCleanup = () =>
      [...effectsCleanup, this.hot.render.bind(this.hot)].forEach(
        (effectCleanup) => effectCleanup()
      );

    const uploadedViewWrapper = this.el.getElementsByClassName(
      'wb-uploaded-view-wrapper'
    )[0];
    uploadedViewWrapper.style.display = '';
    uploadedViewWrapper.innerHTML = '<div></div>';

    this.uploadedView = new WBUploadedView({
      el: uploadedViewWrapper.children[0],
      recordCounts: this.uploadResults.recordCounts,
      isUploaded: this.isUploaded,
      onClose: () => {
        this.uploadedView.remove();
        this.uploadedView = undefined;
        uploadedViewWrapper.style.display = 'none';
        runCleanup();
      },
    }).render();

    runEffects();
  },
  openPlan() {
    navigation.go(`/workbench-plan/${this.dataset.id}/`);
  },
  showPlan() {
    const dataset = this.dataset;
    const $this = this;
    const planJson = JSON.stringify(dataset.uploadplan, null, 4);
    const dialog = $('<div>')
      .append($('<textarea cols="120" rows="50">').text(planJson))
      .dialog({
        title: wbText('dataMapper'),
        width: 'auto',
        modal: true,
        close() {
          $(this).remove();
        },
        buttons: {
          Save: () => {
            dataset.uploadplan = JSON.parse($('textarea', dialog).val());
            $.ajax(`/api/workbench/dataset/${dataset.id}/`, {
              type: 'PUT',
              data: JSON.stringify({ uploadplan: dataset.uploadplan }),
              dataType: 'json',
              processData: false,
            }).fail(this.checkDeletedFail.bind(this));
            dialog.dialog('close');
            $this.trigger('refresh');
          },
          Close: () => dialog.dialog('close'),
        },
      });
  },
  changeOwner() {
    this.datasetmeta.dataSetMeta.changeOwnerWindow.call(
      this.datasetmeta.dataSetMeta
    );
  },

  // Actions
  unupload() {
    const dialog = $(`<div>
      ${wbText('rollbackDialogHeader')}
      <p>${wbText('rollbackDialogMessage')}</p>
    </div>`).dialog({
      modal: true,
      title: wbText('rollbackDialogTitle'),
      close() {
        $(this).remove();
      },
      buttons: {
        [wbText('rollback')]: () => {
          if (typeof this.uploadedView !== 'undefined') {
            this.uploadedView.remove();
            this.uploadedView = undefined;
          }
          $.post(`/api/workbench/unupload/${this.dataset.id}/`).then(() =>
            this.openStatus('unupload')
          );
          dialog.remove();
        },
        [commonText('cancel')]() {
          $(this).remove();
        },
      },
    });
  },
  upload(evt) {
    const mode = $(evt.currentTarget).is('.wb-upload') ? 'upload' : 'validate';
    if (this.mappings?.arrayOfMappings.length > 0) {
      if (mode === 'upload') {
        const dialog = $(`<div>
          ${wbText('startUploadDialogHeader')}
          <p>${wbText('startUploadDialogMessage')}</p>
        </div>`).dialog({
          modal: true,
          title: wbText('startUploadDialogTitle'),
          close() {
            dialog.remove();
          },
          buttons: {
            [commonText('cancel')]() {
              dialog.remove();
            },
            [wbText('upload')]: () => {
              this.startUpload(mode);
              dialog.remove();
            },
          },
        });
      } else this.startUpload(mode);
    } else {
      $(`<div>
        ${wbText('noUploadPlanDialogHeader')}
        <p>${wbText('noUploadPlanDialogMessage')}</p>
      </div>`).dialog({
        title: wbText('noUploadPlanDialogTitle'),
        modal: true,
        buttons: {
          [commonText('close')]: function () {
            $(this).dialog('close');
          },
          [commonText('create')]: () => this.openPlan(),
        },
      });
    }
  },
  startUpload(mode) {
    this.clearAllMetaData();
    this.liveValidationStack = [];
    this.liveValidationActive = false;
    this.validationMode = 'off';
    this.updateValidationButton();
    $.post(`/api/workbench/${mode}/${this.dataset.id}/`)
      .fail((jqxhr) => {
        this.checkDeletedFail(jqxhr);
        this.checkConflictFail(jqxhr);
      })
      .done(() => {
        this.openStatus(mode);
      });
  },
  openStatus(mode) {
    this.wbstatus = new WBStatus({
      dataset: {
        ...this.dataset,
        // Create initial status if it doesn't yet exist
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
  delete: function () {
    const dialog = $(`<div>
      ${wbText('deleteDataSetDialogHeader')}
      <p>${wbText('deleteDataSetDialogMessage')}</p>
    </div>`).dialog({
      modal: true,
      title: wbText('deleteDataSetDialogTitle'),
      close: () => dialog.remove(),
      buttons: {
        [commonText('delete')]: () => {
          $.ajax(`/api/workbench/dataset/${this.dataset.id}/`, {
            type: 'DELETE',
          })
            .done(() => {
              this.$el.empty();
              dialog.dialog('close');

              $(`<div>
                ${wbText('dataSetDeletedHeader')}
                <p>${wbText('dataSetDeletedMessage')}</p>
              </div>`).dialog({
                title: wbText('dataSetDeletedTitle'),
                modal: true,
                close: () => navigation.go('/'),
                buttons: {
                  [commonText('close')]: function () {
                    $(this).dialog('close');
                  },
                },
              });
            })
            .fail((jqxhr) => {
              this.checkDeletedFail(jqxhr);
              dialog.dialog('close');
            });
        },
        [commonText('cancel')]: () => dialog.dialog('close'),
      },
    });
  },
  export() {
    const data = Papa.unparse({
      fields: this.dataset.columns,
      data: this.dataset.rows,
    });
    const wbName = this.dataset.name;
    const filename = wbName.match(/\.csv$/) ? wbName : wbName + '.csv';
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.setAttribute('download', filename);
    a.click();
  },
  revertChanges() {
    $(`<div>
      ${wbText('revertChangesDialogHeader')}
      <p>${wbText('revertChangesDialogMessage')}</p>
    </div>`).dialog({
      modal: true,
      title: wbText('revertChangesDialogTitle'),
      close() {
        $(this).remove();
      },
      buttons: {
        [commonText('cancel')]() {
          $(this).dialog('close');
        },
        [wbText('revert')]: () => {
          navigation.removeUnloadProtect(this);
          this.trigger('refresh');
        },
      },
    });
  },
  saveClicked: function () {
    this.save().done();
  },
  save: function () {
    // Clear validation
    this.clearAllMetaData();
    this.dataset.rowresults = null;
    this.validationMode = 'off';
    this.updateValidationButton();

    // Show saving progress bar
    const dialog = $('<div><div class="progress-bar"></div></div>').dialog({
      title: wbText('savingDialogTitle'),
      modal: true,
      dialogClass: 'ui-dialog-no-close',
      close() {
        $(this).remove();
      },
    });
    $('.progress-bar', dialog).progressbar({ value: false });

    //send data
    return Q(
      $.ajax(`/api/workbench/rows/${this.dataset.id}/`, {
        data: JSON.stringify(this.data),
        error: this.checkDeletedFail.bind(this),
        type: 'PUT',
      })
    )
      .then(() => {
        this.spreadSheetUpToDate();
      })
      .finally(() => dialog.dialog('close'));
  },

  // Validation
  toggleDataCheck(event) {
    this.validationMode = this.validationMode === 'live' ? 'off' : 'live';

    if (!(this.mappings?.arrayOfMappings.length > 0))
      this.validationMode = 'off';

    this.uploadResults = {
      ambiguousMatches: [],
      recordCounts: {},
      newRecords: {},
    };

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

    this.clearAllMetaData();
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
      Q(
        $.post(
          `/api/workbench/validate_row/${this.dataset.id}/`,
          JSON.stringify(rowData)
        )
      )
        .then((result) => this.gotRowValidationResult(physicalRow, result))
        .fin(pumpValidation);
    };

    if (!this.liveValidationActive) {
      pumpValidation();
    }
  },
  updateValidationButton() {
    if (this.validationMode === 'live')
      this.$('.wb-data-check').text(
        wbText('dataCheckOn')(this.liveValidationStack.length)
      );
    else {
      this.$('.wb-data-check').text(wbText('dataCheck'));
    }
  },
  gotRowValidationResult(physicalRow, result) {
    if (this.validationMode !== 'live' || this.hot.isDestroyed) return;
    this.uploadResults.ambiguousMatches[physicalRow] = [];
    this.hot.batch(() =>
      this.applyRowValidationResults(physicalRow, result?.result, true)
    );
    this.updateCellInfoStats();
  },
  getHeadersFromMappingPath(mappingPathFilter, persevering = true) {
    if (!persevering)
      return this.mappings.arrayOfMappings
        .filter(({ mappingPath }) =>
          mappingPathToString(mappingPath).startsWith(
            mappingPathToString(mappingPathFilter)
          )
        )
        .map(({ headerName }) => headerName);
    let columns;
    mappingPathFilter.some((_, index) => {
      columns = this.mappings.arrayOfMappings
        .filter(({ mappingPath }) =>
          mappingPathToString(mappingPath).startsWith(
            mappingPathToString(
              mappingPathFilter.slice(0, index === 0 ? undefined : -1 * index)
            )
          )
        )
        .map(({ headerName }) => headerName);
      return columns.length !== 0;
    });
    if (columns.length === 0)
      columns = this.mappings.arrayOfMappings.map(
        ({ headerName }) => headerName
      );
    if (columns.length === 0) columns = this.dataset.columns;
    return columns;
  },
  resolveValidationColumns(initialColumns, inferColumnsCallback = undefined) {
    // See https://github.com/specify/specify7/issues/810
    let columns = initialColumns.filter((column) => column);
    if (typeof inferColumnsCallback === 'function' && columns.length === 0)
      columns = inferColumnsCallback();
    return columns
      .map((column) => this.dataset.columns.indexOf(column))
      .filter((physicalCol) => physicalCol !== -1);
  },
  applyRowValidationResults(physicalRow, result, isLive) {
    const rowMeta = this.cellMeta[physicalRow];
    const newRowMeta = rowMeta.map((cellMeta) => ({
      ...getDefaultCellMeta(),
      isModified: (isLive && cellMeta.isModified) ?? false,
      isSearchResult: cellMeta.isSearchResult ?? false,
      issues: [],
    }));

    const setMeta = (key, value, columns, inferColumnsCallback) =>
      this.resolveValidationColumns(columns, inferColumnsCallback).forEach(
        (physicalCol) => {
          if (key === 'issues')
            newRowMeta[physicalCol][key].push(capitalize(value));
          else newRowMeta[physicalCol][key] = value;
        }
      );

    if (result) this.parseRowValidationResults(result, setMeta, physicalRow);

    newRowMeta.forEach((cellMeta, physicalCol) => {
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
        setMetaCallback('issues', issue, [column], mappingPath)
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
      setMetaCallback('isNew', true, statusData.info.columns);
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
          [...mappingPath, fieldName, formatReferenceItem(toManyIndex + 1)]
        )
      )
    );
  },
  getValidationResults() {
    if (typeof this.wbstatus !== 'undefined' || !this.mappings) return;

    if (this.dataset.rowresults === null) {
      this.validationMode = 'off';
      this.updateValidationButton();
      return;
    }

    this.hot.batch(() => {
      this.dataset.rowresults.forEach((result, physicalRow) => {
        this.applyRowValidationResults(physicalRow, result, false);
      });
    });

    void this.updateCellInfoStats();
  },

  // Helpers
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
    navigation.addUnloadProtect(this, wbText('onExitDialogMessage'));
  },
  checkDeletedFail(jqxhr) {
    if (!jqxhr.errorHandled && jqxhr.status === 404) {
      this.$el.empty().append(wbText('dataSetDeletedOrNotFound'));
      jqxhr.errorHandled = true;
    }
  },
  checkConflictFail(jqxhr) {
    if (!jqxhr.errorHandled && jqxhr.status === 409) {
      /*
       * Upload/Validation/Un-Upload has been initialized by another session
       * Need to reload the page to display the new state
       * */
      this.trigger('reload');
      jqxhr.errorHandled = true;
    }
  },
  spreadSheetUpToDate: function () {
    if (!this.hasUnSavedChanges) return;
    this.hasUnSavedChanges = false;
    this.$(
      '.wb-upload, .wb-validate, .wb-export-data-set, .wb-change-data-set-owner'
    )
      .prop('disabled', false)
      .prop('title', '');
    this.$('.wb-save').prop('disabled', true);
    this.$('.wb-revert').prop('disabled', true);
    navigation.removeUnloadProtect(this);
  },

  // MetaData
  async updateCellInfoStats() {
    const cellMeta = this.cellMeta.flat(2);

    const cellCounts = {
      newCells: cellMeta.reduce(
        (count, info) => count + (info.isNew ? 1 : 0),
        0
      ),
      invalidCells: cellMeta.reduce(
        (count, info) => count + (info.issues?.length ? 1 : 0),
        0
      ),
      searchResults: cellMeta.reduce(
        (count, info) => count + (info.isSearchResult ? 1 : 0),
        0
      ),
      modifiedCells: cellMeta.reduce(
        (count, info) => count + (info.isModified ? 1 : 0),
        0
      ),
    };

    //update navigation information
    Object.values(
      this.el.getElementsByClassName('wb-navigation-total')
    ).forEach((navigationTotalElement) => {
      const navigationContainer = navigationTotalElement.closest(
        '.wb-navigation-section'
      );
      const navigationType = navigationContainer.getAttribute(
        'data-navigation-type'
      );
      navigationTotalElement.innerText = cellCounts[navigationType];

      if (cellCounts[navigationType] === 0) {
        const currentPositionElement =
          navigationContainer.getElementsByClassName(
            'wb-navigation-position'
          )?.[0];
        if (currentPositionElement !== 'undefined')
          currentPositionElement.innerText = 0;
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
              title: wbText('validationNoErrorsDialogTitle'),
              header: wbText('validationNoErrorsDialogHeader'),
              message: wbText('validationNoErrorsDialogMessage'),
            }
          : {
              title: wbText('validationErrorsDialogTitle'),
              header: wbText('validationErrorsDialogHeader'),
              message: wbText('validationErrorsDialogMessage'),
            },
      upload:
        cellCounts.invalidCells === 0
          ? {
              title: wbText('uploadNoErrorsDialogTitle'),
              header: wbText('uploadNoErrorsDialogHeader'),
              message: wbText('uploadNoErrorsDialogMessage'),
            }
          : {
              title: wbText('uploadErrorsDialogTitle'),
              header: wbText('uploadErrorsDialogHeader'),
              message: wbText('uploadErrorsDialogMessage'),
            },
      unupload: {
        title: wbText('dataSetRollbackDialogTitle'),
        header: wbText('dataSetRollbackDialogHeader'),
        message: wbText('dataSetRollbackDialogMessage'),
      },
    };

    const title = messages[this.refreshInitiatedBy].title;
    const header = messages[this.refreshInitiatedBy].header;
    const message = messages[this.refreshInitiatedBy].message;
    const dialog = $(`<div>
        ${header}
        <p>${message}</p>
    </div>`).dialog({
      title,
      modal: true,
      width: 400,
      buttons: {
        [commonText('close')]: () => dialog.dialog('destroy'),
      },
    });

    this.refreshInitiatedBy = undefined;
    this.refreshInitiatorAborted = false;
  },
  operationAbortedMessage() {
    if (!this.refreshInitiatedBy || !this.refreshInitiatorAborted) return;

    const title =
      this.refreshInitiatedBy === 'validate'
        ? wbText('validationCanceledDialogTitle')
        : this.refreshInitiatedBy === 'unupload'
        ? wbText('rollbackCanceledDialogTitle')
        : wbText('uploadCanceledDialogTitle');
    const header =
      this.refreshInitiatedBy === 'validate'
        ? wbText('validationCanceledDialogHeader')
        : this.refreshInitiatedBy === 'unupload'
        ? wbText('rollbackCanceledDialogHeader')
        : wbText('uploadCanceledDialogHeader');
    const message =
      this.refreshInitiatedBy === 'validate'
        ? wbText('validationCanceledDialogMessage')
        : this.refreshInitiatedBy === 'unupload'
        ? wbText('rollbackCanceledDialogMessage')
        : wbText('uploadCanceledDialogMessage');

    const dialog = $(`<div>
      ${header}
      <p>${message}</p>
    </div>`).dialog({
      title,
      modal: true,
      width: 400,
      close: () => dialog.dialog('destroy'),
      buttons: {
        [commonText('close')]: () => dialog.dialog('destroy'),
      },
    });
    this.refreshInitiatedBy = undefined;
    this.refreshInitiatorAborted = false;
  },
  clearAllMetaData() {
    if (this.hot.isDestroyed) return;
    const { isSearchResult: _, ...partialDefaultCellMeta } =
      getDefaultCellMeta();
    const cellMeta = Object.entries(partialDefaultCellMeta);
    const columnIndexes = this.dataset.columns.map(
      (_, physicalCol) => physicalCol
    );
    this.uploadResults.ambiguousMatches = [];
    this.hot.batch(() =>
      Array.from({ length: this.hot.countRows() }, (_, physicalRow) =>
        columnIndexes.forEach((physicalCol) =>
          cellMeta.forEach(([key, value]) =>
            this.updateCellMeta(physicalRow, physicalCol, key, value)
          )
        )
      )
    );
    void this.updateCellInfoStats();
  },
  getCellMetaObject() {
    /*
     * Return's this.cellMeta, but instead of being indexed by physical row/col
     * indexes, the resulting array is indexed by visual row/col indexes.
     *
     * This is used for navigation among cells.
     *
     * Also, if the navigation direction is set to ColByCol, the resulting array
     * is transposed.
     * */
    if (this.flushIndexedCellData) {
      const getPosition = (visualRow, visualCol, first) =>
        (this.wbutils.searchPreferences.navigation.direction === 'rowFirst') ===
        first
          ? visualRow
          : visualCol;

      const [toVisualRow, toVisualColumn] =
        this.wbutils.getToVisualConverters();
      const indexedCellMeta = [];
      Object.entries(this.cellMeta).forEach(([physicalRow, metaRow]) =>
        Object.entries(metaRow).forEach(([physicalCol, cellMeta]) => {
          const visualRow = toVisualRow[physicalRow];
          const visualCol = toVisualColumn[physicalCol];
          indexedCellMeta[getPosition(visualRow, visualCol, true)] ??= [];
          indexedCellMeta[getPosition(visualRow, visualCol, true)][
            getPosition(visualRow, visualCol, false)
          ] = cellMeta;
        })
      );
      this.indexedCellMeta = indexedCellMeta;
    }
    this.flushIndexedCellData = false;
    return this.indexedCellMeta;
  },
});

module.exports = function loadDataset(
  id,
  refreshInitiatedBy = undefined,
  refreshInitiatorAborted = false
) {
  let dialog;

  function showLoadingBar() {
    dialog = $('<div><div class="progress-bar"></div></div>').dialog({
      title: wbText('dataSetLoadingDialogTitle'),
      modal: true,
      dialogClass: 'ui-dialog-no-close',
      close() {
        $(this).remove();
      },
    });
    $('.progress-bar', dialog).progressbar({ value: false });
  }

  showLoadingBar();

  $.get(`/api/workbench/dataset/${id}/`)
    .done((dataset) => {
      const view = new WBView({
        dataset,
        refreshInitiatedBy,
        refreshInitiatorAborted,
      })
        .on('refresh', (mode, wasAborted) => loadDataset(id, mode, wasAborted))
        .on('loaded', () => dialog.dialog('close'));
      app.setCurrentView(view);
      showLoadingBar();
    })
    .fail((jqXHR) => {
      if (jqXHR.status === 404) {
        jqXHR.errorHandled = true;
        app.setCurrentView(new NotFoundView());
        app.setTitle(commonText('pageNotFound'));
        return '(not found)';
      }
      return jqXHR;
    });
};
