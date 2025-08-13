import React from 'react';

import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import type { RA } from '../../utils/types';
import { Container, H2 } from '../Atoms';
import type { SetupProgress } from '../Login';

type ResourceFormData = Record<string, any>;

type ResourceConfig = {
  readonly resourceName: string;
  readonly endpoint: string;
  readonly fields: RA<FieldConfig>;
};

type FieldConfig = {
  readonly name: string;
  readonly label: string;
  readonly type?: 'boolean' | 'password' | 'select' | 'text';
  readonly options?: RA<string>;
};

const disciplineTypeOptions = [
  'fish',
  'herpetology',
  'paleobotany',
  'invertpaleo',
  'vertpaleo',
  'bird',
  'mammal',
  'insect',
  'botany',
  'invertebrate',
  'minerals',
  'geology',
  'anthropology',
  /*
   * 'vascplant',
   * 'fungi',
   */
];

const catalogNumberFormats = [
  'CatalogNumber',
  'CatalogNumberAlphaNumByYear',
  'CatalogNumberNumeric',
  'CatalogNumberString',
];

const resources: RA<ResourceConfig> = [
  {
    resourceName: 'Institution',
    endpoint: '/setup_tool/institution/create/',
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'code', label: 'Code' },
      {
        name: 'isAccessionsGlobal',
        label: 'Define Accession Globally',
        type: 'boolean',
      },
      {
        name: 'isSingleGeographyTree',
        label: 'Use Single Geography Tree',
        type: 'boolean',
      },
    ],
  },
  {
    resourceName: 'Division',
    endpoint: '/setup_tool/division/create/',
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'abbrev', label: 'Abbreviation' },
    ],
  },
  {
    resourceName: 'Discipline',
    endpoint: '/setup_tool/discipline/create/',
    fields: [
      { name: 'name', label: 'Name' },
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        options: disciplineTypeOptions,
      },
    ],
  },
  {
    resourceName: 'Collection',
    endpoint: '/setup_tool/collection/create/',
    fields: [
      { name: 'collectionName', label: 'Collection Name' },
      { name: 'code', label: 'Code' },
      {
        name: 'catalogNumFormatName',
        label: 'Catalog Number Format',
        type: 'select',
        options: catalogNumberFormats,
      },
    ],
  },
  {
    resourceName: 'SpecifyUser',
    endpoint: '/setup_tool/specifyuser/create/',
    fields: [
      { name: 'name', label: 'Username' },
      { name: 'password', label: 'Password', type: 'password' },
    ],
  },
];

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

  const initialStep = findInitialStep(setupProgress);
  const [currentStep, setCurrentStep] = React.useState(initialStep);

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
      body: JSON.stringify(data),
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
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value, type } = event.target;

    const newValue =
      type === 'checkbox' && 'checked' in event.target
        ? (event.target as HTMLInputElement).checked
        : value;

    setFormData((previous) => ({
      ...previous,
      [name]: newValue,
    }));
  };

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    const { endpoint, resourceName } = resources[currentStep];

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
      });
  };

  const renderFormFields = () =>
    resources[currentStep].fields.map(({ name, label, type, options }) => (
      <div className="mb-4" key={name}>
        {type === 'boolean' ? (
          <div className="flex items-center space-x-2">
            <label className="font-medium text-gray-700" htmlFor={name}>
              {label}
            </label>
            <input
              checked={Boolean(formData[name])}
              className="border border-gray-500 rounded-full"
              id={name}
              name={name}
              type="checkbox"
              onChange={handleChange}
            />
          </div>
        ) : type === 'select' && Array.isArray(options) ? (
          <div className="mb-4" key={name}>
            <label
              className="block font-medium text-gray-700 mb-1"
              htmlFor={name}
            >
              {label}
            </label>
            <select
              className="rounded-md p-2 w-full"
              id={name}
              name={name}
              value={formData[name] || ''}
              onChange={handleChange}
            >
              <option disabled value="">
                Select a type
              </option>
              {options.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <label
              className="block font-medium text-gray-700 mb-1"
              htmlFor={name}
            >
              {label}
            </label>
            <input
              className="rounded-md p-2 w-full"
              id={name}
              name={name}
              type={type === 'password' ? 'password' : 'text'}
              value={formData[name] || ''}
              onChange={handleChange}
            />
          </>
        )}
      </div>
    ));

  return (
    <Container.FullGray className="overflow-auto w-full items-center">
      <H2 className="text-2xl mb-6">Specify Configuration Setup</H2>
      {currentStep < resources.length ? (
        <form
          className="bg-white p-6 rounded shadow-md max-w-xl"
          onSubmit={handleSubmit}
        >
          <h3 className="text-xl font-semibold mb-4">
            {resources[currentStep].resourceName}
          </h3>
          {renderFormFields()}
          <button
            className="bg-orange-500 text-white px-4 py-2 rounded mt-4"
            type="submit"
          >
            Save & Continue
          </button>
        </form>
      ) : (
        <p className="mt-6 text-green-600 font-semibold">
          🎉 All resources have been created successfully!
        </p>
      )}
    </Container.FullGray>
  );
}
