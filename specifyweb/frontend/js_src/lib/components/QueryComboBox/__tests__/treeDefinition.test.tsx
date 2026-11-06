import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { localized } from '../../../utils/types';
import { requireContext } from '../../../tests/helpers';
import type { AnySchema } from '../../DataModel/helperTypes';
import type { SpecifyResource } from '../../DataModel/legacyTypes';
import { getResourceApiUrl } from '../../DataModel/resource';
import { tables } from '../../DataModel/tables';
import { runQuery } from '../../QueryBuilder/ResultsWrapper';
import { QueryComboBox } from '../index';
import type { TypeSearch } from '../spec';

jest.mock('../../../hooks/useResourceValue', () => ({
  useResourceValue: () => ({
    value: undefined,
    updateValue: jest.fn(),
    validationRef: jest.fn(),
    inputRef: { current: null },
    setValidation: jest.fn(),
    parser: undefined,
  }),
}));

jest.mock('../../../utils/parser/definitions', () => ({
  ...jest.requireActual('../../../utils/parser/definitions'),
  getValidationAttributes: () => ({}),
}));

jest.mock('../../Atoms/DataEntry', () => {
  const mockReact = jest.requireActual<typeof import('react')>('react');
  const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
    mockReact.createElement('button', props, 'Search');
  return {
    DataEntry: {
      Add: Button,
      Clone: Button,
      Edit: Button,
      Search: Button,
      View: Button,
    },
  };
});

jest.mock('../../Forms/ResourceView', () => ({
  ResourceView: () => null,
  RESTRICT_ADDING: new Set(),
}));

jest.mock('../../Formatters/formatters', () => ({
  format: jest.fn(async () => ''),
  naiveFormatter: jest.fn(() => ''),
}));

jest.mock('../../Molecules/AutoComplete', () => {
  const mockReact = jest.requireActual<typeof import('react')>('react');
  type MockItem = { readonly data: string; readonly label: React.ReactNode };
  type MockProps = {
    readonly disabled: boolean;
    readonly inputProps: React.InputHTMLAttributes<HTMLInputElement>;
    readonly source: (value: string) => Promise<ReadonlyArray<MockItem>>;
  };
  const AutoComplete = ({ disabled, inputProps, source }: MockProps) => {
    const [items, setItems] = mockReact.useState<ReadonlyArray<MockItem>>([]);
    return mockReact.createElement(
      mockReact.Fragment,
      null,
      mockReact.createElement('input', {
        ...inputProps,
        disabled,
        onChange: async (event: React.ChangeEvent<HTMLInputElement>) =>
          setItems(await source(event.currentTarget.value)),
      }),
      mockReact.createElement(
        'ul',
        { role: 'listbox' },
        ...items.map(({ data, label }) =>
          mockReact.createElement('li', { key: data, role: 'option' }, label)
        )
      )
    );
  };
  return { AutoComplete };
});

jest.mock('../../Permissions/helpers', () => ({
  ...jest.requireActual('../../Permissions/helpers'),
  hasTablePermission: () => true,
}));

jest.mock('../../QueryBuilder/ResultsWrapper', () => ({
  runQuery: jest.fn(),
}));

jest.mock('../../SearchDialog', () => {
  const mockReact = jest.requireActual<typeof import('react')>('react');
  const SearchDialog = ({ extraFilters }: { readonly extraFilters: unknown }) =>
    mockReact.createElement(
      'output',
      { 'data-testid': 'search-filters' },
      JSON.stringify(extraFilters)
    );
  return { SearchDialog };
});

jest.mock('../helpers', () => ({
  ...jest.requireActual('../helpers'),
  useQueryComboBoxDefaults: jest.fn(),
}));

jest.mock('../useCollectionRelationships', () => ({
  useCollectionRelationships: () => false,
}));

jest.mock('../useTreeData', () => {
  const mockReact = jest.requireActual<typeof import('react')>('react');
  return {
    TreeDefinitionContext: mockReact.createContext(undefined),
    useTreeData: () => false,
  };
});

