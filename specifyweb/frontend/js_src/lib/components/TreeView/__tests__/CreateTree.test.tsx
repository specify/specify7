import { screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { commonText } from '../../../localization/common';
import { formsText } from '../../../localization/forms';
import { treeText } from '../../../localization/tree';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { getCache, setCache } from '../../../utils/cache';
import { Http } from '../../../utils/ajax/definitions';
import { f } from '../../../utils/functools';
import type { IR, RA } from '../../../utils/types';
import { LoadingContext } from '../../Core/Contexts';
import { addMissingFields } from '../../DataModel/addMissingFields';
import type { AnySchema } from '../../DataModel/helperTypes';
import type { SpecifyResource } from '../../DataModel/legacyTypes';
import { getResourceApiUrl } from '../../DataModel/resource';
import { deserializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import { clearViewLocal } from '../../FormParse';
import { ResourceEdit } from '../../Molecules/ResourceLink';
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

overrideAjax('/trees/db_encoding/', { encoding: 'utf8mb4' });

const newTreeId = 5;
const disciplineUrl = getResourceApiUrl('Discipline', 3);

const nameRow =
  '<row><cell type="label" labelfor="name" /><cell type="field" id="name" uitype="text" name="name" /></row>';
const ranksRow =
  '<row><cell type="subview" id="items" name="treeDefItems" colspan="2" defaulttype="table" initialize="sortField=rankId" /></row>';

const jsonContaining = (expected: Record<string, unknown>): unknown => ({
  $$typeof: Symbol.for('jest.asymmetricMatcher'),
  asymmetricMatch: (actual: unknown): boolean =>
    typeof actual === 'string' &&
    expect.objectContaining(expected).asymmetricMatch(JSON.parse(actual)),
  toAsymmetricMatcher: (): string =>
    `JsonContaining ${JSON.stringify(expected)}`,
});

const formView = (
  tableName: 'TaxonTreeDef' | 'TaxonTreeDefItem',
  rows: RA<string>
): IR<unknown> => ({
  name: tableName,
  class: `edu.ku.brc.specify.datamodel.${tableName}`,
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
    [tableName]: `<viewdef name="${tableName}" type="form" class="edu.ku.brc.specify.datamodel.${tableName}" gettable="edu.ku.brc.af.ui.forms.DataGetterForObj" settable="edu.ku.brc.af.ui.forms.DataSetterForObj">
      <columnDef>p,p</columnDef>
      <rowDef>${rows.map(() => 'p').join(',')}</rowDef>
      <rows>
        ${rows.join('\n        ')}
      </rows>
    </viewdef>`,
  },
});

function useTaxonTreeDefForm(rows: RA<string>): void {
  beforeAll(() => clearViewLocal('TaxonTreeDef'));
  overrideAjax(
    '/context/view.json?name=TaxonTreeDef',
    formView('TaxonTreeDef', rows),
    {},
    true
  );
}

function mockNoDeleteBlockers(treeId: number): void {
  overrideAjax(
    `/delete_blockers/delete_blockers/taxontreedef/${treeId}/?limit=40`,
    { results: [], next: [] }
  );
  overrideAjax(`/delete_blockers/count/taxontreedef/${treeId}/`, {
    results: [],
    total_count: 0,
  });
}

const renderWithProviders = (element: JSX.Element): ReturnType<typeof mount> =>
  mount(
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

const newTreeDefinition = (
  fields: IR<unknown> = {}
): SpecifyResource<AnySchema> =>
  deserializeResource(
    addMissingFields('TaxonTreeDef', {
      id: newTreeId,
      name: treeText.emptyTree(),
      discipline: disciplineUrl,
      resource_uri: getResourceApiUrl('TaxonTreeDef', newTreeId),
      ...fields,
    })
  ) as SpecifyResource<AnySchema>;

async function openEmptyTreeForm(
  user: ReturnType<typeof mount>['user']
): Promise<HTMLElement> {
  await user.click(screen.getByRole('button', { name: treeText.addTree() }));
  const addTreeDialog = await screen.findByRole('dialog', {
    name: treeText.addTree(),
  });
  await user.click(
    within(addTreeDialog).getByRole('button', { name: treeText.emptyTree() })
  );
  return screen.findByRole('dialog', { name: /Taxon Tree/u });
}

async function openTreeForm(
  user: ReturnType<typeof mount>['user']
): Promise<HTMLElement> {
  await user.click(screen.getByRole('link', { name: commonText.edit() }));
  return screen.findByRole('dialog', {
    name: new RegExp(treeText.emptyTree(), 'u'),
  });
}

function spyOnNavigation(): {
  readonly hasNavigated: () => boolean;
  readonly onlyNavigationErrors: () => boolean;
  readonly restore: () => void;
} {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(f.void);
  const isNavigation = (error: unknown): boolean =>
    (error as Error | undefined)?.message?.startsWith(
      'Not implemented: navigation'
    ) === true;
  return {
    hasNavigated: (): boolean =>
      consoleError.mock.calls.some(([error]) => isNavigation(error)),
    onlyNavigationErrors: (): boolean =>
      consoleError.mock.calls.every(([error]) => isNavigation(error)),
    restore: (): void => consoleError.mockRestore(),
  };
}

describe('Add new taxon tree', () => {
  useTaxonTreeDefForm([nameRow]);
  const createRequest = jest.fn(() =>
    addMissingFields('TaxonTreeDef', {
      id: newTreeId,
      name: treeText.emptyTree(),
      resource_uri: getResourceApiUrl('TaxonTreeDef', newTreeId),
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
    const navigation = spyOnNavigation();
    const { user } = renderWithProviders(
      <CreateTree tableName="Taxon" treeDefinitions={[]} />
    );

    const form = await openEmptyTreeForm(user);
    await waitFor(() =>
      expect(within(form).getByRole('textbox')).toHaveValue(
        treeText.emptyTree()
      )
    );
    await user.click(
      within(form).getByRole('button', { name: commonText.save() })
    );

    await waitFor(() => expect(navigation.hasNavigated()).toBe(true));
    expect(createRequest).toHaveBeenCalledTimes(1);
    expect(navigation.onlyNavigationErrors()).toBe(true);
    navigation.restore();
  });
});

describe('Cannot add rank in tree creation dialog', () => {
  useTaxonTreeDefForm([nameRow, ranksRow]);
  overrideAjax(
    '/context/view.json?name=TaxonTreeDefItem',
    formView('TaxonTreeDefItem', [
      '<row><cell type="label" labelfor="1" /><cell type="field" id="1" name="name" uitype="text" /></row>',
    ])
  );
  beforeEach(() => {
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });
  afterEach(() => jest.restoreAllMocks());

  test('the ranks of a new tree have no enabled "Add" button', async () => {
    const { user } = renderWithProviders(
      <CreateTree tableName="Taxon" treeDefinitions={[]} />
    );

    const form = await openEmptyTreeForm(user);
    await waitFor(() =>
      expect(
        within(form)
          .getAllByRole('textbox')
          .map((input) => (input as HTMLInputElement).value)
      ).toContain('Life')
    );
    const ranks = within(form).getByRole('group', {
      name: new RegExp(
        `^${tables.TaxonTreeDef.strictGetRelationship('treeDefItems').label}`,
        'u'
      ),
    });
    expect(
      within(ranks)
        .queryAllByRole('button', {
          name: new RegExp(`^${commonText.add()}`, 'u'),
        })
        .filter((button) => !(button as HTMLButtonElement).disabled)
    ).toHaveLength(0);
  });
});

describe('Delete new taxon tree', () => {
  const defaultTreeId = 1;
  const deleteRequest = jest.fn(() => '');
  useTaxonTreeDefForm([nameRow]);
  mockNoDeleteBlockers(newTreeId);
  overrideAjax(getResourceApiUrl('TaxonTreeDef', newTreeId), deleteRequest, {
    method: 'DELETE',
    responseCode: Http.NO_CONTENT,
  });

  test('deleting the new tree returns to the default taxon tree', async () => {
    const navigation = spyOnNavigation();
    setCache('tree', 'definitionTaxon', newTreeId);
    const { user } = renderWithProviders(
      <ResourceEdit resource={newTreeDefinition()} />
    );

    const form = await openTreeForm(user);
    await user.click(
      await within(form).findByRole('button', { name: commonText.delete() })
    );
    const confirmation = await screen.findByRole('dialog', {
      name: formsText.deleteConfirmation({
        tableName: tables.TaxonTreeDef.label,
      }),
    });
    await user.click(
      within(confirmation).getByRole('button', { name: commonText.delete() })
    );

    await waitFor(() => expect(navigation.hasNavigated()).toBe(true));
    expect(deleteRequest).toHaveBeenCalledTimes(1);
    expect(getCache('tree', 'definitionTaxon')).toBe(defaultTreeId);
    expect(navigation.onlyNavigationErrors()).toBe(true);
    navigation.restore();
  });
});

describe('Rename tree', () => {
  const newName = 'Ichthyology Taxonomy';
  const saveRequest = jest.fn(() =>
    addMissingFields('TaxonTreeDef', {
      id: newTreeId,
      name: newName,
      version: 1,
      discipline: disciplineUrl,
      resource_uri: getResourceApiUrl('TaxonTreeDef', newTreeId),
    })
  );
  useTaxonTreeDefForm([nameRow]);
  mockNoDeleteBlockers(newTreeId);
  overrideAjax(
    `/api/specify/taxontreedef/?${new URLSearchParams({
      domainfilter: 'false',
      name: newName,
      discipline: '3',
      offset: '0',
    }).toString()}`,
    { objects: [], meta: { limit: 20, offset: 0, total_count: 0 } }
  );
  overrideAjax(getResourceApiUrl('TaxonTreeDef', newTreeId), saveRequest, {
    method: 'PUT',
    body: jsonContaining({ name: newName }),
  });

  test('saving a new name in the tree form renames the tree', async () => {
    const handleSaved = jest.fn();
    const { user } = renderWithProviders(
      <ResourceEdit
        resource={newTreeDefinition({ version: 0 })}
        onSaved={handleSaved}
      />
    );

    const form = await openTreeForm(user);
    const name = within(form).getByRole('textbox');
    await waitFor(() => expect(name).toHaveValue(treeText.emptyTree()));
    await user.tripleClick(name);
    await user.paste(newName);
    await user.click(
      within(form).getByRole('button', { name: commonText.save() })
    );

    await waitFor(() => expect(handleSaved).toHaveBeenCalled());
    expect(saveRequest).toHaveBeenCalledTimes(1);
  });
});
