import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { setupToolText } from '../../localization/setupTool';
import { userText } from '../../localization/user'
import { commonText } from '../../localization/common'
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import type { RA } from '../../utils/types';
import { Container, H2, H3 } from '../Atoms';
import { Form, Input, Label, Select } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import type { SetupProgress } from '../Login';
import { MIN_PASSWORD_LENGTH } from '../Security/SetPassword';
import type { FieldConfig, ResourceConfig } from "./setupResources";
import { resources } from "./setupResources";
import { useId } from '../../hooks/useId';
import { Progress } from '../Atoms';

type ResourceFormData = Record<string, any>;

const stepOrder: RA<keyof SetupProgress> = [
  'institution',
  'storageTreeDef',
  'globalGeographyTreeDef',
  'division',
  'discipline',
  'geographyTreeDef',
  'taxonTreeDef',
  'collection',
  'specifyUser',
];

function findInitialStep(progress: SetupProgress): number {
  return stepOrder.findIndex((key) => !progress[key]);
}

function useFormDefaults(
  resource: ResourceConfig,
  setFormData: (data: ResourceFormData) => void,
): void {
  const defaultFormData: ResourceFormData = {};
  const applyFieldDefaults = (field: FieldConfig, parentName?: string) =>
    { 
      const fieldName = parentName === undefined ? field.name : `${parentName}.${field.name}`
      if (field.type === 'object' && field.fields !== undefined)
        field.fields.forEach((field) => applyFieldDefaults(field, fieldName));
      if (field.default !== undefined)
        defaultFormData[fieldName] = field.default;
    }
  resource.fields.forEach(
    (field) => applyFieldDefaults(field)
  )
  setFormData(defaultFormData);
}

export function SetupTool({
  setupProgress,
  setSetupProgress,
}: {
  readonly setupProgress: SetupProgress;
  readonly setSetupProgress: (value: SetupProgress | ((oldValue: SetupProgress | undefined) => SetupProgress | undefined) | undefined) => void;
}): JSX.Element {
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const [formData, setFormData] = React.useState<ResourceFormData>({});
  const [temporaryFormData, setTemporaryFormData] = React.useState<ResourceFormData>({}); // For front-end only.

  const currentStep = findInitialStep(setupProgress);

  React.useEffect(() => {
    useFormDefaults(resources[currentStep], setFormData);
  }, [currentStep])
  
  const loading = React.useContext(LoadingContext);

  const onResourceSaved = async (
    endpoint: string,
    resourceLabel: string,
    data: ResourceFormData
  ): Promise<any> =>
    ajax<any>(endpoint, {
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
          return data
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
        .then((data) => {
          console.log(data);
          setSetupProgress(data.setup_progress as SetupProgress);
        })
        .catch((error) => {
          console.error('Form submission failed:', error);
        })
      );
  };

  const renderFormField = (field: FieldConfig, parentName?: string) => {
    const { name, label, type, required = false, description, options, fields, passwordRepeat } = field;

    const fieldName = parentName === undefined ? name : `${parentName}.${name}`

    const colSpan = (type === 'object') ? 2 : 1
    return <div className={`mb-2 col-span-${colSpan}`} key={fieldName}>
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
              <option disabled value={field.default as string ?? ''}>
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
              minLength={MIN_PASSWORD_LENGTH}
              name={fieldName}
              required={required}
              type='password'
              value={formData[fieldName] ?? ''}
              onValueChange={(value) => handleChange(fieldName, value)}
            />
          </Label.Block>
          {
            passwordRepeat === undefined ? undefined : (
            <Label.Block title={passwordRepeat.description}>
              {passwordRepeat.label}
              <Input.Generic
                minLength={MIN_PASSWORD_LENGTH}
                name={passwordRepeat.name}
                required={required}
                type='password'
                value={temporaryFormData[passwordRepeat.name] ?? ''}
                onChange={({ target }): void => {
                  target.setCustomValidity(
                    target.value === formData[fieldName] ? "" : userText.passwordsDoNotMatchError()
                  );
                }}
                onValueChange={(value) => setTemporaryFormData((previous) => ({
                  ...previous,
                  [passwordRepeat.name]: value,
                }))}
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
            {fields === undefined ? undefined : renderFormFields(fields, name)}
          </div>
      ) : (
        <Label.Block title={description}>
          {label}
          <Input.Text
            name={fieldName}
            required={required}
            value={formData[fieldName] ?? ''}
            onValueChange={(value) => handleChange(fieldName, value)}
          />
        </Label.Block>
      )}
    </div>;
  };

  const renderFormFields = (fields: RA<FieldConfig>, parentName?: string) => (
    <div className="grid grid-cols-2 gap-4">
      {fields.map((field) => renderFormField(field, parentName))}
    </div>
  );

  const id = useId('setup-tool');

  return (
    <Container.FullGray className="overflow-auto w-full items-center">
      <img
        src="/static/img/logo.svg"
        className="w-auto h-12 mx-auto"
      />
      <H2 className="text-2xl mb-6">{setupToolText.specifyConfigurationSetup()}</H2>
      {currentStep < resources.length ? (
        <>
          <Container.Center className="p-3 shadow-md max-w-lg">
            <Form
              forwardRef={formRef}
              className="flex-1 overflow-auto gap-2"
              onSubmit={handleSubmit}
              id={id('form')}
            >
              <H3 className="text-xl font-semibold mb-4">
                {resources[currentStep].label}
              </H3>
              {renderFormFields(resources[currentStep].fields)}
            </Form>
            <Submit.Save className="self-start" form={id('form')}>
              {setupToolText.saveAndContinue()}
            </Submit.Save>
          </Container.Center>
          <Container.Center className="p-3 shadow-md max-w-lg">
            <Progress max={stepOrder.length} value={currentStep} />
          </Container.Center>
        </>
      ) : (
        <p className="mt-6 text-green-600 font-semibold">
          {setupToolText.setupComplete()}
        </p>
      )}
    </Container.FullGray>
  );
}

// Turn 'table.field' keys to nested objects to send to the backend
function flattenToNested(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (key.includes('.')) {
      const [prefix, field] = key.split('.', 2);
      if (!result[prefix])
        result[prefix] = {}
      result[prefix][field] = value;
    } else {
      result[key] = value;
    }
  });
  return result;
}