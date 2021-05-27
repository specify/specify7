'use strict';

require('../css/workbench.css');

const $ = require('jquery');
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
const WBUploadedView = require('./components/wbuploadedview.tsx').default;
const dataModelStorage = require('./wbplanviewmodel').default;
const WBStatus = require('./wbstatus.js');
const WBUtils = require('./wbutils.js');
const {
  getIndexFromReferenceItemName,
  valueIsReferenceItem,
  valueIsTreeRank,
  mappingPathToString,
  getNameFromTreeRankName,
} = require('./wbplanviewmodelhelper');
const {
  mappingsTreeToArrayOfSplitMappings,
} = require('./wbplanviewtreehelper.ts');
const { uploadPlanToMappingsTree } = require('./uploadplantomappingstree.ts');
const { extractDefaultValues } = require('./wbplanviewhelper.ts');
const { getMappingLineData } = require('./wbplanviewnavigator.ts');
const fetchDataModelPromise = require('./wbplanviewmodelfetcher.ts').default;
const { capitalize } = require('./wbplanviewhelper.ts');
const icons = require('./icons.js');
const formatObj = require('./dataobjformatters.js').format;
const template = require('./templates/wbview.html');

const getDefaultCellMeta = () => ({
  isNew: false,
  isModified: false,
  isSearchResult: false,
  issues: [],
});

