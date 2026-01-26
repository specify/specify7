/**
 * Form renderer for setup tool.
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { setupToolText } from '../../localization/setupTool';
import { type RA } from '../../utils/types';
import { H3 } from '../Atoms';
import { Input, Label, Select } from '../Atoms/Form';
import { MIN_PASSWORD_LENGTH } from '../Security/SetPassword';
import type { TaxonFileDefaultList } from '../TreeView/CreateTree';
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
    newValue: LocalizedString | boolean
  ) => void;
  readonly temporaryFormData: ResourceFormData;
  readonly setTemporaryFormData: (
    value: React.SetStateAction<ResourceFormData>
  ) => void;
  readonly formRef: React.MutableRefObject<HTMLFormElement | null>;
  readonly treeOptions?: TaxonFileDefaultList | undefined;
}) {
  const [darkTheme, setDarkTheme] = React.useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setDarkTheme(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  const renderFormField = (
    field: FieldConfig,
    parentName?: string,
    inTable: boolean = false,
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

    const colSpan = (width === undefined) ? (type === 'object' ? 'col-span-4' : 'col-span-2') : `col-span-${width}`;

    const verticalSpacing = (width !== undefined && width < 2) ? '-mb-2' : 'mb-2'

    const disciplineTypeValue =
      resources[currentStep].resourceName === 'discipline'
        ? getFormValue(formData, currentStep, 'type')
        : undefined;
    const isDisciplineNameDisabled =
      resources[currentStep].resourceName === 'discipline' &&
      fieldName === 'name' &&
      (disciplineTypeValue === undefined || disciplineTypeValue === '');

    const taxonTreePreloadDisabled = 
      resources[currentStep].resourceName === 'taxonTreeDef' &&
      fieldName === 'preload' &&
      (
        Array.isArray(treeOptions) &&
        !treeOptions.some(
          (tree) => tree.discipline === getFormValue(formData, 3, 'type')
        )
      );

    return (
      <div className={`${verticalSpacing} ${colSpan}`} key={fieldName}>
        {type === 'boolean' ? (
          <div className="h-full flex items-center space-x-2">
            <Label.Inline title={description}>
              <Input.Checkbox
                checked={Boolean(
                  getFormValue(formData, currentStep, fieldName)
                ) && !taxonTreePreloadDisabled}
                disabled={taxonTreePreloadDisabled}
                id={fieldName}
                name={fieldName}
                required={required}
                onValueChange={(isChecked) =>
                  handleChange(fieldName, isChecked)
                }
              />
              {!inTable && label}
            </Label.Inline>
          </div>
        ) : type === 'select' && Array.isArray(options) ? (
          <div
            className="mb-4"
            key={`${resources[currentStep].resourceName}.${fieldName}`}
          >
            {!inTable && (
              <Label.Block title={description}>
                {label}
              </Label.Block>
            )}
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
            {fields ? renderFormFields(fields, fieldName, isTable === true) : null}
          </div>
        ) : (
          <Label.Block title={description}>
            {!inTable && label}
            <Input.Text
              disabled={isDisciplineNameDisabled}
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

  const renderFormFields = (fields: RA<FieldConfig>, parentName?: string, isTable: boolean = false): JSX.Element => {
    if (isTable && fields.length > 0 && fields[0].fields) {
      // Table format specifically for tree rank configuration
      return (
        <div className="w-full">
          <table className="w-full border-collapse table-fixed bg-white dark:bg-neutral-800 border border-gray-300 dark:border-gray-500">
            <thead>
              <tr className="bg-gray-200 dark:bg-neutral-700 border-b-2 border-gray-400 dark:border-gray-500">
                <th className="px-2 py-3 text-left font-semibold text-gray-700 dark:text-gray-100 border-r border-gray-300 dark:border-gray-500 break-words">
                  {setupToolText.treeRanks()}
                </th>
                {fields[0].fields!.map((subField) => (
                  <th
                    key={subField.name}
                    className="px-2 py-3 text-left font-semibold text-gray-700 dark:text-gray-100 border-r border-gray-300 dark:border-gray-500 break-words"
                  >
                    {subField.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr
                  key={field.name}
                  className={`bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-500 align-middle`}
                >
                  <td className="px-2 py-3 font-semibold text-gray-800 dark:text-gray-100 border-r border-gray-300 dark:border-gray-500">
                    {field.label}
                  </td>
                  {field.fields!.map((subField) => (
                    <td key={`${field.name}-${subField.name}`} className="px-2 py-2 border-r border-gray-300 dark:border-gray-500 align-middle">
                      {renderFormField(
                        subField,
                        parentName === undefined ? field.name : `${parentName}.${field.name}`,
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
