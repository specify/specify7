import { screen, waitFor, within } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { queryText } from '../../../localization/query';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { Http } from '../../../utils/ajax/definitions';
import { f } from '../../../utils/functools';
import { LoadingContext } from '../../Core/Contexts';
import { addMissingFields } from '../../DataModel/addMissingFields';
import { getResourceApiUrl } from '../../DataModel/resource';
import { tables } from '../../DataModel/tables';
import { allTrees } from '../../InitialContext/treeRanks';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { queryFromTree } from '../fromTree';
import { QuerySaveDialog } from '../Save';

requireContext();

const rankNames = {
  Taxon: 'Species',
  Geography: 'County',
  Storage: 'Cabinet',
  GeologicTimePeriod: 'Epoch',
  LithoStrat: 'Formation',
  TectonicUnit: 'Substructure',
};
const fullNames = {
  Taxon: 'Carpiodes velifer',
  Geography: 'Los Angeles County',
  Storage: 'Cabinet 1',
  GeologicTimePeriod: 'Paleocene',
  LithoStrat: 'Cretaceous',
  TectonicUnit: 'Plate',
};

allTrees.map((table, rankId) => {
  const nodeId = rankId * 4;
  const rankUrl = getResourceApiUrl(`${table}TreeDefItem`, rankId);
  overrideAjax(getResourceApiUrl(table, nodeId), () =>
    addMissingFields(table, {
      id: nodeId,
      definitionItem: rankUrl,
      fullName: fullNames[table],
      resource_uri: getResourceApiUrl(table, nodeId),
    })
  );
  overrideAjax(rankUrl, () =>
    addMissingFields(`${table}TreeDefItem`, {
      id: rankId,
      name: rankNames[table],
      resource_uri: rankUrl,
    })
  );
});

test('queryFromTree', async () =>
  expect(
    Promise.all(
      allTrees.map(async (tree, index) => queryFromTree(tree, index * 4))
    )
  ).resolves.toMatchSnapshot());

describe('Verify generated query can be saved', () => {
  const nodeId = allTrees.indexOf('Taxon') * 4;
  const savedQueryId = 20;
  const generatedName = (): string =>
    queryText.treeQueryName({
      tableName: tables.CollectionObject.label,
      nodeFullName: fullNames.Taxon,
    });
  const jsonContaining = (
    getExpected: () => Record<string, unknown>
  ): unknown => ({
    $$typeof: Symbol.for('jest.asymmetricMatcher'),
    asymmetricMatch: (actual: unknown): boolean =>
      typeof actual === 'string' &&
      expect
        .objectContaining(getExpected())
        .asymmetricMatch(JSON.parse(actual)),
    toAsymmetricMatcher: (): string =>
      `JsonContaining ${JSON.stringify(getExpected())}`,
  });
  const saveRequest = jest.fn(() =>
    addMissingFields('SpQuery', {
      id: savedQueryId,
      name: generatedName(),
      contextName: 'CollectionObject',
      contextTableId: tables.CollectionObject.tableId,
      resource_uri: getResourceApiUrl('SpQuery', savedQueryId),
    })
  );
  overrideAjax('/api/specify/spquery/', saveRequest, {
    method: 'POST',
    responseCode: Http.CREATED,
    body: jsonContaining(() => ({
      name: generatedName(),
      contextname: 'CollectionObject',
      fields: expect.arrayContaining([
        expect.objectContaining({
          fieldname: `${rankNames.Taxon} ID`,
          startvalue: nodeId.toString(),
        }),
      ]),
    })),
  });

  const portalRoot = document.createElement('div');
  beforeAll(() => {
    portalRoot.id = 'portal-root';
    document.body.append(portalRoot);
  });
  afterAll(() => portalRoot.remove());

  test('the query generated from a tree node is saved', async () => {
    const query = await queryFromTree('Taxon', nodeId);
    const handleSaved = jest.fn();
    const { user } = mount(
      React.createElement(
        LoadingContext.Provider,
        { value: f.void },
        React.createElement(
          UnloadProtectsContext.Provider,
          { value: [] },
          React.createElement(QuerySaveDialog, {
            isSaveAs: false,
            query,
            onClose: jest.fn(),
            onSaved: handleSaved,
          })
        )
      )
    );

    const dialog = await screen.findByRole('dialog', {
      name: queryText.saveQuery(),
    });
    expect(within(dialog).getByRole('textbox')).toHaveValue(generatedName());
    await user.click(
      within(dialog).getByRole('button', { name: commonText.save() })
    );

    await waitFor(() => expect(handleSaved).toHaveBeenCalledWith(savedQueryId));
    expect(saveRequest).toHaveBeenCalledTimes(1);
  });
});
