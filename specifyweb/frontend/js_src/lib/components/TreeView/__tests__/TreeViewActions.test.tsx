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
import { genericTables, tables } from '../../DataModel/tables';
import { collectionPreferences } from '../../Preferences/collectionPreferences';
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

const withProviders = (element: JSX.Element): JSX.Element => (
  <MemoryRouter>
    <LoadingContext.Provider value={f.void}>
      <UnloadProtectsContext.Provider value={[]}>
        <SetUnloadProtectsContext.Provider value={f.void}>
          {element}
        </SetUnloadProtectsContext.Provider>
      </UnloadProtectsContext.Provider>
    </LoadingContext.Provider>
  </MemoryRouter>
);

function renderActions(
  tableName: AnyTree['tableName'],
  focusedRow: Row,
  handleRefresh: () => void = jest.fn(),
  focusPath: GetSet<RA<number>> = [[], jest.fn()]
): ReturnType<typeof mount> {
  return mount(
    withProviders(
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
    )
  );
}

function renderTreeViewer(
  tableName: AnyTree['tableName'],
  selectedRow: Row,
  handleRefresh: () => void
): {
  readonly user: ReturnType<typeof mount>['user'];
  readonly selectRow: (row: Row) => void;
} {
  let setSelectedRow: (row: Row) => void = f.void;
  function TreeViewer(): JSX.Element {
    const [focusedRow, setFocusedRow] = React.useState<Row>(selectedRow);
    const [actionRow, setActionRow] = React.useState<Row | undefined>(
      undefined
    );
    setSelectedRow = setFocusedRow;
    return (
      <TreeViewActions
        actionRow={actionRow}
        focusPath={[[], jest.fn()]}
        focusRef={{ current: null }}
        focusedRow={focusedRow}
        ranks={ranks}
        tableName={tableName}
        onChange={setActionRow}
        onRefresh={handleRefresh}
      />
    );
  }
  return {
    user: mount(withProviders(<TreeViewer />)).user,
    selectRow: (row): void => act(() => setSelectedRow(row)),
  };
}

const jsonContaining = (expected: Record<string, unknown>): unknown => ({
  $$typeof: Symbol.for('jest.asymmetricMatcher'),
  asymmetricMatch: (actual: unknown): boolean =>
    typeof actual === 'string' &&
    expect.objectContaining(expected).asymmetricMatch(JSON.parse(actual)),
  toAsymmetricMatcher: (): string =>
    `JsonContaining ${JSON.stringify(expected)}`,
});

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

type TreeNode = {
  readonly id: number;
  readonly name: string;
  readonly fullName: string;
  readonly rankId: number;
};

type RankedNode = TreeNode & {
  readonly rankItemId: number;
  readonly rankName: string;
};

const treeDefinitionUrl = (tableName: AnyTree['tableName']): string =>
  getResourceApiUrl(`${tableName}TreeDef`, 1);

const rankItemUrl = (tableName: AnyTree['tableName'], id: number): string =>
  getResourceApiUrl(`${tableName}TreeDefItem`, id);

function mockNoDeleteBlockers(
  tableName: AnyTree['tableName'],
  id: number
): void {
  const table = tableName.toLowerCase();
  overrideAjax(`/delete_blockers/delete_blockers/${table}/${id}/?limit=40`, {
    results: [],
    next: [],
  });
  overrideAjax(`/delete_blockers/count/${table}/${id}/`, {
    results: [],
    total_count: 0,
  });
}

