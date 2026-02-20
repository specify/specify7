import type { HierarchyPointLink, HierarchyPointNode } from 'd3';
import {
  hierarchy as d3Hierarchy,
  select as d3Select,
  tree as d3Tree,
  zoom as d3Zoom,
  zoomIdentity,
} from 'd3';
import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { setupToolText } from '../../localization/setupTool';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { type RA } from '../../utils/types';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { tables } from '../DataModel/tables';
import { getSystemInfo } from '../InitialContext/systemInfo';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { ResourceLink } from '../Molecules/ResourceLink';
import { hasTablePermission } from '../Permissions/helpers';
import { tableLabel } from '../Preferences/UserDefinitions';
import {
  applyFormDefaults,
  renderFormFieldFactory,
  updateSetupFormData,
} from '../SetupTool/SetupForm';
import { resources, stepOrder } from '../SetupTool/setupResources';
import type { ResourceFormData } from '../SetupTool/types';
import { nestAllResources } from '../SetupTool/utils';
import type { TaxonFileDefaultDefinition } from '../TreeView/CreateTree';
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
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = React.useState(zoomIdentity);

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

  React.useEffect(() => {
    if (!svgRef.current) return;

    const zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .wheelDelta(
        (wheelEvent: WheelEvent) =>
          -wheelEvent.deltaY * (wheelEvent.deltaMode === 1 ? 0.05 : 0.002)
      )
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    const svgSelection = d3Select(svgRef.current);
    svgSelection.call(zoomBehavior);

    // Resets so you don't lose the view
    svgSelection.call(zoomBehavior.transform, zoomIdentity);
    setTransform(zoomIdentity);

    return () => {
      svgSelection.call(zoomBehavior);
    };
  }, [isVertical]);

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
          ref={svgRef}
          role="img"
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
        >
          <g transform={transform.toString()}>
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
                <foreignObject
                  height={NODE_HEIGHT - 12}
                  width={NODE_WIDTH}
                  y={6}
                >
                  <div className="text-white h-full px-3 flex flex-col items-center justify-center text-center leading-tight break-words">
                    <div className="text-sm font-semibold">
                      {node.data.name}
                    </div>
                    <div className="text-xs">{textByKind[node.data.kind]}</div>
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
  readonly onSubmit: (formData: ResourceFormData) => void;
  readonly resourceIndex: number;
  readonly title: LocalizedString;
  readonly step: number;
  readonly formData: ResourceFormData;
  readonly setFormData: (value: React.SetStateAction<ResourceFormData>) => void;
  readonly institutionData: InstitutionData;
};

import type { TaxonFileDefaultList } from '../TreeView/CreateTree';
import { fetchDefaultTrees } from '../TreeView/CreateTree';

