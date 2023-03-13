import { schemaText } from '../../localization/schema';
import { resolveParser } from '../../utils/parser/definitions';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { sortFunction, split } from '../../utils/utils';
import type { AnySchema, TableFields } from '../DataModel/helperTypes';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type {
  FormMode,
  FormType,
  ParsedFormDefinition,
  ViewDescription,
} from '../FormParse';
import type { CellTypes, FormCellDefinition } from '../FormParse/cells';
import { hasTablePermission } from '../Permissions/helpers';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';

/**
 * If form definition is missing, this function will generate one on the fly
 */
export function autoGenerateViewDefinition<SCHEMA extends AnySchema>(
  model: SpecifyModel<SCHEMA>,
  formType: FormType,
  mode: FormMode,
  fieldsToShow: RA<TableFields<SCHEMA>> = getFieldsForAutoView(model, [])
): ViewDescription {
  return {
    ...(formType === 'form' ? generateForm : generateFormTable)(
      model,
      mode,
      fieldsToShow
    ),
    name: '',
    formType,
    mode,
    model,
  };
}

/**
 * Get fields that a user would most likely want to see.
 * The "fieldsToSkip" can be replaced by filtering the output array, however,
 * that won't be as type safe
 */
export function getFieldsForAutoView<SCHEMA extends AnySchema>(
  model: SpecifyModel<SCHEMA>,
  fieldsToSkip: RA<TableFields<SCHEMA>>
): RA<TableFields<SCHEMA>> {
  const baseFields = model.literalFields
    .filter((field) => !fieldsToSkip.includes(field.name))
    .sort(sortFunction(({ isRequired }) => isRequired, true));
  const filteredFields = baseFields.filter(
    (field) => !field.isHidden && !field.isReadOnly
  );
  // BUG: if displayed as a dependent sub view, should hide relationship to parent
  const relationships = model.relationships
    .filter(
      (field) =>
        !field.isHidden &&
        !field.isReadOnly &&
        !fieldsToSkip.includes(field.name) &&
        (field.isRequired || field.isDependent())
    )
    .sort(sortFunction(({ isRequired }) => isRequired, true));
  // Hide hidden fields, unless all fields are hidden
  const fields =
    filteredFields.length > 0 || relationships.length > 0
      ? filteredFields
      : baseFields;
  return [...fields, ...relationships].map((field) => field.name);
}

function generateFormTable(
  model: SpecifyModel,
  _mode: FormMode,
  fieldsToShow: RA<string>
): ParsedFormDefinition {
  const fields = fieldsToShow
    .map((fieldName) => model.strictGetField(fieldName))
    .filter(
      (field): field is LiteralField =>
        !field.isRelationship && !field.isHidden && !field.isReadOnly
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
  fieldsToShow: RA<string>
): ParsedFormDefinition {
  const allFields = fieldsToShow.map((fieldName) =>
    model.strictGetField(fieldName)
  );
  const [fields, relationships] = split<LiteralField, Relationship>(
    allFields,
    (field) => field.isRelationship
  );
  const skipLabels =
    fields.length === 0 ||
    relationships.length === 0 ||
    fields.length + relationships.length < 10;
  return {
    columns: [undefined],
    rows: filterArray([
      skipLabels
        ? undefined
        : [
            {
              type: 'Separator',
              label: schemaText.fields(),
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
                  fieldNames: [field.name],
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
              label: schemaText.relationships(),
              ...cellAttributes,
              icon: undefined,
              forClass: undefined,
            },
          ],
      ...relationships
        .filter(({ relatedModel }) =>
          hasTablePermission(relatedModel.name, 'read')
        )
        .flatMap(
          (field) =>
            [
              [
                {
                  type: 'Label',
                  text: field.label,
                  labelForCellId: field.name,
                  fieldNames: [field.name],
                  title: field.getLocalizedDesc(),
                  ...cellAttributes,
                },
              ],
              [
                relationshipIsToMany(field)
                  ? ({
                      ...cellAttributes,
                      id: field.name,
                      type: 'SubView',
                      formType: 'form',
                      mode,
                      fieldNames: [field.name],
                      viewName: undefined,
                      isButton: true,
                      icon: undefined,
                      isRequired: false,
                      sortField: { fieldNames: ['id'], direction: 'asc' },
                    } as const)
                  : ({
                      ...cellAttributes,
                      id: field.name,
                      type: 'Field',
                      fieldNames: [field.name],
                      fieldDefinition: {
                        type: 'QueryComboBox',
                        hasCloneButton: false,
                        typeSearch: undefined,
                        isReadOnly: mode === 'view',
                      },
                      isRequired: false,
                      viewName: undefined,
                    } as const),
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
): CellTypes['Field'] & FormCellDefinition {
  const parser = resolveParser(field);
  // FEATURE: render date fields using Partial Date UI
  return {
    ...cellAttributes,
    type: 'Field',
    fieldNames: [field.name],
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
            minLength: parser.minLength,
            maxLength: parser.maxLength,
          }),
    },
  };
}
