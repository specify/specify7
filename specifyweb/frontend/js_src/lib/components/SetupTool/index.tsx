import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { setupToolText } from '../../localization/setupTool';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { type RA, localized } from '../../utils/types';
import { Container, H2, H3 } from '../Atoms';
import { Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { dialogIcons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { loadingBar } from '../Molecules';
import { checkFormCondition, renderFormFieldFactory } from './SetupForm';
import { SetupOverview } from './SetupOverview';
import type { FieldConfig, ResourceConfig } from './setupResources';
import { resources } from './setupResources';
import type {
  ResourceFormData,
  SetupProgress,
  SetupResources,
  SetupResponse,
} from './types';
import { flattenAllResources } from './utils';

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

  const [saveBlocked, setSaveBlocked] = React.useState<boolean>(false);

  React.useEffect(() => {
    const formValid = formRef.current?.checkValidity();
    setSaveBlocked(!formValid);
  }, [formData, temporaryFormData, currentStep]);
  const SubmitComponent = saveBlocked ? Submit.Danger : Submit.Save;

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

  const startSetup = async (data: ResourceFormData): Promise<any> =>
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
          console.log(`Setup completed successfully:`, data);
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
      loading(
        startSetup(formData)
          .then((data) => {
            console.log(data);
            setSetupProgress(data.setup_progress as SetupProgress);
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
            <div className="w-[20rem] h-full">
              <Container.Center className="p-3 shadow-md max-w-lg h-full">
                <H3 className="text-xl font-semibold mb-4">
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
                      <Link.NewTab
                        href={resources[currentStep].documentationUrl!}
                      >
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
                  <SubmitComponent className="self-start" form={id('form')}>
                    {(currentStep === resources.length - 1) ? commonText.create() : commonText.next()}
                  </SubmitComponent>
                </div>
              </Container.Center>
              <Container.Center className="p-3 shadow-md max-w-lg">
                <p className="text-md mb-4">{setupToolText.setupProgress()}</p>
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