function DialogForm({
  open,
  onClose,
  onSubmit,
  title,
  step,
  formData,
  setFormData,
  institutionData,
}: DialogFormProps) {
  const id = useId('config-tool');

  const formRef = React.useRef<HTMLFormElement | null>(null);

  const [temporaryFormData, setTemporaryFormData] =
    React.useState<ResourceFormData>({});

  React.useEffect(() => {
    if (!open) {
      return;
    }
    applyFormDefaults(resources[step], setFormData, step);
  }, [open, step]);

  // Fetch list of available default trees.
  const [treeOptions, setTreeOptions] = React.useState<
    TaxonFileDefaultList | undefined
  >(undefined);
  React.useEffect(() => {
    if (open && step === stepOrder.indexOf('taxonTreeDef')) {
      fetchDefaultTrees()
        .then((data) => setTreeOptions(data))
        .catch((error) => {
          console.error('Failed to fetch tree options:', error);
        });
    }
  }, [open, step]);

  const handleChange = (
    name: string,
    newValue: LocalizedString | TaxonFileDefaultDefinition | boolean
  ): void => {
    updateSetupFormData(setFormData, name, newValue, step, institutionData);
  };

  const { renderFormFields } = renderFormFieldFactory({
    formData,
    currentStep: step,
    handleChange,
    temporaryFormData,
    setTemporaryFormData,
    formRef,
    treeOptions,
    institutionData,
  });

  const [saveBlocked, setSaveBlocked] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (!open) {
      setSaveBlocked(false);
      return;
    }
    const formValid = formRef.current?.checkValidity();
    setSaveBlocked(formValid !== true);
  }, [formData, temporaryFormData, step, open]);
  const SubmitComponent = saveBlocked ? Submit.Danger : Submit.Save;

  if (!open) return null;

  return (
    <Dialog
      buttons={
        <>
          <Button.Info onClick={onClose}>{commonText.cancel()}</Button.Info>
          <SubmitComponent form={id('form')}>
            {commonText.save()}
          </SubmitComponent>
        </>
      }
      header={title}
      onClose={onClose}
    >
      <Form
        className="flex-1 overflow-auto gap-2"
        forwardRef={formRef}
        id={id('form')}
        onSubmit={() => {
          onSubmit(formData);
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
): JSX.Element | null => (
  hasTablePermission(resource.specifyTable.name, 'update') ? 
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
  </div> : null
);

const addButton = (
  createResource: () => void,
  table: typeof tables[keyof typeof tables]
): JSX.Element | null => (
  hasTablePermission(table.name, 'create') ? 
  <Button.LikeLink
    className="flex items-center gap-2 mb-2"
    onClick={() => {
      createResource();
    }}
  >
    <span className="flex items-center gap-1">
      {icons.plus}
      {`${setupToolText.hierarchyAddNew()} ${tableLabel(table.name)}`}
    </span>
  </Button.LikeLink> : null
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

  const [formData, setFormData] = React.useState<ResourceFormData>(
    Object.fromEntries(stepOrder.map((key) => [key, {}]))
  );

  const [selectedDivisionId, setSelectedDivisionId] = React.useState<
    number | null
  >(null);

  const systemInfo = getSystemInfo();

  React.useEffect(() => {
    void refreshAllInfo();
  }, [refreshAllInfo]);

  const loading = React.useContext(LoadingContext);

  const isGeographyGlobal = systemInfo.geography_is_global;

  const [
    disciplineCreationOpen,
    openDisciplineCreation,
    closeDisciplineCreation,
  ] = useBooleanState(false);
  const [disciplineStep, setDisciplineStep] = React.useState(0);

  const [_disciplineRelatedFormData, setDisciplineRelatedFormData] =
    React.useState<Record<string, any>>({});

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
          <H3
            className="font-semibold"
            style={{ color: colorByKind.collection }}
          >{`${tableLabel('Collection')}:`}</H3>
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
                    <H3
                      className="font-semibold"
                      style={{ color: colorByKind.discipline }}
                    >{`${tableLabel('Discipline')}:`}</H3>
                    <H3>{discipline.name}</H3>
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    {handleEditResource(
                      new tables.Discipline.Resource({ id: discipline.id }),
                      refreshAllInfo
                    )}
                  </div>
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
                }, tables.Collection)}
              </div>
            )}
            {/* DISCIPLINE CONFIG DIALOGS */}

            <DialogForm
              formData={formData}
              institutionData={institution}
              open={disciplineCreationOpen && disciplineStep === 0}
              resourceIndex={stepOrder.indexOf('discipline')}
              setFormData={setFormData}
              step={stepOrder.indexOf('discipline')}
              title={tableLabel('Discipline')}
              onClose={closeDisciplineCreation}
              onSubmit={(formData) => {
                setDisciplineRelatedFormData((previous) => ({
                  ...previous,
                  discipline: formData.discipline,
                }));
                setDisciplineStep(1);
              }}
            />

            <DialogForm
              formData={formData}
              institutionData={institution}
              open={disciplineCreationOpen && disciplineStep === 1}
              resourceIndex={stepOrder.indexOf('geographyTreeDef')}
              setFormData={setFormData}
              step={stepOrder.indexOf('geographyTreeDef')}
              title={setupToolText.addNewGeographyTree()}
              onClose={closeDisciplineCreation}
              onSubmit={(formData) => {
                setDisciplineRelatedFormData((previous) => ({
                  ...previous,
                  geographyTreeDef: formData.geographyTreeDef,
                }));
                setDisciplineStep(2);
              }}
            />

            <DialogForm
              formData={formData}
              institutionData={institution}
              open={disciplineCreationOpen && disciplineStep === 2}
              resourceIndex={stepOrder.indexOf('taxonTreeDef')}
              setFormData={setFormData}
              step={stepOrder.indexOf('taxonTreeDef')}
              title={setupToolText.addNewTaxonTree()}
              onClose={closeDisciplineCreation}
              onSubmit={(formData) => {
                // Store final form data and send creation request
                setDisciplineRelatedFormData((previous) => {
                  const next = {
                    ...previous,
                    discipline: {
                      ...previous?.discipline,
                      division_id: selectedDivisionId,
                    },
                    taxonTreeDef: formData.taxonTreeDef,
                  };

                  loading(
                    ajax('/setup_tool/discipline_and_trees/create/', {
                      method: 'POST',
                      headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(nestAllResources(next)),
                      errorMode: 'visible',
                      expectedErrors: [Http.CONFLICT, Http.UNAVAILABLE],
                    })
                      .then(() => {
                        void refreshAllInfo();
                      })
                      .catch((error) => {
                        console.error(
                          'Failed to create discipline and trees:',
                          error
                        );
                      })
                  );

                  return next;
                });

                closeDisciplineCreation();
                setDisciplineStep(0);
                void refreshAllInfo();
                globalThis.setTimeout(() => {
                  void refreshAllInfo();
                }, 400);
              }}
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
                  <H3
                    className="font-semibold"
                    style={{ color: colorByKind.division }}
                  >{`${tableLabel('Division')}:`}</H3>
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
              // Use custom forms for discipline to allow tree configuration
              () => {
                setFormData(
                  Object.fromEntries(stepOrder.map((key) => [key, {}]))
                );
                setSelectedDivisionId(division.id);
                openDisciplineCreation();
                setDisciplineStep(0);
              },
              tables.Discipline
            )}
          </div>
        </CollapsibleSection>
      </li>
    ));

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0 gap-4 overflow-hidden h-ful rounded">
      <div
        aria-label={setupToolText.hierarchyStructureTitle()}
        className="flex-shrink-0 md:flex-shrink md:basis-1/3 md:max-w-[33%] overflow-y-auto overflow-x-auto min-h-0"
        role="navigation"
      >
        <Ul
          aria-label={setupToolText.hierarchyStructureTitle()}
          className="bg-[color:var(--background)] p-3 min-h-full w-max min-w-full"
        >
          <li key={institution.id}>
            <CollapsibleSection
              hasChildren={institution.children.length > 0}
              title={
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-baseline gap-2">
                    <H3
                      className="font-semibold"
                      style={{ color: colorByKind.institution }}
                    >{`${tableLabel('Institution')}:`}</H3>
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
                }, tables.Division)}
              </div>
            </CollapsibleSection>
          </li>
        </Ul>
      </div>

      <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
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
