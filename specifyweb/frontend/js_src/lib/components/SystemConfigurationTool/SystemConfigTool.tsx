import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { userText } from '../../localization/user';
import { Container, H2 } from '../Atoms';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type {
  Collection,
  Discipline,
  Division,
  GeographyTreeDef,
  Institution,
  TaxonTreeDef,
} from '../DataModel/types';
import { collection, discipline, division } from '../FormParse/webOnlyViews';
import { ResourceView } from '../Forms/ResourceView';
import { load } from '../InitialContext';
import { LoadingScreen } from '../Molecules/Dialog';
import { Hierarchy } from './Hierarchy';
import type { InstitutionData } from './Utils';
import { fetchAllSystemData } from './Utils';

export function SystemConfigurationTool(): JSX.Element | null {
  const [allInfo, setAllInfo] = React.useState<InstitutionData | null>(null);

  const [newResourceOpen, handleNewResource, closeNewResource] =
    useBooleanState();

  const [newResource, setNewResource] = React.useState<
    | SpecifyResource<Collection>
    | SpecifyResource<Discipline>
    | SpecifyResource<Division>
    | SpecifyResource<GeographyTreeDef>
    | SpecifyResource<Institution>
    | SpecifyResource<TaxonTreeDef>
    | undefined
  >();

  React.useEffect(() => {
    fetchAllSystemData
      .then(setAllInfo)
      .catch(() => console.warn('Error when fetching institution info'));
  }, []);

  const refreshAllInfo = async () =>
    load<InstitutionData>(
      '/context/all_system_data.json',
      'application/json'
    ).then(setAllInfo);

  const newResourceViewName =
    newResource?.isNew?.() === true
      ? newResource?.specifyTable.name === 'Collection'
        ? collection
        : newResource?.specifyTable.name === 'Discipline'
          ? discipline
          : newResource?.specifyTable.name === 'Division'
            ? division
            : undefined
      : undefined;

  return (
    <Container.FullGray className="sm:h-auto overflow-scroll">
      <H2 className="text-2xl">{userText.systemConfigurationTool()}</H2>
      <div className="flex h-0 flex-1 flex-col gap-4 md:flex-row">
        {allInfo === undefined || allInfo === null ? (
          <LoadingScreen />
        ) : (
          <Hierarchy
            handleNewResource={handleNewResource}
            institution={allInfo}
            refreshAllInfo={refreshAllInfo}
            setNewResource={setNewResource}
          />
        )}
      </div>
      {newResourceOpen ? (
        <ResourceView
          dialog="modal"
          isDependent={false}
          isSubForm={false}
          resource={newResource as SpecifyResource<Collection>}
          viewName={newResourceViewName}
          onAdd={undefined}
          onClose={closeNewResource}
          onDeleted={async () => {
            await refreshAllInfo();
            closeNewResource();
          }}
          onSaved={async () => {
            await refreshAllInfo();
            closeNewResource();
          }}
        />
      ) : undefined}
    </Container.FullGray>
  );
}
