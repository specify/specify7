import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { setupToolText } from '../../localization/setupTool';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { type RA, localized } from '../../utils/types';
import { Container, H2, H3, Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { dialogIcons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { loadingBar } from '../Molecules';
import type { TaxonFileDefaultList } from '../TreeView/CreateTree';
import { fetchDefaultTrees } from '../TreeView/CreateTree';
import { checkFormCondition, renderFormFieldFactory } from './SetupForm';
import { SetupOverview } from './SetupOverview';
import type { FieldConfig, ResourceConfig } from './setupResources';
import { disciplineTypeOptions, resources } from './setupResources';
import type {
  ResourceFormData,
  SetupProgress,
  SetupResources,
  SetupResponse,
} from './types';
import { flattenAllResources } from './utils';
import type { TaxonFileDefaultDefinition } from '../TreeView/CreateTree';

const SETUP_POLLING_INTERVAL = 3000;

export const stepOrder: RA<keyof SetupResources> = [
  'institution',
  'storageTreeDef',
  'division',
  'discipline',
  'geographyTreeDef',
  'taxonTreeDef',
  'collection',
  'specifyUser',
];

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

function applyFormDefaults(
  resource: ResourceConfig,
  setFormData: (data: ResourceFormData) => void,
  currentStep: number
): void {
  const resourceName = resources[currentStep].resourceName;
  const defaultFormData: ResourceFormData = {};
  const applyFieldDefaults = (
    field: FieldConfig,
    parentName?: string
  ): void => {
    const fieldName =
      parentName === undefined ? field.name : `${parentName}.${field.name}`;
    if (field.type === 'object' && field.fields !== undefined)
      field.fields.forEach((field) => applyFieldDefaults(field, fieldName));
    if (field.default !== undefined) defaultFormData[fieldName] = field.default;
  };
  resource.fields.forEach((field) => applyFieldDefaults(field));
  setFormData((previous: ResourceFormData) => ({
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
    applyFormDefaults(resources[currentStep], setFormData, currentStep);
  }, [currentStep]);

  const [saveBlocked, setSaveBlocked] = React.useState<boolean>(false);

  React.useEffect(() => {
    const formValid = formRef.current?.checkValidity();
    setSaveBlocked(formValid !== true);
  }, [formData, temporaryFormData, currentStep]);
  const SubmitComponent = saveBlocked ? Submit.Danger : Submit.Save;

  // Keep track of the last backend error.
  const [setupError, setSetupError] = React.useState<string | null>(
    setupProgress.last_error
  );

  // Is the database currrently being created?
  const [inProgress, setInProgress] = React.useState<boolean>(
    setupProgress.busy
  );
  const nextIncompleteStep = stepOrder.findIndex(
    (resourceName) => !setupProgress.resources[resourceName]
  );
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
            setInProgress(data.busy);
            setSetupError(data.last_error);
          })
          .catch((error) => {
            console.error('Failed to fetch setup progress:', error);
            return undefined;
          }),
      SETUP_POLLING_INTERVAL
    );

    return () => clearInterval(interval);
  }, [inProgress, setSetupProgress]);

  const loading = React.useContext(LoadingContext);

  const startSetup = async (data: ResourceFormData): Promise<SetupResponse> =>
    ajax<SetupResponse>('/setup_tool/setup_database/create/', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flattenAllResources(data)),
      errorMode: 'visible',
      expectedErrors: [Http.CONFLICT, Http.UNAVAILABLE],
    })
      .then(({ data, status }) => {
        if (status === Http.OK) {
          console.log(`Setup started successfully:`, data);
          return data;
        } else {
          const dataParsed = JSON.parse(data as unknown as string); // Data is a string on errors
          const errorMessage = String(dataParsed.error ?? data);
          throw new Error(errorMessage);
        }
      })
      .catch((error) => {
        setSetupError(String(error));
        throw error;
      });

  const handleChange = (
    name: string,
    newValue: LocalizedString | boolean | TaxonFileDefaultDefinition
  ): void => {
    setFormData((previous: ResourceFormData) => {
      const resourceName = resources[currentStep].resourceName;
      const previousResourceData = previous[resourceName];
      const updates: Record<string, any> = {
        ...previousResourceData,
        [name]: newValue,
      };

      if (resourceName === 'discipline' && name === 'type') {
        const matchingType = disciplineTypeOptions.find(
          (option) => option.value === newValue
        );
        updates.name = matchingType
          ? (matchingType.label ?? String(matchingType.value))
          : '';
      }

      return {
        ...previous,
        [resourceName]: updates,
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
      loading(
        startSetup(formData)
          .then((data) => {
            setSetupProgress(data.setup_progress);
            setInProgress(true);
          })
          .catch((error) => {
            console.error('Form submission failed:', error);
            setInProgress(false);
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

  const { renderFormFields } = renderFormFieldFactory({
    formData,
    currentStep,
    handleChange,
    temporaryFormData,
    setTemporaryFormData,
    formRef,
  });

  const id = useId('setup-tool');

  return (
    <div className="w-full flex flex-col h-full min-h-0">
      <header className="w-full bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700 relative z-20">
        <div className="w-full flex flex-col items-center justify-center gap-2 py-3">
          <img
            alt=""
            className="w-auto h-12 mx-auto"
            src="/static/img/logo.svg"
          />
          <H2 className="text-2xl">{setupToolText.guidedSetup()}</H2>
        </div>
      </header>
      <Container.FullGray className="overflow-auto w-full items-center shadow-none">
        {inProgress ? (
          <Container.Center className="p-3 shadow-none max-w-lg">
            <H3 className="text-xl font-semibold">
              {setupToolText.settingUp()}
            </H3>
            <H3 className="text-md">
              {nextIncompleteStep === -1
                ? setupToolText.settingUp()
                : `${setupToolText.creating()} ${resources[nextIncompleteStep].label}`}
            </H3>
            {loadingBar}
          </Container.Center>
        ) : (
          <div className="flex flex-col md:flex-row w-full justify-center gap-4">
            <div className="w-[20rem]">
              <Container.Center className="p-3 shadow-none max-w-lg">
                <H3 className="text-xl font-semibold">
                  {setupToolText.overview()}
                </H3>
                <div className="overflow-auto">
                  <SetupOverview
                    currentStep={currentStep}
                    formData={formData}
                  />
                </div>
              </Container.Center>
            </div>
            <div className="w-[32rem] flex flex-col gap-y-4">
              <Container.Center className="p-3 shadow-none">
                <Form
                  className="flex-1 overflow-auto gap-2"
                  forwardRef={formRef}
                  id={id('form')}
                  key={currentStep}
                  onSubmit={handleSubmit}
                >
                  <div className="flex items-center justify-between">
                    <H3 className="text-xl font-semibold">
                      {resources[currentStep].label}
                    </H3>
                    {resources[currentStep].documentationUrl !== undefined && (
                      <Link.NewTab
                        href={resources[currentStep].documentationUrl!}
                      >
                        {headerText.documentation()}
                      </Link.NewTab>
                    )}
                  </div>
                  {resources[currentStep].description ===
                  undefined ? undefined : (
                    <p className="text-md">
                      {resources[currentStep].description}
                    </p>
                  )}
                  {renderFormFields(resources[currentStep].fields)}
                </Form>
                <div className="flex flex-row gap-2 justify-end">
                  <Button.Secondary className="self-start" onClick={handleBack}>
                    {commonText.back()}
                  </Button.Secondary>
                  <SubmitComponent className="self-start" form={id('form')}>
                    {currentStep === resources.length - 1
                      ? commonText.create()
                      : commonText.next()}
                  </SubmitComponent>
                </div>
              </Container.Center>
              <Container.Center className="p-3 shadow-none max-w-lg">
                <p className="text-md">{setupToolText.setupProgress()}</p>
                <Progress max={stepOrder.length} value={currentStep} />
              </Container.Center>
              {setupError === null ? undefined : (
                <Container.Center className="p-3 shadow-none max-w-lg">
                  <div className="flex items-center justify-start gap-3 w-full">
                    <span className="text-red-500">{dialogIcons.warning}</span>
                    <H3 className="text-xl font-semibold m-0 leading-none">
                      {setupToolText.setupError()}
                    </H3>
                  </div>
                  <p className="text-md">{localized(setupError)}</p>
                </Container.Center>
              )}
            </div>
          </div>
        )}
      </Container.FullGray>
    </div>
  );
}
