import { screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { commonText } from '../../../localization/common';
import { treeText } from '../../../localization/tree';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { Http } from '../../../utils/ajax/definitions';
import { f } from '../../../utils/functools';
import { LoadingContext } from '../../Core/Contexts';
import { addMissingFields } from '../../DataModel/addMissingFields';
import { getResourceApiUrl } from '../../DataModel/resource';
import {
  SetUnloadProtectsContext,
  UnloadProtectsContext,
} from '../../Router/UnloadProtect';
import { CreateTree } from '../CreateTree';

requireContext();

const portalRoot = document.createElement('div');
beforeAll(() => {
  portalRoot.id = 'portal-root';
  document.body.append(portalRoot);
});
afterAll(() => portalRoot.remove());

const originalFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => [],
  })) as unknown as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

const jsonContaining = (expected: Record<string, unknown>): unknown => ({
  $$typeof: Symbol.for('jest.asymmetricMatcher'),
  asymmetricMatch: (actual: unknown): boolean =>
    typeof actual === 'string' &&
    expect.objectContaining(expected).asymmetricMatch(JSON.parse(actual)),
  toAsymmetricMatcher: (): string =>
    `JsonContaining ${JSON.stringify(expected)}`,
});

overrideAjax('/trees/db_encoding/', { encoding: 'utf8mb4' });
overrideAjax('/context/view.json?name=TaxonTreeDef', {
  name: 'TaxonTreeDef',
  class: 'edu.ku.brc.specify.datamodel.TaxonTreeDef',
  isinternal: 'false',
  resourcelabels: 'false',
  altviews: {
    'TaxonTreeDef Edit': {
      name: 'TaxonTreeDef Edit',
      viewdef: 'TaxonTreeDef',
      mode: 'edit',
      default: 'true',
    },
  },
  viewdefs: {
    TaxonTreeDef: `<viewdef name="TaxonTreeDef" type="form" class="edu.ku.brc.specify.datamodel.TaxonTreeDef" gettable="edu.ku.brc.af.ui.forms.DataGetterForObj" settable="edu.ku.brc.af.ui.forms.DataSetterForObj">
      <columnDef>p,p</columnDef>
      <rowDef>p</rowDef>
      <rows>
        <row><cell type="label" labelfor="name" /><cell type="field" id="name" uitype="text" name="name" /></row>
      </rows>
    </viewdef>`,
  },
});

describe('Add new taxon tree', () => {
  const createRequest = jest.fn(() =>
    addMissingFields('TaxonTreeDef', {
      id: 5,
      name: treeText.emptyTree(),
      resource_uri: getResourceApiUrl('TaxonTreeDef', 5),
    })
  );
  overrideAjax('/api/specify/taxontreedef/', createRequest, {
    method: 'POST',
    responseCode: Http.CREATED,
    body: jsonContaining({
      name: treeText.emptyTree(),
      treedefitems: [expect.objectContaining({ name: 'Life', rankid: 0 })],
    }),
  });

  test('an empty tree can be created from the "Add Tree" dialog', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(f.void);
    const isReload = (error: unknown): boolean =>
      (error as Error | undefined)?.message?.startsWith(
        'Not implemented: navigation'
      ) === true;
    const { user } = mount(
      <MemoryRouter>
        <LoadingContext.Provider value={f.void}>
          <UnloadProtectsContext.Provider value={[]}>
            <SetUnloadProtectsContext.Provider value={f.void}>
              <CreateTree tableName="Taxon" treeDefinitions={[]} />
            </SetUnloadProtectsContext.Provider>
          </UnloadProtectsContext.Provider>
        </LoadingContext.Provider>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: treeText.addTree() }));
    const addTreeDialog = await screen.findByRole('dialog', {
      name: treeText.addTree(),
    });
    await user.click(
      within(addTreeDialog).getByRole('button', { name: treeText.emptyTree() })
    );

    const form = await screen.findByRole('dialog', { name: /Taxon Tree/u });
    await waitFor(() =>
      expect(within(form).getByRole('textbox')).toHaveValue(
        treeText.emptyTree()
      )
    );
    await user.click(
      within(form).getByRole('button', { name: commonText.save() })
    );

    await waitFor(() =>
      expect(consoleError.mock.calls.some(([error]) => isReload(error))).toBe(
        true
      )
    );
    expect(createRequest).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls.every(([error]) => isReload(error))).toBe(
      true
    );
    consoleError.mockRestore();
  });
});
