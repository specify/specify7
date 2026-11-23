import { render, screen } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import { localityText } from '../../../localization/locality';
import { queryText } from '../../../localization/query';
import { tables } from '../../DataModel/tables';
import { serializeResource } from '../../DataModel/serializers';
import {
  defaultDataViewQuery,
  makeDataViewQuery,
} from '../../DataViews/queries';
import { QueryFieldSpec } from '../fieldSpec';
import { fieldSpecsToLocalityMappings, QueryToMap } from '../ToMap';
import { maxMapSelectionRows } from '../selection';

requireContext();

test('fieldSpecsToLocalityMappings', () =>
  expect(
    fieldSpecsToLocalityMappings(
      'CollectionObject',
      [
        ['catalogNumber'],
        ['determinations', '#1', 'taxon', '$-any', 'fullName'],
        ['determinations', '#1', 'taxon', '$Species', 'taxonId'],
        ['determinations', '#1', 'isCurrent'],
        ['collectingEvent', 'locality'],
      ].map((path) => QueryFieldSpec.fromPath('CollectionObject', path))
    )
  ).toMatchInlineSnapshot(`[]`));

test.each([0, maxMapSelectionRows, maxMapSelectionRows + 1])(
  'enforces the map selection limit for %i result rows',
  (selectedCount) => {
    const fieldSpecs = ['latitude1', 'longitude1', 'localityId'].map((field) =>
      QueryFieldSpec.fromPath('Locality', [field])
    );
    const query = serializeResource(
      makeDataViewQuery('Locality', defaultDataViewQuery('Locality'))
    );
    render(
      <QueryToMap
        results={[[1, 40, -80, 1]]}
        totalCount={1_000_000}
        selectedRows={new Set()}
        table={tables.Locality}
        fields={[]}
        fieldSpecs={fieldSpecs}
        selectedQuery={{
          query,
          selection: { mode: 'exclude', ids: new Set() },
        }}
        selectedCount={selectedCount}
        onFetchMore={undefined}
      />
    );
    const button = screen.getByRole('button', { name: localityText.geoMap() });
    if (selectedCount === 0 || selectedCount > maxMapSelectionRows)
      expect(button).toBeDisabled();
    else expect(button).toBeEnabled();
    if (selectedCount > maxMapSelectionRows)
      expect(button).toHaveAttribute(
        'title',
        queryText.mapSelectionLimit({ limit: maxMapSelectionRows })
      );
  }
);
