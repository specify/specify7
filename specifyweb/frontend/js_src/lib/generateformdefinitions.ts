/**
 * If form definition is missing, this code will generate one on the fyl
 */

import commonText from './localization/common';
import type {
  FormMode,
  FormType,
  ParsedFormDefinition,
  ViewDescription,
} from './parseform';
import type { CellTypes, FormCellDefinition } from './parseformcells';
import type { LiteralField } from './specifyfield';
import type { SpecifyModel } from './specifymodel';
import { resolveParser } from './uiparse';
import { filterArray } from './types';

export function autoGenerateViewDefinition(
  model: SpecifyModel,
  formType: FormType,
  mode: FormMode
): ViewDescription {
  return {
    ...(formType === 'form' ? generateForm : generateFormTable)(model, mode),
    formType,
    mode,
    model,
  };
}

function generateFormTable(model: SpecifyModel): ParsedFormDefinition {
  const fields = model.literalFields.filter(
    (field) => !field.isHidden && !field.isReadOnly
  );
  return {
    columns: Array.from(fields).fill(undefined),
    rows: [fields.map(getFieldDefinition)],
  };
}

const cellAttributes = {
  id: undefined,
  align: 'left',
  colSpan: 1,
  visible: true,
} as const;

function generateForm(
  model: SpecifyModel,
  mode: FormType
): ParsedFormDefinition {
  const fields = model.literalFields.filter(
    (field) => !field.isHidden && !field.isReadOnly
  );
  const relationships = model.relationships.filter(
    (field) => !field.isHidden && !field.isReadOnly && field.isDependent()
  );
  return {
    columns: [undefined],
    rows: filterArray([
      fields.length === 0
        ? undefined
        : [
            {
              type: 'Separator',
              label: commonText('fields'),
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
      relationships.length === 0
        ? undefined
        : [
            {
              type: 'Separator',
              label: commonText('relationships'),
              ...cellAttributes,
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

function getFieldDefinition(
  field: LiteralField
): FormCellDefinition & CellTypes['Field'] {
  const parser = resolveParser(field) ?? {};
  return {
    ...cellAttributes,
    type: 'Field',
    fieldName: field.name,
    isRequired: false,
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
