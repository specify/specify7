import { act, renderHook } from '@testing-library/react';
import React from 'react';

import { createResource, saveResource } from '../../DataModel/resource';
import { fetchContainerItems, fetchContainerString } from '../data';
import type { SchemaData } from '../schemaData';
import {
  exportsForTests,
  SchemaConfigStoreProvider,
  useSchemaConfig,
} from '../Store';
import type { SchemaConfigEditorState } from '../types';

jest.mock('../../DataModel/resource', () => ({
  saveResource: jest.fn(async () => ({})),
  createResource: jest.fn(async () => ({})),
}));

jest.mock('../data', () => ({
  fetchContainerItems: jest.fn(),
  fetchContainerString: jest.fn(),
}));

const { buildSaveRequests } = exportsForTests;

// A SpLocaleContainerItem-shaped fixture. Strings deliberately lack
// resource_uri so saveString routes through createResource and the
// assertions stay predictable
type TestItem = {
  readonly id: number;
  readonly name: string;
  readonly isHidden: boolean;
  readonly isRequired: boolean | null;
  readonly format: string | null;
  readonly pickListName: string | null;
  readonly webLinkName: string | null;
  readonly strings: {
    readonly name: { readonly id: number; readonly text: string };
    readonly desc: { readonly id: number; readonly text: string };
  };
};

const makeItem = (id: number): TestItem => ({
  id,
  name: `field${id}`,
  isHidden: false,
  isRequired: false,
  format: null,
  pickListName: null,
  webLinkName: null,
  strings: {
    name: { id: 100 + id, text: `Field ${id}` },
    desc: { id: 200 + id, text: `Desc ${id}` },
  },
});

// Cycle through every field-level property the UI can edit
const mutateItem = (item: TestItem, index: number): TestItem => {
  switch (index % 7) {
    case 0:
      return { ...item, isHidden: true };
    case 1:
      return { ...item, isRequired: true };
    case 2:
      return { ...item, pickListName: 'somePickList' };
    case 3:
      return { ...item, webLinkName: 'someWebLink' };
    case 4:
      return { ...item, format: 'someFormat' };
    case 5:
      return {
        ...item,
        strings: {
          ...item.strings,
          name: { ...item.strings.name, text: 'Renamed' },
        },
      };
    default:
      return {
        ...item,
        strings: {
          ...item.strings,
          desc: { ...item.strings.desc, text: 'New desc' },
        },
      };
  }
};

const makeEditor = (
  overrides: Record<string, unknown> = {}
): SchemaConfigEditorState =>
  ({
    container: { id: 1 },
    name: { id: 1, text: 'Name' },
    desc: { id: 2, text: 'Desc' },
    items: [makeItem(1), makeItem(2), makeItem(3)],
    changedItems: [],
    initialContainer: { id: 1 },
    initialName: { id: 1, text: 'Name' },
    initialDesc: { id: 2, text: 'Desc' },
    ...overrides,
  }) as unknown as SchemaConfigEditorState;

describe('buildSaveRequests', () => {
  beforeEach(() => {
    jest.mocked(saveResource).mockClear();
    jest.mocked(createResource).mockClear();
  });

  test('saves each changed container item and its strings', () => {
    buildSaveRequests(makeEditor({ changedItems: [0, 2] }));

    expect(saveResource).toHaveBeenCalledTimes(2);
    expect(saveResource).toHaveBeenNthCalledWith(
      1,
      'SpLocaleContainerItem',
      1,
      expect.anything()
    );
    expect(saveResource).toHaveBeenNthCalledWith(
      2,
      'SpLocaleContainerItem',
      3,
      expect.anything()
    );

    // Each changed item creates a new name and desc string
    expect(createResource).toHaveBeenCalledTimes(4);
    expect(createResource).toHaveBeenNthCalledWith(
      1,
      'SpLocaleItemStr',
      expect.objectContaining({ text: 'Field 1' })
    );
  });

  test('skips the untouched item and untouched container/name/desc', () => {
    buildSaveRequests(makeEditor({ changedItems: [1] }));

    expect(saveResource).toHaveBeenCalledTimes(1);
    expect(saveResource).toHaveBeenCalledWith(
      'SpLocaleContainerItem',
      2,
      expect.anything()
    );
    expect(saveResource).not.toHaveBeenCalledWith(
      'SpLocaleContainer',
      expect.anything(),
      expect.anything()
    );
    expect(createResource).toHaveBeenCalledTimes(2);
  });

  test('emits container save when the container changed', () => {
    buildSaveRequests(
      makeEditor({
        container: { id: 1, isHidden: true },
        initialContainer: { id: 1, isHidden: false },
      })
    );

    expect(saveResource).toHaveBeenCalledWith(
      'SpLocaleContainer',
      1,
      expect.objectContaining({ isHidden: true })
    );
  });
});

