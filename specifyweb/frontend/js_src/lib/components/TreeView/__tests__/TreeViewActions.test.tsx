import { act, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { f } from '../../../utils/functools';
import { commonText } from '../../../localization/common';
import { formsText } from '../../../localization/forms';
import { treeText } from '../../../localization/tree';
import { overrideAjax } from '../../../tests/ajax';
import { Http } from '../../../utils/ajax/definitions';
import { requireContext } from '../../../tests/helpers';
import specifyTrees from '../../../tests/ajax/static/trees/specify_trees.json';
import { mount } from '../../../tests/reactUtils';
import type { GetSet, RA } from '../../../utils/types';
import { LoadingContext } from '../../Core/Contexts';
import { addMissingFields } from '../../DataModel/addMissingFields';
import type { AnyTree } from '../../DataModel/helperTypes';
import { getResourceApiUrl } from '../../DataModel/resource';
import { tables } from '../../DataModel/tables';
import {
  SetUnloadProtectsContext,
  UnloadProtectsContext,
} from '../../Router/UnloadProtect';
import { TreeViewActions } from '../Actions';
import type { Row } from '../helpers';

const chronostratRankUrl = (id: number): string =>
  getResourceApiUrl('GeologicTimePeriodTreeDefItem', id);
const lithostratRankUrl = (id: number): string =>
  getResourceApiUrl('LithoStratTreeDefItem', id);
const tectonicUnitRankUrl = (id: number): string =>
  getResourceApiUrl('TectonicUnitTreeDefItem', id);
overrideAjax('/trees/specify_trees/', {
  ...specifyTrees,
  GeologicTimePeriod: [
    {
      definition: {
        id: 1,
        name: 'Chronostratigraphy',
        fullnamedirection: -1,
        resource_uri: getResourceApiUrl('GeologicTimePeriodTreeDef', 1),
      },
      ranks: (
        [
          [1, 'Root', 0, true],
          [2, 'Era', 100, false],
          [3, 'Period', 200, false],
          [4, 'Epoch', 300, false],
          [5, 'Age', 400, false],
        ] as const
      ).map(([id, name, rankid, isenforced]) => ({
        id,
        name,
        title: name,
        rankid,
        isenforced,
        parent: id === 1 ? null : chronostratRankUrl(id - 1),
        treedef: getResourceApiUrl('GeologicTimePeriodTreeDef', 1),
        resource_uri: chronostratRankUrl(id),
      })),
    },
  ],
  LithoStrat: [
    {
      definition: {
        id: 1,
        name: 'Lithostratigraphy',
        fullnamedirection: -1,
        resource_uri: getResourceApiUrl('LithoStratTreeDef', 1),
      },
      ranks: (
        [
          [1, 'Root', 0, true],
          [2, 'Group', 200, false],
          [3, 'Formation', 300, false],
          [4, 'Member', 400, false],
          [5, 'Bed', 500, false],
        ] as const
      ).map(([id, name, rankid, isenforced]) => ({
        id,
        name,
        title: name,
        rankid,
        isenforced,
        parent: id === 1 ? null : lithostratRankUrl(id - 1),
        treedef: getResourceApiUrl('LithoStratTreeDef', 1),
        resource_uri: lithostratRankUrl(id),
      })),
    },
  ],
  TectonicUnit: [
    {
      definition: {
        id: 1,
        name: 'Tectonic Unit',
        fullnamedirection: -1,
        resource_uri: getResourceApiUrl('TectonicUnitTreeDef', 1),
      },
      ranks: (
        [
          [1, 'Root', 0, true],
          [2, 'Superstructure', 10, false],
          [3, 'Tectonic Domain', 20, false],
          [4, 'Tectonic Subdomain', 30, false],
          [5, 'Tectonic Unit', 40, false],
          [6, 'Tectonic Subunit', 50, false],
        ] as const
      ).map(([id, name, rankid, isenforced]) => ({
        id,
        name,
        title: name,
        rankid,
        isenforced,
        parent: id === 1 ? null : tectonicUnitRankUrl(id - 1),
        treedef: getResourceApiUrl('TectonicUnitTreeDef', 1),
        resource_uri: tectonicUnitRankUrl(id),
      })),
    },
  ],
});

requireContext();

const portalRoot = document.createElement('div');
beforeAll(() => {
  portalRoot.id = 'portal-root';
  document.body.append(portalRoot);
});
afterAll(() => portalRoot.remove());

const ranks = [0, 10, 100, 140, 180, 220, 230];

function makeRow(overrides: Partial<Row> = {}): Row {
  return {
    nodeId: 2,
    name: 'Carpiodes',
    fullName: 'Carpiodes',
    nodeNumber: 2,
    highestNodeNumber: 3,
    rankId: 180,
    acceptedId: undefined,
    acceptedName: undefined,
    author: undefined,
    startPeriod: undefined,
    startUncertainty: undefined,
    endPeriod: undefined,
    endUncertainty: undefined,
    children: 1,
    isLastChild: true,
    synonyms: undefined,
    isBioStrat: undefined,
    matchingDescendantCount: undefined,
    ...overrides,
  };
}

function renderActions(
  tableName: AnyTree['tableName'],
  focusedRow: Row,
  handleRefresh: () => void = jest.fn(),
  focusPath: GetSet<RA<number>> = [[], jest.fn()]
): ReturnType<typeof mount> {
  return mount(
    <MemoryRouter>
      <LoadingContext.Provider value={f.void}>
        <UnloadProtectsContext.Provider value={[]}>
          <SetUnloadProtectsContext.Provider value={f.void}>
            <TreeViewActions
              actionRow={undefined}
              focusPath={focusPath}
              focusRef={{ current: null }}
              focusedRow={focusedRow}
              ranks={ranks}
              tableName={tableName}
              onChange={jest.fn()}
              onRefresh={handleRefresh}
            />
          </SetUnloadProtectsContext.Provider>
        </UnloadProtectsContext.Provider>
      </LoadingContext.Provider>
    </MemoryRouter>
  );
}

const jsonContaining = (expected: Record<string, unknown>): unknown => ({
  $$typeof: Symbol.for('jest.asymmetricMatcher'),
  asymmetricMatch: (actual: unknown): boolean =>
    typeof actual === 'string' &&
    expect.objectContaining(expected).asymmetricMatch(JSON.parse(actual)),
  toAsymmetricMatcher: (): string =>
    `JsonContaining ${JSON.stringify(expected)}`,
});

function overrideTreeView(tableName: AnyTree['tableName']): void {
  const javaClass = `edu.ku.brc.specify.datamodel.${tableName}`;
  overrideAjax(`/context/view.json?name=${tableName}`, {
    name: tableName,
    class: javaClass,
    isinternal: 'false',
    resourcelabels: 'false',
    altviews: {
      [`${tableName} Edit`]: {
        name: `${tableName} Edit`,
        viewdef: tableName,
        mode: 'edit',
        default: 'true',
      },
    },
    viewdefs: {
      [tableName]: `<viewdef name="${tableName}" type="form" class="${javaClass}" gettable="edu.ku.brc.af.ui.forms.DataGetterForObj" settable="edu.ku.brc.af.ui.forms.DataSetterForObj">
        <columnDef>p,p</columnDef>
        <rowDef>p,p,p</rowDef>
        <rows>
          <row><cell type="label" labelfor="name" /><cell type="field" id="name" uitype="text" name="name" /></row>
          <row><cell type="label" labelfor="definitionItem" /><cell type="field" id="definitionItem" uitype="combobox" name="definitionItem" /></row>
          <row><cell type="label" labelfor="parent" /><cell type="field" id="parent" uitype="querycbx" name="parent" initialize="name=${tableName};editbtn=false;newbtn=false" /></row>
        </rows>
      </viewdef>`,
    },
  });
}

describe('Add taxon', () => {
  const parentId = 2;
  const newNodeId = 3;
  const speciesRankId = 2;
  const subspeciesRankId = 22;
  overrideTreeView('Taxon');
  (
    [
      [speciesRankId, 'Species', 220],
      [subspeciesRankId, 'Subspecies', 230],
    ] as const
  ).forEach(([id, name, rankId]) =>
    overrideAjax(getResourceApiUrl('TaxonTreeDefItem', id), () =>
      addMissingFields('TaxonTreeDefItem', {
        id,
        name,
        rankId,
        treeDef: getResourceApiUrl('TaxonTreeDef', 1),
        resource_uri: getResourceApiUrl('TaxonTreeDefItem', id),
      })
    )
  );
  overrideAjax(getResourceApiUrl('Taxon', parentId), () =>
    addMissingFields('Taxon', {
      id: parentId,
      name: 'velifer',
      fullName: 'Carpiodes velifer',
      rankId: 220,
      isAccepted: true,
      definition: getResourceApiUrl('TaxonTreeDef', 1),
      definitionItem: getResourceApiUrl('TaxonTreeDefItem', speciesRankId),
      resource_uri: getResourceApiUrl('Taxon', parentId),
    })
  );

  overrideAjax(
    '/api/specify/taxon/',
    () =>
      addMissingFields('Taxon', {
        id: newNodeId,
        name: 'bellus',
        parent: getResourceApiUrl('Taxon', parentId),
        resource_uri: getResourceApiUrl('Taxon', newNodeId),
      }),
    {
      method: 'POST',
      responseCode: Http.CREATED,
      body: jsonContaining({
        name: 'bellus',
        parent: getResourceApiUrl('Taxon', parentId),
        definitionitem: getResourceApiUrl('TaxonTreeDefItem', subspeciesRankId),
      }),
    }
  );

  overrideAjax(
    `/delete_blockers/delete_blockers/taxon/${newNodeId}/?limit=40`,
    {
      results: [],
      next: [],
    }
  );
  overrideAjax(`/delete_blockers/count/taxon/${newNodeId}/`, {
    results: [],
    total_count: 0,
  });
  overrideAjax(
    `/trees/specify_tree/taxon/${parentId}/predict_fullname/?name=bellus&treedefitemid=${subspeciesRankId}`,
    'Carpiodes velifer bellus'
  );

  test('"Add child" saves a new Taxon under the focused node', async () => {
    const handleRefresh = jest.fn();
    const { user } = renderActions(
      'Taxon',
      makeRow({
        nodeId: parentId,
        name: 'velifer',
        fullName: 'Carpiodes velifer',
        rankId: 220,
      }),
      handleRefresh
    );

    const addChild = screen.getByRole('link', {
      name: new RegExp(`^${treeText.addChild()}`, 'u'),
    });
    expect(addChild).toHaveAttribute('aria-disabled', 'false');
    expect(addChild).toHaveAttribute('href', '/specify/view/taxon/new/');

    await user.click(addChild);

    const dialog = await screen.findByRole('dialog');
    const parent = within(dialog).getByRole('combobox', {
      name: tables.Taxon.strictGetRelationship('parent').label,
    });
    await waitFor(() => expect(parent).toHaveValue('Carpiodes velifer'));

    const rank = within(dialog).getByRole('combobox', {
      name: tables.Taxon.strictGetRelationship('definitionItem').label,
    });
    await waitFor(() => expect(rank).toHaveValue('Subspecies'));

    await user.click(within(dialog).getByRole('textbox'));
    await user.paste('bellus');
    await user.click(
      within(dialog).getByRole('button', { name: commonText.save() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
  });
});

describe('Delete taxon', () => {
  const nodeId = 4;
  const parentId = 2;
  const deleteRequest = jest.fn(() => '');

  overrideAjax(getResourceApiUrl('Taxon', nodeId), () =>
    addMissingFields('Taxon', {
      id: nodeId,
      name: 'velifer',
      fullName: 'Carpiodes velifer',
      rankId: 220,
      parent: getResourceApiUrl('Taxon', parentId),
      resource_uri: getResourceApiUrl('Taxon', nodeId),
    })
  );
  overrideAjax(`/delete_blockers/delete_blockers/taxon/${nodeId}/?limit=40`, {
    results: [],
    next: [],
  });
  overrideAjax(`/delete_blockers/count/taxon/${nodeId}/`, {
    results: [],
    total_count: 0,
  });
  overrideAjax(getResourceApiUrl('Taxon', nodeId), deleteRequest, {
    method: 'DELETE',
    responseCode: Http.NO_CONTENT,
  });

  test('"Delete" removes the focused node and focuses its parent', async () => {
    const handleRefresh = jest.fn();
    const setFocusPath = jest.fn();
    const { user } = renderActions(
      'Taxon',
      makeRow({
        nodeId,
        name: 'velifer',
        fullName: 'Carpiodes velifer',
        rankId: 220,
        children: 0,
      }),
      handleRefresh,
      [[1, parentId, nodeId], setFocusPath]
    );

    await user.click(screen.getByRole('button', { name: commonText.delete() }));

    const dialog = await screen.findByRole('dialog', {
      name: formsText.deleteConfirmation({
        tableName: tables.Taxon.label,
      }),
    });
    await user.click(
      within(dialog).getByRole('button', { name: commonText.delete() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(deleteRequest).toHaveBeenCalledTimes(1);
    expect(setFocusPath).toHaveBeenCalledWith([1, parentId]);
  });
});

describe('Add geography', () => {
  const parentId = 10;
  const newNodeId = 11;
  const stateRankId = 4;
  const countyRankId = 5;
  overrideTreeView('Geography');
  (
    [
      [stateRankId, 'State', 300],
      [countyRankId, 'County', 400],
    ] as const
  ).forEach(([id, name, rankId]) =>
    overrideAjax(getResourceApiUrl('GeographyTreeDefItem', id), () =>
      addMissingFields('GeographyTreeDefItem', {
        id,
        name,
        rankId,
        treeDef: getResourceApiUrl('GeographyTreeDef', 1),
        resource_uri: getResourceApiUrl('GeographyTreeDefItem', id),
      })
    )
  );
  overrideAjax(getResourceApiUrl('Geography', parentId), () =>
    addMissingFields('Geography', {
      id: parentId,
      name: 'Kansas',
      fullName: 'Kansas',
      rankId: 300,
      isAccepted: true,
      definition: getResourceApiUrl('GeographyTreeDef', 1),
      definitionItem: getResourceApiUrl('GeographyTreeDefItem', stateRankId),
      resource_uri: getResourceApiUrl('Geography', parentId),
    })
  );

  overrideAjax(
    '/api/specify/geography/',
    () =>
      addMissingFields('Geography', {
        id: newNodeId,
        name: 'Douglas',
        parent: getResourceApiUrl('Geography', parentId),
        resource_uri: getResourceApiUrl('Geography', newNodeId),
      }),
    {
      method: 'POST',
      responseCode: Http.CREATED,
      body: jsonContaining({
        name: 'Douglas',
        parent: getResourceApiUrl('Geography', parentId),
        definitionitem: getResourceApiUrl('GeographyTreeDefItem', countyRankId),
      }),
    }
  );

  overrideAjax(
    `/delete_blockers/delete_blockers/geography/${newNodeId}/?limit=40`,
    { results: [], next: [] }
  );
  overrideAjax(`/delete_blockers/count/geography/${newNodeId}/`, {
    results: [],
    total_count: 0,
  });
  overrideAjax(
    `/trees/specify_tree/geography/${parentId}/predict_fullname/?name=Douglas&treedefitemid=${countyRankId}`,
    'Douglas, Kansas'
  );

  test('"Add child" saves a new Geography under the focused node', async () => {
    const handleRefresh = jest.fn();
    const { user } = renderActions(
      'Geography',
      makeRow({
        nodeId: parentId,
        name: 'Kansas',
        fullName: 'Kansas',
        rankId: 300,
      }),
      handleRefresh
    );

    const addChild = screen.getByRole('link', {
      name: new RegExp(`^${treeText.addChild()}`, 'u'),
    });
    expect(addChild).toHaveAttribute('aria-disabled', 'false');
    expect(addChild).toHaveAttribute('href', '/specify/view/geography/new/');

    await user.click(addChild);

    const dialog = await screen.findByRole('dialog');
    const parent = within(dialog).getByRole('combobox', {
      name: tables.Geography.strictGetRelationship('parent').label,
    });
    await waitFor(() => expect(parent).toHaveValue('Kansas'));

    const rank = within(dialog).getByRole('combobox', {
      name: tables.Geography.strictGetRelationship('definitionItem').label,
    });
    await waitFor(() => expect(rank).toHaveValue('County'));

    await user.click(within(dialog).getByRole('textbox'));
    await user.paste('Douglas');
    await user.click(
      within(dialog).getByRole('button', { name: commonText.save() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
  });
});

describe('Delete geography', () => {
  const nodeId = 11;
  const parentId = 10;
  const deleteRequest = jest.fn(() => '');

  overrideAjax(getResourceApiUrl('Geography', nodeId), () =>
    addMissingFields('Geography', {
      id: nodeId,
      name: 'Kansas',
      fullName: 'Kansas, USA',
      rankId: 300,
      parent: getResourceApiUrl('Geography', parentId),
      resource_uri: getResourceApiUrl('Geography', nodeId),
    })
  );
  overrideAjax(
    `/delete_blockers/delete_blockers/geography/${nodeId}/?limit=40`,
    { results: [], next: [] }
  );
  overrideAjax(`/delete_blockers/count/geography/${nodeId}/`, {
    results: [],
    total_count: 0,
  });
  overrideAjax(getResourceApiUrl('Geography', nodeId), deleteRequest, {
    method: 'DELETE',
    responseCode: Http.NO_CONTENT,
  });

  test('"Delete" removes the focused node and focuses its parent', async () => {
    const handleRefresh = jest.fn();
    const setFocusPath = jest.fn();
    const { user } = renderActions(
      'Geography',
      makeRow({
        nodeId,
        name: 'Kansas',
        fullName: 'Kansas, USA',
        rankId: 300,
        children: 0,
      }),
      handleRefresh,
      [[1, parentId, nodeId], setFocusPath]
    );

    await user.click(screen.getByRole('button', { name: commonText.delete() }));

    const dialog = await screen.findByRole('dialog', {
      name: formsText.deleteConfirmation({
        tableName: tables.Geography.label,
      }),
    });
    await user.click(
      within(dialog).getByRole('button', { name: commonText.delete() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(deleteRequest).toHaveBeenCalledTimes(1);
    expect(setFocusPath).toHaveBeenCalledWith([1, parentId]);
  });
});

describe('Add storage', () => {
  const parentId = 20;
  const newNodeId = 21;
  const buildingRankId = 2;
  const roomRankId = 3;
  overrideTreeView('Storage');
  (
    [
      [buildingRankId, 'Building', 100],
      [roomRankId, 'Room', 200],
    ] as const
  ).forEach(([id, name, rankId]) =>
    overrideAjax(getResourceApiUrl('StorageTreeDefItem', id), () =>
      addMissingFields('StorageTreeDefItem', {
        id,
        name,
        rankId,
        isEnforced: rankId === 200,
        treeDef: getResourceApiUrl('StorageTreeDef', 1),
        resource_uri: getResourceApiUrl('StorageTreeDefItem', id),
      })
    )
  );
  overrideAjax(getResourceApiUrl('Storage', parentId), () =>
    addMissingFields('Storage', {
      id: parentId,
      name: 'Dyche Hall',
      fullName: 'Dyche Hall',
      rankId: 100,
      isAccepted: true,
      definition: getResourceApiUrl('StorageTreeDef', 1),
      definitionItem: getResourceApiUrl('StorageTreeDefItem', buildingRankId),
      resource_uri: getResourceApiUrl('Storage', parentId),
    })
  );

  overrideAjax(
    '/api/specify/storage/',
    () =>
      addMissingFields('Storage', {
        id: newNodeId,
        name: 'Fish Room',
        parent: getResourceApiUrl('Storage', parentId),
        resource_uri: getResourceApiUrl('Storage', newNodeId),
      }),
    {
      method: 'POST',
      responseCode: Http.CREATED,
      body: jsonContaining({
        name: 'Fish Room',
        parent: getResourceApiUrl('Storage', parentId),
        definitionitem: getResourceApiUrl('StorageTreeDefItem', roomRankId),
      }),
    }
  );

  overrideAjax(
    `/delete_blockers/delete_blockers/storage/${newNodeId}/?limit=40`,
    { results: [], next: [] }
  );
  overrideAjax(`/delete_blockers/count/storage/${newNodeId}/`, {
    results: [],
    total_count: 0,
  });
  overrideAjax(
    `/trees/specify_tree/storage/${parentId}/predict_fullname/?name=Fish+Room&treedefitemid=${roomRankId}`,
    'Dyche Hall Fish Room'
  );

  test('"Add child" saves a new Storage under the focused node', async () => {
    const handleRefresh = jest.fn();
    const { user } = renderActions(
      'Storage',
      makeRow({
        nodeId: parentId,
        name: 'Dyche Hall',
        fullName: 'Dyche Hall',
        rankId: 100,
      }),
      handleRefresh
    );

    const addChild = screen.getByRole('link', {
      name: new RegExp(`^${treeText.addChild()}`, 'u'),
    });
    expect(addChild).toHaveAttribute('aria-disabled', 'false');
    expect(addChild).toHaveAttribute('href', '/specify/view/storage/new/');

    await user.click(addChild);

    const dialog = await screen.findByRole('dialog');
    const parent = within(dialog).getByRole('combobox', {
      name: tables.Storage.strictGetRelationship('parent').label,
    });
    await waitFor(() => expect(parent).toHaveValue('Dyche Hall'));

    const rank = within(dialog).getByRole('combobox', {
      name: tables.Storage.strictGetRelationship('definitionItem').label,
    });
    await waitFor(() => expect(rank).toHaveValue('Room'));

    await user.click(within(dialog).getByRole('textbox'));
    await user.paste('Fish Room');
    await user.click(
      within(dialog).getByRole('button', { name: commonText.save() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
  });
});

describe('Delete storage', () => {
  const nodeId = 21;
  const parentId = 20;
  const deleteRequest = jest.fn(() => '');

  overrideAjax(getResourceApiUrl('Storage', nodeId), () =>
    addMissingFields('Storage', {
      id: nodeId,
      name: 'Fish Room',
      fullName: 'Dyche Hall Fish Room',
      rankId: 200,
      parent: getResourceApiUrl('Storage', parentId),
      resource_uri: getResourceApiUrl('Storage', nodeId),
    })
  );
  overrideAjax(`/delete_blockers/delete_blockers/storage/${nodeId}/?limit=40`, {
    results: [],
    next: [],
  });
  overrideAjax(`/delete_blockers/count/storage/${nodeId}/`, {
    results: [],
    total_count: 0,
  });
  overrideAjax(getResourceApiUrl('Storage', nodeId), deleteRequest, {
    method: 'DELETE',
    responseCode: Http.NO_CONTENT,
  });

  test('"Delete" removes the focused node and focuses its parent', async () => {
    const handleRefresh = jest.fn();
    const setFocusPath = jest.fn();
    const { user } = renderActions(
      'Storage',
      makeRow({
        nodeId,
        name: 'Fish Room',
        fullName: 'Dyche Hall Fish Room',
        rankId: 200,
        children: 0,
      }),
      handleRefresh,
      [[1, parentId, nodeId], setFocusPath]
    );

    await user.click(screen.getByRole('button', { name: commonText.delete() }));

    const dialog = await screen.findByRole('dialog', {
      name: formsText.deleteConfirmation({
        tableName: tables.Storage.label,
      }),
    });
    await user.click(
      within(dialog).getByRole('button', { name: commonText.delete() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(deleteRequest).toHaveBeenCalledTimes(1);
    expect(setFocusPath).toHaveBeenCalledWith([1, parentId]);
  });
});

describe('Move storage items to another node', () => {
  const sourceId = 30;
  const targetId = 31;
  const moveRequest = jest.fn(() => '');
  const formDataContaining = (expected: Record<string, string>): unknown => ({
    $$typeof: Symbol.for('jest.asymmetricMatcher'),
    asymmetricMatch: (actual: unknown): boolean =>
      typeof (actual as FormData | undefined)?.get === 'function' &&
      Object.entries(expected).every(
        ([key, value]) => (actual as FormData).get(key) === value
      ),
    toAsymmetricMatcher: (): string =>
      `FormDataContaining ${JSON.stringify(expected)}`,
  });
  (
    [
      [sourceId, 'Room 1'],
      [targetId, 'Room 2'],
    ] as const
  ).forEach(([id, name]) =>
    overrideAjax(getResourceApiUrl('Storage', id), () =>
      addMissingFields('Storage', {
        id,
        name,
        fullName: name,
        rankId: 200,
        resource_uri: getResourceApiUrl('Storage', id),
      })
    )
  );
  overrideAjax(
    `/trees/specify_tree/storage/${sourceId}/bulk_move/`,
    moveRequest,
    {
      method: 'POST',
      responseCode: Http.OK,
      body: formDataContaining({ target: targetId.toString() }),
    }
  );

  test('"Move Items" moves the preparations to the selected node', async () => {
    const source = makeRow({
      nodeId: sourceId,
      name: 'Room 1',
      fullName: 'Room 1',
      rankId: 200,
      children: 0,
    });
    const target = makeRow({
      nodeId: targetId,
      name: 'Room 2',
      fullName: 'Room 2',
      rankId: 200,
      children: 0,
    });
    const handleRefresh = jest.fn();
    let selectRow: (row: Row) => void = f.void;
    function TreeViewer(): JSX.Element {
      const [focusedRow, setFocusedRow] = React.useState<Row>(source);
      const [actionRow, setActionRow] = React.useState<Row | undefined>(
        undefined
      );
      selectRow = setFocusedRow;
      return (
        <TreeViewActions
          actionRow={actionRow}
          focusPath={[[], jest.fn()]}
          focusRef={{ current: null }}
          focusedRow={focusedRow}
          ranks={ranks}
          tableName="Storage"
          onChange={setActionRow}
          onRefresh={handleRefresh}
        />
      );
    }
    const { user } = mount(
      <MemoryRouter>
        <LoadingContext.Provider value={f.void}>
          <UnloadProtectsContext.Provider value={[]}>
            <SetUnloadProtectsContext.Provider value={f.void}>
              <TreeViewer />
            </SetUnloadProtectsContext.Provider>
          </UnloadProtectsContext.Provider>
        </LoadingContext.Provider>
      </MemoryRouter>
    );

    await user.click(
      screen.getByRole('button', {
        name: new RegExp(`^${treeText.moveItems()}`, 'u'),
      })
    );
    act(() => selectRow(target));
    await user.click(
      screen.getByRole('button', {
        name: treeText.moveNodePreparationsHere({
          nodeName: source.fullName,
        }),
      })
    );

    const dialog = await screen.findByRole('dialog', {
      name: treeText.moveItems(),
    });
    await user.click(
      within(dialog).getByRole('button', { name: treeText.moveItems() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(moveRequest).toHaveBeenCalledTimes(1);
  });
});

describe('Add a chronostrat', () => {
  const parentId = 40;
  const newNodeId = 41;
  const epochRankId = 4;
  const ageRankId = 5;
  overrideTreeView('GeologicTimePeriod');
  (
    [
      [epochRankId, 'Epoch', 300],
      [ageRankId, 'Age', 400],
    ] as const
  ).forEach(([id, name, rankId]) =>
    overrideAjax(chronostratRankUrl(id), () =>
      addMissingFields('GeologicTimePeriodTreeDefItem', {
        id,
        name,
        rankId,
        treeDef: getResourceApiUrl('GeologicTimePeriodTreeDef', 1),
        resource_uri: chronostratRankUrl(id),
      })
    )
  );
  overrideAjax(getResourceApiUrl('GeologicTimePeriod', parentId), () =>
    addMissingFields('GeologicTimePeriod', {
      id: parentId,
      name: 'Paleocene',
      fullName: 'Paleocene',
      rankId: 300,
      isAccepted: true,
      definition: getResourceApiUrl('GeologicTimePeriodTreeDef', 1),
      definitionItem: chronostratRankUrl(epochRankId),
      resource_uri: getResourceApiUrl('GeologicTimePeriod', parentId),
    })
  );

  overrideAjax(
    '/api/specify/geologictimeperiod/',
    () =>
      addMissingFields('GeologicTimePeriod', {
        id: newNodeId,
        name: 'Danian',
        parent: getResourceApiUrl('GeologicTimePeriod', parentId),
        resource_uri: getResourceApiUrl('GeologicTimePeriod', newNodeId),
      }),
    {
      method: 'POST',
      responseCode: Http.CREATED,
      body: jsonContaining({
        name: 'Danian',
        parent: getResourceApiUrl('GeologicTimePeriod', parentId),
        definitionitem: chronostratRankUrl(ageRankId),
      }),
    }
  );

  overrideAjax(
    `/delete_blockers/delete_blockers/geologictimeperiod/${newNodeId}/?limit=40`,
    { results: [], next: [] }
  );
  overrideAjax(`/delete_blockers/count/geologictimeperiod/${newNodeId}/`, {
    results: [],
    total_count: 0,
  });
  overrideAjax(
    `/trees/specify_tree/geologictimeperiod/${parentId}/predict_fullname/?name=Danian&treedefitemid=${ageRankId}`,
    'Danian'
  );

  test('"Add child" saves a new GeologicTimePeriod under the focused node', async () => {
    const handleRefresh = jest.fn();
    const { user } = renderActions(
      'GeologicTimePeriod',
      makeRow({
        nodeId: parentId,
        name: 'Paleocene',
        fullName: 'Paleocene',
        rankId: 300,
      }),
      handleRefresh
    );

    const addChild = screen.getByRole('link', {
      name: new RegExp(`^${treeText.addChild()}`, 'u'),
    });
    expect(addChild).toHaveAttribute('aria-disabled', 'false');
    expect(addChild).toHaveAttribute(
      'href',
      '/specify/view/geologictimeperiod/new/'
    );

    await user.click(addChild);

    const dialog = await screen.findByRole('dialog');
    const parent = within(dialog).getByRole('combobox', {
      name: tables.GeologicTimePeriod.strictGetRelationship('parent').label,
    });
    await waitFor(() => expect(parent).toHaveValue('Paleocene'));

    const rank = within(dialog).getByRole('combobox', {
      name: tables.GeologicTimePeriod.strictGetRelationship('definitionItem')
        .label,
    });
    await waitFor(() => expect(rank).toHaveValue('Age'));

    await user.click(within(dialog).getByRole('textbox'));
    await user.paste('Danian');
    await user.click(
      within(dialog).getByRole('button', { name: commonText.save() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
  });
});

describe('Delete a chronostrat', () => {
  const nodeId = 41;
  const parentId = 40;
  const deleteRequest = jest.fn(() => '');

  overrideAjax(getResourceApiUrl('GeologicTimePeriod', nodeId), () =>
    addMissingFields('GeologicTimePeriod', {
      id: nodeId,
      name: 'Danian',
      fullName: 'Danian',
      rankId: 400,
      parent: getResourceApiUrl('GeologicTimePeriod', parentId),
      resource_uri: getResourceApiUrl('GeologicTimePeriod', nodeId),
    })
  );
  overrideAjax(
    `/delete_blockers/delete_blockers/geologictimeperiod/${nodeId}/?limit=40`,
    { results: [], next: [] }
  );
  overrideAjax(`/delete_blockers/count/geologictimeperiod/${nodeId}/`, {
    results: [],
    total_count: 0,
  });
  overrideAjax(getResourceApiUrl('GeologicTimePeriod', nodeId), deleteRequest, {
    method: 'DELETE',
    responseCode: Http.NO_CONTENT,
  });

  test('"Delete" removes the focused node and focuses its parent', async () => {
    const handleRefresh = jest.fn();
    const setFocusPath = jest.fn();
    const { user } = renderActions(
      'GeologicTimePeriod',
      makeRow({
        nodeId,
        name: 'Danian',
        fullName: 'Danian',
        rankId: 400,
        children: 0,
      }),
      handleRefresh,
      [[1, parentId, nodeId], setFocusPath]
    );

    await user.click(screen.getByRole('button', { name: commonText.delete() }));

    const dialog = await screen.findByRole('dialog', {
      name: formsText.deleteConfirmation({
        tableName: tables.GeologicTimePeriod.label,
      }),
    });
    await user.click(
      within(dialog).getByRole('button', { name: commonText.delete() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(deleteRequest).toHaveBeenCalledTimes(1);
    expect(setFocusPath).toHaveBeenCalledWith([1, parentId]);
  });
});

describe('Add a lithostrat', () => {
  const parentId = 50;
  const newNodeId = 51;
  const memberRankId = 4;
  const bedRankId = 5;
  overrideTreeView('LithoStrat');
  (
    [
      [memberRankId, 'Member', 400],
      [bedRankId, 'Bed', 500],
    ] as const
  ).forEach(([id, name, rankId]) =>
    overrideAjax(lithostratRankUrl(id), () =>
      addMissingFields('LithoStratTreeDefItem', {
        id,
        name,
        rankId,
        treeDef: getResourceApiUrl('LithoStratTreeDef', 1),
        resource_uri: lithostratRankUrl(id),
      })
    )
  );
  overrideAjax(getResourceApiUrl('LithoStrat', parentId), () =>
    addMissingFields('LithoStrat', {
      id: parentId,
      name: 'Plattsmouth',
      fullName: 'Plattsmouth',
      rankId: 400,
      isAccepted: true,
      definition: getResourceApiUrl('LithoStratTreeDef', 1),
      definitionItem: lithostratRankUrl(memberRankId),
      resource_uri: getResourceApiUrl('LithoStrat', parentId),
    })
  );

  overrideAjax(
    '/api/specify/lithostrat/',
    () =>
      addMissingFields('LithoStrat', {
        id: newNodeId,
        name: 'Unit A',
        parent: getResourceApiUrl('LithoStrat', parentId),
        resource_uri: getResourceApiUrl('LithoStrat', newNodeId),
      }),
    {
      method: 'POST',
      responseCode: Http.CREATED,
      body: jsonContaining({
        name: 'Unit A',
        parent: getResourceApiUrl('LithoStrat', parentId),
        definitionitem: lithostratRankUrl(bedRankId),
      }),
    }
  );

  overrideAjax(
    `/delete_blockers/delete_blockers/lithostrat/${newNodeId}/?limit=40`,
    { results: [], next: [] }
  );
  overrideAjax(`/delete_blockers/count/lithostrat/${newNodeId}/`, {
    results: [],
    total_count: 0,
  });
  overrideAjax(
    `/trees/specify_tree/lithostrat/${parentId}/predict_fullname/?name=Unit+A&treedefitemid=${bedRankId}`,
    'Unit A'
  );

  test('"Add child" saves a new LithoStrat under the focused node', async () => {
    const handleRefresh = jest.fn();
    const { user } = renderActions(
      'LithoStrat',
      makeRow({
        nodeId: parentId,
        name: 'Plattsmouth',
        fullName: 'Plattsmouth',
        rankId: 400,
      }),
      handleRefresh
    );

    const addChild = screen.getByRole('link', {
      name: new RegExp(`^${treeText.addChild()}`, 'u'),
    });
    expect(addChild).toHaveAttribute('aria-disabled', 'false');
    expect(addChild).toHaveAttribute('href', '/specify/view/lithostrat/new/');

    await user.click(addChild);

    const dialog = await screen.findByRole('dialog');
    const parent = within(dialog).getByRole('combobox', {
      name: tables.LithoStrat.strictGetRelationship('parent').label,
    });
    await waitFor(() => expect(parent).toHaveValue('Plattsmouth'));

    const rank = within(dialog).getByRole('combobox', {
      name: tables.LithoStrat.strictGetRelationship('definitionItem').label,
    });
    await waitFor(() => expect(rank).toHaveValue('Bed'));

    await user.click(within(dialog).getByRole('textbox'));
    await user.paste('Unit A');
    await user.click(
      within(dialog).getByRole('button', { name: commonText.save() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
  });
});

describe('Delete a lithostrat', () => {
  const nodeId = 51;
  const parentId = 50;
  const deleteRequest = jest.fn(() => '');

  overrideAjax(getResourceApiUrl('LithoStrat', nodeId), () =>
    addMissingFields('LithoStrat', {
      id: nodeId,
      name: 'Unit A',
      fullName: 'Unit A',
      rankId: 500,
      parent: getResourceApiUrl('LithoStrat', parentId),
      resource_uri: getResourceApiUrl('LithoStrat', nodeId),
    })
  );
  overrideAjax(
    `/delete_blockers/delete_blockers/lithostrat/${nodeId}/?limit=40`,
    { results: [], next: [] }
  );
  overrideAjax(`/delete_blockers/count/lithostrat/${nodeId}/`, {
    results: [],
    total_count: 0,
  });
  overrideAjax(getResourceApiUrl('LithoStrat', nodeId), deleteRequest, {
    method: 'DELETE',
    responseCode: Http.NO_CONTENT,
  });

  test('"Delete" removes the focused node and focuses its parent', async () => {
    const handleRefresh = jest.fn();
    const setFocusPath = jest.fn();
    const { user } = renderActions(
      'LithoStrat',
      makeRow({
        nodeId,
        name: 'Unit A',
        fullName: 'Unit A',
        rankId: 500,
        children: 0,
      }),
      handleRefresh,
      [[1, parentId, nodeId], setFocusPath]
    );

    await user.click(screen.getByRole('button', { name: commonText.delete() }));

    const dialog = await screen.findByRole('dialog', {
      name: formsText.deleteConfirmation({
        tableName: tables.LithoStrat.label,
      }),
    });
    await user.click(
      within(dialog).getByRole('button', { name: commonText.delete() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(deleteRequest).toHaveBeenCalledTimes(1);
    expect(setFocusPath).toHaveBeenCalledWith([1, parentId]);
  });
});

describe('Add tectonic unit', () => {
  const parentId = 60;
  const newNodeId = 61;
  const unitRankId = 5;
  const subunitRankId = 6;
  overrideTreeView('TectonicUnit');
  (
    [
      [unitRankId, 'Tectonic Unit', 40],
      [subunitRankId, 'Tectonic Subunit', 50],
    ] as const
  ).forEach(([id, name, rankId]) =>
    overrideAjax(tectonicUnitRankUrl(id), () =>
      addMissingFields('TectonicUnitTreeDefItem', {
        id,
        name,
        rankId,
        treeDef: getResourceApiUrl('TectonicUnitTreeDef', 1),
        resource_uri: tectonicUnitRankUrl(id),
      })
    )
  );
  overrideAjax(getResourceApiUrl('TectonicUnit', parentId), () =>
    addMissingFields('TectonicUnit', {
      id: parentId,
      name: 'Ozark Plateau',
      fullName: 'Ozark Plateau',
      rankId: 40,
      isAccepted: true,
      definition: getResourceApiUrl('TectonicUnitTreeDef', 1),
      definitionItem: tectonicUnitRankUrl(unitRankId),
      resource_uri: getResourceApiUrl('TectonicUnit', parentId),
    })
  );

  overrideAjax(
    '/api/specify/tectonicunit/',
    () =>
      addMissingFields('TectonicUnit', {
        id: newNodeId,
        name: 'Springfield Plateau',
        parent: getResourceApiUrl('TectonicUnit', parentId),
        resource_uri: getResourceApiUrl('TectonicUnit', newNodeId),
      }),
    {
      method: 'POST',
      responseCode: Http.CREATED,
      body: jsonContaining({
        name: 'Springfield Plateau',
        parent: getResourceApiUrl('TectonicUnit', parentId),
        definitionitem: tectonicUnitRankUrl(subunitRankId),
      }),
    }
  );

  overrideAjax(
    `/delete_blockers/delete_blockers/tectonicunit/${newNodeId}/?limit=40`,
    { results: [], next: [] }
  );
  overrideAjax(`/delete_blockers/count/tectonicunit/${newNodeId}/`, {
    results: [],
    total_count: 0,
  });
  overrideAjax(
    `/trees/specify_tree/tectonicunit/${parentId}/predict_fullname/?name=Springfield+Plateau&treedefitemid=${subunitRankId}`,
    'Springfield Plateau'
  );

  test('"Add child" saves a new TectonicUnit under the focused node', async () => {
    const handleRefresh = jest.fn();
    const { user } = renderActions(
      'TectonicUnit',
      makeRow({
        nodeId: parentId,
        name: 'Ozark Plateau',
        fullName: 'Ozark Plateau',
        rankId: 40,
      }),
      handleRefresh
    );

    const addChild = screen.getByRole('link', {
      name: new RegExp(`^${treeText.addChild()}`, 'u'),
    });
    expect(addChild).toHaveAttribute('aria-disabled', 'false');
    expect(addChild).toHaveAttribute('href', '/specify/view/tectonicunit/new/');

    await user.click(addChild);

    const dialog = await screen.findByRole('dialog');
    const parent = within(dialog).getByRole('combobox', {
      name: tables.TectonicUnit.strictGetRelationship('parent').label,
    });
    await waitFor(() => expect(parent).toHaveValue('Ozark Plateau'));

    const rank = within(dialog).getByRole('combobox', {
      name: tables.TectonicUnit.strictGetRelationship('definitionItem').label,
    });
    await waitFor(() => expect(rank).toHaveValue('Tectonic Subunit'));

    await user.click(within(dialog).getByRole('textbox'));
    await user.paste('Springfield Plateau');
    await user.click(
      within(dialog).getByRole('button', { name: commonText.save() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
  });
});

describe('Delete tectonic unit', () => {
  const nodeId = 61;
  const parentId = 60;
  const deleteRequest = jest.fn(() => '');

  overrideAjax(getResourceApiUrl('TectonicUnit', nodeId), () =>
    addMissingFields('TectonicUnit', {
      id: nodeId,
      name: 'Springfield Plateau',
      fullName: 'Springfield Plateau',
      rankId: 50,
      parent: getResourceApiUrl('TectonicUnit', parentId),
      resource_uri: getResourceApiUrl('TectonicUnit', nodeId),
    })
  );
  overrideAjax(
    `/delete_blockers/delete_blockers/tectonicunit/${nodeId}/?limit=40`,
    { results: [], next: [] }
  );
  overrideAjax(`/delete_blockers/count/tectonicunit/${nodeId}/`, {
    results: [],
    total_count: 0,
  });
  overrideAjax(getResourceApiUrl('TectonicUnit', nodeId), deleteRequest, {
    method: 'DELETE',
    responseCode: Http.NO_CONTENT,
  });

  test('"Delete" removes the focused node and focuses its parent', async () => {
    const handleRefresh = jest.fn();
    const setFocusPath = jest.fn();
    const { user } = renderActions(
      'TectonicUnit',
      makeRow({
        nodeId,
        name: 'Springfield Plateau',
        fullName: 'Springfield Plateau',
        rankId: 50,
        children: 0,
      }),
      handleRefresh,
      [[1, parentId, nodeId], setFocusPath]
    );

    await user.click(screen.getByRole('button', { name: commonText.delete() }));

    const dialog = await screen.findByRole('dialog', {
      name: formsText.deleteConfirmation({
        tableName: tables.TectonicUnit.label,
      }),
    });
    await user.click(
      within(dialog).getByRole('button', { name: commonText.delete() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(deleteRequest).toHaveBeenCalledTimes(1);
    expect(setFocusPath).toHaveBeenCalledWith([1, parentId]);
  });
});

describe("Can't delete a node with an associated CO", () => {
  const nodeId = 7;
  const determinationId = 100;
  const deleteRequest = jest.fn(() => '');

  overrideAjax(getResourceApiUrl('Taxon', nodeId), () =>
    addMissingFields('Taxon', {
      id: nodeId,
      name: 'carpio',
      fullName: 'Carpiodes carpio',
      rankId: 220,
      resource_uri: getResourceApiUrl('Taxon', nodeId),
    })
  );
  overrideAjax(`/delete_blockers/delete_blockers/taxon/${nodeId}/?limit=40`, {
    results: [
      {
        table: 'determination',
        field: 'taxon',
        ids: [determinationId],
        limit: 40,
        complete: true,
        anchor: null,
        backwards: false,
      },
    ],
    next: [],
  });
  overrideAjax(`/delete_blockers/count/taxon/${nodeId}/`, {
    results: [{ table: 'determination', field: 'taxon', count: 1 }],
    total_count: 1,
  });
  overrideAjax(getResourceApiUrl('Taxon', nodeId), deleteRequest, {
    method: 'DELETE',
    responseCode: Http.NO_CONTENT,
  });

  test('"Delete" shows the blockers instead of deleting', async () => {
    const handleRefresh = jest.fn();
    const { user } = renderActions(
      'Taxon',
      makeRow({
        nodeId,
        name: 'carpio',
        fullName: 'Carpiodes carpio',
        rankId: 220,
        children: 0,
      }),
      handleRefresh
    );

    await user.click(
      screen.getByRole('button', {
        name: new RegExp(
          `^(${commonText.delete()}|${formsText.deleteBlocked()})$`,
          'u'
        ),
      })
    );

    const dialog = await screen.findByRole('dialog', {
      name: formsText.deleteBlocked(),
    });
    expect(dialog).toHaveTextContent(formsText.deleteBlockedDescription());
    expect(
      await within(dialog).findByRole('button', {
        name: new RegExp(`${tables.Determination.label} \\(1\\)$`, 'u'),
      })
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: commonText.delete() })
    ).not.toBeInTheDocument();

    await user.click(
      within(dialog).getByRole('button', { name: commonText.close() })
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deleteRequest).not.toHaveBeenCalled();
    expect(handleRefresh).not.toHaveBeenCalled();
  });
});

describe('Can delete a parent when its children reference nothing', () => {
  const nodeId = 8;
  const parentId = 1;
  const deleteRequest = jest.fn(() => '');

  overrideAjax(getResourceApiUrl('Taxon', nodeId), () =>
    addMissingFields('Taxon', {
      id: nodeId,
      name: 'Ictiobus',
      fullName: 'Ictiobus',
      rankId: 180,
      parent: getResourceApiUrl('Taxon', parentId),
      resource_uri: getResourceApiUrl('Taxon', nodeId),
    })
  );
  overrideAjax(`/delete_blockers/delete_blockers/taxon/${nodeId}/?limit=40`, {
    results: [],
    next: [],
  });
  overrideAjax(`/delete_blockers/count/taxon/${nodeId}/`, {
    results: [],
    total_count: 0,
  });
  overrideAjax(getResourceApiUrl('Taxon', nodeId), deleteRequest, {
    method: 'DELETE',
    responseCode: Http.NO_CONTENT,
  });

  test('"Delete" removes a node that has children', async () => {
    const handleRefresh = jest.fn();
    const setFocusPath = jest.fn();
    const { user } = renderActions(
      'Taxon',
      makeRow({
        nodeId,
        name: 'Ictiobus',
        fullName: 'Ictiobus',
        rankId: 180,
        children: 2,
      }),
      handleRefresh,
      [[parentId, nodeId], setFocusPath]
    );

    await user.click(screen.getByRole('button', { name: commonText.delete() }));

    const dialog = await screen.findByRole('dialog', {
      name: formsText.deleteConfirmation({
        tableName: tables.Taxon.label,
      }),
    });
    await user.click(
      within(dialog).getByRole('button', { name: commonText.delete() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(deleteRequest).toHaveBeenCalledTimes(1);
    expect(setFocusPath).toHaveBeenCalledWith([parentId]);
  });
});

describe('Move', () => {
  const sourceId = 4;
  const targetId = 8;
  const moveRequest = jest.fn(() => '');
  const formDataContaining = (expected: Record<string, string>): unknown => ({
    $$typeof: Symbol.for('jest.asymmetricMatcher'),
    asymmetricMatch: (actual: unknown): boolean =>
      typeof (actual as FormData | undefined)?.get === 'function' &&
      Object.entries(expected).every(
        ([key, value]) => (actual as FormData).get(key) === value
      ),
    toAsymmetricMatcher: (): string =>
      `FormDataContaining ${JSON.stringify(expected)}`,
  });
  (
    [
      [sourceId, 'velifer', 'Carpiodes velifer', 220],
      [targetId, 'Ictiobus', 'Ictiobus', 180],
    ] as const
  ).forEach(([id, name, fullName, rankId]) =>
    overrideAjax(getResourceApiUrl('Taxon', id), () =>
      addMissingFields('Taxon', {
        id,
        name,
        fullName,
        rankId,
        resource_uri: getResourceApiUrl('Taxon', id),
      })
    )
  );
  overrideAjax(`/trees/specify_tree/taxon/${sourceId}/move/`, moveRequest, {
    method: 'POST',
    responseCode: Http.OK,
    body: formDataContaining({ target: targetId.toString() }),
  });

  test('"Move" places the node under the selected parent', async () => {
    const source = makeRow({
      nodeId: sourceId,
      name: 'velifer',
      fullName: 'Carpiodes velifer',
      rankId: 220,
      children: 0,
    });
    const target = makeRow({
      nodeId: targetId,
      name: 'Ictiobus',
      fullName: 'Ictiobus',
      rankId: 180,
      children: 2,
    });
    const handleRefresh = jest.fn();
    let selectRow: (row: Row) => void = f.void;
    function TreeViewer(): JSX.Element {
      const [focusedRow, setFocusedRow] = React.useState<Row>(source);
      const [actionRow, setActionRow] = React.useState<Row | undefined>(
        undefined
      );
      selectRow = setFocusedRow;
      return (
        <TreeViewActions
          actionRow={actionRow}
          focusPath={[[], jest.fn()]}
          focusRef={{ current: null }}
          focusedRow={focusedRow}
          ranks={ranks}
          tableName="Taxon"
          onChange={setActionRow}
          onRefresh={handleRefresh}
        />
      );
    }
    const { user } = mount(
      <MemoryRouter>
        <LoadingContext.Provider value={f.void}>
          <UnloadProtectsContext.Provider value={[]}>
            <SetUnloadProtectsContext.Provider value={f.void}>
              <TreeViewer />
            </SetUnloadProtectsContext.Provider>
          </UnloadProtectsContext.Provider>
        </LoadingContext.Provider>
      </MemoryRouter>
    );

    await user.click(
      screen.getByRole('button', {
        name: new RegExp(`^${treeText.move()}(\\s|$)`, 'u'),
      })
    );
    act(() => selectRow(target));
    await user.click(
      screen.getByRole('button', {
        name: treeText.moveNodeHere({ nodeName: source.fullName }),
      })
    );

    const dialog = await screen.findByRole('dialog', {
      name: treeText.moveNode(),
    });
    await user.click(
      within(dialog).getByRole('button', { name: treeText.moveNode() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(moveRequest).toHaveBeenCalledTimes(1);
  });
});
