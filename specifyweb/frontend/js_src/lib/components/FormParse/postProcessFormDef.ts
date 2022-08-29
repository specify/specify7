import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { CellTypes, FormCellDefinition } from './cells';
import type { ParsedFormDefinition } from './index';

// TODO: split this function into smaller functions
/**
 * Unfortunately, not all cell definitions can be parsed by looking at just
 * one cell at a time.
 *
 * This method looks over all grid cells holistically and finishes parsing
 * them or fixes discovered issues.
 */
export function postProcessFormDef(
  columns: RA<number | undefined>,
  rows: RA<RA<FormCellDefinition>>,
  model: SpecifyModel | undefined
): ParsedFormDefinition {
  // Index fieldNames and labelOverride for all cells by cellId
  const fieldsById: IR<{
    readonly fieldName: string | undefined;
    readonly labelOverride: string | undefined;
    // An alternative label to use, only if label is missing
    readonly altLabel: string | undefined;
  }> = Object.fromEntries(
    filterArray(
      rows.flatMap((row) =>
        row
          .filter(
            (
              cell
            ): cell is CellTypes['Field'] &
              FormCellDefinition & { readonly id: string } =>
              cell.type === 'Field' && typeof cell.id === 'string'
          )
          .map((cell) =>
            typeof cell.id === 'string' && cell.type === 'Field'
              ? [
                  cell.id,
                  {
                    fieldName: cell.fieldName,
                    // Checkbox definition can contain a label
                    labelOverride:
                      cell.fieldDefinition.type === 'Checkbox'
                        ? cell.fieldDefinition.label
                        : undefined,
                    /*
                     * Default Accession view doesn't have a label for
                     * Division ComboBox for some reason
                     */
                    altLabel:
                      cell.fieldName === 'divisionCBX'
                        ? model?.getField('division')?.label
                        : undefined,
                  },
                ]
              : undefined
          )
      )
    )
  );
  const initialLabelsForCells = Object.fromEntries(
    filterArray(
      rows
        .flat()
        .map((cell) =>
          cell.type === 'Label' && typeof cell.labelForCellId === 'string'
            ? [cell.labelForCellId, cell]
            : undefined
        )
    )
  );
  // If some row has extra columns, add new columns to the definition
  const newColumns = [
    ...columns,
    ...Array.from({
      length:
        Math.max(
          ...rows.map((row) => f.sum(row.map(({ colSpan }) => colSpan ?? 1)))
        ) - columns.length,
    }).fill(undefined),
  ];
  const newRows = rows.map<RA<FormCellDefinition>>((row, rowIndex) => {
    const totalColumns = f.sum(row.map(({ colSpan = 1 }) => colSpan));
    return filterArray([
      ...row
        .map((cell, index) =>
          /*
           * If a Label without a labelForCellId attribute precedes a field with an
           * ID, but no label, associate the label with that field
           */
          cell.type === 'Label' && cell.labelForCellId === undefined
            ? typeof row[index + 1]?.id === 'string' &&
              /*
               * Don't do this for plugins, as they may already have a label.
               * Don't do this for checkboxes because of this issue:
               * https://github.com/specify/specify7/issues/1780
               */
              f.var(
                row[index + 1],
                (cell) =>
                  cell.type !== 'Field' ||
                  !['Plugin', 'Checkbox'].includes(cell.fieldDefinition.type)
              ) &&
              initialLabelsForCells[defined(row[index + 1].id)] === undefined
              ? {
                  // Assocate label with a field that follows it
                  ...cell,
                  labelForCellId: row[index + 1].id,
                }
              : newColumns.length === 1 &&
                typeof row[rowIndex + 1]?.id === 'string' &&
                initialLabelsForCells[defined(row[rowIndex + 1].id)] ===
                  undefined
              ? {
                  /*
                   * Similar, but associate label with cell in next row, if
                   * there is only one column
                   */
                  ...cell,
                  labelForCellId: row[rowIndex + 1].id,
                }
              : cell
            : cell
        )
        .map((cell) =>
          cell.type === 'Label'
            ? {
                ...cell,
                ...(typeof cell.labelForCellId === 'string'
                  ? {
                      // Let some fields overwrite their label
                      text:
                        fieldsById[cell.labelForCellId]?.labelOverride ??
                        cell.text ??
                        fieldsById[cell.labelForCellId]?.altLabel,
                      // Get label fieldName from its field
                      fieldName: fieldsById[cell.labelForCellId]?.fieldName,
                    }
                  : {}),
                // Don't right align labels if there is only one column
                align: newColumns.length === 1 ? 'left' : cell.align,
              }
            : cell
        )
        .map((cell) =>
          cell.type === 'Label' && typeof model === 'object'
            ? f.var(model.getField(cell.fieldName ?? ''), (field) => ({
                ...cell,
                text:
                  cell.text ??
                  field?.label ??
                  /*
                   * Default Accession view doesn't have a label for
                   * Division ComboBox for some reason
                   */
                  (cell.id === 'divLabel'
                    ? model.getField('division')?.label
                    : undefined) ??
                  (cell.fieldName?.toLowerCase() === 'this'
                    ? undefined
                    : cell.fieldName) ??
                  '',
                title: field?.getLocalizedDesc(),
              }))
            : cell
        )
        .map((cell) =>
          // Replace labels without text with blank cells
          cell.type === 'Label' && (cell.text ?? '').length === 0
            ? ({
                type: 'Blank',
                id: cell.id,
                align: 'left',
                colSpan: cell.colSpan,
                visible: false,
                ariaLabel: undefined,
              } as const)
            : cell
        ),
      /*
       * Add a necessary number of blank cells at the end so that the
       * grid is not off when some row has fewer columns than in the definition.
       */
      newColumns.length - totalColumns > 0
        ? {
            type: 'Blank',
            id: undefined,
            align: 'left',
            colSpan: newColumns.length - totalColumns,
            visible: false,
            ariaLabel: undefined,
          }
        : undefined,
    ]);
  });
  const labelsForCells = Object.fromEntries(
    filterArray(
      newRows
        .flat()
        .map((cell) =>
          cell.type === 'Label' && typeof cell.labelForCellId === 'string'
            ? [cell.labelForCellId, cell]
            : undefined
        )
    )
  );
  return {
    columns: newColumns,
    rows: newRows.map((row) =>
      row.map((cell) =>
        cell.id === undefined || typeof labelsForCells[cell.id] === 'object'
          ? cell.type === 'Field' && cell.fieldDefinition.type === 'Checkbox'
            ? {
                ...cell,
                fieldDefinition: {
                  ...cell.fieldDefinition,
                  /*
                   * Remove label from the checkbox field, if it already has an
                   * associated label
                   */
                  label: undefined,
                },
              }
            : cell
          : {
              ...cell,
              ...(cell.type === 'Field' &&
              cell.fieldDefinition.type === 'Checkbox'
                ? {
                    fieldDefinition: {
                      ...cell.fieldDefinition,
                      /*
                       * If checkbox does not have a label in a separate cell,
                       * Get its label from the fieldName
                       */
                      label:
                        cell.fieldDefinition.label ??
                        model?.getField(cell.fieldName ?? '')?.label ??
                        cell.ariaLabel,
                    },
                  }
                : {}),
              // If cell has a fieldName, but no associated label, set ariaLabel
              ariaLabel:
                // Don't add aria-label to checkboxes as they would already have a label
                cell.type === 'Field' &&
                cell.fieldDefinition.type === 'Checkbox'
                  ? undefined
                  : cell.ariaLabel ??
                    (cell.type === 'Field' || cell.type === 'SubView'
                      ? model?.getField(cell.fieldName ?? '')?.label
                      : undefined),
            }
      )
    ),
  };
}