function mockAddChild(
  tableName: AnyTree['tableName'],
  parent: RankedNode,
  child: RankedNode
): void {
  overrideTreeView(tableName);
  [parent, child].forEach(({ rankItemId, rankName, rankId }) =>
    overrideAjax(rankItemUrl(tableName, rankItemId), () =>
      addMissingFields(`${tableName}TreeDefItem`, {
        id: rankItemId,
        name: rankName,
        rankId,
        treeDef: treeDefinitionUrl(tableName),
        resource_uri: rankItemUrl(tableName, rankItemId),
      })
    )
  );
  overrideAjax(getResourceApiUrl(tableName, parent.id), () =>
    addMissingFields(tableName, {
      id: parent.id,
      name: parent.name,
      fullName: parent.fullName,
      rankId: parent.rankId,
      isAccepted: true,
      definition: treeDefinitionUrl(tableName),
      definitionItem: rankItemUrl(tableName, parent.rankItemId),
      resource_uri: getResourceApiUrl(tableName, parent.id),
    })
  );
  overrideAjax(
    `/api/specify/${tableName.toLowerCase()}/`,
    () =>
      addMissingFields(tableName, {
        id: child.id,
        name: child.name,
        parent: getResourceApiUrl(tableName, parent.id),
        resource_uri: getResourceApiUrl(tableName, child.id),
      }),
    {
      method: 'POST',
      responseCode: Http.CREATED,
      body: jsonContaining({
        name: child.name,
        parent: getResourceApiUrl(tableName, parent.id),
        definitionitem: rankItemUrl(tableName, child.rankItemId),
      }),
    }
  );
  mockNoDeleteBlockers(tableName, child.id);
  overrideAjax(
    `/trees/specify_tree/${tableName.toLowerCase()}/${parent.id}/predict_fullname/?${new URLSearchParams(
      { name: child.name, treedefitemid: child.rankItemId.toString() }
    ).toString()}`,
    child.fullName
  );
}

async function addChildFromTreeViewer(
  tableName: AnyTree['tableName'],
  parent: RankedNode,
  child: RankedNode,
  handleRefresh: () => void
): Promise<void> {
  const { user } = renderActions(
    tableName,
    makeRow({
      nodeId: parent.id,
      name: parent.name,
      fullName: parent.fullName,
      rankId: parent.rankId,
    }),
    handleRefresh
  );

  const addChild = screen.getByRole('link', {
    name: new RegExp(`^${treeText.addChild()}`, 'u'),
  });
  expect(addChild).toHaveAttribute('aria-disabled', 'false');
  expect(addChild).toHaveAttribute(
    'href',
    `/specify/view/${tableName.toLowerCase()}/new/`
  );

  await user.click(addChild);

  const table = genericTables[tableName];
  const dialog = await screen.findByRole('dialog');
  const parentField = within(dialog).getByRole('combobox', {
    name: table.strictGetRelationship('parent').label,
  });
  await waitFor(() => expect(parentField).toHaveValue(parent.fullName));

  const rank = within(dialog).getByRole('combobox', {
    name: table.strictGetRelationship('definitionItem').label,
  });
  await waitFor(() => expect(rank).toHaveValue(child.rankName));

  await user.click(within(dialog).getByRole('textbox'));
  await user.paste(child.name);
  await user.click(
    within(dialog).getByRole('button', { name: commonText.save() })
  );
}

function mockDeletableNode(
  tableName: AnyTree['tableName'],
  node: TreeNode,
  parentId: number
): jest.Mock {
  const deleteRequest = jest.fn(() => '');
  overrideAjax(getResourceApiUrl(tableName, node.id), () =>
    addMissingFields(tableName, {
      id: node.id,
      name: node.name,
      fullName: node.fullName,
      rankId: node.rankId,
      parent: getResourceApiUrl(tableName, parentId),
      resource_uri: getResourceApiUrl(tableName, node.id),
    })
  );
  mockNoDeleteBlockers(tableName, node.id);
  overrideAjax(getResourceApiUrl(tableName, node.id), deleteRequest, {
    method: 'DELETE',
    responseCode: Http.NO_CONTENT,
  });
  return deleteRequest;
}

async function deleteFromTreeViewer(
  tableName: AnyTree['tableName'],
  node: TreeNode & { readonly children?: number },
  focusPath: RA<number>,
  handleRefresh: () => void,
  setFocusPath: (path: RA<number>) => void
): Promise<void> {
  const { user } = renderActions(
    tableName,
    makeRow({
      nodeId: node.id,
      name: node.name,
      fullName: node.fullName,
      rankId: node.rankId,
      children: node.children ?? 0,
    }),
    handleRefresh,
    [focusPath, setFocusPath]
  );

  await user.click(screen.getByRole('button', { name: commonText.delete() }));

  const dialog = await screen.findByRole('dialog', {
    name: formsText.deleteConfirmation({
      tableName: genericTables[tableName].label,
    }),
  });
  await user.click(
    within(dialog).getByRole('button', { name: commonText.delete() })
  );
}

