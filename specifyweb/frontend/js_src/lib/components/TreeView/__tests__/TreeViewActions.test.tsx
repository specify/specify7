import { screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { f } from '../../../utils/functools';
import { commonText } from '../../../localization/common';
import { formsText } from '../../../localization/forms';
import { treeText } from '../../../localization/tree';
import { overrideAjax } from '../../../tests/ajax';
import { Http } from '../../../utils/ajax/definitions';
import { requireContext } from '../../../tests/helpers';
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

requireContext();

const portalRoot = document.createElement('div');
beforeAll(() => {
  portalRoot.id = 'portal-root';
  document.body.append(portalRoot);
});
afterAll(() => portalRoot.remove());

const ranks = [0, 10, 100, 140, 180, 220];

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
  const genusRankId = 9;
  const speciesRankId = 2;
  overrideTreeView('Taxon');
  (
    [
      [genusRankId, 'Genus', 180],
      [15, 'Subgenus', 190],
      [speciesRankId, 'Species', 220],
      [22, 'Subspecies', 230],
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
      name: 'Carpiodes',
      fullName: 'Carpiodes',
      rankId: 180,
      isAccepted: true,
      definition: getResourceApiUrl('TaxonTreeDef', 1),
      definitionItem: getResourceApiUrl('TaxonTreeDefItem', genusRankId),
      resource_uri: getResourceApiUrl('Taxon', parentId),
    })
  );

  overrideAjax(
    '/api/specify/taxon/',
    () =>
      addMissingFields('Taxon', {
        id: 3,
        name: 'velifer',
        parent: getResourceApiUrl('Taxon', parentId),
        resource_uri: getResourceApiUrl('Taxon', 3),
      }),
    {
      method: 'POST',
      responseCode: Http.CREATED,
      body: jsonContaining({
        name: 'velifer',
        parent: getResourceApiUrl('Taxon', parentId),
        definitionitem: getResourceApiUrl('TaxonTreeDefItem', speciesRankId),
      }),
    }
  );

  overrideAjax('/delete_blockers/delete_blockers/taxon/3/?limit=40', {
    results: [],
    next: [],
  });
  overrideAjax('/delete_blockers/count/taxon/3/', {
    results: [],
    total_count: 0,
  });
  overrideAjax(
    `/trees/specify_tree/taxon/${parentId}/predict_fullname/?name=velifer&treedefitemid=${speciesRankId}`,
    'Carpiodes velifer'
  );

  test('"Add child" saves a new Taxon under the focused node', async () => {
    const handleRefresh = jest.fn();
    const { user } = renderActions(
      'Taxon',
      makeRow({ nodeId: parentId }),
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
      name: 'Parent of Taxon',
    });
    await waitFor(() => expect(parent).toHaveValue('Carpiodes'));

    const rank = within(dialog).getByRole('combobox', { name: /rank/i });
    await user.click(rank);
    await user.clear(rank);
    await user.type(rank, 'Spe');
    await user.click(
      await screen.findByRole('option', {
        name: (_, element) => element.textContent === 'Species',
      })
    );

    await user.click(within(dialog).getByRole('textbox'));
    await user.paste('velifer');
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
