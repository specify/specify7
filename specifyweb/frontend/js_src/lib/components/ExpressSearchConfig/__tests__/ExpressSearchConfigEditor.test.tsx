import { act } from '@testing-library/react';
import React from 'react';

import { clearIdStore } from '../../../hooks/useId';
import { overrideAjax } from '../../../tests/ajax';
import { mount } from '../../../tests/reactUtils';
import { ExpressSearchConfigEditor } from '../ExpressSearchConfigEditor';

// Mock child components to simplify testing the main editor logic
jest.mock('../SearchFieldsTab', () => ({
  SearchFieldsTab: () => <div>Search Fields Tab</div>,
}));
jest.mock('../RelatedTablesTab', () => ({
  RelatedTablesTab: () => <div>Related Tables Tab</div>,
}));
jest.mock('../ResultsOrderingTab', () => ({
  ResultsOrderingTab: () => <div>Results Ordering Tab</div>,
}));

beforeEach(() => {
  clearIdStore();
});

const mockConfigResponse = {
  config: {
    tables: [
      {
        tableName: 'CollectionObject',
        displayOrder: 0,
        searchFields: [],
        displayFields: [],
      },
    ],
    relatedQueries: [],
  },
  related_queries_definitions: [],
  schema_metadata: [
    {
      name: 'CollectionObject',
      title: 'Collection Object',
      fields: [],
    },
  ],
};

describe('ExpressSearchConfigEditor', () => {
  overrideAjax('/express_search/config/', mockConfigResponse);

  test('uses provided XML data in app-resource mode', async () => {
    const onChangeJSON = jest.fn();
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><search><tables><searchtable><tableName>Agent</tableName><displayOrder>0</displayOrder><searchFields><searchfield><fieldName>firstName</fieldName><order>0</order><sortDirection>None</sortDirection></searchfield></searchFields><displayFields><displayfield><fieldName>lastName</fieldName></displayfield></displayFields></searchtable></tables><relatedQueries></relatedQueries></search>';

    mount(
      <ExpressSearchConfigEditor
        initialXmlData={xml}
        useResolvedConfig={false}
        onChange={jest.fn()}
        onChangeJSON={onChangeJSON}
        onSetCleanup={jest.fn()}
      />
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(onChangeJSON).toHaveBeenCalled();
    const latestConfig =
      onChangeJSON.mock.calls.at(-1)[0];
    expect(latestConfig.tables[0].tableName).toBe('Agent');
    expect(latestConfig.tables[0].searchFields[0].fieldName).toBe('firstName');
  });

  test('renders loading state initially', async () => {
    const { getByText } = mount(
      <ExpressSearchConfigEditor
        onChange={jest.fn()}
        onSetCleanup={jest.fn()}
      />
    );
    expect(getByText('Loading...')).toBeInTheDocument();

    // Wait for it to finish loading to avoid act warnings
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  test('renders tabs after data load', async () => {
    const { findByRole } = mount(
      <ExpressSearchConfigEditor
        onChange={jest.fn()}
        onSetCleanup={jest.fn()}
      />
    );

    await expect(findByRole('tablist')).resolves.toBeInTheDocument();
  });

  test('switches tabs correctly', async () => {
    const { findByText, getByRole, user } = mount(
      <ExpressSearchConfigEditor
        onChange={jest.fn()}
        onSetCleanup={jest.fn()}
      />
    );

    // Initial tab
    await expect(findByText('Search Fields Tab')).resolves.toBeInTheDocument();

    // Click Related Tables
    const relatedTab = getByRole('tab', { name: /related tables/i });
    await act(async () => {
      await user.click(relatedTab);
    });

    await expect(findByText('Related Tables Tab')).resolves.toBeInTheDocument();

    // Click Results Ordering
    const resultsTab = getByRole('tab', { name: /results ordering/i });
    await act(async () => {
      await user.click(resultsTab);
    });
    await expect(findByText('Results Ordering Tab')).resolves.toBeInTheDocument();
  });
});
