import React from 'react';

import { configurationText } from '../../localization/configurationText';
import { Container, H2 } from '../Atoms';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { tables } from '../DataModel/tables';
import type { Collection } from '../DataModel/types';
import { adminUser, collection, discipline, division, institution } from '../FormParse/webOnlyViews';
import { ResourceView } from '../Forms/ResourceView';

export function ConfigurationTool(): JSX.Element {
 const resources = [
  { resource: new tables.Institution.Resource(), viewName: institution, onClick: () => console.log('click') },
  { resource: new tables.Division.Resource(), viewName: division, onClick: () => console.log('click')  },
  { resource: new tables.Discipline.Resource(), viewName: discipline, onClick: () => console.log('click')  },
  { resource: new tables.Collection.Resource(), viewName: collection, onClick: () => console.log('click')  },
  { resource: new tables.SpecifyUser.Resource(), viewName: adminUser, onClick: () => console.log('click')  }
];
const onClose = ():void => {
console.log('close')
}

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
            onSaved={() => resource.onClick()}
          />
    ))}
      </Container.FullGray>
)
}