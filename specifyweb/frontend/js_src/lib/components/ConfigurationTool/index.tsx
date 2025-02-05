import React from 'react';

import { configurationText } from '../../localization/configurationText';
import { Container, H2 } from '../Atoms';
import { tables } from '../DataModel/tables';
import { adminUser, collection, discipline, division, institution } from '../FormParse/webOnlyViews';
import { ResourceView } from '../Forms/ResourceView';

export function ConfigurationTool(): JSX.Element {
 const resources = [
  { resource: new tables.Institution.Resource(), viewName: institution },
  { resource: new tables.Division.Resource(), viewName: division },
  { resource: new tables.Discipline.Resource(), viewName: discipline },
  { resource: new tables.Collection.Resource(), viewName: collection },
  { resource: new tables.SpecifyUser.Resource(), viewName: adminUser }
];
 return (
      <Container.FullGray>
        <H2 className="text-2xl">{configurationText.specifySetUp()}</H2>
        {resources.map((resource, index) => (
         <ResourceView
           dialog={false}
           isDependent={false}
           isSubForm={false}
           key={index}
           resource={resource.resource}
           viewName={resource.viewName}
           onAdd={undefined}
           onClose={() => console.log('close')}
           onDeleted={undefined}
           onSaved={() => console.log('save')}
         />
    ))}
      </Container.FullGray>
 )
}