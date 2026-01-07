import type { HierarchyPointLink, HierarchyPointNode } from 'd3';
import { hierarchy as d3Hierarchy, tree as d3Tree } from 'd3';
import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { setupToolText } from '../../localization/setupTool';
import { type RA } from '../../utils/types';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { tables } from '../DataModel/tables';
import { getSystemInfo } from '../InitialContext/systemInfo';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { ResourceLink } from '../Molecules/ResourceLink';
import { tableLabel } from '../Preferences/UserDefinitions';
import { stepOrder } from '../SetupTool';
import { renderFormFieldFactory } from '../SetupTool/SetupForm';
import { resources } from '../SetupTool/setupResources';
import type { ResourceFormData } from '../SetupTool/types';
import { CollapsibleSection } from './CollapsibleSection';
import type { InstitutionData } from './Utils';

type HierarchyNodeKind =
  | 'collection'
  | 'discipline'
  | 'division'
  | 'institution';

type HierarchyNodeDatum = {
  readonly id: number;
  readonly name: string;
  readonly kind: HierarchyNodeKind;
  readonly children?: RA<HierarchyNodeDatum>;
};

type HierarchyDiagramProps = {
  readonly institution: InstitutionData;
  readonly onSelect: (node: HierarchyNodeDatum) => void;
  readonly orientation: 'horizontal' | 'vertical';
  readonly onToggleOrientation: () => void;
};

const NODE_WIDTH = 300;
const NODE_HEIGHT = 64;
const NODE_HORIZONTAL_GAP = 24;
const NODE_VERTICAL_GAP = 10;
const CHART_MARGIN = { top: 12, right: 16, bottom: 12, left: 16 } as const;

const colorByKind: Record<HierarchyNodeKind, string> = {
  institution: '#c3452d',
  division: '#66b642',
  discipline: '#4f98d6',
  collection: '#f1a43c',
};

const textByKind: Record<HierarchyNodeKind, string> = {
  institution: tableLabel('Institution'),
  division: tableLabel('Division'),
  discipline: tableLabel('Discipline'),
  collection: tableLabel('Collection'),
};

const toHierarchyDatum = (
  institution: InstitutionData
): HierarchyNodeDatum => ({
  id: institution.id,
  name: institution.name,
  kind: 'institution',
  children: institution.children.map((division) => ({
    id: division.id,
    name: division.name,
    kind: 'division',
    children: division.children.map((discipline) => ({
      id: discipline.id,
      name: discipline.name,
      kind: 'discipline',
      children: discipline.children.map((collection) => ({
        id: collection.id,
        name: collection.name,
        kind: 'collection',
      })),
    })),
  })),
});

