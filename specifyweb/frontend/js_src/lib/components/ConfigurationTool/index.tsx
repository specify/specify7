import React from 'react';

import { configurationText } from '../../localization/configurationText';
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
  readonly onClick: (data: ReadonlyMap<string, unknown>) => Promise<void>;
};

type InstitutionRequestBody = {
  readonly name: string;
  readonly code: string;
  readonly isaccessionsglobal: boolean;
  readonly issecurityon: boolean;
  readonly isserverbased: boolean;
  readonly issinglegeographytree: boolean;
};

export function ConfigurationTool(): JSX.Element {
  const loading = React.useContext(LoadingContext);

  const onInstitutionSaved = async (data: any): Promise<void> =>
    ajax('/api/specify/institution/create/', {
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
        if (status === Http.CREATED) {
          console.log('Institution created successfully:', data);
        } else {
          console.error('Error creating institution:', data);
        }
      })
      .catch((error) => {
        console.error('Request failed:', error);
      });

  const onDivisionSaved = async (data: any): Promise<void> =>
    ajax('/api/specify/division/create/', {
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
        if (status === Http.CREATED) {
          console.log('Division created successfully:', data);
        } else {
          console.error('Error creating division:', data);
        }
      })
      .catch((error) => {
        console.error('Request failed:', error);
      });

  const onDisciplineSaved = async (data: any): Promise<void> =>
    ajax('/api/specify/discipline/create/', {
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
        if (status === Http.CREATED) {
          console.log('Discipline created successfully:', data);
        } else {
          console.error('Error creating discipline:', data);
        }
      })
      .catch((error) => {
        console.error('Request failed:', error);
      });

  const onCollectionSaved = async (data: any): Promise<void> =>
    ajax('/api/specify/collection/create/', {
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
        if (status === Http.CREATED) {
          console.log('Collection created successfully:', data);
        } else {
          console.error('Error creating collection:', data);
        }
      })
      .catch((error) => {
        console.error('Request failed:', error);
      });

  const onSpecifyUserSaved = async (data: any): Promise<void> =>
    ajax('/api/specify/specifyuser/create/', {
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
        if (status === Http.CREATED) {
          console.log('Specify user created successfully:', data);
        } else {
          console.error('Error creating specify user:', data);
        }
      })
      .catch((error) => {
        console.error('Request failed:', error);
      });

  const resources: RA<ConfigResourceType> = [
    {
      resource: new tables.Institution.Resource(),
      viewName: institution,
      onClick: async (data: ReadonlyMap<string, unknown>): Promise<void> => {
        const body: InstitutionRequestBody = {
          name: data.get('name') as string,
          code: data.get('code') as string,
          isaccessionsglobal:
            (data.get('isaccessionsglobal') as boolean) || false,
          issecurityon: (data.get('issecurityon') as boolean) || false,
          isserverbased: (data.get('isserverbased') as boolean) || false,
          issinglegeographytree:
            (data.get('issinglegeographytree') as boolean) || false,
        };
        loading(onInstitutionSaved(body));
      },
    },
    {
      resource: new tables.Division.Resource(),
      viewName: division,
      onClick: async (data: ReadonlyMap<string, unknown>): Promise<void> => {
        const body = {
          name: data.get('name'),
          abbreviation: data.get('abbrev'),
        };
        loading(onDivisionSaved(body));
      },
    },
    {
      resource: new tables.Discipline.Resource(),
      viewName: discipline,
      onClick: async (data: ReadonlyMap<string, unknown>): Promise<void> => {
        const body = {
          name: data.get('name'),
          type: data.get('type'),
        };
        loading(onDisciplineSaved(body));
      },
    },
    {
      resource: new tables.Collection.Resource(),
      viewName: collection,
      onClick: async (data: ReadonlyMap<string, unknown>): Promise<void> => {
        const body = {
          collectionname: data.get('collectionname'),
          code: data.get('code'),
          catalognumformatname: data.get('catalognumformatname'),
          discipline: data.get('discipline'),
        };
        loading(onCollectionSaved(body));
      },
    },
    {
      resource: new tables.SpecifyUser.Resource(),
      viewName: adminUser,
      onClick: async (data: ReadonlyMap<string, unknown>): Promise<void> => {
        const body = {
          name: data.get('name'),
          password: data.get('password'),
        };
        loading(onSpecifyUserSaved(body));
      },
    },
  ];

  const onClose = (): void => {
    console.log('close');
  };

  return (
    <Container.FullGray>
      <H2 className="text-2xl">{configurationText.specifySetUp()}</H2>
      {resources.map((resource, index) => (
        <ResourceView
          dialog={false}
          isDependent={false}
          isSubForm={false}
          key={index}
          resource={resource.resource as SpecifyResource<Collection>}
          viewName={resource.viewName}
          onAdd={undefined}
          onClose={() => onClose()}
          onDeleted={undefined}
          onSaved={f.never}
          onSaving={(unsetUnloadProtect): false => {
            unsetUnloadProtect();
            resource.onClick(resource.resource);
            return false;
          }}
        />
      ))}
    </Container.FullGray>
  );
}
