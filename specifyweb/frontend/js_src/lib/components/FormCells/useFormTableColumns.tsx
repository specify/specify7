import React from 'react';

import { columnDefinitionsToCss } from '../Atoms/DataEntry';
import { backboneFieldSeparator } from '../DataModel/helpers';
import type { ParsedFormDefinition } from '../FormParse';
import type { SortConfig } from '../Molecules/Sorting';

const minimumColumnWidth = 80;
const minimumResizableColumnWidth = 60;
const maximumColumnWidth = 600;

function measureText(
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

function measureHeader(
  text: string,
  font: string,
  context: CanvasRenderingContext2D
): number {
  const words = text.trim().split(/\s+/u);
  const middle = Math.ceil(words.length / 2);
  return measureText(
    `${words.slice(0, middle).join(' ')}\n${words.slice(middle).join(' ')}`,
    font,
    context
  );
}

function measureCell(
  cell: HTMLElement,
  context: CanvasRenderingContext2D
): number {
  const controls = Array.from(
    cell.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >('input, textarea, select')
  );
  if (controls.length === 0)
    return measureText(
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
      measureText(value, style.font, context) +
      horizontalPadding +
      (control instanceof HTMLSelectElement
        ? 28
        : control instanceof HTMLInputElement && control.type === 'number'
          ? 30
          : 8);
    return Math.max(total, width);
  }, minimumColumnWidth);
}

function fitColumnWidths(
  widths: Array<number>,
  availableWidth: number,
  minimumWidths: Array<number>
): Array<number> {
  const minimumTotal = minimumWidths.reduce((total, width) => total + width, 0);
  const preferredWidths = widths.map((width, index) =>
    Math.max(width, minimumWidths[index] ?? minimumColumnWidth)
  );
  const totalWidth = preferredWidths.reduce((total, width) => total + width, 0);
  if (totalWidth <= availableWidth) return preferredWidths;
  if (minimumTotal === 0) return minimumWidths;
  if (availableWidth <= minimumTotal)
    return minimumWidths.map(
      (width) => (width * availableWidth) / minimumTotal
    );
  const scale = (availableWidth - minimumTotal) / (totalWidth - minimumTotal);
  return preferredWidths.map((width, index) => {
    const minimum = minimumWidths[index] ?? minimumColumnWidth;
    return minimum + (width - minimum) * scale;
  });
}

type FormTableColumnSizing = {
  readonly columnWidths: Record<number, number>;
  readonly contentColumnWidths: Array<number>;
  readonly gridRef: React.RefObject<HTMLDivElement>;
  readonly gridTemplateColumns: string;
  readonly resizeColumn: (
    columnIndex: number,
    event: React.PointerEvent<HTMLDivElement>
  ) => void;
  readonly resizeColumnWithKeyboard: (
    columnIndex: number,
    direction: -1 | 1
  ) => void;
  readonly scrollContainerRef: React.RefObject<HTMLDivElement>;
};

