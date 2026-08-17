import React from 'react';

import { ping } from '../../utils/ajax/ping';
import type { IR, RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import type { SerializedResource } from '../DataModel/helperTypes';
import { createResource, saveResource } from '../DataModel/resource';
import type {
  SpLocaleContainer,
  SpLocaleContainerItem,
} from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { formatUrl } from '../Router/queryString';
import type { WithFetchedStrings } from '../Toolbar/SchemaConfig';
import { fetchContainerItems, fetchContainerString } from './data';
import type { NewSpLocaleItemString, SpLocaleItemString } from './index';
import type { SchemaData } from './schemaData';

export type SchemaConfigEditorState = {
  readonly container: SerializedResource<SpLocaleContainer>;
  readonly name: NewSpLocaleItemString | SpLocaleItemString;
  readonly desc: NewSpLocaleItemString | SpLocaleItemString;
  readonly items: RA<
    SerializedResource<SpLocaleContainerItem> & WithFetchedStrings
  >;
  readonly changedItems: RA<number>;
  readonly initialContainer: SerializedResource<SpLocaleContainer>;
  readonly initialName: NewSpLocaleItemString | SpLocaleItemString;
  readonly initialDesc: NewSpLocaleItemString | SpLocaleItemString;
};

export type SchemaConfigStore = {
  readonly schemaData: SchemaData;
  readonly isReadOnly: boolean;
  readonly modifiedTables: RA<string>;
  readonly anyModified: boolean;
  readonly saveAll: () => Promise<unknown>;
  readonly loadTable: (tableName: string) => Promise<void>;
  readonly editors: IR<SchemaConfigEditorState>;
  readonly setContainer: (
    tableName: string,
    container: SerializedResource<SpLocaleContainer>
  ) => void;
  readonly setName: (
    tableName: string,
    name: NewSpLocaleItemString | SpLocaleItemString
  ) => void;
  readonly setDesc: (
    tableName: string,
    desc: NewSpLocaleItemString | SpLocaleItemString
  ) => void;
  readonly setItem: (
    tableName: string,
    index: number,
    item: SerializedResource<SpLocaleContainerItem> & WithFetchedStrings
  ) => void;
};

const SchemaConfigContext = React.createContext<SchemaConfigStore | undefined>(
  undefined
);
SchemaConfigContext.displayName = 'SchemaConfigContext';

const getEditorChanges = (
  editor: SchemaConfigEditorState
): {
  readonly nameChanged: boolean;
  readonly descChanged: boolean;
  readonly containerChanged: boolean;
} => ({
  nameChanged:
    JSON.stringify(editor.initialName) !== JSON.stringify(editor.name),
  descChanged:
    JSON.stringify(editor.initialDesc) !== JSON.stringify(editor.desc),
  containerChanged:
    JSON.stringify(editor.initialContainer) !==
    JSON.stringify(editor.container),
});

export const isEditorModified = (editor: SchemaConfigEditorState): boolean => {
  const changes = getEditorChanges(editor);
  return (
    changes.nameChanged ||
    changes.descChanged ||
    changes.containerChanged ||
    editor.changedItems.length > 0
  );
};

const updateEditor = (
  editors: IR<SchemaConfigEditorState>,
  tableName: string,
  update: (editor: SchemaConfigEditorState) => SchemaConfigEditorState
): IR<SchemaConfigEditorState> => {
  const editor = editors[tableName];
  return editor === undefined
    ? editors
    : { ...editors, [tableName]: update(editor) };
};

export function SchemaConfigStoreProvider({
  schemaData,
  rawLanguage,
  isReadOnly,
  children,
}: {
  readonly schemaData: SchemaData;
  readonly rawLanguage: string;
  readonly isReadOnly: boolean;
  readonly children: React.ReactNode;
}): JSX.Element {
  const [language, country = null] = rawLanguage.split('-');
  const [editors, setEditors] = React.useState<IR<SchemaConfigEditorState>>({});

  const editorsRef = React.useRef(editors);
  editorsRef.current = editors;
  const loadingRef = React.useRef<ReadonlySet<string>>(new Set());

  const loadTable = React.useCallback(
    async (tableName: string): Promise<void> => {
      if (tableName in editorsRef.current || loadingRef.current.has(tableName))
        return;
      loadingRef.current = new Set(loadingRef.current).add(tableName);
      try {
        const container = defined(
          Object.values(schemaData.tables).find(
            ({ name }) => name.toLowerCase() === tableName.toLowerCase()
          ),
          `Unable to find SpLocaleContainer for ${tableName}`
        );
        const [name, desc, items] = await Promise.all([
          fetchContainerString('containerName', container, language, country),
          fetchContainerString('containerDesc', container, language, country),
          fetchContainerItems(container, language, country),
        ]);
        setEditors((editors) => ({
          ...editors,
          [tableName]: {
            container,
            name,
            desc,
            items,
            changedItems: [],
            initialContainer: container,
            initialName: name,
            initialDesc: desc,
          },
        }));
      } finally {
        loadingRef.current = new Set(
          Array.from(loadingRef.current).filter((item) => item !== tableName)
        );
      }
    },
    [schemaData.tables, language, country]
  );

  const setContainer = React.useCallback(
    (tableName: string, container: SerializedResource<SpLocaleContainer>) =>
      setEditors((editors) =>
        updateEditor(editors, tableName, (editor) => ({
          ...editor,
          container,
        }))
      ),
    []
  );

  const setName = React.useCallback(
    (tableName: string, name: NewSpLocaleItemString | SpLocaleItemString) =>
      setEditors((editors) =>
        updateEditor(editors, tableName, (editor) => ({ ...editor, name }))
      ),
    []
  );

  const setDesc = React.useCallback(
    (tableName: string, desc: NewSpLocaleItemString | SpLocaleItemString) =>
      setEditors((editors) =>
        updateEditor(editors, tableName, (editor) => ({ ...editor, desc }))
      ),
    []
  );

  const setItem = React.useCallback(
    (
      tableName: string,
      index: number,
      item: SerializedResource<SpLocaleContainerItem> & WithFetchedStrings
    ) =>
      setEditors((editors) =>
        updateEditor(editors, tableName, (editor) => ({
          ...editor,
          items: replaceItem(editor.items, index, item),
          changedItems: editor.changedItems.includes(index)
            ? editor.changedItems
            : [...editor.changedItems, index],
        }))
      ),
    []
  );

  const modifiedTables = React.useMemo(
    () =>
      Object.entries(editors)
        .filter(([, editor]) => isEditorModified(editor))
        .map(([tableName]) => tableName),
    [editors]
  );

  const saveAll = React.useCallback(async (): Promise<void> => {
    const outcomes = await Promise.all(
      Object.entries(editorsRef.current)
        .filter(([, editor]) => isEditorModified(editor))
        .flatMap(([tableName, editor]) =>
          buildSaveRequests(editor).map((request) => ({
            tableName,
            request,
          }))
        )
        .map(({ tableName, request }) =>
          request.promise.then(
            (result) => ({
              status: 'fulfilled' as const,
              tableName,
              request,
              result,
            }),
            () => ({ status: 'rejected' as const, tableName, request })
          )
        )
    );

    const newEditors: Record<string, SchemaConfigEditorState> = {
      ...editorsRef.current,
    };
    const failedItems = new Map<string, Set<number>>();
    let hasFailure = false;

    for (const outcome of outcomes) {
      if (outcome.status === 'fulfilled')
        newEditors[outcome.tableName] = outcome.request.reconcile(
          newEditors[outcome.tableName],
          outcome.result
        );
      else {
        hasFailure = true;
        if (typeof outcome.request.itemIndex === 'number') {
          const failed =
            failedItems.get(outcome.tableName) ?? new Set<number>();
          failed.add(outcome.request.itemIndex);
          failedItems.set(outcome.tableName, failed);
        }
      }
    }

    // Keep only items whose writes all failed, so a retry re-saves them
    for (const [tableName, editor] of Object.entries(newEditors)) {
      const failed = failedItems.get(tableName);
      if (failed === undefined) continue;
      newEditors[tableName] = {
        ...editor,
        changedItems: editor.changedItems.filter((index) => failed.has(index)),
      };
    }

    setEditors(newEditors);

    if (hasFailure) throw new Error('Some schema changes could not be saved');
  }, []);

  return (
    <SchemaConfigContext.Provider
      value={{
        schemaData,
        isReadOnly,
        modifiedTables,
        anyModified: modifiedTables.length > 0,
        saveAll,
        loadTable,
        editors,
        setContainer,
        setName,
        setDesc,
        setItem,
      }}
    >
      {children}
    </SchemaConfigContext.Provider>
  );
}

export function useSchemaConfig(): SchemaConfigStore {
  return React.useContext(SchemaConfigContext)!;
}

export function useSchemaConfigTable(tableName: string): {
  readonly container: SerializedResource<SpLocaleContainer>;
  readonly name: NewSpLocaleItemString | SpLocaleItemString | undefined;
  readonly desc: NewSpLocaleItemString | SpLocaleItemString | undefined;
  readonly items:
    | RA<SerializedResource<SpLocaleContainerItem> & WithFetchedStrings>
    | undefined;
  readonly setContainer: (
    container: SerializedResource<SpLocaleContainer>
  ) => void;
  readonly setName: (name: NewSpLocaleItemString | SpLocaleItemString) => void;
  readonly setDesc: (desc: NewSpLocaleItemString | SpLocaleItemString) => void;
  readonly setItem: (
    index: number,
    item: SerializedResource<SpLocaleContainerItem> & WithFetchedStrings
  ) => void;
} {
  const {
    schemaData,
    editors,
    loadTable,
    setContainer,
    setName,
    setDesc,
    setItem,
  } = useSchemaConfig();
  const editor = editors[tableName];

  React.useEffect(() => {
    if (tableName === '') return;
    void loadTable(tableName).catch(softFail);
  }, [loadTable, tableName]);

  const container = React.useMemo(
    () =>
      defined(
        Object.values(schemaData.tables).find(
          ({ name }) => name.toLowerCase() === tableName.toLowerCase()
        ),
        `Unable to find SpLocaleContainer for ${tableName}`
      ),
    [schemaData.tables, tableName]
  );

  return {
    container: editor?.container ?? container,
    name: editor?.name,
    desc: editor?.desc,
    items: editor?.items,
    setContainer: React.useCallback(
      (value) => setContainer(tableName, value),
      [setContainer, tableName]
    ),
    setName: React.useCallback(
      (value) => setName(tableName, value),
      [setName, tableName]
    ),
    setDesc: React.useCallback(
      (value) => setDesc(tableName, value),
      [setDesc, tableName]
    ),
    setItem: React.useCallback(
      (index, value) => setItem(tableName, index, value),
      [setItem, tableName]
    ),
  };
}

type SaveRequest = {
  readonly promise: Promise<unknown>;
  readonly itemIndex?: number;
  readonly reconcile: (
    editor: SchemaConfigEditorState,
    result: unknown
  ) => SchemaConfigEditorState;
};

const applySavedId = <T extends { readonly id?: number }>(
  resource: T,
  result: unknown
): T => {
  const id = (result as { readonly id?: number } | undefined)?.id;
  return typeof id === 'number' ? { ...resource, id } : resource;
};

const applyItemStringId = (
  editor: SchemaConfigEditorState,
  index: number,
  key: 'name' | 'desc',
  result: unknown
): SchemaConfigEditorState => {
  const item = editor.items[index];
  const strings =
    key === 'name'
      ? { ...item.strings, name: applySavedId(item.strings.name, result) }
      : { ...item.strings, desc: applySavedId(item.strings.desc, result) };
  return {
    ...editor,
    items: replaceItem(editor.items, index, { ...item, strings }),
  };
};

const buildSaveRequests = (
  editor: SchemaConfigEditorState
): RA<SaveRequest> => {
  const { nameChanged, descChanged, containerChanged } =
    getEditorChanges(editor);
  return [
    ...(nameChanged
      ? [
          {
            promise: saveString(editor.name),
            reconcile: (
              editor: SchemaConfigEditorState,
              result: unknown
            ): SchemaConfigEditorState => {
              const saved = applySavedId(editor.name, result);
              return { ...editor, name: saved, initialName: saved };
            },
          },
        ]
      : []),
    ...(descChanged
      ? [
          {
            promise: saveString(editor.desc),
            reconcile: (
              editor: SchemaConfigEditorState,
              result: unknown
            ): SchemaConfigEditorState => {
              const saved = applySavedId(editor.desc, result);
              return { ...editor, desc: saved, initialDesc: saved };
            },
          },
        ]
      : []),
    ...(containerChanged
      ? [
          {
            promise: saveResource(
              'SpLocaleContainer',
              editor.container.id,
              editor.container
            ),
            reconcile: (
              editor: SchemaConfigEditorState
            ): SchemaConfigEditorState => ({
              ...editor,
              initialContainer: editor.container,
            }),
          },
        ]
      : []),
    ...editor.items.flatMap(({ strings, ...item }, index) =>
      editor.changedItems.includes(index)
        ? [
            {
              itemIndex: index,
              promise: saveResource('SpLocaleContainerItem', item.id, item),
              reconcile: (
                editor: SchemaConfigEditorState
              ): SchemaConfigEditorState => editor,
            },
            {
              itemIndex: index,
              promise: saveString(strings.name),
              reconcile: (
                editor: SchemaConfigEditorState,
                result: unknown
              ): SchemaConfigEditorState =>
                applyItemStringId(editor, index, 'name', result),
            },
            {
              itemIndex: index,
              promise: saveString(strings.desc),
              reconcile: (
                editor: SchemaConfigEditorState,
                result: unknown
              ): SchemaConfigEditorState =>
                applyItemStringId(editor, index, 'desc', result),
            },
          ]
        : []
    ),
  ];
};

const saveString = async (
  resource: NewSpLocaleItemString | SpLocaleItemString
): Promise<unknown> =>
  'resource_uri' in resource &&
  typeof resource.id === 'number' &&
  resource.id >= 0
    ? saveResource('SpLocaleItemStr', resource.id, resource)
    : createResource('SpLocaleItemStr', resource);

export const handleSchemaSaved = async (
  rawLanguage: string,
  tableName: string
): Promise<void> =>
  ping(
    // Flush schema cache
    formatUrl('/context/schema_localization.json', {
      lang: rawLanguage,
    }),
    {
      method: 'HEAD',
      cache: 'no-cache',
    }
  )
    // Reload the page after schema changes
    .then((): void =>
      globalThis.location.assign(
        tableName === ''
          ? `/specify/schema-config/${rawLanguage}/`
          : `/specify/schema-config/${rawLanguage}/${tableName}/`
      )
    );

export const exportsForTests = {
  buildSaveRequests,
};
