import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { setupToolText } from '../../localization/setupTool';
import { userText } from '../../localization/user'
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import type { RA } from '../../utils/types';
import { Container, H2, H3 } from '../Atoms';
import { Form, Input, Label, Select } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import type { SetupProgress } from '../Login';
import { MIN_PASSWORD_LENGTH } from '../Security/SetPassword';
import { resources, FieldConfig } from "./setupResources";

type ResourceFormData = Record<string, any>;

const stepOrder: RA<keyof SetupProgress> = [
  'institution',
  'division',
  'discipline',
  'collection',
  'specifyUser',
];

function findInitialStep(progress: SetupProgress): number {
  return stepOrder.findIndex((key) => !progress[key]);
}

export function SetupTool({
  setupProgress,
}: {
  readonly setupProgress: SetupProgress;
}): JSX.Element {
  const [formData, setFormData] = React.useState<ResourceFormData>({});
  const [temporaryFormData, setTemporaryFormData] = React.useState<ResourceFormData>({}); // For front-end only.

  const initialStep = findInitialStep(setupProgress);
  const [currentStep, setCurrentStep] = React.useState(initialStep);
  
  const loading = React.useContext(LoadingContext);

  const onResourceSaved = async (
    endpoint: string,
    resourceLabel: string,
    data: ResourceFormData
  ): Promise<void> =>
    ajax(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flattenToNested(data)),
      errorMode: 'visible',
      expectedErrors: [Http.CREATED],
    })
      .then(({ data, status }) => {
        if (status === Http.OK) {
          console.log(`${resourceLabel} created successfully:`, data);
        } else {
          console.error(`Error creating ${resourceLabel}:`, data);
          throw new Error(`Issue when creating ${resourceLabel}`);
        }
      })
      .catch((error) => {
        console.error(`Request failed for ${resourceLabel}:`, error);
        throw error;
      });

  const handleChange = (
    name: string,
    newValue: LocalizedString | boolean
  ): void => {
    setFormData((previous) => ({
      ...previous,
      [name]: newValue,
    }));
  };

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    const { endpoint, resourceName } = resources[currentStep];

    loading(
      onResourceSaved(endpoint, resourceName, formData)
        .then(() => {
          if (resourceName === 'SpecifyUser') {
            globalThis.location.reload();
          } else {
            setFormData({});
            setCurrentStep((previous) => previous + 1);
          }
        })
        .catch((error) => {
          console.error('Form submission failed:', error);
        })
      );
  };

  const renderFormField = (field: FieldConfig, parentName?: string) => {
    const { name, label, type, required = false, description, options, fields, passwordRepeat } = field;

    const fieldName = parentName !== undefined ? `${parentName}.${name}` : name

    return <div className="mb-2" key={fieldName}>
      {type === 'boolean' ? (
        <div className="flex items-center space-x-2">
          <Label.Inline title={description}>
            <Input.Checkbox
              checked={Boolean(formData[fieldName])}
              id={fieldName}
              name={fieldName}
              onValueChange={(isChecked) => handleChange(fieldName, isChecked)}
            />
            {label}
          </Label.Inline>
        </div>
      ) : type === 'select' && Array.isArray(options) ? (
        <div className="mb-4" key={fieldName}>
          <Label.Block title={description}>
            {label}
            <Select
              aria-label={label}
              className="w-full min-w-[theme(spacing.40)]"
              id={fieldName}
              name={fieldName}
              value={formData[fieldName] ?? ''}
              onValueChange={(value) => handleChange(fieldName, value)}
            >
              <option disabled value="">
                Select a type
              </option>
              {options.map((value) => (
                <option key={value} value={value}>
                  {value}
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
              name={fieldName}
              required={required}
              type='password'
              value={formData[fieldName] ?? ''}
              minLength={MIN_PASSWORD_LENGTH}
              onValueChange={(value) => handleChange(fieldName, value)}
            />
          </Label.Block>
          {
            passwordRepeat === undefined ? undefined : (
            <Label.Block title={passwordRepeat.description}>
              {passwordRepeat.label}
              <Input.Generic
                required={required}
                type='password'
                name={passwordRepeat.name}
                value={temporaryFormData[passwordRepeat.name] ?? ''}
                minLength={MIN_PASSWORD_LENGTH}
                onValueChange={(value) => setTemporaryFormData((previous) => ({
                  ...previous,
                  [passwordRepeat.name]: value,
                }))}
                onChange={({ target }): void => {
                  target.setCustomValidity(
                    target.value !== formData[fieldName] ? userText.passwordsDoNotMatchError() : ""
                  );
                }}
              />
            </Label.Block>
          )}
        </>
      ) : type === 'object' ? (
        // Subforms
        <>
          <div className="border border-gray-500 rounded-b p-1">
            <H3 className="text-xl font-semibold mb-4">
              {label}
            </H3>
            {fields === undefined ? undefined : fields.map((field) => renderFormField(field, name))}
          </div>
        </>
      ) : (
        <>
          <Label.Block title={description}>
            {label}
            <Input.Text
              required={required}
              name={fieldName}
              value={formData[fieldName] ?? ''}
              onValueChange={(value) => handleChange(fieldName, value)}
            />
          </Label.Block>
        </>
      )}
    </div>;
  };

  const renderFormFields = () =>
    resources[currentStep].fields.map((field) => renderFormField(field));

  return (
    <Container.FullGray className="overflow-auto w-full items-center">
      <H2 className="text-2xl mb-6">{setupToolText.specifyConfigurationSetup()}</H2>
      {currentStep < resources.length ? (
        <Container.Center className="p-3 shadow-md max-w-sm">
          <Form
            className="flex-1 overflow-auto gap-2"
            onSubmit={handleSubmit}
          >
            <H3 className="text-xl font-semibold mb-4">
              {resources[currentStep].resourceName}
            </H3>
            {renderFormFields()}
            <Submit.Save className="self-start">
              {setupToolText.saveAndContinue()}
            </Submit.Save>
          </Form>
        </Container.Center>
      ) : (
        <p className="mt-6 text-green-600 font-semibold">
          🎉 All resources have been created successfully!
        </p>
      )}
    </Container.FullGray>
  );
}

// Turn 'table.field' keys to nested objects to send to the backend
function flattenToNested(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key.includes('.')) {
      const [prefix, field] = key.split('.', 2);
      if (!result[prefix]) result[prefix] = {};
      result[prefix][field] = value;
    } else {
      result[key] = value;
    }
  }
  return result;
}