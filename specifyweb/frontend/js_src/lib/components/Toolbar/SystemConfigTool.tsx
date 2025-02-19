import React from 'react';

import { userText } from '../../localization/user';
import { Container, H2, H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { load } from '../InitialContext';
import { LoadingScreen } from '../Molecules/Dialog';

export function SystemConfigurationTool(): JSX.Element | null {
  const [allInfo, setAllInfo] = React.useState<InstitutionData | null>(null);

  React.useEffect(() => {
    fetchAllSystemData.then(setAllInfo);
  }, []);

  const renderHierarchy = (data: InstitutionData | null): JSX.Element => {
    if (!data) return <LoadingScreen />;
  
    return (
      <Ul className="m-4">
        <li>
          <div className='flex'>
          <H2>{`Institution: ${data.institution.name}`}</H2>
          <Button.Icon
                  icon="plus"
                  title="Add new division to institution"
                  onClick={() => console.log(`'Add new division to institution' ${data.institution.id}`)}
                />
                </div>
            <Ul className="m-6">
              {data.institution.children.map((division) => (
                <li key={division.id}>
                  <div className='flex'>
                  <H3>{`Division: ${division.name}`}</H3>
                  <Button.Icon
                  icon="plus"
                  title="Add new discipline to institution"
                  onClick={() => console.log(`'Add new discipline to division' ${division.id}`)}
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
                            onClick={() => console.log(`'Add new collection to discipline' ${discipline.id}`)}/>
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
      {allInfo === undefined || allInfo === null ? undefined : renderHierarchy(allInfo)}
      </div>
    </Container.FullGray>
  );
}

type InstitutionData = {
  readonly id: number;
  readonly name: string;
  readonly children: readonly {
    readonly id: number;
    readonly name: string;
    readonly children: readonly {
      readonly id: number;
      readonly name: string;
      readonly children: readonly {
        readonly id: number;
        readonly name: string;
      }[];
    }[];
  }[];
};

let institutionData: InstitutionData;

export const fetchAllSystemData = load<{ readonly institution: InstitutionData }>(
  '/context/all_system_data.json',
  'application/json'
).then((data: { readonly institution: InstitutionData }) => {
  institutionData = data.institution;
  return institutionData;
});

export const getAllInfo = ():InstitutionData => institutionData