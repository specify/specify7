import { screen } from '@testing-library/react';
import React from 'react';

import { treeText } from '../../../localization/tree';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
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
