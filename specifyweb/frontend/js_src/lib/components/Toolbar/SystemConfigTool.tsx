import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { userText } from '../../localization/user';
import type { RA } from '../../utils/types';
import { Container, H2, H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { tables } from '../DataModel/tables';
import type { Collection } from '../DataModel/types';
import { collection } from '../FormParse/webOnlyViews';
import { ResourceView } from '../Forms/ResourceView';
import { load } from '../InitialContext';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';

export function SystemConfigurationTool(): JSX.Element | null {
  const [allInfo, setAllInfo] = React.useState<InstitutionData | null>(null);

  const [newResourceOpen, handleNewResource, closeNewResource] = useBooleanState()

  const [parentId, setParentId] = React.useState<number | undefined>()

  const [newResource, setNewResource] = React.useState<SpecifyResource<Collection> | undefined>()

  React.useEffect(() => {
    fetchAllSystemData.then(setAllInfo).catch(() => console.warn('Error when fetching institution info'));
  }, []);

  const renderHierarchy = (institution: InstitutionData | null): JSX.Element => {
    if (!institution) return <LoadingScreen />;
  
    return (
      <Ul className="m-4">
        <li>
          <div className='flex'>
          <H2>{`Institution: ${institution.name}`}</H2>
          <Button.Icon
                  icon="plus"
                  title="Add new division to institution"
                  onClick={() => {
                    console.log(`'Add new division to institution' ${institution.id}`)
                    setParentId(institution.id)
                    setNewResource(new tables.Division.Resource())
                    handleNewResource()
                  }}
                />
                </div>
            <Ul className="m-6">
              {institution.children.map((division) => (
                <li key={division.id}>
                  <div className='flex'>
                  <H3>{`Division: ${division.name}`}</H3>
                  <Button.Icon
                  icon="plus"
                  title="Add new discipline to institution"
                  onClick={() => {
                    console.log(`'Add new discipline to division' ${division.id}`)
                    setParentId(division.id)
                    setNewResource(new tables.Discipline.Resource())
                    handleNewResource()
                  }}
                />
                </div>
                  {division.children.length > 0 && (
                    <Ul className="m-6">
                      {division.children.map((discipline) => (
                        <li key={discipline.id}>
                          <div className='flex'>
                          <h4>{`Discipline: ${discipline.name}`}</h4>
                          <Button.Icon
                            icon="plus"
                            title="Add new collection to discipline"
                            onClick={() =>{
                              console.log(`'Add new collection to discipline' ${discipline.id}`)
                              setParentId(discipline.id)
                              setNewResource(new tables.Collection.Resource())
                              handleNewResource()
                              }}/>
                          </div>
                          {discipline.children.length > 0 && (
                            <Ul className="m-6">
                              {discipline.children.map((collection) => (
                                <li className="m-4 list-disc" key={collection.id}>
                                  <p>{collection.name}</p>
                                </li>
                              ))}
                            </Ul>
                          )}
                        </li>
                      ))}
                    </Ul>
                  )}
                  
                </li>
              ))}
            </Ul>
        </li>
      </Ul>
    );
  };

  return (
    <Container.FullGray>
      <H2 className="text-2xl">{userText.systemConfigurationTool()}</H2>
      <div className="flex h-0 flex-1 flex-col gap-4 md:flex-row">
      {allInfo === undefined || allInfo === null ? <LoadingScreen /> : renderHierarchy(allInfo)}
      </div>
      {newResourceOpen ?     
        <Dialog header="Add new Resource" onClose={closeNewResource}>
          <ResourceView
                dialog="modal"
                isDependent={false}
                isSubForm={false}
                resource={newResource}
                viewName={collection}
                onAdd={undefined}
                onClose={closeNewResource}
                onDeleted={undefined}
                onSaved={() => console.log('Click')}
              />
          </Dialog> 
        : undefined}
    </Container.FullGray>
  );
}

type InstitutionData = {
  /*
   * Readonly 'institution': {
   *   // Institution
   */
  readonly id: number;
  readonly name: string;
  readonly children: RA<{
    // Division
    readonly id: number;
    readonly name: string;
    readonly children: RA<{
      // Discipline
      readonly id: number;
      readonly name: string;
      readonly children: RA<{
        // Collection
        readonly id: number;
        readonly name: string;
      }>;
    }>;
  }>;}
// };

let institutionData: InstitutionData;

export const fetchAllSystemData = load<InstitutionData>(
  '/context/all_system_data.json',
  'application/json'
).then((data: InstitutionData) => {
  institutionData = data;
  return data;
});

export const getAllInfo = ():InstitutionData => institutionData