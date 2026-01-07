/**
 * Form renderer for setup tool.
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { type RA } from '../../utils/types';
import { H3 } from '../Atoms';
import { Input, Label, Select } from '../Atoms/Form';
import { MIN_PASSWORD_LENGTH } from '../Security/SetPassword';
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
}) {
  const renderFormField = (
    field: FieldConfig,
    parentName?: string
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
    } = field;

    const fieldName = parentName === undefined ? name : `${parentName}.${name}`;

    const colSpan = type === 'object' ? 2 : 1;

    return (
      <div className={`mb-2 col-span-${colSpan}`} key={fieldName}>
        {type === 'boolean' ? (
          <div className="flex items-center space-x-2">
            <Label.Inline title={description}>
              <Input.Checkbox
                checked={Boolean(
                  getFormValue(formData, currentStep, fieldName)
                )}
                id={fieldName}
                name={fieldName}
                required={required}
                onValueChange={(isChecked) =>
                  handleChange(fieldName, isChecked)
                }
              />
              {label}
            </Label.Inline>
          </div>
        ) : type === 'select' && Array.isArray(options) ? (
          <div
            className="mb-4"
            key={`${resources[currentStep].resourceName}.${fieldName}`}
          >
            <Label.Block title={description}>
              {label}
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
            </Label.Block>
          </div>
        ) : type === 'password' ? (
          <>
            <Label.Block title={description}>
              {label}
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
                {passwordRepeat.label}
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
          <div className="border border-gray-500 rounded-b p-1">
            <H3 className="text-xl font-semibold mb-4" title={description}>
              {label}
            </H3>
            {fields ? renderFormFields(fields, name) : null}
          </div>
        ) : (
          <Label.Block title={description}>
            {label}
            <Input.Text
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

  const renderFormFields = (fields: RA<FieldConfig>, parentName?: string) => (
    <div className="grid grid-cols-2 gap-4">
      {fields.map((field) => renderFormField(field, parentName))}
    </div>
  );

  return { renderFormField, renderFormFields };
}
