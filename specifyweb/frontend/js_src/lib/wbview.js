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
const WBUploadedView = require('./components/wbuploadedview').default;
const WBStatus = require('./wbstatus.js');
const WBUtils = require('./wbutils.js');
const {
  getIndexFromReferenceItemName,
  valueIsReferenceItem,
  valueIsTreeRank,
  mappingPathToString,
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
    'click .wb-validate': 'chooseValidationMode',
    'click .wb-plan': 'openPlan',
    // TODO: remove the Show Plan button
    'click .wb-show-plan': 'showPlan',
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

    if (this.dataset.uploadplan) {
      this.mappings = uploadPlanToMappingsTree(
        this.dataset.columns,
        this.dataset.uploadplan
      );
      this.mappings.arrayOfMappings = mappingsTreeToArrayOfSplitMappings(
        this.mappings.mappingsTree
      );
      this.mappings.mappingLinesData = this.mappings.arrayOfMappings.map(
        ({ mappingPath }) =>
          getMappingLineData({
            baseTableName: this.mappings.baseTableName,
            mappingPath: mappingPath.slice(0, -1),
          })
      );
    } else this.mappings = undefined;

    this.validationMode = this.dataset.rowresults == null ? 'off' : 'static';
    this.liveValidationStack = [];
    this.liveValidationActive = false;
    this.hasUnSavedChanges = false;

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
    });
    this.searchCell = undefined;
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
        has_rowresults: this.dataset.rowresults !== null,
        is_manager: userInfo.usertype === 'Manager',
      })
    );

    this.datasetmeta.render();

    if (this.dataset.uploaderstatus) this.openStatus();

    if (!this.dataset.uploadplan)
      $(
        '<div>No plan has been defined for this dataset. Create one now?</div>'
      ).dialog({
        title: 'No Plan is defined',
        modal: true,
        buttons: {
          Create: this.openPlan.bind(this),
          Cancel: function () {
            $(this).dialog('close');
          },
        },
      });

    this.initHot().then(() => {
      this.dataset.rowresults && this.getValidationResults();
      fetchDataModelPromise().then(this.identifyMappedHeaders.bind(this));
      this.wbutils.findLocalityColumns();
      this.resize();

      const searchPlugin = this.hot.getPlugin('search');
      const queryMethod = searchPlugin.getQueryMethod();
      this.searchCell = (visualRow, visualCol, value) =>
        searchPlugin.callback(
          this.hot,
          visualRow,
          visualCol,
          value,
          queryMethod(this.wbutils.searchQuery, value)
        );

      this.commentsPlugin = this.hot.getPlugin('comments');
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
          cells: this.cellRenderer.bind(this),
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
          },
          minSpareRows: 1,
          comments: {
            displayDelay: 100,
          },
          commentedCellClassName: 'htCommentCell wb-invalid-cell',
          rowHeaders: true,
          manualColumnResize: true,
          manualColumnMove: this.dataset.visualorder ?? true,
          outsideClickDeselects: false,
          columnSorting: true,
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
          afterColumnSort: this.cellPositionChanged.bind(this),
          beforeColumnMove: this.beforeColumnMove.bind(this),
          afterColumnMove: this.afterColumnMove.bind(this),
          afterSetCellMeta: this.afterSetCellMeta.bind(this),
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
        icons.getIcon(
          this.mappings.mappingLinesData[index][0]?.tableName || ''
        ),
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
  cellRenderer() {
    return { renderer: this.customRenderer.bind(this) };
  },
  customRenderer(instance, td, row, col, prop, value, cellProperties) {
    Handsontable.renderers.TextRenderer.apply(instance, arguments);
    if (cellProperties.isModified)
      this.afterSetCellMeta(td, undefined, 'isModified', true);
    // if(cellProp)
  },

  // Hooks
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
        ({ oldValue, newValue }) =>
          oldValue !== newValue && (oldValue !== null || newValue !== '')
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
  cellPositionChanged() {
    this.hasMetaDataObjectChanges = true;
  },
  beforeColumnMove: (_columnIndexes, _startPosition, endPosition) =>
    typeof endPosition !== 'undefined',
  afterColumnMove(_columnIndexes, _startPosition, endPosition) {
    if (typeof endPosition === 'undefined' || !this.hot) return;

    this.cellPositionChanged();

    const columnOrder = this.dataset.columns.map((visualColumn) =>
      this.hot.toPhysicalColumn(visualColumn)
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
  afterSetCellMeta(visualRow, visualCol, key, value) {
    this.hasMetaDataChanges = true;

    const cell =
      typeof visualRow === 'object' && typeof visualCol === 'undefined'
        ? visualRow
        : this.hot.getCell(visualRow, visualCol);

    /*
     * This happens when this.hot.query tries to set cellMeta for the
     * disambiguation column
     * */
    if (cell === null) return;

    const actions = {
      isNew: () =>
        cell.classList[value === true ? 'add' : 'remove']('wb-no-match-cell'),
      isModified: () =>
        cell.classList[value === true ? 'add' : 'remove']('wb-modified-cell'),
      isSearchResult: () =>
        cell.classList[value === true ? 'add' : 'remove'](
          'wb-search-match-cell'
        ),
      issues: () => {
        cell.classList[value.length === 0 ? 'remove' : 'add'](
          'wb-invalid-cell'
        );
        if (value.length === 0)
          this.commentsPlugin.removeCommentAtCell(visualRow, visualCol);
        else
          this.commentsPlugin.setCommentAtCell(
            visualRow,
            visualCol,
            value.join('<br>')
          );
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

    const mappingPath = this.mappings.arrayOfMappings.find(
      ({ headerName }) => headerName === targetHeader
    )?.mappingPath;
    const tableName = getMappingLineData({
      baseTableName: this.mappings.baseTableName,
      mappingPath: mappingPath.slice(0, -1),
    })[0]?.tableName;
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
          <input type="checkbox" class="da-use-for-all" value="yes">
          Apply All
        </label>`);

      $('<div>')
        .append(table)
        .append(applyToAll)
        .dialog({
          title: 'Disambiguate Multiple Record Matches',
          modal: true,
          close() {
            $(this).remove();
          },
          buttons: [
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
            {
              text: 'Cancel',
              click() {
                $(this).dialog('close');
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
    if (typeof this.uploadedView !== 'undefined') {
      this.uploadedView.remove();
      this.uploadedView = undefined;
    }
    $.post(`/api/workbench/unupload/${this.dataset.id}/`);
    this.openStatus('unupload');
  },
  upload(evt) {
    const mode = $(evt.currentTarget).is('.wb-upload') ? 'upload' : 'validate';
    const openPlan = () => this.openPlan();
    if (this.dataset.uploadplan) {
      const start = (mode) => {
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
      };
      $(
        '<div>The upload process will transfer the data set data into the main ' +
          'Specify tables. Performing a trial upload is recommended because ' +
          'it can detect some issues that live validation cannot.</div>'
      ).dialog({
        title: 'Upload',
        modal: true,
        buttons: [
          {
            text: 'Upload',
            click: function () {
              start('upload');
            },
          },
          {
            text: 'Trial Upload',
            click: function () {
              start('validate');
            },
          },
          {
            text: 'Cancel',
            click: function () {
              $(this).dialog('close');
            },
          },
        ],
      });
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
          Create: openPlan,
        },
      });
    }
  },
  openStatus(mode) {
    new WBStatus({ dataset: this.dataset })
      .render()
      .on('done', () => this.trigger('refresh', mode));
  },
  delete: function () {
    const dialog = $('<div>Really delete?</div>').dialog({
      modal: true,
      title: 'Confirm delete',
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
  chooseValidationMode() {
    const dl = $('<dl>');
    if (this.dataset.uploadplan == null) {
      dl.append('<dt>Live</dt>');
      dl.append(`<dd>Rows are validated independently from one another and in response to changes.
Requires an <a href="/specify/workbench-plan/${this.dataset.id}/">upload plan</a> to be defined.</dd>`);

      dl.append('<dt>Static</dt>');
      dl.append(`<dd>Row validation highlighting is based on the last trial upload and does not respond to changes.
Requires an <a href="/specify/workbench-plan/${this.dataset.id}/">upload plan</a> to be defined.</dd>`);
    } else {
      dl.append(
        `<dt><label><input type="radio" name="validation-mode" value="live" ${
          this.validationMode === 'live' ? 'checked' : ''
        }> Live</label></dt>`
      );
      dl.append(
        '<dd>Rows are validated independently from one another and in response to changes.</dd>'
      );

      if (this.dataset.rowresults == null) {
        dl.append('<dt>Static</dt>');
        dl.append(`<dd>Row validation highlighting is based on the last trial upload and does not respond to changes.
Only available after a trial upload is completed.</dd>`);
      } else {
        dl.append(
          `<dt><label><input type="radio" name="validation-mode" value="static" ${
            this.validationMode === 'static' ? 'checked' : ''
          }> Static</label></dt>`
        );
        dl.append(
          '<dd>Row validation highlighting is based on the last trial upload and does not respond to changes.</dd>'
        );
      }
    }

    dl.append(
      `<dt><label><input type="radio" name="validation-mode" value="off" ${
        this.validationMode === 'off' ? 'checked' : ''
      }> Off</label></dt>`
    );
    dl.append('<dd>Row validation highlighting is disabled.</dd>');

    $('<div>')
      .append(dl)
      .dialog({
        title: 'Validation Mode',
        width: 360,
        modal: true,
        close() {
          $(this).remove();
        },
        buttons: {
          Select() {
            const choice = $('input:checked', this).val();
            selected(choice);
            $(this).dialog('close');
          },
          Cancel() {
            $(this).dialog('close');
          },
        },
      });
    const selected = (choice) => {
      if (!['live', 'static', 'off'].includes(choice)) {
        return;
      }
      this.validationMode = choice;
      switch (this.validationMode) {
        case 'live':
          this.liveValidationStack = this.dataset.rows
            .map((_, i) => i)
            .reverse();
          this.triggerLiveValidation();
          this.el.classList.remove(
            'wb-hide-new-cells',
            'wb-hide-invalid-cells'
          );
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
    };
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
    switch (this.validationMode) {
      case 'live':
        const n = this.liveValidationStack.length;
        this.$('.wb-validate').text(
          'Validation: Live' + (n > 0 ? ` (${n})` : '')
        );
        break;
      case 'static':
        this.$('.wb-validate').text('Validation: Static');
        break;
      case 'off':
        this.$('.wb-validate').text('Validation: Off');
        break;
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

    this.$('.wb-upload')
      .prop('disabled', true)
      .prop('title', 'You should save your changes before Uploading');
    this.$('.wb-save').prop('disabled', false);
    navigation.addUnloadProtect(this, 'The workbench has not been saved.');
  },
  checkDeletedFail(jqxhr) {
    if (jqxhr.status === 404) {
      this.$el.empty().append('Dataset was deleted by another session.');
      jqxhr.errorHandled = true;
    }
  },
  spreadSheetUpToDate: function () {
    if (!this.hasUnSavedChanges) return;
    this.hasUnSavedChanges = false;
    this.$('.wb-upload').prop('disabled', false).prop('title', '');
    this.$('.wb-save').prop('disabled', true);
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
        const currentPositionElement = navigationContainer.getElementsByClassName(
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
              title: 'Upload completed',
              message: `You can open the 'View' menu to see a detailed
                        breakdown of the upload results.`,
            }
          : {
              title: 'Upload failed due to validation errors',
              message: `Upload failed with ${cellCounts.invalidCells}
                        invalid cells.<br>
                        Please review the validation messages and repeat
                        the upload process.`,
            },
      unupload: {
        title: 'Unupload completed',
        message: 'Unupload completed successfully.',
      },
    };

    if (refreshInitiatedBy in messages) {
      const dialog = $(`<div>
                ${messages[refreshInitiatedBy].message}
            </div>`).dialog({
        title: messages[refreshInitiatedBy].title,
        modal: true,
        buttons: {
          Close() {
            $(this).dialog('destroy');
          },
          ...(this.refreshInitiatedBy === 'upload' &&
          cellCounts.invalidCells === 0
            ? {
                'View upload results': () => {
                  this.displayUploadedView();
                  dialog.dialog('close');
                },
              }
            : {}),
        },
      });

      this.refreshInitiatedBy = undefined;
    }
  },
  clearAllMetaData() {
    const {
      isSearchResult: _,
      ...partialDefaultCellMeta
    } = getDefaultCellMeta();
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
        (this.wbutils.searchPreferences.navigation.direction === 'rowByRow') ===
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
