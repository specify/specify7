import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { setupToolText } from '../../localization/setupTool';
import type { RA } from '../../utils/types';
import { H2, H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { tables } from '../DataModel/tables';
import { getSystemInfo } from '../InitialContext/systemInfo';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { ResourceLink } from '../Molecules/ResourceLink';
import type {
  ResourceFormData} from '../SetupTool';
import {
  renderFormFieldFactory,
  stepOrder,
} from '../SetupTool';
import { resources } from '../SetupTool/setupResources';
import { CollapsibleSection } from './CollapsibleSection';
import type { InstitutionData } from './Utils';

type DialogFormProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly resourceIndex: number;
  readonly title: LocalizedString;
  readonly step: number;
};

function DialogForm({ open, onClose, title, step }: DialogFormProps) {
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
    setFormData((previous) => ({
      ...previous,
      [resourceName]: {
        ...previous[resourceName],
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
}

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

const addButton = (
  createResource: () => void,
  tableName: string
): JSX.Element => (
  <Button.Icon
    className="ml-2"
    icon="plus"
    title={`Add new ${tableName}`}
    onClick={() => {
      createResource();
    }}
  />
);

export function Hierarchy({
  institution,
  setNewResource,
  handleNewResource,
}: {
  readonly institution: InstitutionData | null;
  readonly setNewResource: (resource: any) => void;
  readonly handleNewResource: () => void;
}): JSX.Element {
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
      defaultOpen={false}
      hasChildren={collections.length > 0}
      title={<p>Collections</p>}
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
                {canAddCollection &&
                  addButton(() => {
                    setNewResource(
                      new tables.Collection.Resource({
                        discipline: `/api/specify/discipline/${division.id}/`,
                      })
                    );
                    handleNewResource();
                  }, 'collection')}
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
              resourceIndex={5}
              step={5}
              title={setupToolText.addNewGeographyTree()}
              onClose={closeAddDisciplineGeoTree}
            />

            {/* TAXON */}
            <DialogForm
              open={addDisciplineTaxonTree}
              resourceIndex={6}
              step={6}
              title={setupToolText.addNewTaxonTree()}
              onClose={closeAddDisciplineTaxonTree}
            />
          </CollapsibleSection>
        </li>
      );
    });

  const renderDivisions = (institution: InstitutionData) =>
    institution.children.map((division: any) => (
      <li className="pb-2" key={division.id}>
        <CollapsibleSection
          hasChildren={division.children.length > 0}
          title={
            <div className="flex items-center">
              <H3>{`Division: ${division.name}`}</H3>

              {handleEditResource(
                new tables.Division.Resource({ id: division.id })
              )}

              {addButton(() => {
                setNewResource(
                  new tables.Discipline.Resource({
                    division: `/api/specify/discipline/${division.id}/`,
                  })
                );
                handleNewResource();
              }, 'Discipline')}
            </div>
          }
        >
          <Ul className="m-5">{renderDisciplines(division)}</Ul>
        </CollapsibleSection>
      </li>
    ));

  return (
    <Ul className="m-4">
      <li key={institution.id}>
        <CollapsibleSection
          hasChildren={institution.children.length > 0}
          title={
            <div className="flex items-center">
              <H2>{`Institution: ${institution.name}`}</H2>
              {addButton(() => {
                setNewResource(new tables.Division.Resource());
                handleNewResource();
              }, 'Division')}
            </div>
          }
        >
          <Ul className="m-5">{renderDivisions(institution)}</Ul>
        </CollapsibleSection>
      </li>
    </Ul>
  );
}
