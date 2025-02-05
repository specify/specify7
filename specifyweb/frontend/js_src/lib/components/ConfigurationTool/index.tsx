import React from 'react';

import { configurationText } from '../../localization/configurationText';
import { Container, H2 } from '../Atoms';
import { Form } from '../Atoms/Form';
import { tables } from '../DataModel/tables';
import { adminUser, collection, discipline, division, institution } from '../FormParse/webOnlyViews';
import { ResourceView } from '../Forms/ResourceView';
import { PickListComboBox } from '../PickLists';

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
/*
 * Need Accession Number Format after discipline ==> schema config show on the form the picklist for the default format from splocalcontaineritem or something like that. make similar for accession format the component catalogNumberFormatters line 163 in definitiion.ts
 */
 
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
           onClose={() => onClose()}
           onDeleted={undefined}
           onSaved={() => resource.onClick()}
         />
    ))}
         <Form onSubmit={() => console.log('submit')}>
          <H2>{configurationText.accessionNumberFormat()}</H2>
          <PickListComboBox pickListName={accessionNumberFormatters}/>
         </Form>
      </Container.FullGray>
 )
}