jest.mock('../useTypeSearch', () => ({
  useTypeSearch: (typeSearch: TypeSearch) => typeSearch,
}));

requireContext();

const taxa = [
  { id: 1, name: 'Taxon A1', treeId: 101 },
  { id: 2, name: 'Taxon A2', treeId: 101 },
  { id: 3, name: 'Taxon A3', treeId: 101 },
  { id: 4, name: 'Taxon B1', treeId: 202 },
  { id: 5, name: 'Taxon B2', treeId: 202 },
  { id: 6, name: 'Taxon B3', treeId: 202 },
];

type QueryField = {
  readonly fieldName?: string;
  readonly startValue?: string;
  readonly stringId?: string;
  readonly operStart?: number;
};
type ComboBoxQuery = { readonly fields: ReadonlyArray<QueryField> };

const mockedRunQuery = jest.mocked(runQuery);

describe('Determination Taxon tree definition filtering', () => {
  test.each([
    {
      cot: 'COT A',
      treeId: 101,
      taxa: ['Taxon A1', 'Taxon A2', 'Taxon A3'],
      excludedTaxa: ['Taxon B1', 'Taxon B2', 'Taxon B3'],
    },
    {
      cot: 'COT B',
      treeId: 202,
      taxa: ['Taxon B1', 'Taxon B2', 'Taxon B3'],
      excludedTaxa: ['Taxon A1', 'Taxon A2', 'Taxon A3'],
    },
  ])(
    'filters the dropdown and Search dialog using the tree for $cot',
    async ({ treeId, taxa: expectedTaxa, excludedTaxa }) => {
      mockedRunQuery.mockResolvedValue(
        taxa
          .filter((taxon) => taxon.treeId === treeId)
          .map(({ id, name }) => [id, localized(name)]) as never
      );
      const typeSearch: TypeSearch = {
        name: localized('Taxon'),
        table: tables.Taxon,
        title: localized('Taxon'),
        formatter: localized(''),
        format: localized('%s'),
        displayFields: undefined,
        searchFields: [[tables.Taxon.strictGetField('name')!]],
      };
      const treeDefinition = getResourceApiUrl('TaxonTreeDef', treeId);
      const collectionObjectType = {
        get: (fieldName: string) =>
          fieldName === 'taxonTreeDef' ? treeDefinition : undefined,
      };
      const collectionObject = {
        specifyTable: tables.CollectionObject,
        get: (fieldName: string) =>
          fieldName === 'collectionObjectType'
            ? collectionObjectType
            : undefined,
        rgetPromise: async () => collectionObjectType,
      };
      const determination = {
        specifyTable: tables.Determination,
        collection: { related: collectionObject },
        rgetPromise: async () => undefined,
        on: () => undefined,
        off: () => undefined,
      } as unknown as SpecifyResource<AnySchema>;

      render(
        <QueryComboBox
          id="determination-taxon"
          resource={determination}
          field={tables.Determination.strictGetRelationship('taxon')}
          formType="form"
          isRequired={false}
          hasNewButton={false}
          hasEditButton={false}
          typeSearch={typeSearch}
          forceCollection={undefined}
        />
      );

      const input = screen.getByRole('textbox', { name: 'Taxon' });
      await waitFor(() => expect(input).toBeEnabled());
      await act(async () => {
        await userEvent.type(input, 'Taxon');
      });

      for (const taxon of expectedTaxa)
        expect(await screen.findByRole('option', { name: taxon })).toBeVisible();
      for (const taxon of excludedTaxa)
        expect(screen.queryByRole('option', { name: taxon })).not.toBeInTheDocument();

      const queryCalls = mockedRunQuery.mock.calls.map(([query]) =>
        (query as unknown as ComboBoxQuery).fields
      );
      expect(queryCalls.flat()).toContainEqual(
        expect.objectContaining({ startValue: treeId.toString() })
      );

      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
      const searchFilters = JSON.parse(
        screen.getByRole('status').textContent ?? '[]'
      ) as ReadonlyArray<{ readonly value: string }>;
      expect(searchFilters).toContainEqual(
        expect.objectContaining({ value: treeId.toString() })
      );
    }
  );
});