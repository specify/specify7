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
import { getSystemInfo } from '../InitialContext/systemInfo';
import { Form } from '../Atoms/Form';
import { resources } from '../SetupTool/setupResources';
import {
  renderFormFieldFactory,
  ResourceFormData,
  stepOrder,
} from '../SetupTool/index';
import { useId } from '../../hooks/useId';
import { LocalizedString } from 'typesafe-i18n';
import { Submit } from '../Atoms/Submit';
import { setupToolText } from '../../localization/setupTool';

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

  const institutionData = getSystemInfo();
  const isGeographyGlobal = institutionData.geography_is_global;

  const [
    addDisciplineGeoTree,
    handleOpenAddDisciplineGeoTree,
    handleCloseAddDisciplineGeoTree,
  ] = useBooleanState(false);

  const [
    addDisciplineTaxonTree,
    handleOpenAddDisciplineTaxonTree,
    handleCloseAddDisciplineTaxonTree,
  ] = useBooleanState(false);

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
      const resourceName = resources[5].resourceName;
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
    currentStep: 5,
    handleChange,
    temporaryFormData,
    setTemporaryFormData,
    formRef,
  });

  const id = useId('config-tool');

  const CollapsibleSection = ({
    title,
    children,
    defaultOpen = true,
    hasChildren,
  }: {
    title: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    hasChildren: boolean;
  }) => {
    const [isOpen, _, __, handleOpen] = useBooleanState(defaultOpen);

    return (
      <div className="my-2">
        <div className="flex items-center">
          <Button.Icon
            icon={isOpen ? 'chevronDown' : 'chevronUp'}
            title={'collapse'}
            className={`ml-2 ${hasChildren ? '' : 'invisible'}`}
            onClick={handleOpen}
          />
          {title}
        </div>

        {isOpen && <div className="ml-6 mt-2">{children}</div>}
      </div>
    );
  };

  const renderHierarchy = (
    institution: InstitutionData | null
  ): JSX.Element => {
    if (!institution) return <LoadingScreen />;

    return (
      <Ul className="m-4">
        <li>
          <CollapsibleSection
            title={
              <div className="flex items-center">
                <H2>{`Institution: ${institution.name}`}</H2>

                <Button.Icon
                  icon="plus"
                  title="Add new division to institution"
                  className="ml-2"
                  onClick={() => {
                    setNewResource(new tables.Division.Resource());
                    handleNewResource();
                  }}
                />
              </div>
            }
            hasChildren={institution.children.length > 0}
          >
            {/* ---------------- DIVISIONS ---------------- */}
            <Ul className="m-5">
              {institution.children.map((division) => (
                <li key={division.id} className="pb-2">
                  <CollapsibleSection
                    title={
                      <div className="flex items-center">
                        <H3>{`Division: ${division.name}`}</H3>

                        <Button.Icon
                          icon="plus"
                          title="Add new discipline to division"
                          className="ml-2"
                          onClick={() => {
                            setNewResource(
                              new tables.Discipline.Resource({
                                division: `/api/specify/division/${division.id}/`,
                              })
                            );
                            handleNewResource();
                          }}
                        />
                      </div>
                    }
                    hasChildren={division.children.length > 0}
                  >
                    {/* ---------------- DISCIPLINES ---------------- */}
                    {division.children.length > 0 && (
                      <Ul className="m-5">
                        {division.children.map((discipline) => {
                          const needsGeoTree =
                            isGeographyGlobal &&
                            typeof discipline.geographytreedef !== 'number';

                          const needsTaxonTree =
                            typeof discipline.taxontreedef !== 'number';

                          const canAddCollection =
                            !needsGeoTree && !needsTaxonTree;

                          return (
                            <li key={discipline.id}>
                              <CollapsibleSection
                                hasChildren={discipline.children.length > 0}
                                title={
                                  <div className="flex items-center">
                                    <h4>{`Discipline: ${discipline.name}`}</h4>

                                    {/* GEO TREE */}
                                    {needsGeoTree && (
                                      <div className="flex items-center ml-2">
                                        <Button.Icon
                                          icon="globe"
                                          title={setupToolText.configGeoTree()}
                                          onClick={() => {
                                            setNewResource(
                                              new tables.GeographyTreeDef.Resource()
                                            );
                                            handleOpenAddDisciplineGeoTree();
                                          }}
                                        />
                                        <p className="text-red-600 ml-2">
                                          {setupToolText.treeConfigurationWarning()}
                                        </p>
                                      </div>
                                    )}

                                    {/* TAXON TREE */}
                                    {needsTaxonTree && (
                                      <div className="flex items-center ml-2">
                                        <Button.Icon
                                          icon="tree"
                                          title={setupToolText.configTaxonTree()}
                                          onClick={() => {
                                            setNewResource(
                                              new tables.TaxonTreeDef.Resource()
                                            );
                                            handleOpenAddDisciplineTaxonTree();
                                          }}
                                        />
                                        <p className="text-red-600 ml-2">
                                          {setupToolText.treeConfigurationWarning()}
                                        </p>
                                      </div>
                                    )}

                                    {/* ADD COLLECTION */}
                                    {canAddCollection && (
                                      <Button.Icon
                                        icon="plus"
                                        title="Add new collection"
                                        className="ml-2"
                                        onClick={() => {
                                          setNewResource(
                                            new tables.Collection.Resource({
                                              discipline: `/api/specify/discipline/${discipline.id}/`,
                                            })
                                          );
                                          handleNewResource();
                                        }}
                                      />
                                    )}
                                  </div>
                                }
                              >
                                {/* ---------------- COLLECTIONS ---------------- */}
                                {discipline.children.length > 0 && (
                                  <CollapsibleSection
                                    title={<p>Collections</p>}
                                    defaultOpen={false}
                                    hasChildren={discipline.children.length > 0}
                                  >
                                    <Ul className="m-4">
                                      {discipline.children.map((collection) => (
                                        <li
                                          className="m-4 list-disc"
                                          key={collection.id}
                                        >
                                          <p>{collection.name}</p>
                                        </li>
                                      ))}
                                    </Ul>
                                  </CollapsibleSection>
                                )}
                              </CollapsibleSection>

                              {/* GEO TREE DIALOG */}
                              {addDisciplineGeoTree && (
                                <Dialog
                                  buttons={
                                    <>
                                      <Submit.Save form={id('form')}>
                                        {commonText.create()}
                                      </Submit.Save>
                                      <span className="-ml-2 flex-1" />
                                      <Button.Danger
                                        onClick={
                                          handleCloseAddDisciplineGeoTree
                                        }
                                      >
                                        {commonText.cancel()}
                                      </Button.Danger>
                                    </>
                                  }
                                  header={localized('Add new Geography Tree')}
                                  onClose={handleCloseAddDisciplineGeoTree}
                                >
                                  <Form
                                    className="flex-1 overflow-auto gap-2"
                                    id={id('form')}
                                    onSubmit={handleSaved}
                                  >
                                    <div className="flex items-center justify-between mb-4">
                                      <H3 className="text-xl font-semibold mb-4">
                                        {resources[5].label}
                                      </H3>
                                    </div>
                                    {renderFormFields(resources[5].fields)}
                                  </Form>
                                </Dialog>
                              )}

                              {/* TAXON TREE DIALOG */}
                              {addDisciplineTaxonTree && (
                                <Dialog
                                  buttons={
                                    <>
                                      <Submit.Save form={id('form')}>
                                        {commonText.create()}
                                      </Submit.Save>
                                      <span className="-ml-2 flex-1" />
                                      <Button.Danger
                                        onClick={
                                          handleCloseAddDisciplineTaxonTree
                                        }
                                      >
                                        {commonText.cancel()}
                                      </Button.Danger>
                                    </>
                                  }
                                  header={localized('Add new Taxon Tree')}
                                  onClose={handleCloseAddDisciplineTaxonTree}
                                >
                                  <Form
                                    className="flex-1 overflow-auto gap-2"
                                    id={id('form')}
                                    onSubmit={handleSaved}
                                  >
                                    <div className="flex items-center justify-between mb-4">
                                      <H3 className="text-xl font-semibold mb-4">
                                        {resources[6].label}
                                      </H3>
                                    </div>
                                    {renderFormFields(resources[6].fields)}
                                  </Form>
                                </Dialog>
                              )}
                            </li>
                          );
                        })}
                      </Ul>
                    )}
                  </CollapsibleSection>
                </li>
              ))}
            </Ul>
          </CollapsibleSection>
        </li>
      </Ul>
    );
  };

  return (
    <Container.FullGray className="sm:h-auto overflow-scroll">
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
