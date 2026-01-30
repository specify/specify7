/**
 * Form renderer for setup tool.
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { setupToolText } from '../../localization/setupTool';
import { treeText } from '../../localization/tree';
import { userText } from '../../localization/user';
import { type RA } from '../../utils/types';
import { H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label, Select } from '../Atoms/Form';
import { Dialog } from '../Molecules/Dialog';
import { MIN_PASSWORD_LENGTH } from '../Security/SetPassword';
import type {
  TaxonFileDefaultDefinition,
  TaxonFileDefaultList,
} from '../TreeView/CreateTree';
import { PopulatedTreeList } from '../TreeView/CreateTree';
import type { FieldConfig, ResourceConfig } from './setupResources';
import { FIELD_MAX_LENGTH, resources } from './setupResources';
import type { ResourceFormData } from './types';

function getFormValue(
  formData: ResourceFormData,
  currentStep: number,
  fieldName: string
): number | string | undefined {
  return formData[resources[currentStep].resourceName][fieldName];
}

/**
 * Checks if a conditional form should be rendered.
 */
export function checkFormCondition(
  formData: ResourceFormData,
  resource: ResourceConfig
): boolean {
  if (resource.condition === undefined) {
    return true;
  }
  let pass = true;
  for (const [resourceName, fields] of Object.entries(resource.condition)) {
    for (const [fieldName, requiredValue] of Object.entries(fields)) {
      if (formData[resourceName][fieldName] !== requiredValue) {
        pass = false;
        break;
      }
    }
    if (!pass) break;
  }
  return pass;
}

