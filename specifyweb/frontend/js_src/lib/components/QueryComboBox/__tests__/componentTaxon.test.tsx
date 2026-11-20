import { act, cleanup, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { localized } from '../../../utils/types';
import { LoadingContext } from '../../Core/Contexts';
import { getResourceApiUrl } from '../../DataModel/resource';
import { tables } from '../../DataModel/tables';
import { SaveButton } from '../../Forms/Save';
import * as permissions from '../../Permissions/helpers';
import { queryFieldFilterSpecs } from '../../QueryBuilder/FieldFilterSpec';
import { runQuery } from '../../QueryBuilder/ResultsWrapper';
import {
  SetUnloadProtectsContext,
  UnloadProtectsContext,
} from '../../Router/UnloadProtect';
import { SearchDialog } from '../../SearchDialog';
import { QueryComboBox } from '../index';

jest.mock('../../QueryBuilder/ResultsWrapper', () => ({ runQuery: jest.fn() }));
/*
 * Keep the boundary to the full search form small while inspecting the filters
 * produced by clicking the real QueryComboBox search button.
 */
jest.mock('../../SearchDialog', () => ({ SearchDialog: jest.fn(() => null) }));

requireContext();

const portalRoot = document.createElement('div');
beforeAll(() => {
  portalRoot.id = 'portal-root';
  document.body.append(portalRoot);
});
afterAll(() => portalRoot.remove());

const typeUrl = (id: number) => getResourceApiUrl('CollectionObjectType', id);
const treeUrl = (id: number) => getResourceApiUrl('TaxonTreeDef', id);
overrideAjax(typeUrl(101), {
  id: 101,
  name: 'Botany',
  taxonTreeDef: treeUrl(101),
});
overrideAjax(typeUrl(202), {
  id: 202,
  name: 'Zoology',
  taxonTreeDef: treeUrl(202),
});
overrideAjax(getResourceApiUrl('Taxon', 101), {
  id: 101,
  name: 'Rosa',
  fullName: 'Rosa',
  definition: treeUrl(101),
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

function renderComponent(typeId: number) {
  const resource = new tables.Component.Resource({
    type: typeUrl(typeId),
    name: null,
  });
  return {
    resource,
    ...mount(
      <QueryComboBox
        field={tables.Component.strictGetRelationship('name')}
        forceCollection={undefined}
        formType="form"
        hasEditButton={false}
        hasNewButton={false}
        hasSearchButton
        id={undefined}
        isRequired={false}
        resource={resource}
        typeSearch={{
          table: tables.Taxon,
          searchFields: [[tables.Taxon.strictGetLiteralField('fullName')]],
          name: localized('Taxon'),
          title: localized('Taxon'),
          formatter: localized(''),
          displayFields: undefined,
          format: localized('%s'),
        }}
      />
    ),
  };
}

test.each([101, 202])(
  'typeahead and search button use Type %i taxon tree',
  async (typeId) => {
    jest.mocked(runQuery).mockResolvedValue([]);
    const { getByRole, queryByRole, resource } = renderComponent(typeId);
    const input = getByRole('combobox');
    await waitFor(() => expect(input).toBeEnabled());
    await act(async () => {
      await resource.rgetPromise('type');
    });
    fireEvent.change(input, { target: { value: 'Nonexistent taxon' } });
    await waitFor(() => expect(runQuery).toHaveBeenCalled());
    expect(jest.mocked(runQuery).mock.calls.at(-1)![0].fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: 'taxonTreeDefId',
          startValue: String(typeId),
          operStart: queryFieldFilterSpecs.equal.id,
        }),
      ])
    );
    expect(resource.get('name')).toBeNull();
    expect(queryByRole('option', { name: 'Nonexistent taxon' })).not.toBeInTheDocument();

    fireEvent.click(getByRole('button', { name: /search/i }));
    await waitFor(() => expect(SearchDialog).toHaveBeenCalled());
    expect(
      jest.mocked(SearchDialog).mock.calls.at(-1)![0].extraFilters
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'definition',
          operation: 'in',
          value: String(typeId),
        }),
      ])
    );
  }
);

test('selecting a valid taxon sets the Component Name relationship', async () => {
  jest.mocked(runQuery).mockResolvedValue([[101, localized('Rosa')]]);
  const { getByRole, getByText, resource, user } = renderComponent(101);
  const input = getByRole('combobox');
  await waitFor(() => expect(input).toBeEnabled());
  await act(async () => {
    await resource.rgetPromise('type');
  });
  fireEvent.change(input, { target: { value: 'Rosa' } });
  await waitFor(() => expect(getByText('Rosa')).toBeInTheDocument());
  await user.click(getByText('Rosa'));
  expect(resource.get('name')).toBe(getResourceApiUrl('Taxon', 101));
  expect((await resource.rgetPromise('name'))?.get('definition')).toBe(
    treeUrl(101)
  );
});

test('Save does not submit a selected taxon after Type changes to another tree', async () => {
  const permission = jest
    .spyOn(permissions, 'hasTablePermission')
    .mockReturnValue(true);
  const component = new tables.Component.Resource({
    type: typeUrl(101),
    name: getResourceApiUrl('Taxon', 101),
  });
  const save = jest.spyOn(component, 'save');
  /*
   * Without a full resource form, SaveButton reports an unclaimed blocker
   * and displays its fallback validation dialog.
   */
  const reportBlocker = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  const form = document.createElement('form');
  document.body.append(form);
  const { getByRole, user, unmount } = mount(
    <UnloadProtectsContext.Provider value={[]}>
      <SetUnloadProtectsContext.Provider value={jest.fn()}>
        <LoadingContext.Provider value={(promise) => void promise}>
          <SaveButton form={form} resource={component} />
        </LoadingContext.Provider>
      </SetUnloadProtectsContext.Provider>
    </UnloadProtectsContext.Provider>
  );
  try {
    await act(async () => {
      component.set('type', typeUrl(202));
      await component.businessRuleManager!.pendingPromise;
    });
    const button = getByRole('button', {
      name: commonText.save(),
      exact: true,
    });
    expect(button).toBeEnabled();
    await user.click(button);
    expect(save).not.toHaveBeenCalled();
    expect(getByRole('dialog')).toBeInTheDocument();
    expect(reportBlocker).toHaveBeenCalledTimes(1);
    expect(reportBlocker).toHaveBeenCalledWith(
      expect.stringContaining('Unclaimed blocker'),
      expect.objectContaining({ resource: component })
    );
  } finally {
    unmount();
    form.remove();
    save.mockRestore();
    permission.mockRestore();
    reportBlocker.mockRestore();
  }
});
