import React from 'react';

import { configurationText } from '../../localization/configuration';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Container, H2 } from '../Atoms';
import { LoadingContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { tables } from '../DataModel/tables';
import type { Collection } from '../DataModel/types';
import {
  adminUser,
  collection,
  discipline,
  division,
  institution,
} from '../FormParse/webOnlyViews';
import { ResourceView } from '../Forms/ResourceView';

type ConfigResourceType = {
  readonly resource: SpecifyResource<AnySchema>;
  readonly viewName: string;
  readonly onClick: (data: SpecifyResource<AnySchema>) => Promise<void>;
};

export function ConfigurationTool(): JSX.Element {
  const loading = React.useContext(LoadingContext);

  const [currentStep, setCurrentStep] = React.useState(0);

  const onResourceSaved = async (
    endpoint: string,
    resourceLabel: string,
    data: any
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

  const resources: RA<ConfigResourceType> = [
    {
      resource: new tables.Institution.Resource(),
      viewName: institution,
      onClick: async (data: SpecifyResource<AnySchema>): Promise<void> => {
        const body = {
          name: data.get('name') as string,
          code: data.get('code') as string,
          isaccessionsglobal:
            (data.get('isaccessionsglobal') as boolean) || false,
          issecurityon: (data.get('issecurityon') as boolean) || false,
          isserverbased: (data.get('isserverbased') as boolean) || false,
          issinglegeographytree:
            (data.get('issinglegeographytree') as boolean) || false,
        };
        return onResourceSaved(
          '/api/specify/institution/create/',
          new tables.Institution.Resource().specifyTable.name,
          body
        );
      },
    },
    {
      resource: new tables.Division.Resource(),
      viewName: division,
      onClick: async (data: SpecifyResource<AnySchema>): Promise<void> => {
        const body = {
          name: data.get('name'),
          abbreviation: data.get('abbrev'),
        };
        return onResourceSaved(
          '/api/specify/division/create/',
          new tables.Division.Resource().specifyTable.name,
          body
        );
      },
    },
    {
      resource: new tables.Discipline.Resource(),
      viewName: discipline,
      onClick: async (data: SpecifyResource<AnySchema>): Promise<void> => {
        const body = {
          name: data.get('name'),
          type: data.get('type'),
        };
        return onResourceSaved(
          '/api/specify/discipline/create/',
          new tables.Discipline.Resource().specifyTable.name,
          body
        );
      },
    },
    {
      resource: new tables.Collection.Resource(),
      viewName: collection,
      onClick: async (data: SpecifyResource<AnySchema>): Promise<void> => {
        const body = {
          collectionname: data.get('collectionname'),
          code: data.get('code'),
          catalognumformatname: data.get('catalognumformatname'),
          discipline: data.get('discipline'),
        };
        return onResourceSaved(
          '/api/specify/collection/create/',
          new tables.Collection.Resource().specifyTable.name,
          body
        );
      },
    },
    {
      resource: new tables.SpecifyUser.Resource(),
      viewName: adminUser,
      onClick: async (data: SpecifyResource<AnySchema>): Promise<void> => {
        const body = {
          name: data.get('name'),
          password: data.get('password'),
        };
        return onResourceSaved(
          '/api/specify/specifyuser/create/',
          new tables.SpecifyUser.Resource().specifyTable.name,
          body
        );
      },
    },
  ];

  return (
    <Container.FullGray>
      <H2 className="text-2xl">{configurationText.specifySetUp()}</H2>

      {currentStep < resources.length ? (
        <ResourceView
          dialog={false}
          isDependent={false}
          isSubForm={false}
          key={currentStep}
          resource={
            resources[currentStep].resource as SpecifyResource<Collection>
          }
          viewName={resources[currentStep].viewName}
          onAdd={undefined}
          // eslint-disable-next-line react/jsx-handler-names
          onClose={f.never}
          onDeleted={undefined}
          // eslint-disable-next-line react/jsx-handler-names
          onSaved={f.never}
          onSaving={(unsetUnloadProtect): false => {
            unsetUnloadProtect();

            const resource = resources[currentStep];

            loading(
              resource
                .onClick(resource.resource)
                .then(() => {
                  setCurrentStep(currentStep + 1);
                })
                .catch((error) => {
                  console.error('Step failed:', error);
                })
            );

            return false;
          }}
        />
      ) : (
        <p className="mt-6 text-green-600 font-semibold">
          🎉 All resources have been created successfully!
        </p>
      )}
    </Container.FullGray>
  );
}
