import React from 'react';

import { userText } from '../../localization/user';
import { Container, H2 } from '../Atoms';
import { load } from '../InitialContext';

export function SystemConfigurationTool(): JSX.Element | null {
  const [allInfo, setAllInfo] = React.useState<InstitutionData | null>(null);

  React.useEffect(() => {
    fetchAllSystemData.then(setAllInfo);
  }, []);

  const renderHierarchy = (data: InstitutionData | null): JSX.Element => {
    if (!data) return <p>Loading...</p>;
  
    return (
      <ul className="ml-4 list-disc">
        <li>
          <strong>{data.institution.name}</strong>
            <ul className="ml-6 list-circle">
              {data.institution.children.map((division) => (
                <li key={division.id}>
                  <strong>{division.name}</strong>
                  {division.children.length > 0 && (
                    <ul className="ml-6 list-square">
                      {division.children.map((discipline) => (
                        <li key={discipline.id}>
                          {discipline.name}
                          {discipline.children.length > 0 && (
                            <ul className="ml-6 list-none">
                              {discipline.children.map((collection) => (
                                <li className="ml-4" key={collection.id}>
                                  - {collection.name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
        </li>
      </ul>
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