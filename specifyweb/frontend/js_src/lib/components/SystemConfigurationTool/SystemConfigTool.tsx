import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { ajax } from '../../utils/ajax';
import { localized } from '../../utils/types';
import { toLowerCase } from '../../utils/utils';
import { Container, H2 } from '../Atoms';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { serializeResource } from '../DataModel/serializers';
import type {
  Collection,
  Discipline,
  Division,
  GeographyTreeDef,
  TaxonTreeDef,
} from '../DataModel/types';
import { collection, discipline, division } from '../FormParse/webOnlyViews';
import { ResourceView } from '../Forms/ResourceView';
import { load } from '../InitialContext';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { fetchAllSystemData, InstitutionData } from './Utils';
import { Hierarchy } from './Hierarchy';

export function SystemConfigurationTool(): JSX.Element | null {
  const [allInfo, setAllInfo] = React.useState<InstitutionData | null>(null);

  const [newResourceOpen, handleNewResource, closeNewResource] =
    useBooleanState();

  const [newResource, setNewResource] = React.useState<
    | SpecifyResource<Collection>
    | SpecifyResource<Discipline>
    | SpecifyResource<Division>
    | SpecifyResource<GeographyTreeDef>
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

  const handleSaved = () => {
    if (!newResource) return;

    const data = serializeResource(newResource as SpecifyResource<Collection>);

    ajax<{}>(
      `/setup_tool/${toLowerCase(newResource.specifyTable.name)}/create/`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: data,
      }
    )
      .then(refreshAllInfo)
      .then(closeNewResource);
  };

  return (
    <Container.FullGray className="sm:h-auto overflow-scroll">
      <H2 className="text-2xl">{userText.systemConfigurationTool()}</H2>
      <div className="flex h-0 flex-1 flex-col gap-4 md:flex-row">
        {allInfo === undefined || allInfo === null ? (
          <LoadingScreen />
        ) : (
          <Hierarchy
            setNewResource={setNewResource}
            handleNewResource={handleNewResource}
            institution={allInfo}
            refreshAllInfo={refreshAllInfo}
          />
        )}
      </div>
      {newResourceOpen ? (
        <Dialog
          buttons={commonText.cancel()}
          header={localized('Add new Resource')}
          onClose={closeNewResource}
        >
          <ResourceView
            dialog="modal"
            isDependent={false}
            isSubForm={false}
            resource={newResource as SpecifyResource<Collection>}
            viewName={
              newResource?.specifyTable.name === 'Collection'
                ? collection
                : newResource?.specifyTable.name === 'Discipline'
                  ? discipline
                  : newResource?.specifyTable.name === 'Division'
                    ? division
                    : undefined
            }
            onAdd={undefined}
            onClose={closeNewResource}
            onDeleted={undefined}
            onSaved={handleSaved}
          />
        </Dialog>
      ) : undefined}
    </Container.FullGray>
  );
}