export function renderFormFieldFactory({
  formData,
  currentStep,
  handleChange,
  temporaryFormData,
  setTemporaryFormData,
  formRef,
  treeOptions,
}: {
  readonly formData: ResourceFormData;
  readonly currentStep: number;
  readonly handleChange: (
    name: string,
    newValue: LocalizedString | TaxonFileDefaultDefinition | boolean
  ) => void;
  readonly temporaryFormData: ResourceFormData;
  readonly setTemporaryFormData: (
    value: React.SetStateAction<ResourceFormData>
  ) => void;
  readonly formRef: React.MutableRefObject<HTMLFormElement | null>;
  readonly treeOptions?: TaxonFileDefaultList;
}) {
  const [isTreeDialogOpen, handleTreeDialogOpen, handleTreeDialogClose] =
    useBooleanState(false);

  const renderFormField = (
    field: FieldConfig,
    parentName?: string,
    inTable: boolean = false
  ): JSX.Element => {
    const {
      name,
      label,
      type,
      required = false,
      description,
      options,
      fields,
      passwordRepeat,
      width,
      isTable,
    } = field;

    const fieldName = parentName === undefined ? name : `${parentName}.${name}`;

    const colSpan =
      width === undefined
        ? type === 'object'
          ? 'col-span-4'
          : 'col-span-2'
        : `col-span-${width}`;

    const verticalSpacing = width !== undefined && width < 2 ? '-mb-2' : 'mb-2';

    // 3 is the ID of discipline form
    const disciplineTypeValue = getFormValue(formData, 3, 'type');
    const isDisciplineNameDisabled =
      resources[currentStep].resourceName === 'discipline' &&
      fieldName === 'name' &&
      (disciplineTypeValue === undefined || disciplineTypeValue === '');

    const isRowEnableToggle = name === 'include';
    const isRowEnabled =
      Boolean(getFormValue(formData, currentStep, `${parentName}.include`));

    const taxonTreeAvailable =
      Array.isArray(treeOptions) &&
      disciplineTypeValue !== undefined &&
      treeOptions.some(
        (tree: TaxonFileDefaultDefinition) =>
          tree.discipline === disciplineTypeValue
      );
    const isTaxonTreeSelector =
      fieldName === 'preload' &&
      resources[currentStep].resourceName === 'taxonTreeDef';
    const showTreeSelector = getFormValue(formData, currentStep, 'preload');

    return (
      <div className={`${verticalSpacing} ${colSpan}`} key={fieldName}>
        {type === 'boolean' ? (
          <div className="h-full flex items-center space-x-2">
            {isTaxonTreeSelector && !taxonTreeAvailable ? (
              setupToolText.emptyTaxonTree()
            ) : (
              <Label.Inline title={description}>
                <Input.Checkbox
                  checked={Boolean(
                    getFormValue(formData, currentStep, fieldName)
                  )}
                  disabled={
                    inTable
                      ? !isRowEnabled && !isRowEnableToggle
                      : false
                  }
                  id={fieldName}
                  name={fieldName}
                  required={required}
                  onValueChange={(isChecked) =>
                    handleChange(fieldName, isChecked)
                  }
                />
                {!inTable && label}
              </Label.Inline>
            )}
          </div>
        ) : type === 'select' && Array.isArray(options) ? (
          <div
            className="mb-4"
            key={`${resources[currentStep].resourceName}.${fieldName}`}
          >
            {!inTable && <Label.Block title={description}>{label}</Label.Block>}
            <Select
              aria-label={label}
              className="w-full min-w-[theme(spacing.40)]"
              id={fieldName}
              name={fieldName}
              required={required}
              value={getFormValue(formData, currentStep, fieldName) ?? ''}
              onValueChange={(value) => handleChange(fieldName, value)}
            >
              <option disabled value="">
                {commonText.select()}
              </option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label ?? option.value}
                </option>
              ))}
            </Select>
          </div>
        ) : type === 'password' ? (
          <>
            <Label.Block title={description}>
              {!inTable && label}
              <Input.Generic
                maxLength={field.maxLength ?? FIELD_MAX_LENGTH}
                minLength={MIN_PASSWORD_LENGTH}
                name={fieldName}
                required={required}
                type="password"
                value={getFormValue(formData, currentStep, fieldName) ?? ''}
                onValueChange={(value) => {
                  handleChange(fieldName, value);
                  if (passwordRepeat !== undefined && formRef.current) {
                    const target = formRef.current.elements.namedItem(
                      passwordRepeat.name
                    ) as HTMLInputElement | null;

                    if (target) {
                      target.setCustomValidity(
                        target.value && target.value === value
                          ? ''
                          : userText.passwordsDoNotMatchError()
                      );
                    }
                  }
                }}
              />
            </Label.Block>

            {passwordRepeat === undefined ? null : (
              <Label.Block title={passwordRepeat.description}>
                {!inTable && passwordRepeat.label}
                <Input.Generic
                  maxLength={field.maxLength ?? FIELD_MAX_LENGTH}
                  minLength={MIN_PASSWORD_LENGTH}
                  name={passwordRepeat.name}
                  required={required}
                  type="password"
                  value={temporaryFormData[passwordRepeat.name] ?? ''}
                  onChange={({ target }): void => {
                    target.setCustomValidity(
                      target.value ===
                        getFormValue(formData, currentStep, fieldName)
                        ? ''
                        : userText.passwordsDoNotMatchError()
                    );
                  }}
                  onValueChange={(value) =>
                    setTemporaryFormData((previous) => ({
                      ...previous,
                      [passwordRepeat.name]: value,
                    }))
                  }
                />
              </Label.Block>
            )}
          </>
        ) : type === 'object' ? (
          // Subforms
          <div>
            <H3 className="text-xl font-semibold" title={description}>
              {label}
            </H3>
            {fields
              ? renderFormFields(fields, fieldName, isTable === true)
              : null}
          </div>
        ) : type === 'tree' ? (
          showTreeSelector ? (
            // Taxon tree selection
            <Label.Block title={description}>
              {label}
              <Button.Fancy onClick={handleTreeDialogOpen}>
                {setupToolText.selectATree()}
              </Button.Fancy>
              {(() => {
                // Display the selected tree
                const selectedTree = getFormValue(
                  formData,
                  currentStep,
                  fieldName
                );
                if (selectedTree && typeof selectedTree === 'object') {
                  const tree = selectedTree as TaxonFileDefaultDefinition;
                  return (
                    <div className="mt-2">
                      <div className="p-2 border border-gray-500 rounded">
                        <div className="font-medium">{tree.title}</div>
                        <div className="text-xs text-gray-500">
                          {tree.description}
                        </div>
                        <div className="text-xs text-gray-400 italic">{`${treeText.source()}: ${tree.src}`}</div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              {isTreeDialogOpen ? (
                <Dialog
                  buttons={commonText.cancel()}
                  header={treeText.trees()}
                  onClose={handleTreeDialogClose}
                >
                  <PopulatedTreeList
                    handleClick={(
                      resource: TaxonFileDefaultDefinition
                    ): void => {
                      handleChange(fieldName, resource);
                      handleChange('preload', true);
                      handleTreeDialogClose();
                    }}
                  />
                </Dialog>
              ) : null}
            </Label.Block>
          ) : null
        ) : (
          <Label.Block title={description}>
            {!inTable && label}
            <Input.Text
              disabled={
                inTable
                  ? !isRowEnabled && !isRowEnableToggle
                  : isDisciplineNameDisabled
              }
              maxLength={field.maxLength ?? FIELD_MAX_LENGTH}
              name={fieldName}
              required={required}
              value={getFormValue(formData, currentStep, fieldName) ?? ''}
              onValueChange={(value) => handleChange(fieldName, value)}
            />
          </Label.Block>
        )}
      </div>
    );
  };

  const renderFormFields = (
    fields: RA<FieldConfig>,
    parentName?: string,
    isTable: boolean = false
  ): JSX.Element => {
    if (isTable && fields.length > 0 && fields[0].fields) {
      // Table format specifically for tree rank configuration
      return (
        <div className="w-full rounded-md overflow-hidden border border-gray-300 dark:border-gray-500">
          <table className="w-full border-collapse table-fixed bg-white dark:bg-neutral-800">
            <thead>
              <tr className="bg-gray-100 dark:bg-neutral-700 border-b-2 border-gray-400 dark:border-gray-500">
                <th className="px-2 py-3 text-left font-semibold text-gray-700 dark:text-gray-100 border-r border-gray-300 dark:border-gray-500 break-words last:border-r-0">
                  {setupToolText.rank()}
                </th>
                {fields[0].fields.map((subField) => (
                  <th
                    className="px-2 py-3 text-left font-semibold text-gray-700 dark:text-gray-100 border-r border-gray-300 dark:border-gray-500 break-words last:border-r-0"
                    key={subField.name}
                  >
                    {subField.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr
                  className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-500 align-middle last:border-b-0"
                  key={field.name}
                >
                  <td className="px-2 py-3 font-semibold text-gray-800 dark:text-gray-100 border-r border-gray-300 dark:border-gray-500 last:border-r-0">
                    {field.label}
                  </td>
                  {field.fields!.map((subField) => (
                    <td
                      className="px-2 py-2 border-r border-gray-300 dark:border-gray-500 align-middle last:border-r-0"
                      key={`${field.name}-${subField.name}`}
                    >
                      {renderFormField(
                        subField,
                        parentName === undefined
                          ? field.name
                          : `${parentName}.${field.name}`,
                        true
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    // Otherwise, lay out fields normally
    return (
      <div className="grid grid-cols-4 gap-4">
        {fields.map((field) => renderFormField(field, parentName))}
      </div>
    );
  };

  return { renderFormField, renderFormFields };
}
