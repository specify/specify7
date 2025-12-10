import React from 'react';

import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { InstitutionData } from './Utils';
import { H2, H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { tables } from '../DataModel/tables';
import { ResourceLink } from '../Molecules/ResourceLink';
import { Link } from '../Atoms/Link';
import { commonText } from '../../localization/common';
import { setupToolText } from '../../localization/setupTool';
import { Form } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { resources } from '../SetupTool/setupResources';
import { CollapsibleSection } from './CollapsibleSection';
import { useId } from '../../hooks/useId';
import {
  renderFormFieldFactory,
  ResourceFormData,
  stepOrder,
} from '../SetupTool';
import { LocalizedString } from 'typesafe-i18n';
import { useBooleanState } from '../../hooks/useBooleanState';
import { getSystemInfo } from '../InitialContext/systemInfo';

export const Hierarchy = ({
  institution,
  setNewResource,
  handleNewResource,
}: {
  institution: InstitutionData | null;
  setNewResource: (resource: any) => void;
  handleNewResource: () => void;
}): JSX.Element => {
  const institutionData = getSystemInfo();

  if (!institution) return <LoadingScreen />;

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

  return (
    <Ul className="m-4">
      <li key={institution.id}>
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

                      <ResourceLink
                        component={Link.Icon}
                        props={{ icon: 'pencil', title: commonText.edit() }}
                        resource={
                          new tables.Division.Resource({
                            id: division.id,
                          })
                        }
                        resourceView={{
                          onDeleted: undefined,
                          onSaved() {
                            globalThis.location.reload();
                          },
                        }}
                      />

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

                                  <ResourceLink
                                    component={Link.Icon}
                                    props={{
                                      icon: 'pencil',
                                      title: commonText.edit(),
                                    }}
                                    resource={
                                      new tables.Discipline.Resource({
                                        id: discipline.id,
                                      })
                                    }
                                    resourceView={{
                                      onDeleted: undefined,
                                      onSaved() {
                                        globalThis.location.reload();
                                      },
                                    }}
                                  />

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
                                      <div
                                        className="flex items-center"
                                        key={collection.id}
                                      >
                                        <li
                                          className="m-4 list-disc"
                                          key={collection.id}
                                        >
                                          <p>{collection.name}</p>
                                        </li>
                                        <ResourceLink
                                          component={Link.Icon}
                                          props={{
                                            icon: 'pencil',
                                            title: commonText.edit(),
                                          }}
                                          resource={
                                            new tables.Collection.Resource({
                                              id: collection.id,
                                            })
                                          }
                                          resourceView={{
                                            onDeleted: undefined,
                                            onSaved() {
                                              globalThis.location.reload();
                                            },
                                          }}
                                        />
                                      </div>
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
                                      onClick={handleCloseAddDisciplineGeoTree}
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
