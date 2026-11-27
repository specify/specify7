import { screen, waitFor } from '@testing-library/react';
import React from 'react';

import { treeText } from '../../../localization/tree';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { userPreferences } from '../../Preferences/userPreferences';
import type { Row } from '../helpers';
import { TreeRow } from '../Row';

requireContext();

describe('Synonyms are displayed when hovering', () => {
  const synonyms = 'Carpiodes forbesi, Carpiodes thompsoni';
  const row: Row = {
    nodeId: 4,
    name: 'velifer',
    fullName: 'Carpiodes velifer',
    nodeNumber: 4,
    highestNodeNumber: 4,
    rankId: 220,
    acceptedId: undefined,
    acceptedName: undefined,
    author: undefined,
    startPeriod: undefined,
    startUncertainty: undefined,
    endPeriod: undefined,
    endUncertainty: undefined,
    children: 0,
    isLastChild: true,
    synonyms,
    isBioStrat: undefined,
    matchingDescendantCount: undefined,
  };

  test("hovering an accepted node's name shows its synonyms", () => {
    mount(
      <ul role="tree">
        <TreeRow
          actionRow={undefined}
          collapsedRanks={[]}
          conformation={undefined}
          focusPath={undefined}
          getRows={jest.fn(async () => [])}
          getStats={jest.fn(async () => ({}))}
          hideEmptyNodes={false}
          nodeStats={undefined}
          path={[]}
          rankNameId={(suffix): string => `rank-${suffix}`}
          ranks={[row.rankId]}
          row={row}
          synonymColor="#dd0000"
          treeName="Taxon"
          onAction={jest.fn()}
          onChangeConformation={jest.fn()}
          onFocusNode={jest.fn()}
        />
      </ul>
    );

    expect(screen.getByText(row.name)).toHaveAttribute(
      'title',
      treeText.synonyms({ names: synonyms })
    );
  });
});

describe("Tree preferences 'Order By Field' default is set to Rank ID", () => {
  const makeRow = (
    nodeId: number,
    name: string,
    rankId: number,
    children: number
  ): Row => ({
    nodeId,
    name,
    fullName: name,
    nodeNumber: nodeId,
    highestNodeNumber: nodeId,
    rankId,
    acceptedId: undefined,
    acceptedName: undefined,
    author: undefined,
    startPeriod: undefined,
    startUncertainty: undefined,
    endPeriod: undefined,
    endUncertainty: undefined,
    children,
    isLastChild: true,
    synonyms: undefined,
    isBioStrat: undefined,
    matchingDescendantCount: undefined,
  });

  test('expanded children are ordered by rank by default', async () => {
    expect(userPreferences.get('treeEditor', 'behavior', 'orderByField')).toBe(
      'rankId'
    );

    const genus = makeRow(2, 'Carpiodes', 180, 3);
    const childrenByName = [
      makeRow(7, 'carpio', 220, 0),
      makeRow(4, 'velifer', 220, 0),
      makeRow(15, 'zeta', 190, 0),
    ];
    mount(
      <ul role="tree">
        <TreeRow
          actionRow={undefined}
          collapsedRanks={[]}
          conformation={[[genus.nodeId]]}
          focusPath={undefined}
          getRows={jest.fn(async () => childrenByName)}
          getStats={jest.fn(async () => ({}))}
          hideEmptyNodes={false}
          nodeStats={undefined}
          path={[]}
          rankNameId={(suffix): string => `rank-${suffix}`}
          ranks={[180, 190, 220]}
          row={genus}
          synonymColor="#dd0000"
          treeName="Taxon"
          onAction={jest.fn()}
          onChangeConformation={jest.fn()}
          onFocusNode={jest.fn()}
        />
      </ul>
    );

    await waitFor(() =>
      expect(
        screen
          .getAllByText(/^(carpio|velifer|zeta)$/u)
          .map((element) => element.textContent)
      ).toEqual(['zeta', 'carpio', 'velifer'])
    );
  });
});
