import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useId } from '../../hooks/useId';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { useAttachment } from '../Attachments/Plugin';
import { AttachmentViewer } from '../Attachments/Viewer';
import { ReadOnlyContext, SearchDialogContext } from '../Core/Contexts';
import { backboneFieldSeparator } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { Relationship } from '../DataModel/specifyField';
import type { Collection, SpecifyTable } from '../DataModel/specifyTable';
import type { CollectionObjectGroup } from '../DataModel/types';
import { FormMeta } from '../FormMeta';
import type { FormCellDefinition, SubViewSortField } from '../FormParse/cells';
import { DeleteButton } from '../Forms/DeleteButton';
import { SpecifyForm } from '../Forms/SpecifyForm';
import { SubViewContext } from '../Forms/SubView';
import { propsToFormMode, useViewDefinition } from '../Forms/useViewDefinition';
import { shouldBeToOne } from '../FormSliders/helpers';
import { getCollectionPref } from '../InitialContext/remotePrefs';
import { loadingGif } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';
import type { SortConfig } from '../Molecules/Sorting';
import { SortIndicator } from '../Molecules/Sorting';
import { hasTablePermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { useSearchDialog } from '../SearchDialog';
import { AttachmentPluginSkeleton } from '../SkeletonLoaders/AttachmentPlugin';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { COJODialog } from './COJODialog';
import { FormCell } from './index';

const cellToLabel = (
  table: SpecifyTable,
  cell: FormCellDefinition
): {
  readonly text: LocalizedString | undefined;
  readonly title: LocalizedString | undefined;
} => ({
  text: cell.ariaLabel,
  title:
    cell.type === 'Field' || cell.type === 'SubView'
      ? table
          .getField(cell.fieldNames?.join(backboneFieldSeparator) ?? '')
          ?.getLocalizedDesc()
      : undefined,
});

const cellClassName =
  'sticky top-0 bg-[color:var(--form-foreground)] z-10 h-full -mx-1 px-1 py-1 border-b border-gray-500';

const minSubviewColumnWidth = 80;
const maxSubviewColumnWidth = 600;

function measureSubviewText(
  text: string,
  font: string,
  context: CanvasRenderingContext2D
): number {
  context.font = font;
  return Math.ceil(
    Math.max(
      0,
      ...text.split(/\r?\n/u).map((line) => context.measureText(line).width)
    )
  );
}

function measureSubviewHeader(
  text: string,
  font: string,
  context: CanvasRenderingContext2D
): number {
  const words = text.trim().split(/\s+/u);
  const middle = Math.ceil(words.length / 2);
  return measureSubviewText(
    `${words.slice(0, middle).join(' ')}\n${words.slice(middle).join(' ')}`,
    font,
    context
  );
}

function measureSubviewCell(
  cell: HTMLElement,
  context: CanvasRenderingContext2D
): number {
  const controls = Array.from(
    cell.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >('input, textarea, select')
  );
  if (controls.length === 0)
    return measureSubviewText(
      cell.textContent ?? '',
      getComputedStyle(cell).font,
      context
    );

  return controls.reduce((total, control) => {
    const style = getComputedStyle(control);
    const horizontalPadding =
      Number.parseFloat(style.paddingLeft) +
      Number.parseFloat(style.paddingRight) +
      Number.parseFloat(style.borderLeftWidth) +
      Number.parseFloat(style.borderRightWidth);
    if (control instanceof HTMLInputElement && control.type === 'checkbox')
      return Math.max(total, 48);
    if (control instanceof HTMLInputElement && control.type === 'date')
      return Math.max(total, 136);
    const value =
      control instanceof HTMLSelectElement
        ? (control.selectedOptions[0]?.textContent ?? '')
        : control.value || control.getAttribute('placeholder') || '';
    const width =
      measureSubviewText(value, style.font, context) +
      horizontalPadding +
      (control instanceof HTMLSelectElement
        ? 28
        : control instanceof HTMLInputElement && control.type === 'number'
          ? 30
          : 8);
    return Math.max(total, width);
  }, minSubviewColumnWidth);
}

function fitSubviewColumnWidths(
  widths: Array<number>,
  availableWidth: number,
  minimumWidths: Array<number>
): Array<number> {
  const minimumTotal = minimumWidths.reduce((total, width) => total + width, 0);
  const preferredWidths = widths.map((width, index) =>
    Math.max(width, minimumWidths[index] ?? minSubviewColumnWidth)
  );
  const totalWidth = preferredWidths.reduce((total, width) => total + width, 0);
  if (totalWidth <= availableWidth) return preferredWidths;
  if (availableWidth <= 0) return minimumWidths;
  if (availableWidth <= minimumTotal)
    return minimumWidths.map(
      (width) => (width * availableWidth) / minimumTotal
    );
  const scale = (availableWidth - minimumTotal) / (totalWidth - minimumTotal);
  return preferredWidths.map((width, index) => {
    const minimum = minimumWidths[index] ?? minSubviewColumnWidth;
    return minimum + (width - minimum) * scale;
  });
}

// REFACTOR: split this component into smaller
/**
 * Show several records in "grid view"
 */
export function FormTable<SCHEMA extends AnySchema>({
  relationship,
  isDependent,
  resources: unsortedResources,
  totalCount = unsortedResources.length,
  onAdd: handleAdd,
  onDelete: handleDelete,
  viewName = relationship.relatedTable.view,
  dialog,
  onClose: handleClose,
  sortField,
  onFetchMore: handleFetchMore,
  isCollapsed = false,
  preHeaderButtons,
  collection,
  disableRemove,
}: {
  readonly relationship: Relationship;
  readonly isDependent: boolean;
  readonly resources: RA<SpecifyResource<SCHEMA>>;
  readonly totalCount?: number;
  readonly onAdd:
    | ((resources: RA<SpecifyResource<SCHEMA>>) => void)
    | undefined;
  readonly onDelete: ((resource: SpecifyResource<SCHEMA>) => void) | undefined;
  readonly viewName?: string;
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly onClose: () => void;
  readonly sortField: SubViewSortField | undefined;
  readonly onFetchMore: (() => Promise<void>) | undefined;
  readonly isCollapsed: boolean | undefined;
  readonly preHeaderButtons?: JSX.Element;
  readonly collection: Collection<AnySchema> | undefined;
  readonly disableRemove?: boolean;
}): JSX.Element {
  const [sortConfig, setSortConfig] = React.useState<
    SortConfig<string> | undefined
  >(
    sortField === undefined
      ? undefined
      : {
          sortField: sortField.fieldNames.join(backboneFieldSeparator),
          ascending: sortField.direction === 'asc',
        }
  );

  const resources = React.useMemo(
    () =>
      sortConfig === undefined
        ? // Note, resources might be sorted by the back-end
          unsortedResources
        : Array.from(unsortedResources).sort(
            sortFunction(
              // FEATURE: handle related fields
              (resource) => resource.get(sortConfig.sortField),
              !sortConfig.ascending
            )
          ),
    [sortConfig, unsortedResources]
  );

  // When added a new resource, focus that row
  const addedResource = React.useRef<SpecifyResource<SCHEMA> | undefined>(
    undefined
  );

  const handleAddResources =
    typeof handleAdd === 'function'
      ? function handleAddResources(
          resources: RA<SpecifyResource<SCHEMA>>
        ): void {
          const expandedRecords = {
            ...isExpanded,
            ...Object.fromEntries(
              resources.map((resource) => [resource.cid, true] as const)
            ),
          };
          setExpandedRecords(expandedRecords);
          handleAdd(resources);
          addedResource.current = resources[0];
        }
      : undefined;

  const rowsRef = React.useRef<HTMLDivElement | null>(null);

  const isTreeTable = collection!.table.specifyTable.name.includes('Tree');

  React.useEffect(() => {
    if (addedResource.current === undefined) return;
    const resourceIndex = resources.indexOf(addedResource.current);
    addedResource.current = undefined;
    if (resourceIndex === -1 || rowsRef.current === null) return;
    const lastRow: HTMLElement | null = rowsRef.current.querySelector(
      `:scope > :nth-child(${resourceIndex}) > [tabindex="-1"]`
    );
    lastRow?.focus();
  }, [resources]);

  const isSystemConfigResource =
    (relationship.relatedTable.name === 'Collection' &&
      relationship.name === 'collections') ||
    (relationship.relatedTable.name === 'Discipline' &&
      relationship.name === 'disciplines');

  const isToOne =
    !relationshipIsToMany(relationship) || shouldBeToOne(relationship);

  const disableAdding =
    (isToOne && resources.length > 0) || isSystemConfigResource;

  const header = commonText.countLine({
    resource: relationship.label,
    count: totalCount ?? resources.length,
  });

  const isReadOnly = React.useContext(ReadOnlyContext);

  const isInSearchDialog = React.useContext(SearchDialogContext);

  const mode = propsToFormMode(isReadOnly, isInSearchDialog);

  const collapsedViewDefinition = useViewDefinition({
    table: relationship.relatedTable,
    viewName,
    fallbackViewName: relationship.relatedTable.view,
    formType: 'formTable',
    mode,
  });

  const expandedViewDefinition = useViewDefinition({
    table: relationship.relatedTable,
    viewName,
    fallbackViewName: relationship.relatedTable.view,
    formType: 'form',
    mode,
  });

  const id = useId('form-table');

  const collectionPreparationPref = getCollectionPref(
    'CO_CREATE_PREP',
    schema.domainLevelIds.collection
  );

  const [isExpanded, setExpandedRecords] = React.useState<
    IR<boolean | undefined>
  >(
    Object.fromEntries(
      resources.map((resource) => [
        resource.cid,
        Boolean(
          resource.specifyTable.name === 'Preparation' &&
          collectionPreparationPref &&
          resource.isNew()
        ),
      ])
    )
  );

  const [showSubviewBorders] = userPreferences.use(
    'form',
    'ui',
    'showSubviewBorders'
  );

  const [flexibleColumnWidth] = userPreferences.use(
    'form',
    'definition',
    'flexibleColumnWidth'
  );

  const displayDeleteButton =
    mode !== 'view' && typeof handleDelete === 'function';
  const displayViewButton = !isDependent;

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [tableWidth, setTableWidth] = React.useState(0);
  const [contentColumnWidths, setContentColumnWidths] = React.useState<
    Array<number>
  >([]);
  const [headerColumnWidths, setHeaderColumnWidths] = React.useState<
    Array<number>
  >([]);
  const [tableChromeWidth, setTableChromeWidth] = React.useState(0);
  const [columnWidths, setColumnWidths] = React.useState<
    Record<number, number>
  >({});
  React.useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer === null) return;
    const observer = new ResizeObserver(([entry]) => {
      setTableWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(scrollContainer);
    return (): void => observer.disconnect();
  }, [collapsedViewDefinition, resources.length > 0]);
  React.useEffect(() => {
    if (collapsedViewDefinition === undefined) return;
    const frame = requestAnimationFrame(() => {
      const tableElement = scrollerRef.current;
      if (tableElement === null) return;
      const context = document.createElement('canvas').getContext('2d');
      if (context === null) return;
      const measuredColumns = collapsedViewDefinition.rows[0].map(
        (_, columnIndex) => {
          const header = tableElement.querySelector<HTMLElement>(
            `[data-subview-header-col="${columnIndex}"]`
          );
          const headerLabel = header?.querySelector<HTMLElement>(
            '[data-subview-header-label]'
          );
          const cells = Array.from(
            tableElement.querySelectorAll<HTMLElement>(
              `[data-subview-cell-col="${columnIndex}"]`
            )
          );
          const labelWidth =
            headerLabel === null || headerLabel === undefined
              ? 0
              : measureSubviewHeader(
                  headerLabel.textContent ?? '',
                  getComputedStyle(headerLabel).font,
                  context
                ) + 32;
          const indicator = header?.querySelector(
            '[data-subview-sort-indicator]'
          );
          const headerWidth =
            labelWidth +
            (indicator === undefined || indicator === null ? 0 : 28);
          return {
            headerWidth: Math.min(maxSubviewColumnWidth, headerWidth),
            contentWidth: Math.min(
              maxSubviewColumnWidth,
              Math.max(
                minSubviewColumnWidth,
                labelWidth,
                ...cells.map((cell) => measureSubviewCell(cell, context))
              )
            ),
          };
        }
      );
      const measuredWidths = measuredColumns.map(
        ({ contentWidth }) => contentWidth
      );
      setHeaderColumnWidths(
        measuredColumns.map(({ headerWidth }) =>
          Math.max(minSubviewColumnWidth, headerWidth)
        )
      );
      const headers = tableElement.querySelectorAll<HTMLElement>(
        '[role="columnheader"]'
      );
      const actionButton = tableElement.querySelector<HTMLElement>(
        '[role="rowgroup"] [role="row"] [role="cell"]:last-child button'
      );
      const buttonColumnsWidth =
        (headers[0]?.getBoundingClientRect().width ?? 40) +
        Math.max(40, actionButton?.getBoundingClientRect().width ?? 0);
      const style = getComputedStyle(tableElement);
      const horizontalPadding =
        Number.parseFloat(style.paddingLeft) +
        Number.parseFloat(style.paddingRight);
      const gap = Number.parseFloat(style.columnGap) || 0;
      setTableChromeWidth(
        buttonColumnsWidth +
          horizontalPadding +
          gap * (collapsedViewDefinition.columns.length + 2)
      );
      setContentColumnWidths(measuredWidths);
    });
    return (): void => cancelAnimationFrame(frame);
  }, [collapsedViewDefinition, unsortedResources]);
  const resizeColumn = React.useCallback(
    (columnIndex: number, event: React.PointerEvent<HTMLDivElement>): void => {
      event.preventDefault();
      event.stopPropagation();
      const tableElement = scrollerRef.current;
      if (tableElement === null) return;
      const header = tableElement.querySelector<HTMLElement>(
        `[data-subview-header-col="${columnIndex}"]`
      );
      const initialWidth =
        columnWidths[columnIndex] ?? header?.getBoundingClientRect().width ?? 0;
      const startX = event.clientX;
      const pointerId = event.pointerId;
      let latestX = startX;
      let frame: number | undefined;
      const updateWidth = (clientX: number): void =>
        setColumnWidths((widths) => ({
          ...widths,
          [columnIndex]: Math.max(
            60,
            Math.min(
              maxSubviewColumnWidth,
              Math.ceil(initialWidth + clientX - startX)
            )
          ),
        }));
      const handleMove = (moveEvent: PointerEvent): void => {
        if (moveEvent.pointerId !== pointerId) return;
        latestX = moveEvent.clientX;
        if (frame !== undefined) return;
        frame = requestAnimationFrame(() => {
          frame = undefined;
          updateWidth(latestX);
        });
      };
      const handleUp = (upEvent: PointerEvent): void => {
        if (upEvent.pointerId !== pointerId) return;
        if (frame !== undefined) cancelAnimationFrame(frame);
        updateWidth(latestX);
        globalThis.removeEventListener('pointermove', handleMove);
        globalThis.removeEventListener('pointerup', handleUp);
        globalThis.removeEventListener('pointercancel', handleUp);
      };
      globalThis.addEventListener('pointermove', handleMove);
      globalThis.addEventListener('pointerup', handleUp);
      globalThis.addEventListener('pointercancel', handleUp);
    },
    [columnWidths]
  );
  const gridTemplateColumns = React.useMemo(() => {
    const autoColumns = contentColumnWidths
      .map((width, index) => ({ width, index }))
      .filter(({ index }) => columnWidths[index] === undefined);
    const fixedWidth = Object.values(columnWidths).reduce(
      (total, width) => total + width,
      0
    );
    const minimumWidths = autoColumns.map(({ index }) => {
      const definition = collapsedViewDefinition?.rows[0]?.[index];
      const fieldName =
        definition !== undefined && 'fieldNames' in definition
          ? definition.fieldNames?.join(backboneFieldSeparator)
          : undefined;
      return sortConfig?.sortField === fieldName
        ? Math.max(
            minSubviewColumnWidth,
            headerColumnWidths[index] ?? minSubviewColumnWidth
          )
        : minSubviewColumnWidth;
    });
    const widths = fitSubviewColumnWidths(
      autoColumns.map(({ width }) => width),
      tableWidth - tableChromeWidth - fixedWidth,
      minimumWidths
    );
    let autoIndex = 0;
    const cells = collapsedViewDefinition?.rows[0] ?? [];
    const cellColumns = cells.reduce((total, cell) => total + cell.colSpan, 0);
    return [
      'min-content',
      ...cells.flatMap((cell, index) => {
        const span = cell.colSpan;
        if (columnWidths[index] !== undefined)
          return Array.from(
            { length: span },
            () => `${columnWidths[index] / span}px`
          );
        const minimumWidth = widths[autoIndex] ?? minSubviewColumnWidth;
        const flex = autoColumns[autoIndex]?.width ?? minSubviewColumnWidth;
        autoIndex += 1;
        return Array.from(
          { length: span },
          () => `minmax(${minimumWidth / span}px, ${flex / span}fr)`
        );
      }),
      ...(collapsedViewDefinition?.columns.slice(cellColumns) ?? []).map(
        (width) =>
          typeof width === 'number'
            ? `${width}${flexibleColumnWidth ? 'fr' : 'px'}`
            : 'minmax(0, 1fr)'
      ),
      autoColumns.length === 0 ? 'minmax(0, 1fr)' : '0px',
      'min-content',
    ].join(' ');
  }, [
    collapsedViewDefinition?.columns,
    collapsedViewDefinition?.rows,
    columnWidths,
    contentColumnWidths,
    headerColumnWidths,
    sortConfig,
    flexibleColumnWidth,
    tableChromeWidth,
    tableWidth,
  ]);
  const { isFetching, handleScroll } = useInfiniteScroll(
    handleFetchMore,
    scrollContainerRef
  );

  const [maxHeight] = userPreferences.use('form', 'formTable', 'maxHeight');

  const { searchDialog, showSearchDialog } = useSearchDialog({
    forceCollection: undefined,
    extraFilters: undefined,
    table: relationship.relatedTable,
    multiple: !isToOne,
    onSelected: handleAddResources,
  });

  const subviewContext = React.useContext(SubViewContext);
  const parentContext = React.useMemo(
    () => subviewContext?.parentContext ?? [],
    [subviewContext?.parentContext]
  );

  const renderedResourceId = React.useMemo(
    () =>
      parentContext.length === 0 || relationship.isDependent()
        ? undefined
        : f.maybe(
            parentContext.find(
              ({ relationship: parentRelationship }) =>
                parentRelationship === relationship.getReverse()
            ),
            ({ parentResource: { id } }) => id
          ),
    [parentContext, relationship]
  );

  const children =
    collapsedViewDefinition === undefined ? (
      commonText.loading()
    ) : resources.length === 0 ? (
      <p>{formsText.noData()}</p>
    ) : (
      <div
        className={
          isCollapsed
            ? 'hidden'
            : showSubviewBorders
              ? 'overflow-auto border border-gray-500 border-t-0 rounded-b pl-1 pr-1 pb-1'
              : 'overflow-auto pl-1 pr-1 pb-1'
        }
        ref={scrollContainerRef}
        style={{ maxHeight: `${maxHeight}px` }}
        onScroll={handleScroll}
      >
        <DataEntry.Grid
          className="w-full gap-1 pt-0"
          display="inline"
          flexibleColumnWidth={flexibleColumnWidth}
          forwardRef={scrollerRef}
          role="table"
          style={{
            gridTemplateColumns,
            width: '100%',
          }}
          viewDefinition={collapsedViewDefinition}
        >
          <div
            /*
             * If header was ever visible, don't hide the header row anymore to
             * prevent needless layout shifts, but only make it invisible
             */
            className="contents"
            role="row"
          >
            <div className={cellClassName} role="columnheader">
              <span className="sr-only">{commonText.expand()}</span>
            </div>
            {collapsedViewDefinition.rows[0].map((cell, index) => {
              const columnIndex = index;
              const { text, title } = cellToLabel(
                relationship.relatedTable,
                cell
              );
              const isSortable =
                cell.type === 'Field' || cell.type === 'SubView';
              const fieldName = isSortable
                ? cell.fieldNames?.join(backboneFieldSeparator)
                : undefined;
              const label = (
                <span
                  className="block min-w-0 overflow-hidden whitespace-normal break-normal text-center"
                  style={{
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                  }}
                  data-subview-header-label
                  title={text}
                >
                  {text}
                </span>
              );
              return (
                <DataEntry.Cell
                  align="center"
                  className={`${cellClassName} relative min-w-0 justify-center`}
                  colSpan={cell.colSpan}
                  key={index}
                  data-subview-header-col={columnIndex}
                  role="columnheader"
                  title={title}
                  verticalAlign={cell.verticalAlign}
                  visible
                >
                  {isSortable && typeof fieldName === 'string' ? (
                    <Button.LikeLink
                      className="flex w-full min-w-0 items-center justify-center gap-1 overflow-hidden"
                      onClick={(): void =>
                        setSortConfig({
                          sortField: fieldName,
                          ascending: !(sortConfig?.ascending ?? false),
                        })
                      }
                    >
                      {label}
                      <span className="shrink-0" data-subview-sort-indicator>
                        <SortIndicator
                          fieldName={fieldName}
                          sortConfig={sortConfig}
                        />
                      </span>
                    </Button.LikeLink>
                  ) : (
                    label
                  )}
                  <div
                    aria-label="Resize column"
                    aria-orientation="vertical"
                    aria-valuemax={maxSubviewColumnWidth}
                    aria-valuemin={60}
                    aria-valuenow={Math.round(
                      columnWidths[columnIndex] ??
                        contentColumnWidths[columnIndex] ??
                        minSubviewColumnWidth
                    )}
                    className="absolute inset-y-0 z-20 w-4 cursor-col-resize touch-none before:absolute before:inset-y-0 before:right-2 before:w-px before:bg-gray-500 before:content-['']"
                    role="separator"
                    style={{ right: -8 }}
                    tabIndex={0}
                    onKeyDown={(event): void => {
                      if (
                        event.key !== 'ArrowLeft' &&
                        event.key !== 'ArrowRight'
                      )
                        return;
                      event.preventDefault();
                      const header =
                        scrollerRef.current?.querySelector<HTMLElement>(
                          `[data-subview-header-col="${columnIndex}"]`
                        );
                      const currentWidth =
                        columnWidths[columnIndex] ??
                        header?.getBoundingClientRect().width ??
                        minSubviewColumnWidth;
                      setColumnWidths((widths) => ({
                        ...widths,
                        [columnIndex]: Math.max(
                          60,
                          Math.min(
                            maxSubviewColumnWidth,
                            currentWidth +
                              (event.key === 'ArrowRight' ? 10 : -10)
                          )
                        ),
                      }));
                    }}
                    onPointerDown={(event): void =>
                      resizeColumn(columnIndex, event)
                    }
                  />
                </DataEntry.Cell>
              );
            })}
            <div
              aria-hidden="true"
              className={cellClassName}
              role="columnheader"
            />
            <div className={cellClassName} role="columnheader">
              <span className="sr-only">{commonText.actions()}</span>
            </div>
          </div>
          <div className="contents" ref={rowsRef} role="rowgroup">
            {resources.map((resource) => (
              <React.Fragment key={resource.cid}>
                <div className="contents" role="row">
                  {isExpanded[resource.cid] === true ? (
                    <>
                      <div
                        className="h-full"
                        role="cell"
                        style={{ gridColumn: '1 / 2' }}
                      >
                        <Button.Small
                          aria-label={commonText.collapse()}
                          className="h-full"
                          title={commonText.collapse()}
                          onClick={(): void =>
                            setExpandedRecords({
                              ...isExpanded,
                              [resource.cid]: false,
                            })
                          }
                        >
                          {icons.chevronDown}
                        </Button.Small>
                      </div>
                      <DataEntry.Cell
                        align="left"
                        className="border-y border-gray-400 py-1"
                        colSpan={collapsedViewDefinition.columns.length + 1}
                        role="cell"
                        style={{
                          gridColumn: `2 / span ${collapsedViewDefinition.columns.length + 1}`,
                        }}
                        tabIndex={-1}
                        verticalAlign="stretch"
                        visible
                      >
                        <ReadOnlyContext.Provider
                          value={
                            isReadOnly ||
                            (renderedResourceId !== undefined &&
                              resource.id === renderedResourceId)
                          }
                        >
                          <SpecifyForm
                            display="inline"
                            resource={resource}
                            viewDefinition={expandedViewDefinition}
                          />
                        </ReadOnlyContext.Provider>
                      </DataEntry.Cell>
                    </>
                  ) : (
                    <>
                      <div className="h-full" role="cell">
                        <Button.Small
                          aria-label={commonText.expand()}
                          className="h-full"
                          title={commonText.expand()}
                          onClick={(): void =>
                            setExpandedRecords({
                              ...isExpanded,
                              [resource.cid]: true,
                            })
                          }
                        >
                          {icons.chevronRight}
                        </Button.Small>
                      </div>
                      <ReadOnlyContext.Provider
                        value={
                          isReadOnly ||
                          collapsedViewDefinition.mode === 'view' ||
                          (renderedResourceId !== undefined &&
                            resource.id === renderedResourceId)
                        }
                      >
                        <SearchDialogContext.Provider
                          value={
                            isInSearchDialog ||
                            collapsedViewDefinition.mode === 'search'
                          }
                        >
                          {collapsedViewDefinition.isAttachmentPlugin ? (
                            <div
                              className="flex gap-8"
                              role="cell"
                              style={{
                                gridColumn: `span ${collapsedViewDefinition.columns.length} / span ${collapsedViewDefinition.columns.length}`,
                              }}
                            >
                              <Attachment resource={resource} />
                            </div>
                          ) : (
                            collapsedViewDefinition.rows[0].map(
                              (
                                {
                                  colSpan,
                                  align,
                                  verticalAlign,
                                  visible,
                                  id: cellId,
                                  ...cellData
                                },
                                index
                              ) => (
                                <DataEntry.Cell
                                  align={align}
                                  className="min-w-0 [&_input]:min-w-0 [&_input]:max-w-full [&_input]:text-ellipsis [&_select]:min-w-0 [&_select]:max-w-full [&_textarea]:min-w-0 [&_textarea]:max-w-full"
                                  colSpan={colSpan}
                                  key={index}
                                  data-subview-cell-col={index}
                                  role="cell"
                                  verticalAlign={verticalAlign}
                                  visible={visible}
                                >
                                  <FormCell
                                    align={align}
                                    cellData={cellData}
                                    formatId={(suffix: string): string =>
                                      id(`${index}-${suffix}`)
                                    }
                                    formType="formTable"
                                    id={cellId}
                                    resource={resource}
                                    verticalAlign={verticalAlign}
                                  />
                                </DataEntry.Cell>
                              )
                            )
                          )}
                        </SearchDialogContext.Provider>
                      </ReadOnlyContext.Provider>
                    </>
                  )}
                  {isExpanded[resource.cid] !== true && (
                    <div
                      aria-hidden="true"
                      className="border-b border-gray-200"
                      role="cell"
                    />
                  )}
                  <div
                    className="flex h-full flex-col gap-2"
                    role="cell"
                    style={{ gridColumn: '-2 / -1' }}
                  >
                    {displayViewButton &&
                    isExpanded[resource.cid] === true &&
                    !resource.isNew() ? (
                      <Link.Small
                        aria-label={commonText.openInNewTab()}
                        className="flex-1"
                        href={resource.viewUrl()}
                        title={commonText.openInNewTab()}
                      >
                        {icons.externalLink}
                      </Link.Small>
                    ) : undefined}
                    {displayDeleteButton &&
                    (!resource.isNew() ||
                      hasTablePermission(
                        relationship.relatedTable.name,
                        isDependent ? 'delete' : 'update'
                      )) &&
                    !disableRemove &&
                    (renderedResourceId === undefined ||
                      renderedResourceId === resource.id) ? (
                      /*
                       * Check condition for tree table delete button, since new resources do not have id yet
                       * alternates between DeleteButton logic with save blcokers and simple remove button for new, and unsaved resources
                       */
                      resource.id !== undefined &&
                      resource.id !== null &&
                      isTreeTable ? (
                        <DeleteButton
                          component={Button.Small}
                          deferred
                          isIcon
                          resource={resource}
                          onDeleted={(): void => {
                            if (typeof handleDelete === 'function') {
                              handleDelete(resource);
                            }
                          }}
                        >
                          {(onClick, disabled): JSX.Element => (
                            <Button.Small
                              aria-label={commonText.remove()}
                              className="h-full"
                              disabled={disabled}
                              title={commonText.remove()}
                              onClick={onClick}
                            >
                              {icons.trash}
                            </Button.Small>
                          )}
                        </DeleteButton>
                      ) : (
                        <Button.Small
                          aria-label={commonText.remove()}
                          className="h-full"
                          title={commonText.remove()}
                          onClick={(): void => {
                            handleDelete(resource);
                          }}
                        >
                          {icons.trash}
                        </Button.Small>
                      )
                    ) : undefined}
                    {isExpanded[resource.cid] === true && (
                      <FormMeta
                        className="flex-1"
                        resource={resource}
                        viewDescription={expandedViewDefinition}
                      />
                    )}
                  </div>
                </div>
              </React.Fragment>
            ))}
            {isFetching && (
              <div className="contents" role="row">
                <div className="col-span-full" role="cell">
                  {loadingGif}
                </div>
              </div>
            )}
          </div>
        </DataEntry.Grid>
      </div>
    );

  const addButtons =
    mode === 'view' || disableAdding ? undefined : relationship.relatedTable
        .name === 'CollectionObjectGroupJoin' &&
      relationship.name === 'children' ? (
      <COJODialog
        collection={collection}
        parentResource={
          collection?.related as
            | SpecifyResource<CollectionObjectGroup>
            | undefined
        }
      />
    ) : typeof handleAddResources === 'function' ? (
      <>
        {!isDependent &&
        hasTablePermission(relationship.relatedTable.name, 'read') ? (
          <DataEntry.Search disabled={isReadOnly} onClick={showSearchDialog} />
        ) : undefined}
        {hasTablePermission(relationship.relatedTable.name, 'create') ? (
          <DataEntry.Add
            onClick={(): void => {
              const resource = new relationship.relatedTable.Resource();
              handleAddResources([resource]);
            }}
          />
        ) : undefined}
      </>
    ) : undefined;

  return dialog === false ? (
    <DataEntry.SubForm>
      <DataEntry.SubFormHeader>
        {preHeaderButtons}
        <DataEntry.SubFormTitle>{header}</DataEntry.SubFormTitle>
        {addButtons}
      </DataEntry.SubFormHeader>
      {children}
      {searchDialog}
    </DataEntry.SubForm>
  ) : (
    <Dialog
      buttons={commonText.close()}
      dimensionsKey={relationship.name}
      header={header}
      headerButtons={addButtons}
      modal={dialog === 'modal'}
      onClose={handleClose}
    >
      {children}
    </Dialog>
  );
}

function Attachment({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
}): JSX.Element | null {
  const related = React.useState<SpecifyResource<AnySchema> | undefined>(
    undefined
  );
  const [attachment] = useAttachment(resource);
  return typeof attachment === 'object' ? (
    <AttachmentViewer
      attachment={attachment}
      related={related}
      showMeta={false}
      onViewRecord={undefined}
    />
  ) : attachment === false ? (
    <p>{formsText.noData()}</p>
  ) : (
    <AttachmentPluginSkeleton />
  );
}
