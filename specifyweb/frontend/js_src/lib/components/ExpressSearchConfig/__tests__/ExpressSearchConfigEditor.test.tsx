import React from 'react';
import { clearIdStore } from '../../../hooks/useId';
import { mount } from '../../../tests/reactUtils';
import { overrideAjax } from '../../../tests/ajax';
import { ExpressSearchConfigEditor } from '../ExpressSearchConfigEditor';
import { act } from '@testing-library/react';

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
        displayFields: []
      }
    ],
    relatedQueries: []
  },
  related_queries_definitions: [],
  schema_metadata: [
    {
      name: 'CollectionObject',
      title: 'Collection Object',
      fields: []
    }
  ]
};

describe('ExpressSearchConfigEditor', () => {
  overrideAjax('/express_search/config/', mockConfigResponse);

  test('renders loading state initially', async () => {
    const { getByText, queryByText } = mount(
      <ExpressSearchConfigEditor 
        onChange={jest.fn()} 
        onSetCleanup={jest.fn()} 
        directoryKey="" 
        name="test" 
        mimetype="text/xml" 
      />
    );
    expect(getByText('Loading...')).toBeInTheDocument();
    
    // Wait for it to finish loading to avoid act warnings
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  });

  test('renders tabs after data load', async () => {
    const { findByRole } = mount(
      <ExpressSearchConfigEditor 
        onChange={jest.fn()} 
        onSetCleanup={jest.fn()} 
        directoryKey="" 
        name="test" 
        mimetype="test" 
      />
    );
    
    expect(await findByRole('tablist')).toBeInTheDocument();
  });

  test('switches tabs correctly', async () => {
    const { findByText, getByRole, user } = mount(
      <ExpressSearchConfigEditor 
        onChange={jest.fn()} 
        onSetCleanup={jest.fn()} 
        directoryKey="" 
        name="test" 
        mimetype="text/xml" 
      />
    );

    // Initial tab
    expect(await findByText('Search Fields Tab')).toBeInTheDocument();

    // Click Related Tables
    const relatedTab = getByRole('tab', { name: /Related Tables/i });
    await act(async () => {
      await user.click(relatedTab);
    });
    
    expect(await findByText('Related Tables Tab')).toBeInTheDocument();

    // Click Results Ordering
    const resultsTab = getByRole('tab', { name: /Results Ordering/i });
    await act(async () => {
      await user.click(resultsTab);
    });
    expect(await findByText('Results Ordering Tab')).toBeInTheDocument();
  });
});