describe('saveAll', () => {
  const schemaData = {
    languages: { 'en-us': 'English' },
    tables: {
      Accession: {
        id: 1,
        name: 'Accession',
        resource_uri: '/api/specify/sp_locale_container/1/',
      },
      CollectionObject: {
        id: 2,
        name: 'CollectionObject',
        resource_uri: '/api/specify/sp_locale_container/2/',
      },
      Determination: {
        id: 3,
        name: 'Determination',
        resource_uri: '/api/specify/sp_locale_container/3/',
      },
      Taxon: {
        id: 4,
        name: 'Taxon',
        resource_uri: '/api/specify/sp_locale_container/4/',
      },
      Locality: {
        id: 5,
        name: 'Locality',
        resource_uri: '/api/specify/sp_locale_container/5/',
      },
      Agent: {
        id: 6,
        name: 'Agent',
        resource_uri: '/api/specify/sp_locale_container/6/',
      },
    },
    formatters: [],
    aggregators: [],
    uiFormatters: [],
    webLinks: [],
    pickLists: {},
    update: () => undefined,
  } as unknown as SchemaData;

  const wrapper = ({
    children,
  }: {
    readonly children: React.ReactNode;
  }): JSX.Element => (
    <SchemaConfigStoreProvider
      isReadOnly={false}
      rawLanguage="en-us"
      schemaData={schemaData}
    >
      {children}
    </SchemaConfigStoreProvider>
  );

  beforeEach(() => {
    jest.mocked(saveResource).mockClear();
    jest.mocked(createResource).mockClear();
    jest.mocked(fetchContainerString).mockResolvedValue({ text: 'x' } as never);
  });

  test('accumulates edits across tables and saves only modified tables', async () => {
    jest.mocked(fetchContainerItems).mockImplementation(async (container) => {
      const count = container.id === 1 ? 30 : 20;
      return Array.from({ length: count }, (_, index) =>
        makeItem(index + 1)
      ) as never;
    });

    const { result } = renderHook(() => useSchemaConfig(), { wrapper });

    await act(async () => {
      await result.current.loadTable('Accession');
      await result.current.loadTable('CollectionObject');
    });

    expect(Object.keys(result.current.editors)).toEqual([
      'Accession',
      'CollectionObject',
    ]);

    // Edit 10 fields on Accession, none on CollectionObject
    act(() => {
      const accessionItems = result.current.editors.Accession.items;
      for (let index = 0; index < 10; index += 1)
        result.current.setItem('Accession', index, {
          ...accessionItems[index],
          isHidden: true,
        });
    });

    expect(result.current.modifiedTables).toEqual(['Accession']);
    expect(result.current.anyModified).toBe(true);

    await act(async () => {
      await result.current.saveAll();
    });

    // Only the 10 changed Accession items get saved, CollectionObject stays
    // untouched
    expect(saveResource).toHaveBeenCalledTimes(10);
    expect(saveResource).toHaveBeenNthCalledWith(
      1,
      'SpLocaleContainerItem',
      1,
      expect.anything()
    );
    expect(saveResource).toHaveBeenNthCalledWith(
      10,
      'SpLocaleContainerItem',
      10,
      expect.anything()
    );

    // 10 names + 10 descriptions = 20 new strings
    expect(createResource).toHaveBeenCalledTimes(20);
  });

  test('reports no modifications when nothing changed', async () => {
    jest
      .mocked(fetchContainerItems)
      .mockImplementation(
        async () =>
          Array.from({ length: 5 }, (_, index) => makeItem(index + 1)) as never
      );

    const { result } = renderHook(() => useSchemaConfig(), { wrapper });

    await act(async () => {
      await result.current.loadTable('Accession');
    });

    expect(result.current.modifiedTables).toEqual([]);
    expect(result.current.anyModified).toBe(false);

    await act(async () => {
      await result.current.saveAll();
    });

    expect(saveResource).not.toHaveBeenCalled();
    expect(createResource).not.toHaveBeenCalled();
  });

  test('handles 300 field and table changes across every editable property', async () => {
    let nextId = 0;
    jest
      .mocked(fetchContainerItems)
      .mockImplementation(
        async () =>
          Array.from({ length: 50 }, () => makeItem(++nextId)) as never
      );

    const { result } = renderHook(() => useSchemaConfig(), { wrapper });

    const tableNames = Object.keys(schemaData.tables);
    await act(async () => {
      for (const tableName of tableNames)
        await result.current.loadTable(tableName);
    });

    act(() => {
      tableNames.forEach((tableName, tableIndex) => {
        const editor = result.current.editors[tableName];
        editor.items.forEach((item, itemIndex) =>
          result.current.setItem(
            tableName,
            itemIndex,
            mutateItem(item as unknown as TestItem, itemIndex) as never
          )
        );
        result.current.setContainer(tableName, {
          ...editor.container,
          isHidden: true,
          format: 'someFormat',
          aggregator: 'someAggregator',
        });
        result.current.setName(tableName, {
          text: `Table ${tableIndex}`,
        } as never);
        result.current.setDesc(tableName, {
          text: `Table desc ${tableIndex}`,
        } as never);
      });
    });

    expect(result.current.modifiedTables).toEqual(tableNames);

    await act(async () => {
      await result.current.saveAll();
    });

    // 6 tables × 50 fields = 300 changed items, plus 6 changed containers
    expect(saveResource).toHaveBeenCalledTimes(306);
    // 300 items × (name + desc) + 6 tables × (name + desc) = 612 new strings
    expect(createResource).toHaveBeenCalledTimes(612);

    // Spot check that field-level and table-level edits reached the payloads
    expect(saveResource).toHaveBeenCalledWith(
      'SpLocaleContainerItem',
      expect.any(Number),
      expect.objectContaining({ pickListName: 'somePickList' })
    );
    expect(saveResource).toHaveBeenCalledWith(
      'SpLocaleContainer',
      expect.any(Number),
      expect.objectContaining({ isHidden: true, aggregator: 'someAggregator' })
    );
  });
});
