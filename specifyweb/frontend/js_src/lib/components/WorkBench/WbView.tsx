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

import '../../../css/workbench.css';

import Handsontable from 'handsontable';
import React from 'react';
import _ from 'underscore';

import { commonText } from '../../localization/common';
import { LANGUAGE } from '../../localization/utils/config';
import { wbPlanText } from '../../localization/wbPlan';
import { wbText } from '../../localization/workbench';
import { Http } from '../../utils/ajax/definitions';
import { f } from '../../utils/functools';
import type { IR, RA, WritableArray } from '../../utils/types';
import { ensure, overwriteReadOnly, writable } from '../../utils/types';
import { clamp } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { iconClassName, legacyNonJsxIcons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { legacyLoadingContext } from '../Core/Contexts';
import { Backbone } from '../DataModel/backbone';
import { getTable, strictGetTable } from '../DataModel/tables';
import { crash, raise } from '../Errors/Crash';
import { getIcon, unknownIcon } from '../InitialContext/icons';
import { Dialog } from '../Molecules/Dialog';
import { hasPermission } from '../Permissions/helpers';
import { getUserPref } from '../UserPreferences/helpers';
import type { UploadPlan } from '../WbPlanView/uploadPlanParser';
import type { Dataset } from '../WbPlanView/Wrapped';
import { WbCellMeta } from './CellMeta';
import { DataSetNameView } from './DataSetMeta';
import { DevShowPlan } from './DevShowPlan';
import { Disambiguation } from './DisambiguationLogic';
import { configureHandsontable, getHotPlugin } from './handsontable';
import { downloadDataSet } from './helpers';
import { getHotHooks } from './hooks';
import { getSelectedRegions } from './hotHelpers';
import type { WbMapping } from './mapping';
import { parseWbMappings } from './mapping';
import { fetchWbPickLists } from './pickLists';
import { WbUploaded } from './Results';
import { wbViewTemplate } from './Template';
import { WbActions } from './WbActions';
import { WbUtils } from './WbUtils';
import { WbValidation } from './WbValidation';

export type WbStatus = 'unupload' | 'upload' | 'validate';

// REFACTOR: when rewriting to React, add ErrorBoundaries

// REFACTOR: rewrite to React
/* eslint-disable functional/no-this-expression */
export class WbView extends Backbone.View {
  public readonly data: RA<RA<string | null>>;

  public readonly mappings: WbMapping | undefined = undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  public hotIsReady: boolean = false;

  // eslint-disable-next-line functional/prefer-readonly-type
  public hotCommentsContainer: HTMLElement | undefined = undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  public undoRedoIsHandled: boolean = false;

  private readonly dataSetMeta: DataSetNameView;

  public readonly wbUtils: WbUtils;

  public readonly cells: WbCellMeta;

  public readonly validation: WbValidation;

  public readonly actions: WbActions;

  public readonly disambiguation: Disambiguation;

  // eslint-disable-next-line functional/prefer-readonly-type
  public hot: Handsontable | undefined;

  /*
   * If this.isUploaded, render() will:
   * Add the "Uploaded" label next to DS Name
   * Disable cell editing
   * Disable adding/removing rows
   * Still allow column sort
   * Still allow column move
   *
   */
  public readonly isUploaded: boolean;

  // Disallow all editing and some tools while this dialog is open
  // eslint-disable-next-line functional/prefer-readonly-type
  public uploadedView: (() => void) | undefined = undefined;

  // Disallow all editing and all tools while this dialog is open
  // eslint-disable-next-line functional/prefer-readonly-type
  public coordinateConverterView: (() => void) | undefined = undefined;

  public readonly handleResize: () => void;

  public readonly throttleRate: number;

  // Constructors & Renderers
  public constructor(
    public readonly dataset: Dataset,
    // eslint-disable-next-line functional/prefer-readonly-type
    public refreshInitiatedBy: WbStatus | undefined,
    // eslint-disable-next-line functional/prefer-readonly-type
    public refreshInitiatorAborted: boolean,
    public readonly element: HTMLElement,
    public readonly options: {
      readonly onSetUnloadProtect: (unloadProtect: boolean) => void;
      readonly onDeleted: () => void;
      readonly onDeletedConfirmation: () => void;
      readonly display: (
        jsx: JSX.Element,
        element?: HTMLElement,
        destructor?: () => void
      ) => () => void;
    }
  ) {
    super({
      el: element,
      tagName: 'section',
      events: {
        'click .wb-upload': 'upload',
        'click .wb-validate': 'upload',
        'click .wb-data-check': 'toggleDataCheck',
        'click .wb-show-plan': 'showPlan',
        'click .wb-revert': 'revertChanges',
        'click .wb-save': 'save',
        'click .wb-export-data-set': 'export',
        'click .wb-change-data-set-owner': 'changeOwner',

        'click .wb-show-upload-view': 'displayUploadedView',
        'click .wb-unupload': 'unupload',
      },
    });

    this.data =
      dataset.rows.length === 0
        ? [Array.from(dataset.columns).fill(null)]
        : dataset.rows;

    this.mappings = parseWbMappings(this.dataset);

    this.dataSetMeta = new DataSetNameView({
      dataset: this.dataset,
      el: this.el,
      display: this.options.display,
      getRowCount: () =>
        this.hot === undefined
          ? this.dataset.rows.length
          : this.hot.countRows() - this.hot.countEmptyRows(true),
    });
    this.wbUtils = new WbUtils(this);
    this.cells = new WbCellMeta(this);
    this.validation = new WbValidation(this);
    this.actions = new WbActions(this);
    this.disambiguation = new Disambiguation(this);

    this.isUploaded =
      this.dataset.uploadresult !== null && this.dataset.uploadresult.success;

    this.refreshInitiatedBy = refreshInitiatedBy;
    this.refreshInitiatorAborted = refreshInitiatorAborted;

    /*
     * Throttle cell count update depending on the DS size (between 10ms and 2s)
     * Even if throttling may not be needed for small Data Sets, wrapping the
     * function in _.throttle allows to not worry about calling it several
     * time in a very short amount of time.
     *
     */
    this.throttleRate = Math.ceil(clamp(10, this.data.length / 10, 2000));
    this.handleResize = _.throttle(() => this.hot?.render(), this.throttleRate);
  }

  private readonly hooks = getHotHooks(this);

  render() {
    this.$el.append(
      wbViewTemplate(
        this.isUploaded,
        Boolean(this.dataset.uploadplan),
        this.dataset.id
      )
    );
    this.$el.attr('aria-label', wbText.workBench());

    /*
     * HOT Comments for last column overflow outside the viewport for a moment
     * before getting repositioned by the afterOnCellMouseOver event handler.
     *
     * Hiding overflow prevents scroll bar from flickering on cell mouse over
     *
     */
    document.body.classList.add('overflow-x-hidden');

    this.dataSetMeta.render();

    if (typeof this.dataset.uploaderstatus === 'string')
      this.actions.openStatus(this.dataset.uploaderstatus);

    this.cells.cellMeta = [];

    if (this.refreshInitiatedBy && this.refreshInitiatorAborted)
      this.actions.operationAbortedMessage();

    const initDataModelIntegration = async (): Promise<void> => {
      const pickLists =
        this.mappings === undefined
          ? {}
          : await fetchWbPickLists(
              this.dataset.columns,
              this.mappings.tableNames,
              this.mappings.lines
            );
      this.hot?.batch(() => {
        if (
          !this.isUploaded &&
          (this.mappings?.lines ?? []).length === 0 &&
          hasPermission('/workbench/dataset', 'update')
        ) {
          const dialog = this.options.display(
            <Dialog
              buttons={
                <>
                  <Button.DialogClose>{commonText.close()}</Button.DialogClose>
                  <Link.Blue
                    href={`/specify/workbench/plan/${this.dataset.id}/`}
                  >
                    {commonText.create()}
                  </Link.Blue>
                </>
              }
              header={wbPlanText.noUploadPlan()}
              onClose={() => dialog()}
            >
              {wbPlanText.noUploadPlanDescription()}
            </Dialog>
          );
          this.$('.wb-validate, .wb-data-check')
            .prop('disabled', true)
            .prop('title', wbText.wbValidateUnavailable());
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
        configureHandsontable(
          this.hot!,
          this.mappings,
          this.dataset,
          pickLists
        );

        if (this.dataset.rowresults) this.validation.getValidationResults();

        // CHeck if any column is reordered
        if (this.dataset.visualorder?.some((column, index) => column !== index))
          this.hot?.updateSettings({
            manualColumnMove: writable(this.dataset.visualorder),
          });

        this.wbUtils.findLocalityColumns();
        this.wbUtils.render();

        this.hotIsReady = true;

        this.hotCommentsContainer = (document.getElementsByClassName(
          'htComments'
        )[0] ?? undefined) as HTMLElement | undefined;
      });
    };

    legacyLoadingContext(
      this.initHot().then(initDataModelIntegration).catch(crash)
    );

    this.validation.updateValidationButton();
    if (this.validation.validationMode === 'static' && !this.isUploaded)
      this.wbUtils.toggleCellTypes('invalidCells', 'remove');

    this.cells.flushIndexedCellData = true;
    globalThis.window.addEventListener('resize', this.handleResize);

    return this;
  }

  // Initialize Handsontable
  async initHot(): Promise<void> {
    /*
     * HOT and Backbone appear to conflict, unless HOT init is wrapped in
     * globalThis.setTimeout(...,0)
     */
    await new Promise((resolve) => setTimeout(resolve, 0));
    const hot = new Handsontable(this.$('.wb-spreadsheet')[0], {
      // eslint-disable-next-line functional/prefer-readonly-type
      data: this.data as (string | null)[][],
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
          (typeof mappingCol === 'number'
            ? this.mappings?.tableNames[mappingCol]
            : undefined) ??
          tableIcon?.split('/').slice(-1)?.[0]?.split('.')?.[0];
        const tableLabel = isMapped
          ? f.maybe(tableName, getTable)?.label ?? tableName ?? ''
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
                aria-label="${wbPlanText.unmappedColumn()}"
                title="${wbPlanText.unmappedColumn()}"
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
        // @ts-expect-error Wrong Handsontable typing?
        copyPasteEnabled: false,
      },
      hiddenRows: {
        rows: [],
        indicators: false,
        // @ts-expect-error Wrong Handsontable typing?
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
      // @ts-expect-error Wrong Handsontable typing?
      contextMenu: {
        items: ensure<
          IR<
            | Handsontable.contextMenu.MenuItemConfig
            | Handsontable.contextMenu.PredefinedMenuItemKey
          >
        >()(
          this.isUploaded
            ? ({
                // Display uploaded record
                upload_results: {
                  disableSelection: true,
                  isCommand: false,
                  renderer: (_hot, wrapper) => {
                    const { endRow: visualRow, endCol: visualCol } =
                      getSelectedRegions(hot).at(-1) ?? {};
                    const physicalRow = hot.toPhysicalRow(visualRow ?? 0);
                    const physicalCol = hot.toPhysicalColumn(visualCol ?? 0);

                    const createdRecords =
                      this.validation.uploadResults.newRecords[physicalRow]?.[
                        physicalCol
                      ];

                    if (
                      visualRow === undefined ||
                      visualCol === undefined ||
                      createdRecords === undefined ||
                      !this.cells.getCellMeta(physicalRow, physicalCol, 'isNew')
                    ) {
                      wrapper.textContent = wbText.noUploadResultsAvailable();
                      wrapper.parentElement?.classList.add('htDisabled');
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
                            ? strictGetTable(tableName).label
                            : label;
                        // REFACTOR: use new table icons
                        const tableIcon = getIcon(tableName) ?? unknownIcon;

                        return `<a
                            class="link"
                            href="/specify/view/${tableName}/${recordId}/"
                            target="_blank"
                          >
                            <img class="${iconClassName}" src="${tableIcon}" alt="">
                            ${tableLabel}
                            <span
                              title="${commonText.opensInNewTab()}"
                              aria-label="${commonText.opensInNewTab()}"
                            >${legacyNonJsxIcons.link}</span>
                          </a>`;
                      })
                      .join('');

                    const div = document.createElement('div');
                    div.style.display = 'none';
                    return div;
                  },
                },
              } as const)
            : ({
                row_above: {
                  disabled: () =>
                    typeof this.uploadedView === 'function' ||
                    typeof this.coordinateConverterView === 'function' ||
                    !hasPermission('/workbench/dataset', 'update'),
                },
                row_below: {
                  disabled: () =>
                    typeof this.uploadedView === 'function' ||
                    typeof this.coordinateConverterView === 'function' ||
                    !hasPermission('/workbench/dataset', 'update'),
                },
                remove_row: {
                  disabled: () => {
                    if (
                      typeof this.uploadedView === 'function' ||
                      typeof this.coordinateConverterView === 'function' ||
                      !hasPermission('/workbench/dataset', 'update')
                    )
                      return true;
                    // Or if called on the last row
                    const selectedRegions = getSelectedRegions(hot);
                    return (
                      selectedRegions.length === 1 &&
                      selectedRegions[0].startRow === this.data.length - 1 &&
                      selectedRegions[0].startRow === selectedRegions[0].endRow
                    );
                  },
                },
                disambiguate: {
                  name: wbText.disambiguate(),
                  disabled: (): boolean =>
                    typeof this.uploadedView === 'function' ||
                    typeof this.coordinateConverterView === 'function' ||
                    !this.disambiguation.isAmbiguousCell() ||
                    !hasPermission('/workbench/dataset', 'update'),
                  callback: () =>
                    this.disambiguation.openDisambiguationDialog(),
                },
                separator_1: '---------',
                fill_down: this.wbUtils.fillCellsContextMenuItem('down'),
                fill_up: this.wbUtils.fillCellsContextMenuItem('up'),
                separator_2: '---------',
                undo: {
                  disabled: () =>
                    typeof this.uploadedView === 'function' ||
                    this.hot?.isUndoAvailable() !== true ||
                    !hasPermission('/workbench/dataset', 'update'),
                },
                redo: {
                  disabled: () =>
                    typeof this.uploadedView === 'function' ||
                    this.hot?.isRedoAvailable() !== true ||
                    !hasPermission('/workbench/dataset', 'update'),
                },
              } as const)
        ),
      },
      licenseKey: 'non-commercial-and-evaluation',
      stretchH: 'all',
      readOnly:
        this.isUploaded || !hasPermission('/workbench/dataset', 'update'),
      ...Object.fromEntries(
        Object.entries(this.hooks).map(
          ([name, callback]) => [name, callback.bind(this)] as const
        )
      ),
    });
    this.hot = hot;
  }

  remove(): this {
    this.hot?.destroy();
    this.hot = undefined;
    this.wbUtils.remove();
    this.dataSetMeta.remove();
    this.uploadedView?.();
    this.actions.status?.();
    this.validation.stopLiveValidation();
    globalThis.removeEventListener('resize', this.handleResize);
    document.body.classList.remove('overflow-x-hidden');
    Backbone.View.prototype.remove.call(this);
    return this;
  }

  // Tools
  displayUploadedView(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!this.dataset.rowresults || this.hot === undefined) return;

    if (this.uploadedView !== undefined) {
      this.uploadedView();
      return;
    }

    if (this.validation.liveValidationStack.length > 0) {
      const dialog = this.options.display(
        <Dialog
          buttons={commonText.close()}
          header={commonText.results()}
          onClose={() => dialog()}
        >
          {wbText.unavailableWhileValidating()}
        </Dialog>
      );
      return;
    }

    const effects: WritableArray<() => void> = [];
    const effectsCleanup: WritableArray<() => void> = [];

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
            element.getAttribute('data-navigation-type') ?? ''
          )
        )
        .flatMap((element) =>
          Array.from(element.getElementsByClassName('wb-cell-navigation'))
        ),
    ]
      .filter((element) => element !== undefined)
      .map(
        (element) =>
          [element as HTMLButtonElement, element.getAttribute('title')] as const
      );

    effects.push(() =>
      elementsToDisable.forEach(([element]) => {
        if (element === undefined || element === null) return;
        element.disabled = true;
        element.setAttribute('title', wbText.unavailableWhileViewingResults());
      })
    );
    effectsCleanup.push(() =>
      elementsToDisable.forEach(([element, title]) => {
        if (element === undefined || element === null) return;
        element.disabled = false;
        element.setAttribute('title', title ?? '');
      })
    );

    const isReadOnly = this.hot.getSettings().readOnly;
    effects.push(() => this.hot!.updateSettings({ readOnly: true }));
    effectsCleanup.push(() =>
      this.hot?.updateSettings({ readOnly: isReadOnly })
    );

    const initialHiddenRows = getHotPlugin(
      this.hot,
      'hiddenRows'
    ).getHiddenRows();
    const initialHiddenCols = getHotPlugin(
      this.hot,
      'hiddenColumns'
    ).getHiddenColumns();
    const rowsToInclude = new Set();
    const colsToInclude = new Set();
    Object.entries(this.cells.cellMeta).forEach(([physicalRow, rowMeta]) =>
      rowMeta.forEach((metaArray, physicalCol) => {
        if (!this.cells.getCellMetaFromArray(metaArray, 'isNew')) return;
        rowsToInclude.add((physicalRow as unknown as number) | 0);
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
      if (this.hot === undefined) return;
      getHotPlugin(this.hot, 'hiddenRows').hideRows(rowsToHide);
      getHotPlugin(this.hot, 'hiddenColumns').hideColumns(colsToHide);
    });
    effectsCleanup.push(() => {
      if (this.hot === undefined) return;
      getHotPlugin(this.hot, 'hiddenRows').showRows(
        rowsToHide.filter((visualRow) => !initialHiddenRows.includes(visualRow))
      );
      getHotPlugin(this.hot, 'hiddenColumns').showColumns(
        colsToHide.filter((visualCol) => !initialHiddenCols.includes(visualCol))
      );
    });

    const newCellsAreHidden = this.el.classList.contains('wb-hide-new-cells');
    effects.push(() => this.wbUtils.toggleCellTypes('newCells', 'remove'));
    effectsCleanup.push(() =>
      newCellsAreHidden
        ? this.wbUtils.toggleCellTypes('newCells', 'add')
        : undefined
    );

    effects.push(() => {
      target?.toggleAttribute('aria-pressed', true);
    });
    effectsCleanup.push(() => {
      target?.toggleAttribute('aria-pressed', false);
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
      [...effects, this.hot?.render.bind(this.hot) ?? f.void].forEach(
        (effect) => effect()
      );
    const runCleanup = () =>
      // If WbView.remove() was called, this.hot would be undefined here
      [...effectsCleanup, this.hot?.render.bind(this.hot)].forEach(
        (effectCleanup) => effectCleanup?.()
      );

    const container = document.createElement('div');
    this.uploadedView = this.options.display(
      <WbUploaded
        dataSetId={this.dataset.id}
        dataSetName={this.dataset.name}
        isUploaded={this.isUploaded}
        recordCounts={this.validation.uploadResults.recordCounts}
        onClose={(): void => this.uploadedView?.()}
      />,
      container,
      () => {
        this.uploadedView = undefined;
        runCleanup();
      }
    );
    uploadedViewWrapper.append(container);

    runEffects();
  }

  protected changeOwner(): void {
    this.dataSetMeta.changeOwner();
  }

  protected upload(event: MouseEvent): void {
    this.actions.upload(event);
  }

  protected unupload(): void {
    this.actions.unupload();
  }

  protected toggleDataCheck(event: MouseEvent): void {
    this.validation.toggleDataCheck(event);
  }

  protected revertChanges(): void {
    this.actions.revertChanges();
  }

  protected save(): void {
    this.actions.save().catch(raise);
  }

  protected export(): void {
    downloadDataSet(this.dataset).catch(raise);
  }

  // Helpers
  /*
   * MappingCol is the index of the lines line corresponding to
   * a particular physicalCol. Since there can be unmapped columns, these
   * indexes do not line up and need to be converted like this:
   */
  physicalColToMappingCol(physicalCol: number): number | undefined {
    return this.mappings?.lines.findIndex(
      ({ headerName }) => headerName === this.dataset.columns[physicalCol]
    );
  }

  // Check if AJAX failed because Data Set was deleted
  checkDeletedFail(statusCode: number): boolean {
    if (statusCode === Http.NOT_FOUND) this.options.onDeleted();
    return statusCode === Http.NOT_FOUND;
  }

  // For debugging only
  showPlan(): void {
    const dialog = this.options.display(
      <DevShowPlan
        dataSetId={this.dataset.id}
        uploadPlan={this.dataset.uploadplan ?? ({} as UploadPlan)}
        onChanged={(plan) => {
          overwriteReadOnly(this.dataset, 'uploadplan', plan);
          this.trigger('refresh');
        }}
        onClose={(): void => dialog()}
        onDeleted={this.options.onDeleted}
      />
    );
  }
}

/* eslint-enable functional/no-this-expression */
