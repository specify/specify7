import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { setupToolText } from '../../localization/setupTool';
import { userText } from '../../localization/user';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { type RA, localized } from '../../utils/types';
import { Container, H2, H3 } from '../Atoms';
import { Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form, Input, Label, Select } from '../Atoms/Form';
import { dialogIcons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import type { SetupProgress, SetupResources } from '../Login';
import { loadingBar } from '../Molecules';
import { MIN_PASSWORD_LENGTH } from '../Security/SetPassword';
import type { FieldConfig, ResourceConfig } from './setupResources';
import { FIELD_MAX_LENGTH, resources } from './setupResources';
import { flattenAllResources } from './utils';
import { queryText } from '../../localization/query';

type ResourceFormData = Record<string, any>;

const stepOrder: RA<keyof SetupResources> = [
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

function checkFormCondition(
  formData: ResourceFormData,
  resource: ResourceConfig,
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
  return pass
}

function findNextStep(
  currentStep: number,
  formData: ResourceFormData,
  direction: number = 1
): number {
  /*
   * Find the next *accessible* form.
   * Handles conditional pages, like the global geography tree.
   */
  let step = currentStep + direction;
  while (step >= 0 && step < resources.length) {
    const resource = resources[step];
    // Check condition
    const pass = checkFormCondition(formData, resource);
    if (pass) return step;
    step += direction;
  }
  return currentStep;
}

function getFormValue(
  formData: ResourceFormData,
  currentStep: number,
  fieldName: string
): number | string | undefined {
  return formData[resources[currentStep].resourceName][fieldName];
}

function useFormDefaults(
  resource: ResourceConfig,
  setFormData: (data: ResourceFormData) => void,
  currentStep: number
): void {
  const resourceName = resources[currentStep].resourceName;
  const defaultFormData: ResourceFormData = {};
  const applyFieldDefaults = (field: FieldConfig, parentName?: string) => {
    const fieldName =
      parentName === undefined ? field.name : `${parentName}.${field.name}`;
    if (field.type === 'object' && field.fields !== undefined)
      field.fields.forEach((field) => applyFieldDefaults(field, fieldName));
    if (field.default !== undefined) defaultFormData[fieldName] = field.default;
  };
  resource.fields.forEach((field) => applyFieldDefaults(field));
  setFormData((previous: any) => ({
    ...previous,
    [resourceName]: {
      ...defaultFormData,
      ...previous[resourceName],
    },
  }));
}

export function SetupTool({
  setupProgress,
  setSetupProgress,
}: {
  readonly setupProgress: SetupProgress;
  readonly setSetupProgress: (
    value:
      | SetupProgress
      | ((oldValue: SetupProgress | undefined) => SetupProgress | undefined)
      | undefined
  ) => void;
}): JSX.Element {
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const [formData, setFormData] = React.useState<ResourceFormData>(
    Object.fromEntries(stepOrder.map((key) => [key, {}]))
  );
  const [temporaryFormData, setTemporaryFormData] =
    React.useState<ResourceFormData>({}); // For front-end only.

  const [currentStep, setCurrentStep] = React.useState<number>(0);
  React.useEffect(() => {
    useFormDefaults(resources[currentStep], setFormData, currentStep);
  }, [currentStep]);

  // Keep track of the last backend error.
  const [setupError, setSetupError] = React.useState<string | undefined>(
    undefined
  );

  // Is the database currrently being created?
  const [inProgress, setInProgress] = React.useState<boolean>(false);
  const nextIncompleteStep = stepOrder.findIndex(
    (resourceName) => !setupProgress.resources[resourceName]
  );
  React.useEffect(() => {
    if (setupProgress.busy) setInProgress(true);
    if (setupProgress.last_error) setSetupError(setupProgress.last_error);
  }, [setupProgress]);
  React.useEffect(() => {
    // Poll for the latest setup progress.
    if (!inProgress) return;

    const interval = setInterval(
      async () =>
        ajax<SetupProgress>(`/setup_tool/setup_progress/`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          errorMode: 'dismissible',
        })
          .then(({ data }) => {
            setSetupProgress(data);
            if (data.last_error !== undefined) {
              setInProgress(false);
              setSetupError(data.last_error);
            }
          })
          .catch((error) => {
            console.error('Failed to fetch setup progress:', error);
            return undefined;
          }),
      3000
    );

    return () => clearInterval(interval);
  }, [inProgress, setSetupProgress]);

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
      body: JSON.stringify(flattenAllResources(data)),
      errorMode: 'visible',
      expectedErrors: [Http.CREATED],
    })
      .then(({ data, status }) => {
        if (status === Http.OK) {
          console.log(`${resourceLabel} created successfully:`, data);
          return data;
        } else {
          console.error(`Error creating ${resourceLabel}:`, data);
          throw new Error(`Issue when creating ${resourceLabel}`);
        }
      })
      .catch((error) => {
        console.log(error);
        console.error(`Request failed for ${resourceLabel}:`, error);
        setSetupError(String(error));
        throw error;
      });

  const handleChange = (
    name: string,
    newValue: LocalizedString | boolean
  ): void => {
    setFormData((previous) => {
      const resourceName = resources[currentStep].resourceName;
      return {
        ...previous,
        [resourceName]: {
          ...previous[resourceName],
          [name]: newValue,
        },
      };
    });
  };

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();

    if (currentStep === resources.length - 1) {
      /*
       * Send resources to backend to start the setup
       * const { endpoint, resourceName } = resources[currentStep];
       */
      const endpoint = '/setup_tool/setup_database/create/';
      loading(
        onResourceSaved(endpoint, 'TEMPORARY_LABEL', formData)
          .then((data) => {
            console.log(data);
            setSetupProgress(data.setup_progress as SetupProgress);
            setInProgress(true);
          })
          .catch((error) => {
            console.error('Form submission failed:', error);
          })
      );
    } else {
      // Continue onto the next resource/form
      setCurrentStep(findNextStep(currentStep, formData, 1));
    }
  };

  const handleBack = (): void => {
    setCurrentStep(findNextStep(currentStep, formData, -1));
  };

  const renderFormField = (field: FieldConfig, parentName?: string) => {
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
            key={`${resources[currentStep].resourceName}.fieldName`}
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
            {passwordRepeat === undefined ? undefined : (
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
            {fields === undefined ? undefined : renderFormFields(fields, name)}
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

  const id = useId('setup-tool');

  return (
    <div className="w-full">
      <header className="w-full bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700 shadow-lg relative z-20">
        <div className="w-full flex flex-col items-center justify-center gap-2 pt-3 pb-0 px-4">
          <img className="w-auto h-12 mx-auto" src="/static/img/logo.svg" />
          <H2 className="text-2xl mb-6">
            {setupToolText.specifyConfigurationSetup()}
          </H2>
        </div>
      </header>
      <Container.FullGray className="overflow-auto w-full items-center">
        {inProgress ? (
          <Container.Center className="p-3 shadow-md max-w-lg">
            <H3 className="text-xl font-semibold mb-4">
              {setupToolText.settingUp()}
            </H3>
            <H3 className="text-md mb-4">
              {nextIncompleteStep === -1
                ? setupToolText.settingUp()
                : resources[nextIncompleteStep].label}
            </H3>
            {loadingBar}
          </Container.Center>
        ) : (
          <div className="flex flex-col md:flex-row w-full justify-center gap-8">
            <div className="w-[18rem] h-full">
              <Container.Center className="p-3 shadow-md max-w-lg h-full">
                <H3 className="text-xl font-semibold mb-4">
                  {setupToolText.overview()}
                </H3>
                <div className="overflow-auto">
                  <SetupOverview currentStep={currentStep} formData={formData} />
                </div>
              </Container.Center>
            </div>
            <div className="w-[32rem] flex flex-col gap-y-4">
              <Container.Center className="p-3 shadow-md">
                <Form
                  className="flex-1 overflow-auto gap-2"
                  forwardRef={formRef}
                  id={id('form')}
                  key={currentStep}
                  onSubmit={handleSubmit}
                >
                  <div className="flex items-center justify-between mb-4">
                    <H3 className="text-xl font-semibold mb-4">
                      {resources[currentStep].label}
                    </H3>
                    {resources[currentStep].documentationUrl !== undefined && (
                      <Link.NewTab href={resources[currentStep].documentationUrl!}>
                        {headerText.documentation()}
                      </Link.NewTab>
                    )}
                  </div>
                  {resources[currentStep].description ===
                  undefined ? undefined : (
                    <p className="text-md mb-4">
                      {resources[currentStep].description}
                    </p>
                  )}
                  {renderFormFields(resources[currentStep].fields)}
                </Form>
                <div className="flex flex-row gap-2 justify-end">
                  <Button.Secondary className="self-start" onClick={handleBack}>
                    {commonText.back()}
                  </Button.Secondary>
                  {
                    (currentStep === resources.length - 1) ? 
                    <Submit.Save className="self-start" form={id('form')}>
                      {commonText.create()}
                    </Submit.Save>
                    :
                    <Submit.Save className="self-start" form={id('form')}>
                      {commonText.next()}
                    </Submit.Save>
                  }
                  
                </div>
              </Container.Center>
              <Container.Center className="p-3 shadow-md max-w-lg">
                <p className="text-md mb-4">{setupToolText.progress()}</p>
                <Progress max={stepOrder.length} value={currentStep} />
              </Container.Center>
              {setupError === undefined ? undefined : (
                <Container.Center className="p-3 shadow-md max-w-lg">
                  <div className="flex items-center justify-start gap-3 w-full">
                    <span className="text-red-500">{dialogIcons.warning}</span>
                    <H3 className="text-xl font-semibold m-0 leading-none">
                      {setupToolText.setupError()}
                    </H3>
                  </div>
                  <p className="text-md mb-4">{localized(setupError)}</p>
                </Container.Center>
              )}
            </div>
          </div>
        )}
      </Container.FullGray>
    </div>
  );
}

function SetupOverview({
  formData,
  currentStep,
}: {
  readonly formData: ResourceFormData;
  readonly currentStep: number;
}): JSX.Element {
  // Displays all previously filled out forms in a grid format. 
  return (
    <div className="space-y-4 max-h-[70vh] overflow-auto ">
      <table className="w-full text-sm border-collapse table-auto rounded-md bg-white dark:bg-neutral-800">
        <colgroup>
          <col style={{ width: '60%' }} />
          <col style={{ width: '40%' }} />
        </colgroup>
        <tbody className="divide-y divide-gray-500">
          {resources.map((resource, step) => {
            // Display only the forms that have been visited.
            if (
              (Object.keys(formData[resource.resourceName]).length > 0 ||
              step <= currentStep) &&
              checkFormCondition(formData, resource)
            ) {
              // Decide how to render each field.
              const fieldDisplay = (field: FieldConfig, parentName?: string) => {
                const fieldName = parentName === undefined ? field.name : `${parentName}.${field.name}`;
                const rawValue = formData[resource.resourceName]?.[fieldName];
                let value = rawValue?.toString() ?? '-';
                if (field.type === 'object') {
                  // Construct a sub list of properties
                  field.fields?.map((child_field) => fieldDisplay(child_field, field.name));
                  return (
                    <React.Fragment key={`${resource.resourceName}-${field.name}`}>
                      <tr key={`${resource.resourceName}`}>
                        <td className="font-medium py-1 pr-2 pl-2" colSpan={2}>
                          {field.label}
                        </td>
                      </tr>
                      {field.fields?.map((child) => (
                        <React.Fragment key={`${resource.resourceName}-${field.name}-${child.name}`}>
                          {fieldDisplay(
                            child,
                            parentName ? `${parentName}.${field.name}` : field.name
                          )}
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  );
                } else if (field.type === 'password') {
                  value = rawValue ? '***' : '-';
                } else if (
                  field.type === 'select' &&
                  Array.isArray(field.options)
                ) {
                  const match = field.options.find(
                    (option) => String(option.value) === value
                  );
                  value = match ? (match.label ?? match.value) : value;
                } else if (
                  field.type == 'boolean'
                ) {
                  value = rawValue === true ? queryText.yes() : commonText.no();
                }
                return (
                  <tr key={`${resource.resourceName}-${field.name}`}>
                    <td className={`py-1 pr-2 ${parentName ? 'pl-5' : 'pl-2'}`}>{field.label}</td>
                    <td className="py-1 pl-2 border-l border-gray-500">{value}</td>
                  </tr>
                );
              };
              return (
                <React.Fragment key={resource.resourceName}>
                  <tr key={`${resource.resourceName}`}>
                    <td className="font-bold py-1 pr-2 pl-2 bg-gray-200 dark:bg-neutral-700" colSpan={2}>
                      {resource.label}
                    </td>
                  </tr>
                  {resource.fields.map((field) => fieldDisplay(field))}
                </React.Fragment>
              );
            }
            return undefined;
          })}
        </tbody>
      </table>
    </div>
  );
}