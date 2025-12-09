import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { ajax } from '../../utils/ajax';
import { type RA, localized } from '../../utils/types';
import { toLowerCase } from '../../utils/utils';
import { Container, H2, H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { serializeResource } from '../DataModel/serializers';
import { tables } from '../DataModel/tables';
import type { Collection, Discipline, Division } from '../DataModel/types';
import { collection, discipline, division } from '../FormParse/webOnlyViews';
import { ResourceView } from '../Forms/ResourceView';
import { load } from '../InitialContext';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { getSystemInfo } from '../InitialContext/systemInfo';
import { Form } from '../Atoms/Form';
import { resources } from '../SetupTool/setupResources';
import { headerText } from '../../localization/header';
import { Link } from '../Atoms/Link';
import {
  renderFormFieldFactory,
  ResourceFormData,
  stepOrder,
} from '../SetupTool/index';
import { useId } from '../../hooks/useId';
import { LocalizedString } from 'typesafe-i18n';

export function SystemConfigurationTool(): JSX.Element | null {
  const [allInfo, setAllInfo] = React.useState<InstitutionData | null>(null);

  const [newResourceOpen, handleNewResource, closeNewResource] =
    useBooleanState();

  const [newResource, setNewResource] = React.useState<
    | SpecifyResource<Collection>
    | SpecifyResource<Discipline>
    | SpecifyResource<Division>
    | undefined
  >();

  const institutionData = getSystemInfo();
  const isGeographyGlobal = institutionData.geography_is_global;

  const [addDisciplineGeoTree, setAddDisciplineGeoTree] =
    useBooleanState(false);

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

  const [temporaryFormData, setTemporaryFormData] =
    React.useState<ResourceFormData>({});

  const [formData, setFormData] = React.useState<ResourceFormData>(
    Object.fromEntries(stepOrder.map((key) => [key, {}]))
  );

  const formRef = React.useRef<HTMLFormElement | null>(null);

  const handleChange = (
    name: string,
    newValue: LocalizedString | boolean
  ): void => {
    setFormData((previous) => {
      const resourceName = resources[6].resourceName;
      return {
        ...previous,
        [resourceName]: {
          ...previous[resourceName],
          [name]: newValue,
        },
      };
    });
  };

  const { renderFormFields } = renderFormFieldFactory({
    formData,
    currentStep: 6,
    handleChange,
    temporaryFormData,
    setTemporaryFormData,
    formRef,
  });

  const id = useId('config-tool');

  const renderHierarchy = (
    institution: InstitutionData | null
  ): JSX.Element => {
    if (!institution) return <LoadingScreen />;

    return (
      <Ul className="m-4">
        <li>
          <div className="flex">
            <H2>{`Institution: ${institution.name}`}</H2>
            <Button.Icon
              icon="plus"
              title="Add new division to institution"
              onClick={() => {
                console.log(
                  `'Add new division to institution' ${institution.id}`
                );
                setNewResource(new tables.Division.Resource());
                handleNewResource();
              }}
            />
          </div>
          <Ul className="m-6">
            {institution.children.map((division) => (
              <li key={division.id}>
                <div className="flex">
                  <H3>{`Division: ${division.name}`}</H3>
                  <Button.Icon
                    icon="plus"
                    title="Add new discipline to institution"
                    onClick={() => {
                      console.log(
                        `'Add new discipline to division' ${division.id}`
                      );
                      setNewResource(
                        new tables.Discipline.Resource({
                          division: `/api/specify/discipline/${division.id}/`,
                        })
                      );
                      handleNewResource();
                    }}
                  />
                </div>
                {division.children.length > 0 && (
                  <Ul className="m-6">
                    {division.children.map((discipline) => (
                      <li key={discipline.id}>
                        <div className="flex">
                          <h4>{`Discipline: ${discipline.name}`}</h4>
                          {/* Verify isgeoglobal set correctly than chnage the !  */}
                          {isGeographyGlobal &&
                          typeof discipline.geographytreedef === 'number' ? (
                            <Button.Icon
                              icon="plus"
                              title="Add new collection to discipline"
                              onClick={() => {
                                console.log(
                                  `'Add new collection to discipline' ${discipline.id}`
                                );
                                setNewResource(
                                  new tables.Collection.Resource({
                                    discipline: `/api/specify/discipline/${discipline.id}/`,
                                  })
                                );
                                handleNewResource();
                              }}
                            />
                          ) : (
                            <Button.Icon
                              icon="globe"
                              title="Add new geography to discipline"
                              onClick={() => {
                                console.log(
                                  `'Add new geography to discipline' ${discipline.id}`
                                );
                                setAddDisciplineGeoTree();
                                // setNewResource(
                                //   new tables.Collection.Resource({
                                //     discipline: `/api/specify/discipline/${discipline.id}/`,
                                //   })
                                // );
                                // handleNewResource();
                              }}
                            />
                          )}
                          {addDisciplineGeoTree && (
                            <Dialog
                              buttons={commonText.cancel()}
                              header={localized('Add new Resource')}
                              onClose={closeNewResource}
                            >
                              {' '}
                              <Form
                                className="flex-1 overflow-auto gap-2"
                                // forwardRef={formRef}
                                id={id('form')}
                                // key={currentStep}
                                onSubmit={() => console.log()}
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <H3 className="text-xl font-semibold mb-4">
                                    {resources[6].label}
                                  </H3>
                                  {resources[6].documentationUrl !==
                                    undefined && (
                                    <Link.NewTab
                                      href={resources[6].documentationUrl!}
                                    >
                                      {headerText.documentation()}
                                    </Link.NewTab>
                                  )}
                                </div>
                                {resources[6].description ===
                                undefined ? undefined : (
                                  <p className="text-md mb-4">
                                    {resources[6].description}
                                  </p>
                                )}
                                {renderFormFields(resources[6].fields)}
                              </Form>
                            </Dialog>
                          )}
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
    <Container.FullGray className="sm:h-auto">
      <H2 className="text-2xl">{userText.systemConfigurationTool()}</H2>
      <div className="flex h-0 flex-1 flex-col gap-4 md:flex-row">
        {allInfo === undefined || allInfo === null ? (
          <LoadingScreen />
        ) : (
          renderHierarchy(allInfo)
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

type InstitutionData = {
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
      readonly geographytreedef: number | null;
      readonly taxontreedef: number | null;
    }>;
  }>;
};

let institutionData: InstitutionData;

export const fetchAllSystemData = load<InstitutionData>(
  '/context/all_system_data.json',
  'application/json'
).then((data: InstitutionData) => {
  institutionData = data;
  return data;
});

export const getAllInfo = (): InstitutionData => institutionData;