function HierarchyDiagram({
  institution,
  onSelect,
  orientation,
  onToggleOrientation,
}: HierarchyDiagramProps) {
  const isVertical = orientation === 'vertical';

  const layout = React.useMemo(() => {
    const root = d3Hierarchy<HierarchyNodeDatum>(toHierarchyDatum(institution));
    return d3Tree<HierarchyNodeDatum>()
      .nodeSize(
        isVertical
          ? [NODE_HEIGHT + NODE_VERTICAL_GAP, NODE_WIDTH + NODE_HORIZONTAL_GAP]
          : [NODE_WIDTH + NODE_HORIZONTAL_GAP, NODE_HEIGHT + NODE_VERTICAL_GAP]
      )
      .separation(() => 1)(root);
  }, [institution, isVertical]);

  const nodes = layout.descendants();
  const links = layout.links();

  const getX = (node: HierarchyPointNode<HierarchyNodeDatum>) =>
    isVertical ? node.y : node.x;
  const getY = (node: HierarchyPointNode<HierarchyNodeDatum>) =>
    isVertical ? node.x : node.y;

  const minX = Math.min(...nodes.map((node) => getX(node)));
  const maxX = Math.max(...nodes.map((node) => getX(node)));
  const minY = Math.min(...nodes.map((node) => getY(node)));
  const maxY = Math.max(...nodes.map((node) => getY(node)));

  const width =
    maxX - minX + NODE_WIDTH + CHART_MARGIN.left + CHART_MARGIN.right;
  const height =
    maxY - minY + NODE_HEIGHT + CHART_MARGIN.top + CHART_MARGIN.bottom;

  const xOffset = CHART_MARGIN.left - minX;
  const yOffset = CHART_MARGIN.top - minY;

  const handleKeyDown = (
    event: React.KeyboardEvent<SVGGElement>,
    node: HierarchyNodeDatum
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(node);
    }
  };

  return (
    <div className="bg-[color:var(--background)] p-3 rounded h-full min-h-0 flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <H3 className="text-lg font-semibold">
          {setupToolText.hierarchyStructureTitle()}
        </H3>
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-300">
            {setupToolText.hierarchyStructureHint()}
          </p>
          <Button.LikeLink onClick={onToggleOrientation}>
            {orientation === 'vertical'
              ? setupToolText.hierarchySwitchToHorizontal()
              : setupToolText.hierarchySwitchToVertical()}
          </Button.LikeLink>
        </div>
      </div>
      <div className="overflow-auto flex-1">
        <svg
          aria-label={setupToolText.hierarchyDiagram()}
          className="w-full h-full"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
        >
          <g transform="translate(0,0)">
            {links.map((link: HierarchyPointLink<HierarchyNodeDatum>) => {
              const sourceX = getX(link.source) + xOffset + NODE_WIDTH / 2;
              const sourceY = getY(link.source) + yOffset + NODE_HEIGHT / 2;
              const targetX = getX(link.target) + xOffset + NODE_WIDTH / 2;
              const targetY = getY(link.target) + yOffset + NODE_HEIGHT / 2;

              const controlXOffset = (targetX - sourceX) / 2;
              const controlYOffset = (targetY - sourceY) / 2;

              return (
                <path
                  className="stroke-slate-500"
                  d={`M${sourceX},${sourceY} C${
                    isVertical ? sourceX + controlXOffset : sourceX
                  },${isVertical ? sourceY : sourceY + controlYOffset} ${
                    isVertical ? targetX - controlXOffset : targetX
                  },${
                    isVertical ? targetY : targetY - controlYOffset
                  } ${targetX},${targetY}`}
                  fill="none"
                  key={`${link.source.data.kind}-${link.source.data.id}-${link.target.data.kind}-${link.target.data.id}`}
                  strokeOpacity={0.6}
                  strokeWidth={2}
                />
              );
            })}

            {nodes.map((node: HierarchyPointNode<HierarchyNodeDatum>) => (
              <g
                aria-label={`${textByKind[node.data.kind]} ${node.data.name}`}
                className="cursor-pointer drop-shadow-sm fill-white"
                key={`${node.data.kind}-${node.data.id}`}
                role="button"
                tabIndex={0}
                transform={`translate(${getX(node) + xOffset},${getY(node) + yOffset})`}
                onClick={() => onSelect(node.data)}
                onKeyDown={(event) => handleKeyDown(event, node.data)}
              >
                <rect
                  fill={colorByKind[node.data.kind]}
                  height={NODE_HEIGHT - 12}
                  opacity={1}
                  rx={10}
                  width={NODE_WIDTH}
                  y={6}
                />
                <foreignObject height={NODE_HEIGHT - 12} width={NODE_WIDTH} y={6}>
                  <div className="text-white h-full px-3 flex flex-col items-center justify-center text-center leading-tight break-words">
                    <div className="text-sm font-semibold">
                      {node.data.name}
                    </div>
                    <div className="text-xs">
                      {textByKind[node.data.kind]}
                    </div>
                  </div>
                </foreignObject>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

type DialogFormProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly resourceIndex: number;
  readonly title: LocalizedString;
  readonly step: number;
  readonly refreshAllInfo: () => Promise<void>;
};

function DialogForm({ open, onClose, title, step, refreshAllInfo }: DialogFormProps) {
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
        onSubmit={() => {
          void refreshAllInfo();
          globalThis.setTimeout(() => {
            void refreshAllInfo();
          }, 400);
        }}
      >
        {renderFormFields(resources[step].fields)}
      </Form>
    </Dialog>
  );
}

const handleEditResource = (
  resource: SpecifyResource<any>,
  refreshAllInfo: () => Promise<void>
) => (
  <div className="flex items-center">
    <ResourceLink
      component={Link.Default}
      props={{}}
      resource={resource}
      resourceView={{
        onDeleted: async () => {
          await refreshAllInfo();
        },
        onSaved: async () => {
          await refreshAllInfo();
        },
      }}
    >
      {icons.pencil}
      {commonText.edit()}
    </ResourceLink>
  </div>
);

const addButton = (
  createResource: () => void,
  tableName: string
): JSX.Element => (
  <Button.LikeLink
    className="flex items-center gap-2 mb-2"
    onClick={() => {
      createResource();
    }}
  >
    <span className="flex items-center gap-1">
      {icons.plus}
      {`${setupToolText.hierarchyAddNew()} ${tableName}`}
    </span>
  </Button.LikeLink>
);

export function Hierarchy({
  institution,
  setNewResource,
  handleNewResource,
  refreshAllInfo,
}: {
  readonly institution: InstitutionData | null;
  readonly setNewResource: (resource: any) => void;
  readonly handleNewResource: () => void;
  readonly refreshAllInfo: () => Promise<void>;
}): JSX.Element {
  if (!institution) return <LoadingScreen />;

  const systemInfo = getSystemInfo();

  React.useEffect(() => {
    void refreshAllInfo();
  }, [refreshAllInfo]);

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

  const [isVertical, , , toggleOrientation] = useBooleanState(true);

  const handleNodeSelect = React.useCallback(
    (node: HierarchyNodeDatum) => {
      const resource =
        node.kind === 'institution'
          ? new tables.Institution.Resource({ id: node.id })
          : node.kind === 'division'
            ? new tables.Division.Resource({ id: node.id })
            : node.kind === 'discipline'
              ? new tables.Discipline.Resource({ id: node.id })
              : new tables.Collection.Resource({ id: node.id });

      setNewResource(resource);
      handleNewResource();
    },
    [handleNewResource, setNewResource]
  );

  const renderCollections = (
    collections: RA<{
      readonly id: number;
      readonly name: string;
    }>
  ) => (
    <div className="mt-2 mb-2 ml-2 space-y-2">
      {collections.map((collection) => (
        <div
          className="flex items-center gap-2 flex-wrap bg-[color:var(--background)] rounded px-2 py-1"
          key={collection.id}
        >
          <H3 className="!text-amber-800 font-semibold">{`${tableLabel('Collection')}:`}</H3>
          <H3>{collection.name}</H3>
          <div className="flex items-center gap-1">
            {handleEditResource(
              new tables.Collection.Resource({ id: collection.id }),
              refreshAllInfo
            )}
          </div>
        </div>
      ))}
    </div>
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
              <div>
                <div className="flex items-center gap-1 flex-wrap">
                  <div className="flex items-baseline gap-2">
                    <H3 style={{ color: colorByKind['discipline'] }} className="font-semibold">{`${tableLabel('Discipline')}:`}</H3>
                    <H3>{discipline.name}</H3>
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    {handleEditResource(
                      new tables.Discipline.Resource({ id: discipline.id }),
                      refreshAllInfo
                    )}
                  </div>
                </div>
                <div className="m-2">
                  {/* GEO TREE */}
                  {needsGeoTree && (
                    <div className="flex items-center m-2">
                      <Button.LikeLink
                        onClick={() => {
                          setNewResource(
                            new tables.GeographyTreeDef.Resource()
                          );
                          openAddDisciplineGeoTree();
                        }}
                      >
                        {icons.globe}
                        {setupToolText.geoTreeSetUp()}
                      </Button.LikeLink>
                    </div>
                  )}
                  {/* TAXON TREE */}
                  {needsTaxonTree && (
                    <div className="flex items-center m-2">
                      <Button.LikeLink
                        onClick={() => {
                          setNewResource(new tables.TaxonTreeDef.Resource());
                          openAddDisciplineTaxonTree();
                        }}
                      >
                        {icons.tree}
                        {setupToolText.taxonTreeSetUp()}
                      </Button.LikeLink>
                    </div>
                  )}
                </div>
              </div>
            }
          >
            {/* COLLECTIONS */}
            {discipline.children.length > 0 &&
              renderCollections(discipline.children)}

            {canAddCollection && (
              <div className="flex  mb-2 ml-2">
                {addButton(() => {
                  setNewResource(
                    new tables.Collection.Resource({
                      discipline: `/api/specify/discipline/${discipline.id}/`,
                    })
                  );
                  handleNewResource();
                  void refreshAllInfo();
                }, tableLabel('Collection'))}
              </div>
            )}

            {/* TREE CONFIG DIALOGS */}
            {/* GEO */}
            <DialogForm
              open={addDisciplineGeoTree}
              refreshAllInfo={refreshAllInfo}
              resourceIndex={5}
              step={5}
              title={setupToolText.addNewGeographyTree()}
              onClose={closeAddDisciplineGeoTree}
            />

            {/* TAXON */}
            <DialogForm
              open={addDisciplineTaxonTree}
              refreshAllInfo={refreshAllInfo}
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
      <li key={division.id}>
        <CollapsibleSection
          hasChildren={division.children.length > 0}
          title={
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-baseline gap-2">
                  <H3 style={{ color: colorByKind['division'] }} className="font-semibold">{`${tableLabel('Division')}:`}</H3>
                  <H3>{division.name}</H3>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  {handleEditResource(
                    new tables.Division.Resource({ id: division.id }),
                    refreshAllInfo
                  )}
                </div>
              </div>
            </div>
          }
        >
          <Ul className="m-5">{renderDisciplines(division)}</Ul>
          <div className="flex mt-1">
            {addButton(
              () => {
                setNewResource(
                  new tables.Discipline.Resource({
                    division: `/api/specify/division/${division.id}/`,
                  })
                );
                handleNewResource();
                void refreshAllInfo();
              },
              `${tableLabel('Discipline')}`
            )}
          </div>
        </CollapsibleSection>
      </li>
    ));

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0 gap-4 overflow-hidden m-4">
      <div
        aria-label={setupToolText.hierarchyStructureTitle()}
        className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-auto md:basis-1/3 md:max-w-[33%]"
        role="navigation"
      >
        <Ul
          aria-label={setupToolText.hierarchyStructureTitle()}
          className="bg-[color:var(--background)] p-3 rounded h-full min-h-0 overflow-auto w-max min-w-full"
        >
          <li key={institution.id}>
            <CollapsibleSection
              hasChildren={institution.children.length > 0}
              title={
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-baseline gap-2">
                    <H3 className="!text-red-700 font-semibold">{`${tableLabel('Institution')}:`}</H3>
                    <H3>{institution.name}</H3>
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    {handleEditResource(
                      new tables.Institution.Resource({ id: institution.id }),
                      refreshAllInfo
                    )}
                  </div>
                </div>
              }
            >
              <Ul className="m-5">{renderDivisions(institution)}</Ul>
              <div className="flex mt-1">
                {addButton(() => {
                  setNewResource(new tables.Division.Resource());
                  handleNewResource();
                  void refreshAllInfo();
                }, tableLabel('Division'))}
              </div>
            </CollapsibleSection>
          </li>
        </Ul>
      </div>

      <div className="flex-1 min-w-0 min-h-0 overflow-hidden h-[50vh] md:h-auto md:w-2/3">
        <HierarchyDiagram
          institution={institution}
          orientation={isVertical ? 'vertical' : 'horizontal'}
          onSelect={handleNodeSelect}
          onToggleOrientation={toggleOrientation}
        />
      </div>
    </div>
  );
}
