import type { AnySchema, TableFields } from './datamodelutils';
import { commonText } from './localization/common';
import type {
  FormMode,
  FormType,
  ParsedFormDefinition,
  ViewDescription,
} from './parseform';
import type { CellTypes, FormCellDefinition } from './parseformcells';
import type { LiteralField } from './specifyfield';
import type { SpecifyModel } from './specifymodel';
import type { RA } from './types';
import { filterArray } from './types';
import { resolveParser } from './uiparse';

/**
 * If form definition is missing, this function will generate one on the fly
 */
export function autoGenerateViewDefinition<SCHEMA extends AnySchema>(
  model: SpecifyModel<SCHEMA>,
  formType: FormType,
  mode: FormMode,
  fieldsToSkip: RA<TableFields<SCHEMA>> = []
): ViewDescription {
  return {
    ...(formType === 'form' ? generateForm : generateFormTable)(
      model,
      mode,
      fieldsToSkip
    ),
    formType,
    mode,
    model,
  };
}

function generateFormTable(
  model: SpecifyModel,
  _mode: FormMode,
  fieldsToSkip: RA<string>
): ParsedFormDefinition {
  const fields = model.literalFields.filter(
    (field) =>
      !field.isHidden && !field.isReadOnly && !fieldsToSkip.includes(field.name)
  );
  return {
    columns: Array.from(fields).fill(undefined),
    rows: [
      fields.map(getFieldDefinition).map((cell) => ({
        ...cell,
        align: 'center',
      })),
    ],
  };
}

// Common cell attributes
const cellAttributes = {
  id: undefined,
  align: 'left',
  colSpan: 1,
  visible: true,
  ariaLabel: undefined,
} as const;

function generateForm(
  model: SpecifyModel,
  mode: FormMode,
  fieldsToSkip: RA<string>
): ParsedFormDefinition {
  // Hide hidden fields, unless all fields are hidden
  const baseFields = model.literalFields.filter(
    (field) => !fieldsToSkip.includes(field.name)
  );
  const filteredFields = baseFields.filter(
    (field) => !field.isHidden && !field.isReadOnly
  );
  const baseRelationships = model.relationships.filter(
    (field) => !fieldsToSkip.includes(field.name) && field.isDependent()
  );
  const filteredRelationships = baseRelationships.filter(
    (field) => !field.isHidden && !field.isReadOnly && field.isDependent()
  );
  const fields =
    filteredFields.length > 0 || filteredRelationships.length > 0
      ? filteredFields
      : baseFields;
  const relationships =
    filteredFields.length > 0 || filteredRelationships.length > 0
      ? filteredRelationships
      : baseRelationships;

  const skipLabels = fields.length === 0 || relationships.length === 0;
  return {
    columns: [undefined],
    rows: filterArray([
      skipLabels
        ? undefined
        : [
            {
              type: 'Separator',
              label: commonText('fields'),
              icon: undefined,
              forClass: undefined,
              ...cellAttributes,
            },
          ],
      ...fields
        .map(
          (field) =>
            [
              [
                {
                  type: 'Label',
                  text: field.label,
                  labelForCellId: field.name,
                  fieldName: field.name,
                  title: field.getLocalizedDesc(),
                  ...cellAttributes,
                },
              ],
              [
                {
                  ...getFieldDefinition(field),
                  id: field.name,
                },
              ],
            ] as const
        )
        .flatMap(([label, field]) => [
          // Remove redundant labels from checkboxes
          field[0].fieldDefinition.type === 'Checkbox' ? undefined : label,
          field,
        ]),
      skipLabels
        ? undefined
        : [
            {
              type: 'Separator',
              label: commonText('relationships'),
              ...cellAttributes,
              icon: undefined,
              forClass: undefined,
            },
          ],
      ...relationships.flatMap(
        (field) =>
          [
            [
              {
                type: 'Label',
                text: field.label,
                labelForCellId: field.name,
                fieldName: field.name,
                title: field.getLocalizedDesc(),
                ...cellAttributes,
              },
            ],
            [
              {
                ...cellAttributes,
                id: field.name,
                type: 'SubView',
                formType: 'form',
                mode,
                fieldName: field.name,
                viewName: undefined,
                isButton: true,
                icon: undefined,
                isRequired: false,
                sortField: 'id',
                fieldDefinition: {
                  type: 'SubView',
                },
              },
            ],
          ] as const
      ),
    ]),
  };
}

/**
 * Generate definition for a non-relationship field
 */
function getFieldDefinition(
  field: LiteralField
): FormCellDefinition & CellTypes['Field'] {
  const parser = resolveParser(field);
  return {
    ...cellAttributes,
    type: 'Field',
    fieldName: field.name,
    isRequired: false,
    ariaLabel: undefined,
    fieldDefinition: {
      isReadOnly: false,
      ...(parser.type === 'checkbox'
        ? {
            type: 'Checkbox',
            defaultValue: undefined,
            label: field.label,
            printOnSave: false,
          }
        : typeof parser.pickListName === 'string'
        ? {
            type: 'ComboBox',
            defaultValue: undefined,
            pickList: parser.pickListName,
          }
        : field.type === 'text'
        ? {
            type: 'TextArea',
            defaultValue: undefined,
            rows: undefined,
          }
        : {
            type: 'Text',
            defaultValue: undefined,
            min: parser.min,
            max: parser.max,
            step: parser.step,
          }),
    },
  };
}
