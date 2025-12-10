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
import { SpecifyResource } from '../DataModel/legacyTypes';
import { RA } from '../../utils/types';

type DialogFormProps = {
  open: boolean;
  onClose: () => void;
  resourceIndex: number;
  title: LocalizedString;
  step: number;
};

const DialogForm = ({ open, onClose, title, step }: DialogFormProps) => {
  const id = useId('config-tool');

  if (!open) return null;

  const formRef = React.useRef<HTMLFormElement | null>(null);

  const [formData, setFormData] = React.useState<ResourceFormData>(
    Object.fromEntries(stepOrder.map((key) => [key, {}]))
  );

  const [temporaryFormData, setTemporaryFormData] =
    React.useState<ResourceFormData>({});

  const handleChange = (name: string, newValue: LocalizedString | boolean) => {
    const resourceName = resources[5].resourceName;
    setFormData((prev) => ({
      ...prev,
      [resourceName]: {
        ...prev[resourceName],
        [name]: newValue,
      },
    }));
  };

  const { renderFormFields } = renderFormFieldFactory({
    formData,
    currentStep: 5,
    handleChange,
    temporaryFormData,
    setTemporaryFormData,
    formRef,
  });

  return (
    <Dialog
      buttons={
        <>
          <Submit.Save form={id('form')}>{commonText.create()}</Submit.Save>
          <span className="-ml-2 flex-1" />
          <Button.Danger onClick={onClose}>{commonText.cancel()}</Button.Danger>
        </>
      }
      header={title}
      onClose={onClose}
    >
      <Form
        className="flex-1 overflow-auto gap-2"
        id={id('form')}
        onSubmit={() => {}}
      >
        {renderFormFields(resources[step].fields)}
      </Form>
    </Dialog>
  );
};

const handleEditResource = (resource: SpecifyResource<any>) => (
  <ResourceLink
    component={Link.Icon}
    props={{ icon: 'pencil', title: commonText.edit() }}
    resource={resource}
    resourceView={{
      onDeleted: undefined,
      onSaved: () => globalThis.location.reload(),
    }}
  />
);

export const Hierarchy = ({
  institution,
  setNewResource,
  handleNewResource,
}: {
  institution: InstitutionData | null;
  setNewResource: (resource: any) => void;
  handleNewResource: () => void;
}): JSX.Element => {
  if (!institution) return <LoadingScreen />;

  const systemInfo = getSystemInfo();

  const isGeographyGlobal = systemInfo.geography_is_global;

  const [
    addDisciplineGeoTree,
    openAddDisciplineGeoTree,
    closeAddDisciplineGeoTree,
  ] = useBooleanState(false);
  const [
    addDisciplineTaxonTree,
    openAddDisciplineTaxonTree,
    closeAddDisciplineTaxonTree,
  ] = useBooleanState(false);

  const renderCollections = (
    collections: RA<{
      readonly id: number;
      readonly name: string;
    }>
  ) => (
    <CollapsibleSection
      title={<p>Collections</p>}
      defaultOpen={false}
      hasChildren={collections.length > 0}
    >
      <Ul className="m-4">
        {collections.map((collection) => (
          <div className="flex items-center" key={collection.id}>
            <li className="m-4 list-disc">
              <p>{collection.name}</p>
            </li>
            {handleEditResource(
              new tables.Collection.Resource({ id: collection.id })
            )}
          </div>
        ))}
      </Ul>
    </CollapsibleSection>
  );

  const renderDisciplines = (division: any) =>
    division.children.map((discipline: any) => {
      const needsGeoTree =
        isGeographyGlobal && typeof discipline.geographytreedef !== 'number';
      const needsTaxonTree = typeof discipline.taxontreedef !== 'number';
      const canAddCollection = !needsGeoTree && !needsTaxonTree;

      return (
        <li key={discipline.id}>
          <CollapsibleSection
            hasChildren={discipline.children.length > 0}
            title={
              <div className="flex items-center">
                <H3>{`Discipline: ${discipline.name}`}</H3>

                {/* GEO TREE */}
                {needsGeoTree && (
                  <div className="flex items-center ml-2">
                    <Button.Icon
                      icon="globe"
                      title={setupToolText.configGeoTree()}
                      onClick={() => {
                        setNewResource(new tables.GeographyTreeDef.Resource());
                        openAddDisciplineGeoTree();
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
                        setNewResource(new tables.TaxonTreeDef.Resource());
                        openAddDisciplineTaxonTree();
                      }}
                    />
                    <p className="text-red-600 ml-2">
                      {setupToolText.treeConfigurationWarning()}
                    </p>
                  </div>
                )}

                {handleEditResource(
                  new tables.Discipline.Resource({ id: discipline.id })
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
            {/* COLLECTIONS */}
            {discipline.children.length > 0 &&
              renderCollections(discipline.children)}

            {/* TREE CONFIG DIALOGS */}
            {/* GEO */}
            <DialogForm
              open={addDisciplineGeoTree}
              onClose={closeAddDisciplineGeoTree}
              resourceIndex={5}
              title={setupToolText.addNewGeographyTree()}
              step={5}
            />

            {/* TAXON */}
            <DialogForm
              open={addDisciplineTaxonTree}
              onClose={closeAddDisciplineTaxonTree}
              resourceIndex={6}
              title={setupToolText.addNewTaxonTree()}
              step={6}
            />
          </CollapsibleSection>
        </li>
      );
    });

  const renderDivisions = (institution: InstitutionData) =>
    institution.children.map((division: any) => (
      <li key={division.id} className="pb-2">
        <CollapsibleSection
          title={
            <div className="flex items-center">
              <H3>{`Division: ${division.name}`}</H3>
              {handleEditResource(
                new tables.Division.Resource({ id: division.id })
              )}
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
          <Ul className="m-5">{renderDisciplines(division)}</Ul>
        </CollapsibleSection>
      </li>
    ));

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
          <Ul className="m-5">{renderDivisions(institution)}</Ul>
        </CollapsibleSection>
      </li>
    </Ul>
  );
};
