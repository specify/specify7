import React from 'react';
import { useNavigate } from 'react-router-dom';

import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { Container, H2 } from '../Atoms';

type ResourceFormData = Record<string, any>;

type ResourceConfig = {
  readonly resourceName: string;
  readonly endpoint: string;
  readonly fields: readonly FieldConfig[];
};

type FieldConfig = {
  readonly name: string;
  readonly label: string;
};

const resources: readonly ResourceConfig[] = [
  {
    resourceName: 'Institution',
    endpoint: '/api/specify/institution/create/',
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'code', label: 'Code' },
      { name: 'isAccessionsGlobal', label: 'Define Accession Globally' },
      { name: 'isSingleGeographyTree', label: 'Use Single Geography Tree' },
    ],
  },
  {
    resourceName: 'Division',
    endpoint: '/api/specify/division/create/',
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'abbrev', label: 'Abbreviation' },
    ],
  },
  {
    resourceName: 'Discipline',
    endpoint: '/api/specify/discipline/create/',
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'type', label: 'Type' },
    ],
  },
  {
    resourceName: 'Collection',
    endpoint: '/api/specify/collection/create/',
    fields: [
      { name: 'collectionName', label: 'Collection Name' },
      { name: 'code', label: 'Code' },
      { name: 'catalogNumFormatName', label: 'Catalog Number Format' },
    ],
  },
  {
    resourceName: 'SpecifyUser',
    endpoint: '/api/specify/specifyuser/create/',
    fields: [
      { name: 'name', label: 'Username' },
      { name: 'password', label: 'Password' },
    ],
  },
];

export function ConfigurationTool(): JSX.Element {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState<ResourceFormData>({});
  const navigate = useNavigate();

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    resources[currentStep].fields.map(({ name, label }) => {
      const isCheckbox = name.startsWith('is');

      return (
        <div className="mb-4" key={name}>
          {isCheckbox ? (
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
                type={name === 'password' ? 'password' : 'text'}
                value={formData[name] || ''}
                onChange={handleChange}
              />
            </>
          )}
        </div>
      );
    });

  return (
    <Container.FullGray className="overflow-auto">
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