describe('Add taxon', () => {
  const parent = {
    id: 2,
    name: 'velifer',
    fullName: 'Carpiodes velifer',
    rankId: 220,
    rankItemId: 2,
    rankName: 'Species',
  };
  const child = {
    id: 3,
    name: 'bellus',
    fullName: 'Carpiodes velifer bellus',
    rankId: 230,
    rankItemId: 22,
    rankName: 'Subspecies',
  };
  mockAddChild('Taxon', parent, child);

  test('"Add child" saves a new Taxon under the focused node', async () => {
    const handleRefresh = jest.fn();
    await addChildFromTreeViewer('Taxon', parent, child, handleRefresh);
    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
  });
});

describe('Delete taxon', () => {
  const node = {
    id: 4,
    name: 'velifer',
    fullName: 'Carpiodes velifer',
    rankId: 220,
  };
  const deleteRequest = mockDeletableNode('Taxon', node, 2);

  test('"Delete" removes the focused node and focuses its parent', async () => {
    const handleRefresh = jest.fn();
    const setFocusPath = jest.fn();
    await deleteFromTreeViewer(
      'Taxon',
      node,
      [1, 2, 4],
      handleRefresh,
      setFocusPath
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(deleteRequest).toHaveBeenCalledTimes(1);
    expect(setFocusPath).toHaveBeenCalledWith([1, 2]);
  });
});

describe('Add geography', () => {
  const parent = {
    id: 10,
    name: 'Kansas',
    fullName: 'Kansas',
    rankId: 300,
    rankItemId: 4,
    rankName: 'State',
  };
  const child = {
    id: 11,
    name: 'Douglas',
    fullName: 'Douglas, Kansas',
    rankId: 400,
    rankItemId: 5,
    rankName: 'County',
  };
  mockAddChild('Geography', parent, child);

  test('"Add child" saves a new Geography under the focused node', async () => {
    const handleRefresh = jest.fn();
    await addChildFromTreeViewer('Geography', parent, child, handleRefresh);
    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
  });
});

describe('Delete geography', () => {
  const node = { id: 11, name: 'Kansas', fullName: 'Kansas, USA', rankId: 300 };
  const deleteRequest = mockDeletableNode('Geography', node, 10);

  test('"Delete" removes the focused node and focuses its parent', async () => {
    const handleRefresh = jest.fn();
    const setFocusPath = jest.fn();
    await deleteFromTreeViewer(
      'Geography',
      node,
      [1, 10, 11],
      handleRefresh,
      setFocusPath
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(deleteRequest).toHaveBeenCalledTimes(1);
    expect(setFocusPath).toHaveBeenCalledWith([1, 10]);
  });
});

describe('Add storage', () => {
  const parent = {
    id: 20,
    name: 'Dyche Hall',
    fullName: 'Dyche Hall',
    rankId: 100,
    rankItemId: 2,
    rankName: 'Building',
  };
  const child = {
    id: 21,
    name: 'Fish Room',
    fullName: 'Dyche Hall Fish Room',
    rankId: 200,
    rankItemId: 3,
    rankName: 'Room',
  };
  mockAddChild('Storage', parent, child);

  test('"Add child" saves a new Storage under the focused node', async () => {
    const handleRefresh = jest.fn();
    await addChildFromTreeViewer('Storage', parent, child, handleRefresh);
    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
  });
});

describe('Delete storage', () => {
  const node = {
    id: 21,
    name: 'Fish Room',
    fullName: 'Dyche Hall Fish Room',
    rankId: 200,
  };
  const deleteRequest = mockDeletableNode('Storage', node, 20);

  test('"Delete" removes the focused node and focuses its parent', async () => {
    const handleRefresh = jest.fn();
    const setFocusPath = jest.fn();
    await deleteFromTreeViewer(
      'Storage',
      node,
      [1, 20, 21],
      handleRefresh,
      setFocusPath
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(deleteRequest).toHaveBeenCalledTimes(1);
    expect(setFocusPath).toHaveBeenCalledWith([1, 20]);
  });
});

describe('Move storage items to another node', () => {
  const sourceId = 30;
  const targetId = 31;
  const moveRequest = jest.fn(() => '');
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
    const { user, selectRow } = renderTreeViewer(
      'Storage',
      source,
      handleRefresh
    );

    await user.click(
      screen.getByRole('button', {
        name: new RegExp(`^${treeText.moveItems()}`, 'u'),
      })
    );
    selectRow(target);
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
  const parent = {
    id: 40,
    name: 'Paleocene',
    fullName: 'Paleocene',
    rankId: 300,
    rankItemId: 4,
    rankName: 'Epoch',
  };
  const child = {
    id: 41,
    name: 'Danian',
    fullName: 'Danian',
    rankId: 400,
    rankItemId: 5,
    rankName: 'Age',
  };
  mockAddChild('GeologicTimePeriod', parent, child);

  test('"Add child" saves a new GeologicTimePeriod under the focused node', async () => {
    const handleRefresh = jest.fn();
    await addChildFromTreeViewer(
      'GeologicTimePeriod',
      parent,
      child,
      handleRefresh
    );
    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
  });
});

describe('Delete a chronostrat', () => {
  const node = { id: 41, name: 'Danian', fullName: 'Danian', rankId: 400 };
  const deleteRequest = mockDeletableNode('GeologicTimePeriod', node, 40);

  test('"Delete" removes the focused node and focuses its parent', async () => {
    const handleRefresh = jest.fn();
    const setFocusPath = jest.fn();
    await deleteFromTreeViewer(
      'GeologicTimePeriod',
      node,
      [1, 40, 41],
      handleRefresh,
      setFocusPath
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(deleteRequest).toHaveBeenCalledTimes(1);
    expect(setFocusPath).toHaveBeenCalledWith([1, 40]);
  });
});

describe('Add a lithostrat', () => {
  const parent = {
    id: 50,
    name: 'Plattsmouth',
    fullName: 'Plattsmouth',
    rankId: 400,
    rankItemId: 4,
    rankName: 'Member',
  };
  const child = {
    id: 51,
    name: 'Unit A',
    fullName: 'Unit A',
    rankId: 500,
    rankItemId: 5,
    rankName: 'Bed',
  };
  mockAddChild('LithoStrat', parent, child);

  test('"Add child" saves a new LithoStrat under the focused node', async () => {
    const handleRefresh = jest.fn();
    await addChildFromTreeViewer('LithoStrat', parent, child, handleRefresh);
    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
  });
});

describe('Delete a lithostrat', () => {
  const node = { id: 51, name: 'Unit A', fullName: 'Unit A', rankId: 500 };
  const deleteRequest = mockDeletableNode('LithoStrat', node, 50);

  test('"Delete" removes the focused node and focuses its parent', async () => {
    const handleRefresh = jest.fn();
    const setFocusPath = jest.fn();
    await deleteFromTreeViewer(
      'LithoStrat',
      node,
      [1, 50, 51],
      handleRefresh,
      setFocusPath
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(deleteRequest).toHaveBeenCalledTimes(1);
    expect(setFocusPath).toHaveBeenCalledWith([1, 50]);
  });
});

describe('Add tectonic unit', () => {
  const parent = {
    id: 60,
    name: 'Ozark Plateau',
    fullName: 'Ozark Plateau',
    rankId: 40,
    rankItemId: 5,
    rankName: 'Tectonic Unit',
  };
  const child = {
    id: 61,
    name: 'Springfield Plateau',
    fullName: 'Springfield Plateau',
    rankId: 50,
    rankItemId: 6,
    rankName: 'Tectonic Subunit',
  };
  mockAddChild('TectonicUnit', parent, child);

  test('"Add child" saves a new TectonicUnit under the focused node', async () => {
    const handleRefresh = jest.fn();
    await addChildFromTreeViewer('TectonicUnit', parent, child, handleRefresh);
    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
  });
});

describe('Delete tectonic unit', () => {
  const node = {
    id: 61,
    name: 'Springfield Plateau',
    fullName: 'Springfield Plateau',
    rankId: 50,
  };
  const deleteRequest = mockDeletableNode('TectonicUnit', node, 60);

  test('"Delete" removes the focused node and focuses its parent', async () => {
    const handleRefresh = jest.fn();
    const setFocusPath = jest.fn();
    await deleteFromTreeViewer(
      'TectonicUnit',
      node,
      [1, 60, 61],
      handleRefresh,
      setFocusPath
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(deleteRequest).toHaveBeenCalledTimes(1);
    expect(setFocusPath).toHaveBeenCalledWith([1, 60]);
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
  const node = {
    id: 8,
    name: 'Ictiobus',
    fullName: 'Ictiobus',
    rankId: 180,
    children: 2,
  };
  const deleteRequest = mockDeletableNode('Taxon', node, 1);

  test('"Delete" removes a node that has children', async () => {
    const handleRefresh = jest.fn();
    const setFocusPath = jest.fn();
    await deleteFromTreeViewer(
      'Taxon',
      node,
      [1, 8],
      handleRefresh,
      setFocusPath
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(deleteRequest).toHaveBeenCalledTimes(1);
    expect(setFocusPath).toHaveBeenCalledWith([1]);
  });
});

describe('Move', () => {
  const sourceId = 4;
  const targetId = 8;
  const moveRequest = jest.fn(() => '');
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
    const { user, selectRow } = renderTreeViewer(
      'Taxon',
      source,
      handleRefresh
    );

    await user.click(
      screen.getByRole('button', {
        name: new RegExp(`^${treeText.move()}(\\s|$)`, 'u'),
      })
    );
    selectRow(target);
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

describe('Merge', () => {
  const sourceId = 4;
  const targetId = 7;
  const mergeRequest = jest.fn(() => '');
  (
    [
      [sourceId, 'velifer', 'Carpiodes velifer'],
      [targetId, 'carpio', 'Carpiodes carpio'],
    ] as const
  ).forEach(([id, name, fullName]) =>
    overrideAjax(getResourceApiUrl('Taxon', id), () =>
      addMissingFields('Taxon', {
        id,
        name,
        fullName,
        rankId: 220,
        resource_uri: getResourceApiUrl('Taxon', id),
      })
    )
  );
  overrideAjax(`/trees/specify_tree/taxon/${sourceId}/merge/`, mergeRequest, {
    method: 'POST',
    responseCode: Http.OK,
    body: formDataContaining({ target: targetId.toString() }),
  });

  test('"Merge" merges the node into the selected node', async () => {
    const source = makeRow({
      nodeId: sourceId,
      name: 'velifer',
      fullName: 'Carpiodes velifer',
      rankId: 220,
      children: 0,
    });
    const target = makeRow({
      nodeId: targetId,
      name: 'carpio',
      fullName: 'Carpiodes carpio',
      rankId: 220,
      children: 0,
    });
    const handleRefresh = jest.fn();
    const { user, selectRow } = renderTreeViewer(
      'Taxon',
      source,
      handleRefresh
    );

    await user.click(
      screen.getByRole('button', {
        name: new RegExp(`^${treeText.merge()}(\\s|$)`, 'u'),
      })
    );
    selectRow(target);
    await user.click(
      screen.getByRole('button', {
        name: treeText.mergeNodeHere({ nodeName: source.fullName }),
      })
    );

    const dialog = await screen.findByRole('dialog', {
      name: treeText.mergeNode(),
    });
    await user.click(
      within(dialog).getByRole('button', { name: treeText.mergeNode() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(mergeRequest).toHaveBeenCalledTimes(1);
  });
});

describe('Synonymize', () => {
  const sourceId = 4;
  const targetId = 7;
  const synonymizeRequest = jest.fn(() => '');
  (
    [
      [sourceId, 'velifer', 'Carpiodes velifer'],
      [targetId, 'carpio', 'Carpiodes carpio'],
    ] as const
  ).forEach(([id, name, fullName]) =>
    overrideAjax(getResourceApiUrl('Taxon', id), () =>
      addMissingFields('Taxon', {
        id,
        name,
        fullName,
        rankId: 220,
        resource_uri: getResourceApiUrl('Taxon', id),
      })
    )
  );
  overrideAjax(
    `/trees/specify_tree/taxon/${sourceId}/synonymize/`,
    synonymizeRequest,
    {
      method: 'POST',
      responseCode: Http.OK,
      body: formDataContaining({ target: targetId.toString() }),
    }
  );

  test('"Synonymize" makes the node a synonym of the selected node', async () => {
    const source = makeRow({
      nodeId: sourceId,
      name: 'velifer',
      fullName: 'Carpiodes velifer',
      rankId: 220,
      children: 0,
    });
    const target = makeRow({
      nodeId: targetId,
      name: 'carpio',
      fullName: 'Carpiodes carpio',
      rankId: 220,
      children: 0,
    });
    const handleRefresh = jest.fn();
    const { user, selectRow } = renderTreeViewer(
      'Taxon',
      source,
      handleRefresh
    );

    await user.click(
      screen.getByRole('button', {
        name: new RegExp(`^${treeText.synonymize()}(\\s|$)`, 'u'),
      })
    );
    selectRow(target);
    await user.click(
      screen.getByRole('button', {
        name: treeText.makeSynonym({
          nodeName: source.fullName,
          synonymName: target.fullName,
        }),
      })
    );

    const dialog = await screen.findByRole('dialog', {
      name: treeText.synonymizeNode(),
    });
    await user.click(
      within(dialog).getByRole('button', { name: treeText.synonymizeNode() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(synonymizeRequest).toHaveBeenCalledTimes(1);
  });
});

describe('Children can only be added to synonymized nodes if stated in Collection Prefs', () => {
  const synonym = makeRow({
    nodeId: 9,
    name: 'cyprinus',
    fullName: 'Carpiodes cyprinus',
    rankId: 220,
    acceptedId: 4,
    acceptedName: 'Carpiodes velifer',
    children: 0,
  });
  const addChildName = new RegExp(`^${treeText.addChild()}`, 'u');
  overrideAjax(getResourceApiUrl('Taxon', synonym.nodeId), () =>
    addMissingFields('Taxon', {
      id: synonym.nodeId,
      name: synonym.name,
      fullName: synonym.fullName,
      rankId: synonym.rankId,
      isAccepted: false,
      acceptedTaxon: getResourceApiUrl('Taxon', 4),
      resource_uri: getResourceApiUrl('Taxon', synonym.nodeId),
    })
  );
  let originalPreferences: ReturnType<typeof collectionPreferences.getRaw>;
  beforeEach(() => {
    originalPreferences = collectionPreferences.getRaw();
  });
  afterEach(() => collectionPreferences.setRaw(originalPreferences));

  function allowChildrenOfSynonyms(allow: boolean): void {
    collectionPreferences.setRaw({
      ...originalPreferences,
      treeManagement: {
        ...originalPreferences.treeManagement,
        synonymized: {
          ...originalPreferences.treeManagement?.synonymized,
          'sp7.allow_adding_child_to_synonymized_parent.Taxon': allow,
        },
      },
    } as typeof originalPreferences);
  }

  test('"Add child" is disabled for a synonym when the preference is off', () => {
    allowChildrenOfSynonyms(false);
    renderActions('Taxon', synonym);

    expect(screen.getByRole('button', { name: addChildName })).toBeDisabled();
    expect(
      screen.queryByRole('link', { name: addChildName })
    ).not.toBeInTheDocument();
  });

  test('"Add child" is enabled for a synonym when the preference is on', () => {
    allowChildrenOfSynonyms(true);
    renderActions('Taxon', synonym);

    expect(screen.getByRole('link', { name: addChildName })).toHaveAttribute(
      'aria-disabled',
      'false'
    );
  });
});

describe('Add a child node to a parent then edit it to a lower rank', () => {
  const parentId = 2;
  const nodeId = 12;
  const genusRankId = 9;
  const speciesRankId = 2;
  const subspeciesRankId = 22;
  const saveRequest = jest.fn(() =>
    addMissingFields('Taxon', {
      id: nodeId,
      name: 'velifer',
      fullName: 'Carpiodes velifer',
      rankId: 230,
      version: 1,
      isAccepted: true,
      parent: getResourceApiUrl('Taxon', parentId),
      definition: treeDefinitionUrl('Taxon'),
      definitionItem: rankItemUrl('Taxon', subspeciesRankId),
      resource_uri: getResourceApiUrl('Taxon', nodeId),
    })
  );
  overrideTreeView('Taxon');
  (
    [
      [genusRankId, 'Genus', 180],
      [15, 'Subgenus', 190],
      [speciesRankId, 'Species', 220],
      [subspeciesRankId, 'Subspecies', 230],
    ] as const
  ).forEach(([id, name, rankId]) =>
    overrideAjax(rankItemUrl('Taxon', id), () =>
      addMissingFields('TaxonTreeDefItem', {
        id,
        name,
        rankId,
        treeDef: treeDefinitionUrl('Taxon'),
        resource_uri: rankItemUrl('Taxon', id),
      })
    )
  );
  overrideAjax(getResourceApiUrl('Taxon', parentId), () =>
    addMissingFields('Taxon', {
      id: parentId,
      name: 'Carpiodes',
      fullName: 'Carpiodes',
      rankId: 180,
      isAccepted: true,
      definition: treeDefinitionUrl('Taxon'),
      definitionItem: rankItemUrl('Taxon', genusRankId),
      resource_uri: getResourceApiUrl('Taxon', parentId),
    })
  );
  overrideAjax(getResourceApiUrl('Taxon', nodeId), () =>
    addMissingFields('Taxon', {
      id: nodeId,
      name: 'velifer',
      fullName: 'Carpiodes velifer',
      rankId: 220,
      version: 0,
      isAccepted: true,
      parent: getResourceApiUrl('Taxon', parentId),
      definition: treeDefinitionUrl('Taxon'),
      definitionItem: rankItemUrl('Taxon', speciesRankId),
      resource_uri: getResourceApiUrl('Taxon', nodeId),
    })
  );
  mockNoDeleteBlockers('Taxon', nodeId);
  const predictFullName = jest.fn(() => 'Carpiodes velifer');
  overrideAjax(
    `/trees/specify_tree/taxon/${parentId}/predict_fullname/?name=velifer&treedefitemid=${subspeciesRankId}`,
    predictFullName
  );
  [
    `/api/specify/taxon/?limit=1&parent=${nodeId}&orderby=rankid`,
    `/api/specify/taxon/?limit=1&orderby=rankid&parent_id=${nodeId}`,
  ].forEach((url) =>
    overrideAjax(url, {
      objects: [],
      meta: { limit: 1, offset: 0, total_count: 0 },
    })
  );
  overrideAjax(getResourceApiUrl('Taxon', nodeId), saveRequest, {
    method: 'PUT',
    body: jsonContaining({
      definitionitem: rankItemUrl('Taxon', subspeciesRankId),
    }),
  });

  test('"Edit" saves the node with a lower rank', async () => {
    const handleRefresh = jest.fn();
    const { user } = renderActions(
      'Taxon',
      makeRow({
        nodeId,
        name: 'velifer',
        fullName: 'Carpiodes velifer',
        rankId: 220,
        children: 0,
      }),
      handleRefresh
    );

    await user.click(
      screen.getByRole('link', {
        name: new RegExp(`^${commonText.edit()}`, 'u'),
      })
    );
    const dialog = await screen.findByRole('dialog');
    const rank = within(dialog).getByRole('combobox', {
      name: tables.Taxon.strictGetRelationship('definitionItem').label,
    });
    await waitFor(() => expect(rank).toHaveValue('Species'));
    await waitFor(() =>
      expect(within(dialog).getByRole('textbox')).toHaveValue('velifer')
    );
    await waitFor(() =>
      expect(
        within(dialog).getByRole('combobox', {
          name: tables.Taxon.strictGetRelationship('parent').label,
        })
      ).toHaveValue('Carpiodes')
    );

    await user.click(
      within(rank.parentElement!).getByRole('button', {
        name: commonText.expand(),
      })
    );
    const subspecies = await screen.findByRole('option', {
      name: (_, element) => element.textContent === 'Subspecies',
    });
    await user.pointer([
      { target: subspecies, coords: { screenX: 10, screenY: 10 } },
      { target: subspecies, coords: { screenX: 12, screenY: 12 } },
    ]);
    await waitFor(() =>
      expect(subspecies.dataset.headlessuiState).toContain('active')
    );
    await user.click(subspecies);
    await waitFor(() => expect(rank).toHaveValue('Subspecies'));
    await waitFor(() => expect(predictFullName).toHaveBeenCalled());

    await user.click(
      within(dialog).getByRole('button', { name: commonText.save() })
    );

    await waitFor(() => expect(handleRefresh).toHaveBeenCalled());
    expect(saveRequest).toHaveBeenCalledTimes(1);
  });
});
