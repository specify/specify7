import React from 'react';
import { useNavigate } from 'react-router-dom';

import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { Container, H2 } from '../Atoms';

type ResourceFormData = Record<string, any>;

type ResourceConfig = {
  readonly resourceName: string;
  readonly endpoint: string;
  readonly fields: readonly string[];
};

const resources: readonly ResourceConfig[] = [
  {
    resourceName: 'Institution',
    endpoint: '/api/specify/institution/create/',
    fields: ['name', 'code', 'isAccessionsGlobal', 'isSingleGeographyTree'],
  },
  {
    resourceName: 'Division',
    endpoint: '/api/specify/division/create/',
    fields: ['name', 'abbrev'],
  },
  {
    resourceName: 'Discipline',
    endpoint: '/api/specify/discipline/create/',
    fields: ['name', 'type'],
  },
  {
    resourceName: 'Collection',
    endpoint: '/api/specify/collection/create/',
    fields: ['collectionName', 'code', 'catalogNumFormatName'],
  },
  {
    resourceName: 'SpecifyUser',
    endpoint: '/api/specify/specifyuser/create/',
    fields: ['name', 'password', 'agents'],
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
          navigate('/accounts/login/');
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
    resources[currentStep].fields.map((field) => (
      <div className="mb-4" key={field}>
        <label className="block font-medium text-gray-700 mb-1" htmlFor={field}>
          {field}
        </label>
        <input
          checked={
            typeof formData[field] === 'boolean' ? formData[field] : undefined
          }
          className="border rounded p-2 w-full"
          id={field}
          name={field}
          type={
            field.startsWith('is')
              ? 'checkbox'
              : field === 'password'
                ? 'password'
                : 'text'
          }
          value={
            typeof formData[field] === 'boolean'
              ? undefined
              : formData[field] || ''
          }
          onChange={handleChange}
        />
      </div>
    ));

  return (
    <Container.FullGray>
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
            className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
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
