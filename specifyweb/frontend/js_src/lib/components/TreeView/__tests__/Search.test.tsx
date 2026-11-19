import { screen, waitFor } from '@testing-library/react';
import React from 'react';

import { treeText } from '../../../localization/tree';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import * as collection from '../../DataModel/collection';
import type { SerializedResource } from '../../DataModel/helperTypes';
import type { Taxon } from '../../DataModel/types';
import { strictGetTreeDefinitionItems } from '../../InitialContext/treeRanks';
import { TreeViewSearch } from '../Search';

requireContext();

const portalRoot = document.createElement('div');
beforeAll(() => {
  portalRoot.id = 'portal-root';
  document.body.append(portalRoot);
});
afterAll(() => portalRoot.remove());
afterEach(() => jest.restoreAllMocks());

describe('Use Search Tree to find a node', () => {
  const nodeId = 4;
  overrideAjax(`/trees/specify_tree/taxon/${nodeId}/path/`, {
    Species: { rankid: 220, id: nodeId },
    Life: { rankid: 0, id: 1 },
    Genus: { rankid: 180, id: 2 },
    Kingdom: { rankid: 10, id: 3 },
    resource_uri: `/api/specify/taxon/${nodeId}/`,
  });

  test('choosing a search result focuses the path to that node', async () => {
    jest.spyOn(collection, 'fetchCollection').mockResolvedValue({
      records: [
        {
          _tableName: 'Taxon',
          id: nodeId,
          name: 'velifer',
          fullName: 'Carpiodes velifer',
          rankId: 220,
        } as unknown as SerializedResource<Taxon>,
      ],
      totalCount: 1,
    });
    const handleFocusPath = jest.fn();
    const { user } = mount(
      <TreeViewSearch
        forwardRef={React.createRef<HTMLInputElement>()}
        tableName="Taxon"
        treeDefinitionId={1}
        treeDefinitionItems={strictGetTreeDefinitionItems('Taxon', false, 1)}
        onFocusPath={handleFocusPath}
      />
    );

    const search = screen.getByRole('combobox', {
      name: treeText.searchTreePlaceholder(),
    });
    await user.type(search, 'carp');
    const result = await screen.findByRole(
      'option',
      {
        name: (_, element) =>
          element.textContent?.includes('Carpiodes velifer') === true,
      },
      { timeout: 3000 }
    );
    expect(result).toHaveTextContent('Species');
    await user.click(result);

    await waitFor(() =>
      expect(handleFocusPath).toHaveBeenCalledWith([1, 3, 2, nodeId])
    );
    expect(search).toHaveValue('Carpiodes velifer');
  });
});