export function useFormTableColumns({
  flexibleSubGridColumnWidth,
  hasResources,
  isCollapsed,
  measurementKey,
  sortConfig,
  viewDefinition,
}: {
  readonly flexibleSubGridColumnWidth: boolean;
  readonly hasResources: boolean;
  readonly isCollapsed: boolean;
  readonly measurementKey: unknown;
  readonly sortConfig: SortConfig<string> | undefined;
  readonly viewDefinition: ParsedFormDefinition | undefined;
}): FormTableColumnSizing {
  const gridRef = React.useRef<HTMLDivElement | null>(null);
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
  }, [viewDefinition, hasResources, isCollapsed]);

  React.useEffect(() => {
    if (viewDefinition === undefined) return;
    const frame = requestAnimationFrame(() => {
      const tableElement = gridRef.current;
      if (tableElement === null) return;
      const context = document.createElement('canvas').getContext('2d');
      if (context === null) return;
      const measuredColumns = viewDefinition.rows[0].map((_, columnIndex) => {
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
            : measureHeader(
                headerLabel.textContent ?? '',
                getComputedStyle(headerLabel).font,
                context
              ) + 32;
        const indicator = header?.querySelector(
          '[data-subview-sort-indicator]'
        );
        const headerWidth =
          labelWidth + (indicator === undefined || indicator === null ? 0 : 28);
        return {
          headerWidth: Math.min(maximumColumnWidth, headerWidth),
          contentWidth: Math.min(
            maximumColumnWidth,
            Math.max(
              minimumColumnWidth,
              labelWidth,
              ...cells.map((cell) => measureCell(cell, context))
            )
          ),
        };
      });
      setHeaderColumnWidths(
        measuredColumns.map(({ headerWidth }) =>
          Math.max(minimumColumnWidth, headerWidth)
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
          gap * (viewDefinition.columns.length + 2)
      );
      setContentColumnWidths(
        measuredColumns.map(({ contentWidth }) => contentWidth)
      );
    });
    return (): void => cancelAnimationFrame(frame);
  }, [viewDefinition, isCollapsed, measurementKey]);

  const resizeCleanupRef = React.useRef<(() => void) | undefined>(undefined);
  React.useEffect(() => (): void => resizeCleanupRef.current?.(), []);

  const resizeColumn = React.useCallback(
    (columnIndex: number, event: React.PointerEvent<HTMLDivElement>): void => {
      event.preventDefault();
      event.stopPropagation();
      resizeCleanupRef.current?.();
      resizeCleanupRef.current = undefined;
      const tableElement = gridRef.current;
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
            minimumResizableColumnWidth,
            Math.min(
              maximumColumnWidth,
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
        cleanup();
        updateWidth(latestX);
      };
      const cleanup = (): void => {
        if (frame !== undefined) cancelAnimationFrame(frame);
        globalThis.removeEventListener('pointermove', handleMove);
        globalThis.removeEventListener('pointerup', handleUp);
        globalThis.removeEventListener('pointercancel', handleUp);
        if (resizeCleanupRef.current === cleanup)
          resizeCleanupRef.current = undefined;
      };
      globalThis.addEventListener('pointermove', handleMove);
      globalThis.addEventListener('pointerup', handleUp);
      globalThis.addEventListener('pointercancel', handleUp);
      resizeCleanupRef.current = cleanup;
    },
    [columnWidths]
  );

  const resizeColumnWithKeyboard = React.useCallback(
    (columnIndex: number, direction: -1 | 1): void => {
      const header = gridRef.current?.querySelector<HTMLElement>(
        `[data-subview-header-col="${columnIndex}"]`
      );
      const currentWidth =
        columnWidths[columnIndex] ??
        header?.getBoundingClientRect().width ??
        minimumColumnWidth;
      setColumnWidths((widths) => ({
        ...widths,
        [columnIndex]: Math.max(
          minimumResizableColumnWidth,
          Math.min(maximumColumnWidth, currentWidth + direction * 10)
        ),
      }));
    },
    [columnWidths]
  );

  const gridTemplateColumns = React.useMemo(() => {
    const cells = viewDefinition?.rows[0] ?? [];
    const definitions = viewDefinition?.columns ?? [];
    let trackIndex = 0;
    const tracks = cells.flatMap((cell, cellIndex) => {
      const span = cell.colSpan;
      return Array.from({ length: span }, () => {
        const index = trackIndex++;
        const customWidth = definitions[index];
        return {
          cellIndex,
          width:
            columnWidths[cellIndex] === undefined ? customWidth : undefined,
        };
      });
    });
    const autoColumns = tracks
      .filter(
        ({ width, cellIndex }) =>
          typeof width !== 'number' && columnWidths[cellIndex] === undefined
      )
      .map(({ cellIndex }) => ({
        cellIndex,
        width:
          (contentColumnWidths[cellIndex] ?? minimumColumnWidth) /
          (cells[cellIndex]?.colSpan ?? 1),
      }));
    const fixedWidth = Object.values(columnWidths).reduce(
      (total, width) => total + width,
      0
    );
    const customFixedWidth = tracks.reduce(
      (total, { cellIndex, width }) =>
        total +
        (typeof width !== 'number'
          ? 0
          : flexibleSubGridColumnWidth
            ? (contentColumnWidths[cellIndex] ?? minimumColumnWidth) /
              (cells[cellIndex]?.colSpan ?? 1)
            : width),
      0
    );
    const minimumWidths = autoColumns.map(({ cellIndex }) => {
      const definition = cells[cellIndex];
      const fieldName =
        definition !== undefined && 'fieldNames' in definition
          ? definition.fieldNames?.join(backboneFieldSeparator)
          : undefined;
      return sortConfig?.sortField === fieldName
        ? Math.max(
            minimumColumnWidth,
            (headerColumnWidths[cellIndex] ?? minimumColumnWidth) /
              (definition?.colSpan ?? 1)
          )
        : minimumColumnWidth;
    });
    const widths = fitColumnWidths(
      autoColumns.map(({ width }) => width),
      Math.max(
        0,
        tableWidth - tableChromeWidth - fixedWidth - customFixedWidth
      ),
      minimumWidths
    );
    const cellColumns = cells.reduce((total, cell) => total + cell.colSpan, 0);
    let autoIndex = 0;
    return [
      'min-content',
      ...tracks.map(({ cellIndex, width }) => {
        const cell = cells[cellIndex];
        if (columnWidths[cellIndex] !== undefined)
          return `${columnWidths[cellIndex] / (cell?.colSpan ?? 1)}px`;
        if (typeof width === 'number')
          return columnDefinitionsToCss([width], flexibleSubGridColumnWidth);
        const minimumWidth = widths[autoIndex] ?? minimumColumnWidth;
        const flex = autoColumns[autoIndex]?.width ?? minimumColumnWidth;
        autoIndex += 1;
        return `minmax(${minimumWidth}px, ${flex}fr)`;
      }),
      ...(viewDefinition?.columns.slice(cellColumns) ?? []).map((width) =>
        typeof width === 'number'
          ? columnDefinitionsToCss([width], flexibleSubGridColumnWidth)
          : 'minmax(0, 1fr)'
      ),
      autoColumns.length === 0 ? 'minmax(0, 1fr)' : '0px',
      'min-content',
    ].join(' ');
  }, [
    viewDefinition?.columns,
    viewDefinition?.rows,
    columnWidths,
    contentColumnWidths,
    headerColumnWidths,
    sortConfig,
    flexibleSubGridColumnWidth,
    tableChromeWidth,
    tableWidth,
  ]);

  return {
    columnWidths,
    contentColumnWidths,
    gridRef,
    gridTemplateColumns,
    resizeColumn,
    resizeColumnWithKeyboard,
    scrollContainerRef,
  };
}

export function FormTableColumnResizeHandle({
  columnIndex,
  columnSizing,
}: {
  readonly columnIndex: number;
  readonly columnSizing: FormTableColumnSizing;
}): JSX.Element {
  return (
    <div
      aria-label="Resize column"
      aria-orientation="vertical"
      aria-valuemax={maximumColumnWidth}
      aria-valuemin={minimumResizableColumnWidth}
      aria-valuenow={Math.round(
        columnSizing.columnWidths[columnIndex] ??
          columnSizing.contentColumnWidths[columnIndex] ??
          minimumColumnWidth
      )}
      className="absolute inset-y-0 z-20 w-4 cursor-col-resize touch-none before:absolute before:inset-y-0 before:right-2 before:w-px before:bg-gray-500 before:content-['']"
      role="separator"
      style={{ right: -8 }}
      tabIndex={0}
      onKeyDown={(event): void => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        columnSizing.resizeColumnWithKeyboard(
          columnIndex,
          event.key === 'ArrowRight' ? 1 : -1
        );
      }}
      onPointerDown={(event): void =>
        columnSizing.resizeColumn(columnIndex, event)
      }
    />
  );
}