const WBView = Backbone.View.extend({
  __name__: 'WbForm',
  className: 'wbs-form',
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
  initialize({ dataset, refreshInitiatedBy }) {
    this.dataset = dataset;
    this.mappedHeaders = {};
    this.data = dataset.rows;
    if (this.data.length < 1) {
      this.data.push(Array(this.dataset.columns.length).fill(null));
    }

    this.mappings = undefined;

    this.validationMode = this.dataset.rowresults == null ? 'off' : 'static';
    this.liveValidationStack = [];
    this.liveValidationActive = false;
    this.hasUnSavedChanges = false;
    this.sortConfigIsSet = false;
    this.hotIsReady = false;

    // These fields are primarily used for navigation, as the user may press the
    // "next" button several times per second - no point in reCalculating the
    // metaData for all the cells.
    this.hasMetaDataChanges = true;
    this.cachedMetaDataArray = undefined;
    this.cachedMetaData = undefined;

    this.wbutils = new WBUtils({
      wbview: this,
      el: this.el,
    });

    this.datasetmeta = new DataSetMeta({
      dataset: this.dataset,
      el: this.el,
      getRowCount: () => this.hot?.countRows() ?? this.dataset.rows.length,
    });
    this.searchCell = undefined;
    this.searchPlugin = undefined;
    this.commentsPlugin = undefined;

    this.uploaded =
      this.dataset.uploadresult !== null && this.dataset.uploadresult.success;
    this.uploadedView = undefined;
    this.refreshInitiatedBy = refreshInitiatedBy;
    this.rowResults = this.dataset.rowresults
      ? this.dataset.rowresults.slice()
      : [];

    this.resize = this.resize.bind(this);
  },
  render() {
    this.$el.append(
      template({
        is_uploaded: this.uploaded,
        is_manager: userInfo.usertype === 'Manager',
      })
    );

    this.datasetmeta.render();

    if (this.dataset.rowresults !== null) {
      this.$('.wb-show-upload-view').prop('disabled', false);
    } else {
      this.$('.wb-show-upload-view')
        .prop('disabled', true)
        .prop('title', 'The data set must be validated or uploaded');
    }

    if (this.dataset.uploaderstatus) this.openStatus();

    if (!this.dataset.uploadplan) {
      $(
        '<div>No upload plan has been defined for this dataset. Create one now?</div>'
      ).dialog({
        title: 'No upload plan is defined',
        modal: true,
        buttons: {
          Create: this.openPlan.bind(this),
          Cancel: function () {
            $(this).dialog('close');
          },
        },
      });
    }

    const initDataModelIntegration = () => {
      this.identifyMappedHeaders();
      // This needs to run after identifyMappedHeaders
      if (this.dataset.rowresults) this.getValidationResults();
      this.wbutils.findLocalityColumns();
      this.identifyPickLists();
      this.identifyTreeRanks();
      if (this.dataset.visualorder !== null)
        this.hot.updateSettings({
          manualColumnMove: this.dataset.visualorder,
        });
      this.hotIsReady = true;
    };

    this.initHot().then(() => {
      this.resize();

      this.searchPlugin = this.hot.getPlugin('search');
      const queryMethod = this.searchPlugin.getQueryMethod();
      this.searchCell = (visualRow, visualCol, value) =>
        this.searchPlugin.callback(
          this.hot,
          visualRow,
          visualCol,
          value,
          queryMethod(this.wbutils.searchQuery, value)
        );

      this.commentsPlugin = this.hot.getPlugin('comments');
      this.multiColumnSortingPlugin = this.hot.getPlugin('multiColumnSorting');

      if (this.dataset.uploadplan) {
        fetchDataModelPromise().then(() => {
          this.mappings = uploadPlanToMappingsTree(
            this.dataset.columns,
            this.dataset.uploadplan
          );
          this.mappings.arrayOfMappings = mappingsTreeToArrayOfSplitMappings(
            this.mappings.mappingsTree
          );
          this.mappings.treeRanks = undefined;

          this.mappings.mappingLinesData = this.mappings.arrayOfMappings.map(
            ({ mappingPath }) =>
              getMappingLineData({
                baseTableName: this.mappings.baseTableName,
                mappingPath: mappingPath.slice(0, -1),
              })[0]
          );

          if (
            this.mappings.mappingLinesData.some(
              (lineData) => typeof lineData === 'undefined'
            )
          )
            throw new Error('Mapping Line Data can not be undefined');

          initDataModelIntegration();
        });
      } else initDataModelIntegration();
    });

    this.updateValidationButton();
    if (this.validationMode === 'static') {
      this.el.classList.remove('wb-hide-invalid-cells');
      this.el.classList.add('wb-hide-new-cells');
    }

    // Calling resize here minimizes layout shift
    this.resize();

    $(window).on('resize', this.resize);

    this.hasMetaDataChanges = true;
    this.hasMetaDataObjectChanges = true;

    return this;
  },
  initHot() {
    return new Promise((resolve) =>
      setTimeout(() => {
        this.hot = new Handsontable(this.$('.wb-spreadsheet')[0], {
          // initial height gets overwritten on page's load
          height: 500,
          data: this.data,
          columns: this.dataset.columns.map((__, i) => ({
            data: i,
            ...getDefaultCellMeta(),
          })),
          cells: () => ({ type: 'text' }),
          colHeaders: (col) => `<div class="wb-header-${col} ${
            this.dataset.columns[col] in this.mappedHeaders
              ? ''
              : 'wb-header-unmapped'
          }">
            ${
              this.dataset.columns[col] in this.mappedHeaders
                ? `<img
                    class="wb-header-icon"
                    alt="${
                      this.mappedHeaders[this.dataset.columns[col]].split(
                        '.'
                      )?.[1] || ''
                    }"
                    src="${this.mappedHeaders[this.dataset.columns[col]]}"
                  >`
                : ''
            }
            <span class="wb-header-name columnSorting">
                ${this.dataset.columns[col]}
            </span>
          </div>`,
          hiddenColumns: {
            // hide the disambiguation column
            columns: [this.dataset.columns.length],
            indicators: false,
            copyPasteEnabled: false,
          },
          minSpareRows: 1,
          comments: {
            displayDelay: 100,
          },
          commentedCellClassName: 'htCommentCell wb-invalid-cell',
          rowHeaders: true,
          manualColumnResize: true,
          manualColumnMove: true,
          outsideClickDeselects: false,
          multiColumnSorting: true,
          sortIndicator: true,
          search: {
            searchResultClass: 'wb-search-match-cell',
            queryMethod: this.wbutils.searchFunction.bind(this.wbutils),
            callback: (hot, visualRow, visualCol, data, testResult) => {
              hot.setCellMeta(
                visualRow,
                visualCol,
                'isSearchResult',
                testResult
              );
            },
          },
          contextMenu: {
            items: this.uploaded
              ? {}
              : {
                  row_above: 'row_above',
                  row_below: 'row_below',
                  remove_row: 'remove_row',
                  separator_1: '---------',
                  fill_down: this.wbutils.fillCellsContextMenuItem(
                    'Fill Down',
                    this.wbutils.fillDown
                  ),
                  fill_up: this.wbutils.fillCellsContextMenuItem(
                    'Fill Up',
                    this.wbutils.fillUp
                  ),
                  separator_2: '---------',
                  disambiguate: {
                    name: 'Disambiguate',
                    disabled: () => !this.isAmbiguousCell(),
                    callback: (__, selection) =>
                      this.disambiguateCell(selection),
                  },
                  undo: 'undo',
                  redo: 'redo',
                },
          },
          licenseKey: 'non-commercial-and-evaluation',
          stretchH: 'all',
          readOnly: this.uploaded,
          afterChange: this.afterChange.bind(this),
          afterCreateRow: this.rowCountChanged.bind(this),
          afterRemoveRow: this.rowCountChanged.bind(this),
          beforeColumnSort: this.beforeColumnSort.bind(this),
          beforeColumnMove: this.beforeColumnMove.bind(this),
          afterColumnMove: this.afterColumnMove.bind(this),
          afterSetCellMeta: this.afterSetCellMeta.bind(this),
          afterRenderer: this.afterRenderer.bind(this),
        });
        resolve();
      }, 0)
    );
  },
  remove() {
    this.hot.destroy();
    $(window).off('resize', this.resize);
  },
  identifyMappedHeaders() {
    const stylesContainer = document.createElement('style');
    const unmappedCellStyles = '{ color: #999; }';

    if (!this.mappings) return;

    const mappedHeadersAndTables = Object.fromEntries(
      this.mappings.arrayOfMappings.map(({ headerName }, index) => [
        headerName,
        icons.getIcon(this.mappings.mappingLinesData[index].tableName || ''),
      ])
    );

    this.mappedHeaders = mappedHeadersAndTables;

    Object.values(
      this.el
        .getElementsByClassName('wtSpreader')[0]
        ?.getElementsByClassName('colHeader')
    ).forEach((headerContainer) => {
      const header = headerContainer.children[0];
      let headerId = header?.className.match(/wb-header-(\d+)/)?.[1];

      if (!headerId) return;

      headerId = parseInt(headerId);

      const src = this.mappedHeaders[headerId];

      if (typeof src !== 'string') return;

      const img = document.createElement('img');
      img.classList.add('wb-header-icon');
      img.setAttribute('src', src);
      img.setAttribute(
        'alt',
        src.split('/').slice(-1)?.[0]?.split('.')?.[0] || src
      );
    });

    stylesContainer.innerHTML = `${Object.entries(this.dataset.columns)
      .filter(([, columnName]) => !(columnName in mappedHeadersAndTables))
      .map(([index]) => `.wb-col-${index} ${unmappedCellStyles}`)
      .join('\n')}`;

    const defaultValues = Object.fromEntries(
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
        typeof defaultValues[index] === 'undefined'
          ? {}
          : { placeholder: defaultValues[index] },
    });

    this.$el.append(stylesContainer);
  },
  identifyPickLists() {
    if (!this.mappings) return;
    const pickLists = Object.fromEntries(
      this.mappings.mappingLinesData
        .map((lineData, index) => ({
          tableName: lineData.tableName,
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
      cells: (_visualRow, visualCol, _prop) => {
        const physicalCol = this.hot.toPhysicalColumn(visualCol);
        return physicalCol in pickLists
          ? {
              type: 'autocomplete',
              source: pickLists[physicalCol].items,
              strict: pickLists[physicalCol].readOnly,
              allowInvalid: true,
            }
          : { type: 'text' };
      },
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
          tableName: this.mappings.mappingLinesData[index].tableName,
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

  // Hooks
  afterRenderer(td, row, col, prop, value, cellProperties) {
    /*
     * After cell is rendered, we need to reApply metaData classes
     * NOTE:
     * .isSearchResult is handled automatically by the search plugin.
     * .issues are handled automatically by the comments plugin.
     * This is why, afterRenderer only has to handle the isModified and isNew
     * cases
     * */
    if (cellProperties.isModified)
      this.afterSetCellMeta(row, col, 'isModified', true, td);
    if (cellProperties.isNew)
      this.afterSetCellMeta(row, col, 'isNew', true, td);
  },
  afterChange(unfilteredChanges, source) {
    if (
      ![
        'edit',
        'CopyPaste.paste',
        'Autofill.fill',
        'UndoRedo.undo',
        'UndoRedo.redo',
      ].includes(source)
    )
      return;

    const changes = unfilteredChanges
      .map(([visualRow, prop, oldValue, newValue]) => ({
        visualRow: visualRow,
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

    changes.forEach(({ visualRow, visualCol, physicalRow, newValue }) => {
      this.clearDisambiguation(physicalRow);
      this.hot.setCellMeta(visualRow, visualCol, 'isModified', true);
      if (
        this.wbutils.searchPreferences.search.liveUpdate &&
        this.wbutils.searchQuery !== ''
      )
        this.searchCell(visualRow, visualCol, newValue);
    });

    this.spreadSheetChanged();
    this.updateCellInfoStats();

    if (this.dataset.uploadplan)
      new Set(
        changes
          // Ignore changes to unmapped columns
          .filter(
            ({ physicalCol }) =>
              Object.keys(this.mappedHeaders).indexOf(
                this.dataset.columns[physicalCol]
              ) !== -1
          )
          .map(({ physicalRow }) => physicalRow)
      ).forEach((physicalRow) => this.startValidateRow(physicalRow));
  },
  rowCountChanged(index, amount, source) {
    if (this.hot && source !== 'auto') this.spreadSheetChanged();
    this.hasMetaDataChanges = true;
  },
  beforeColumnSort(currentSortConfig, newSortConfig) {
    this.hasMetaDataObjectChanges = true;

    if (!this.mappings || this.sortConfigIsSet) return true;

    const findTreeColumns = (searchConfig, deltaSearchConfig) =>
      searchConfig
        .map(({ column, sortOrder }) => ({
          sortOrder,
          visualColumn: column,
          physicalCol: this.hot.toPhysicalColumn(column),
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
        .filter(({ sortOrder, visualColumn }) => {
          const deltaColumnState = deltaSearchConfig.find(
            ({ column }) => column === visualColumn
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
    this.multiColumnSortingPlugin.sort(fullSortConfig);
    this.sortConfigIsSet = false;

    return false;
  },
  beforeColumnMove(_columnIndexes, startPosition, endPosition) {
    // An ugly fix for jQuery dialogs conflicting with HOT
    return typeof endPosition !== 'undefined' || this.hotIsReady === false;
  },
  afterColumnMove(_columnIndexes, _startPosition, endPosition) {
    if (typeof endPosition === 'undefined' || !this.hotIsReady) return;

    this.hasMetaDataObjectChanges = true;

    const columnOrder = Object.keys(this.dataset.columns).map((physicalCol) =>
      this.hot.toVisualColumn(Number.parseInt(physicalCol))
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
  afterSetCellMeta(visualRow, visualCol, key, value, initialCell = undefined) {
    this.hasMetaDataChanges = true;

    const cell =
      typeof initialCell === 'undefined'
        ? this.hot.getCell(visualRow, visualCol)
        : initialCell;

    /*
     * This happens when this.hot.query tries to set cellMeta for the
     * disambiguation column
     * */
    const actions = {
      isNew: () =>
        cell?.classList[value === true ? 'add' : 'remove']('wb-no-match-cell'),
      isModified: () =>
        cell?.classList[value === true ? 'add' : 'remove']('wb-modified-cell'),
      isSearchResult: () =>
        cell?.classList[value === true ? 'add' : 'remove'](
          'wb-search-match-cell'
        ),
      issues: () => {
        cell?.classList[value.length === 0 ? 'remove' : 'add'](
          'wb-invalid-cell'
        );
        if (value.length === 0)
          this.commentsPlugin.removeCommentAtCell(visualRow, visualCol);
        else {
          this.commentsPlugin.setCommentAtCell(
            visualRow,
            visualCol,
            value.join('<br>')
          );
          this.commentsPlugin.updateCommentMeta(visualRow, visualCol, {
            readOnly: true,
          });
        }
      },
      // Triggered by setCommentAtCell / removeCommentAtCell
      comment: () => {
        /* Ignore it */
      },
    };

    if (!(key in actions)) {
      console.warn(
        `Unknown metaData ${key}=${value} is being set for ` +
          `cell ${visualRow}x${visualCol}`
      );
      return;
    }

    actions[key]();
    this.hasMetaDataChanges = true;
  },

  // Disambiguation
  isAmbiguousCell() {
    if (!this.mappings) return false;

    const [visualRow, visualCol] = this.wbutils.getSelectedLast();
    const physicalRow = this.hot.toPhysicalRow(visualRow);
    const physicalCol = this.hot.toPhysicalColumn(visualCol);
    const targetHeader = this.dataset.columns[physicalCol];
    const mappingPath = this.mappings.arrayOfMappings.find(
      ({ headerName }) => headerName === targetHeader
    )?.mappingPath;
    const rowResult = this.rowResults[physicalRow];
    return typeof rowResult === 'undefined' ||
      typeof mappingPath === 'undefined'
      ? false
      : getRecordResult(rowResult, mappingPath)?.MatchedMultiple != null;
  },
  clearDisambiguation(physicalRow) {
    const cols = this.dataset.columns.length;
    const hidden = this.data[physicalRow][cols];
    const extra = hidden ? JSON.parse(hidden) : {};
    extra.disambiguation = {};
    this.data[physicalRow][cols] = JSON.stringify(extra);
  },
  setDisambiguation(physicalRow, mapping, id, affectedColumns) {
    const cols = this.dataset.columns.length;
    const hidden = this.data[physicalRow][cols];
    const extra = hidden ? JSON.parse(hidden) : {};
    const da = extra.disambiguation || {};
    da[mapping.slice(0, -1).join(' ')] = id;
    extra.disambiguation = da;
    this.data[physicalRow][cols] = JSON.stringify(extra);
    this.spreadSheetChanged();

    const visualRow = this.hot.toVisualRow(physicalRow);
    affectedColumns.forEach((visualCol) =>
      this.hot.setCellMeta(visualRow, visualCol, 'isModified', true)
    );
    this.updateCellInfoStats();
  },
  disambiguateCell([
    {
      start: { col: visualCol, row: visualRow },
    },
  ]) {
    if (!this.mappings) return;

    const physicalRow = this.hot.toPhysicalRow(visualRow);
    const physicalCol = this.hot.toPhysicalColumn(visualCol);
    const targetHeader = this.dataset.columns[physicalCol];

    const mappingIndex = this.mappings.arrayOfMappings.findIndex(
      ({ headerName }) => headerName === targetHeader
    );
    const mappingPath = this.mappings.arrayOfMappings[mappingIndex].mappingPath;
    const tableName = this.mappings.mappingLinesData[mappingIndex].tableName;
    const model = schema.getModel(tableName);
    const rowResult = this.rowResults[physicalRow];
    const matches = getRecordResult(rowResult, mappingPath).MatchedMultiple;
    const resources = new model.LazyCollection({
      filters: { id__in: matches.ids.join(',') },
    });

    const affectedHeaders = this.mappings.arrayOfMappings
      .filter(
        ({ mappingPath: comparisonMappingPath }) =>
          mappingPathToString(comparisonMappingPath.slice(0, -1)) ===
          mappingPathToString(mappingPath.slice(0, -1))
      )
      .map(({ headerName }) => headerName);
    const affectedColumns = affectedHeaders.map((headerName) =>
      this.dataset.columns.indexOf(headerName)
    );

    const doDA = (selected) => {
      this.setDisambiguation(
        physicalRow,
        mappingPath,
        parseInt(selected, 10),
        affectedColumns
      );
      this.startValidateRow(physicalRow);
    };
    const doAll = (selected) => {
      // loop backwards so the live validation will go from top to bottom
      for (let i = this.data.length - 1; i >= 0; i--) {
        const rowResult = this.rowResults[this.hot.toPhysicalRow(i)];
        const key =
          rowResult &&
          getRecordResult(rowResult, mappingPath)?.MatchedMultiple?.key;
        if (key === matches.key) {
          this.setDisambiguation(
            i,
            mappingPath,
            parseInt(selected, 10),
            affectedColumns
          );
          this.startValidateRow(i);
        }
      }
    };

    const table = $('<table>');
    resources.fetch({ limit: 0 }).done(() => {
      if (resources.length < 1) {
        $(`<div>None of the matched records currently exist in the database.
This can happen if all of the matching records were deleted since the validation process occurred,
or if all of the matches were ambiguous with respect other records in this data set. In the latter case,
you will need to add fields and values to the data set to resolve the ambiguity.</div>`).dialog(
          {
            title: 'Disambiguate',
            modal: true,
            close() {
              $(this).remove();
            },
            buttons: [
              {
                text: 'Close',
                click() {
                  $(this).dialog('close');
                },
              },
            ],
          }
        );
        return;
      }

      resources.forEach((resource, i) => {
        const tr = $(
          `<tr><td><input type="radio" class="da-option" name="disambiguate" value="${resource.id}" id="da-option-${i}"></td></tr>`
        ).appendTo(table);
        tr.append(
          $('<td>').append(
            $(`<a target="_blank">ℹ️</a>`).attr('href', resource.viewUrl())
          )
        );
        const label = $(`<label for="da-option-${i}">`).text(resource.id);
        tr.append($('<td>').append(label));
        formatObj(resource).done((formatted) => label.text(formatted));
      });

      const applyToAll = $(`<label>
          <br>
          <input
            type="checkbox"
            class="da-use-for-all"
            value="yes"
            style="
              margin-left: 5px;
            "
          >
          Apply All
        </label>`);

      $('<div>')
        .append(table)
        .append(applyToAll)
        .dialog({
          title: 'Disambiguate Multiple Record Matches',
          minWidth: 400,
          minHeight: 300,
          modal: true,
          close() {
            $(this).remove();
          },
          buttons: [
            {
              text: 'Cancel',
              click() {
                $(this).dialog('close');
              },
            },
            {
              text: 'Apply',
              click() {
                const selected = $('input.da-option:checked', this).val();
                const useForAll = $('input.da-use-for-all:checked', this).val();
                if (selected != null) {
                  (useForAll ? doAll : doDA)(selected);
                  $(this).dialog('close');
                }
              },
            },
          ],
        });
    });
  },

  // Tools
  displayUploadedView() {
    if (!this.dataset.rowresults) return;

    const uploadView = this.$el.find('.wb-upload-view')[0];

    if (typeof this.uploadedView !== 'undefined') return;

    uploadView.innerHTML = '<div></div>';
    const container = uploadView.children[0];

    this.uploadedView = new WBUploadedView({
      dataset: this.dataset,
      hot: this.hot,
      el: container,
      removeCallback: () => (this.uploadedView = undefined),
    }).render();
  },
  openPlan() {
    navigation.go(`/workbench-plan/${this.dataset.id}/`);
  },
  showPlan() {
    const dataset = this.dataset;
    const $this = this;
    const planJson = JSON.stringify(dataset.uploadplan, null, 4);
    $('<div>')
      .append($('<textarea cols="120" rows="50">').text(planJson))
      .dialog({
        title: 'Upload plan',
        width: 'auto',
        modal: true,
        close() {
          $(this).remove();
        },
        buttons: {
          Save() {
            dataset.uploadplan = JSON.parse($('textarea', this).val());
            $.ajax(`/api/workbench/dataset/${dataset.id}/`, {
              type: 'PUT',
              data: JSON.stringify({ uploadplan: dataset.uploadplan }),
              dataType: 'json',
              processData: false,
            }).fail(this.checkDeletedFail.bind(this));
            $(this).dialog('close');
            $this.trigger('refresh');
          },
          Close() {
            $(this).dialog('close');
          },
        },
      });
  },
  changeOwner() {
    this.datasetmeta.changeOwnerWindow.call(this.datasetmeta);
  },

  // Actions
  unupload() {
    $(
      '<div>Rolling back the Data Set will attempt to remove the data it added to the main Specify tables. ' +
        'The rollback can fail if the data has been referenced by other new data in the interim.</div>'
    ).dialog({
      modal: true,
      title: 'Start Data Set Rollback?',
      close() {
        $(this).remove();
      },
      buttons: {
        Rollback: () => {
          if (typeof this.uploadedView !== 'undefined') {
            this.uploadedView.remove();
            this.uploadedView = undefined;
          }
          $.post(`/api/workbench/unupload/${this.dataset.id}/`);
          this.openStatus('unupload');
        },
        Cancel() {
          $(this).dialog('close');
        },
      },
    });
  },
  upload(evt) {
    const mode = $(evt.currentTarget).is('.wb-upload') ? 'upload' : 'validate';
    if (this.dataset.uploadplan) {
      if (mode === 'upload') {
        $(
          '<div>Uploading the Data Set will transfer the data into the main Specify tables.</div>'
        ).dialog({
          modal: true,
          title: 'Start Data Set Upload?',
          close() {
            $(this).remove();
          },
          buttons: {
            Upload: () => this.startUpload(mode),
            Cancel() {
              $(this).dialog('close');
            },
          },
        });
      } else {
        this.startUpload(mode);
      }
    } else {
      $(
        '<div>No plan has been defined for this dataset. Create one now?</div>'
      ).dialog({
        title: 'No Plan is defined',
        modal: true,
        buttons: {
          Cancel: function () {
            $(this).dialog('close');
          },
          Create: () => this.openPlan(),
        },
      });
    }
  },
  startUpload(mode) {
    this.liveValidationStack = [];
    this.liveValidationActive = false;
    this.validationMode = 'off';
    this.updateValidationButton();
    $.post(`/api/workbench/${mode}/${this.dataset.id}/`)
      .fail((jqxhr) => {
        this.checkDeletedFail(jqxhr);
      })
      .done(() => {
        this.openStatus(mode);
      });
  },
  openStatus(mode) {
    new WBStatus({ dataset: this.dataset })
      .render()
      .on('done', () => this.trigger('refresh', mode));
  },
  delete: function () {
    const dialog = $('<div>Confirm Data Set Delete?</div>').dialog({
      modal: true,
      title: 'Delete Data Set',
      close: () => dialog.remove(),
      buttons: {
        Delete: () => {
          $.ajax(`/api/workbench/dataset/${this.dataset.id}/`, {
            type: 'DELETE',
          })
            .done(() => {
              this.$el.empty().append('<p>Dataset deleted.</p>');
              dialog.dialog('close');
            })
            .fail((jqxhr) => {
              this.checkDeletedFail(jqxhr);
              dialog.dialog('close');
            });
        },
        Cancel: () => dialog.dialog('close'),
      },
    });
  },
  export() {
    const data = Papa.unparse({
      fields: this.dataset.columns,
      data: this.dataset.rows,
    });
    const wbname = this.dataset.name;
    const filename = wbname.match(/\.csv$/) ? wbname : wbname + '.csv';
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.setAttribute('download', filename);
    a.click();
  },
  revertChanges() {
    $(
      '<div>This action will discard all changes to the Data Set since the last save.</div>'
    ).dialog({
      modal: true,
      title: 'Revert Unsaved Changes?',
      close() {
        $(this).remove();
      },
      buttons: {
        Revert: () => {
          navigation.removeUnloadProtect(this);
          this.trigger('refresh');
        },
        Cancel() {
          $(this).dialog('close');
        },
      },
    });
  },
  saveClicked: function () {
    this.save().done();
  },
  save: function () {
    // clear validation
    this.clearAllMetaData();
    this.dataset.rowresults = null;
    if (this.validationMode === 'static') {
      this.validationMode = 'off';
      this.updateValidationButton();
    }

    //show saving progress bar
    const dialog = $('<div><div class="progress-bar"></div></div>').dialog({
      title: 'Saving',
      modal: true,
      open(evt, ui) {
        $('.ui-dialog-titlebar-close', ui.dialog).hide();
      },
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
  toggleDataCheck() {
    this.validationMode = this.validationMode === 'live' ? 'off' : 'live';

    switch (this.validationMode) {
      case 'live':
        this.liveValidationStack = [...Array(this.hot.countRows())]
          .map((_, i) => i)
          .reverse();
        this.triggerLiveValidation();
        this.el.classList.remove('wb-hide-new-cells', 'wb-hide-invalid-cells');
        this.el.classList.add('wb-hide-modified-cells');
        break;
      case 'static':
        this.getValidationResults();
        this.el.classList.remove('wb-hide-invalid-cells');
        this.el.classList.add('wb-hide-new-cells');
      case 'off':
        this.liveValidationStack = [];
        this.liveValidationActive = false;
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
    if (this.validationMode === 'live') {
      const n = this.liveValidationStack.length;
      this.$('.wb-data-check').text(
        'Data Check: On' + (n > 0 ? ` (${n})` : '')
      );
    } else {
      this.$('.wb-data-check').text('Data Check');
    }
  },
  gotRowValidationResult(physicalRow, result) {
    if (this.validationMode !== 'live') return;
    this.rowResults[physicalRow] = result.result;
    this.hot.batchRender(() =>
      this.parseRowValidationResult(physicalRow, result.validation, true)
    );
    this.updateCellInfoStats();
  },
  parseRowValidationResult(physicalRow, result, isLive) {
    const rowMeta = this.hot.getCellMetaAtRow(physicalRow).slice(0, -1);
    const newRowMeta = rowMeta.map((cellMeta) => ({
      ...getDefaultCellMeta(),
      isModified: (isLive && cellMeta.isModified) ?? false,
      isSearchResult: cellMeta.isSearchResult ?? false,
    }));

    const addErrorMessage = (columnName, issue) => {
      const physicalCol = this.dataset.columns.indexOf(columnName);
      newRowMeta[physicalCol].issues.push(capitalize(issue));
    };

    result?.tableIssues.forEach((tableIssue) =>
      (tableIssue.columns.length === 0
        ? this.dataset.columns
        : tableIssue.columns
      ).forEach((columnName) => addErrorMessage(columnName, tableIssue.issue))
    );

    result?.cellIssues.forEach((cellIssue) =>
      addErrorMessage(cellIssue.column, cellIssue.issue)
    );

    result?.newRows.forEach(({ columns }) =>
      columns.forEach((columnName) => {
        const physicalCol = this.dataset.columns.indexOf(columnName);
        if (physicalCol === -1) return;
        newRowMeta[physicalCol].isNew = true;
      })
    );

    const visualRow = this.hot.toVisualRow(physicalRow);
    newRowMeta.forEach((cellMeta, physicalCol) => {
      const visualCol = this.hot.toVisualColumn(physicalCol);
      this.hot.setCellMetaObject(visualRow, visualCol, cellMeta);
    });
  },
  getValidationResults(showValidationSummary = false) {
    Q($.get(`/api/workbench/validation_results/${this.dataset.id}/`)).done(
      (results) => {
        if (results == null) {
          this.validationMode = 'off';
          this.updateValidationButton();
          return;
        }

        this.hot.batchRender(() => {
          results.forEach((result, physicalRow) => {
            this.parseRowValidationResult(physicalRow, result, false);
          });
        });

        this.updateCellInfoStats(showValidationSummary);
      }
    );
  },

  // Helpers
  spreadSheetChanged() {
    if (this.hasUnSavedChanges) return;
    this.hasUnSavedChanges = true;

    this.$(
      '.wb-upload, .wb-validate, .wb-export-data-set, .wb-change-data-set-owner'
    )
      .prop('disabled', true)
      .prop('title', 'This action requires all changes to be saved');
    this.$('.wb-save').prop('disabled', false);
    this.$('.wb-revert').prop('disabled', false);
    this.$('.wb-show-upload-view')
      .prop('disabled', true)
      .prop('title', 'The data set must be validated or uploaded');
    navigation.addUnloadProtect(
      this,
      'Changes to this Data Set have not been saved.'
    );
  },
  checkDeletedFail(jqxhr) {
    if (jqxhr.status === 404) {
      this.$el.empty().append('Data Set was deleted by another session.');
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
  resize: function () {
    // Height of the page - content offset - bottom margin
    this.el.style.height = `${$(window).height() - this.el.offsetTop - 15}px`;
    if (!this.hot) return;
    this.hot.updateSettings({
      height: this.$el.find('.wb-spreadsheet').height(),
    });
    return true;
  },

  // MetaData
  updateCellInfoStats(showValidationSummary = false) {
    const cellsMeta = this.getCellsMeta();

    const cellCounts = {
      newCells: cellsMeta.reduce(
        (count, info) => count + (info.isNew ? 1 : 0),
        0
      ),
      invalidCells: cellsMeta.reduce(
        (count, info) => count + (info.issues?.length ? 1 : 0),
        0
      ),
      searchResults: cellsMeta.reduce(
        (count, info) => count + (info.isSearchResult ? 1 : 0),
        0
      ),
      modifiedCells: cellsMeta.reduce(
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

    const refreshInitiatedBy = showValidationSummary
      ? 'validation'
      : this.refreshInitiatedBy;

    if (refreshInitiatedBy)
      this.operationCompletedMessage(cellCounts, refreshInitiatedBy);
  },
  operationCompletedMessage(cellCounts, refreshInitiatedBy) {
    const messages = {
      validation:
        cellCounts.invalidCells === 0
          ? {
              title: 'Validation successful',
              message: 'Validation completed successfully!',
            }
          : {
              title: 'Validation Failed',
              message: `Some issues were detected.<br>
                        Please fix them before uploading the dataset.`,
            },
      upload:
        cellCounts.invalidCells === 0
          ? {
              title: 'Upload Completed',
              message: `Click on the "View Upload Results" button below or the
                        "Results" button above, to see lists of new records
                        added to each data table.`,
            }
          : {
              title: 'Upload failed due to validation errors',
              message: `Upload failed with ${cellCounts.invalidCells}
                        invalid cells.<br>
                        Please review the validation messages and repeat
                        the upload process.`,
            },
      unupload: {
        title: 'Data Set Rollback',
        message: 'Data Set was rolled back successfully.',
      },
    };

    if (refreshInitiatedBy in messages) {
      const dialog = $(`<div>
                ${messages[refreshInitiatedBy].message}
            </div>`).dialog({
        title: messages[refreshInitiatedBy].title,
        modal: true,
        buttons: {
          ...(this.refreshInitiatedBy === 'upload' &&
          cellCounts.invalidCells === 0
            ? {
                'View Upload Results': () => {
                  this.displayUploadedView();
                  dialog.dialog('close');
                },
              }
            : {}),
          Close: () => dialog.dialog('destroy'),
        },
      });

      this.refreshInitiatedBy = undefined;
    }
  },
  clearAllMetaData() {
    const { isSearchResult: _, ...partialDefaultCellMeta } =
      getDefaultCellMeta();
    this.hot.batchRender(() =>
      [...Array(this.hot.countRows())].forEach((_, visualRow) =>
        Object.keys(this.dataset.columns).map((physicalCol) =>
          this.hot.setCellMetaObject(
            visualRow,
            /*
             * Despite the fact that setCellMetaObject expects a visualCol,
             * it doesn't matter since we are looping though all the columns
             * */
            parseInt(physicalCol),
            partialDefaultCellMeta
          )
        )
      )
    );
    this.updateCellInfoStats();
  },
  getCellsMeta() {
    if (this.hasMetaDataChanges) {
      this.wbutils.metaCellCountChanged = {};
      this.hasMetaDataChanges = false;
      this.cachedMetaDataArray = this.hot.getCellsMeta();
    }
    return this.cachedMetaDataArray;
  },
  getCellsMetaObject() {
    if (this.hasMetaDataObjectChanges) {
      const getPosition = (cellMetaData, first) =>
        (this.wbutils.searchPreferences.navigation.direction === 'rowFirst') ===
        first
          ? cellMetaData.visualRow
          : cellMetaData.visualCol;

      this.cachedMetaData = this.getCellsMeta().reduce(
        (cachedMetaData, cellMetaData) => {
          cachedMetaData[getPosition(cellMetaData, true)] ??= {};
          cachedMetaData[getPosition(cellMetaData, true)][
            getPosition(cellMetaData, false)
          ] = cellMetaData;
          return cachedMetaData;
        },
        []
      );
    }
    this.hasMetaDataObjectChanges = false;
    return this.cachedMetaData;
  },
});

module.exports = function loadDataset(id, refreshInitiatedBy = undefined) {
  const dialog = $('<div><div class="progress-bar"></div></div>').dialog({
    title: 'Loading',
    modal: true,
    open(evt, ui) {
      $('.ui-dialog-titlebar-close', ui.dialog).hide();
    },
    close() {
      $(this).remove();
    },
  });
  $('.progress-bar', dialog).progressbar({ value: false });

  $.get(`/api/workbench/dataset/${id}/`)
    .done((dataset) => {
      dialog.dialog('close');

      const view = new WBView({
        dataset,
        refreshInitiatedBy,
      }).on('refresh', (mode) => loadDataset(id, mode));
      app.setCurrentView(view);
    })
    .fail((jqXHR) => {
      if (jqXHR.status === 404) {
        jqXHR.errorHandled = true;
        app.setCurrentView(new NotFoundView());
        app.setTitle('Page Not Found');
        return '(not found)';
      }
      return jqXHR;
    });
};

function getRecordResult({ UploadResult }, mappingPath) {
  if (mappingPath.length <= 1 || valueIsTreeRank(mappingPath[0])) {
    return UploadResult.record_result;
  } else if (valueIsReferenceItem(mappingPath[1])) {
    const idx = getIndexFromReferenceItemName(mappingPath[1]);
    const toMany = UploadResult.toMany[mappingPath[0]];
    const next = toMany && toMany[idx - 1];
    return next && getRecordResult(next, mappingPath.slice(2));
  } else {
    const next = UploadResult.toOne[mappingPath[0]];
    return next && getRecordResult(next, mappingPath.slice(1));
  }
}
