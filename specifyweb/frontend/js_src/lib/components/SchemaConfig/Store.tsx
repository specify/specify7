import React from 'react';

import { ping } from '../../utils/ajax/ping';
import type { IR, RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import type { SerializedResource } from '../DataModel/helperTypes';
import type {
  SpLocaleContainer,
  SpLocaleContainerItem,
} from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { formatUrl } from '../Router/queryString';
import type { WithFetchedStrings } from '../Toolbar/SchemaConfig';
import { fetchContainerItems, fetchContainerString } from './data';
import { buildSaveRequests, isEditorModified, updateEditor } from './helpers';
import type { NewSpLocaleItemString, SpLocaleItemString } from './index';
import type { SchemaData } from './schemaData';
import type { SchemaConfigEditorState, SchemaConfigStore } from './types';

const SchemaConfigContext = React.createContext<SchemaConfigStore | undefined>(
  undefined
);
SchemaConfigContext.displayName = 'SchemaConfigContext';

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
    const snapshot = editorsRef.current;
    const outcomes = await Promise.all(
      Object.entries(snapshot)
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

    const failedItems = new Map<string, Set<number>>();
    let hasFailure = false;

    for (const outcome of outcomes) {
      if (outcome.status !== 'rejected') continue;
      hasFailure = true;
      if (typeof outcome.request.itemIndex === 'number') {
        const failed = failedItems.get(outcome.tableName) ?? new Set<number>();
        failed.add(outcome.request.itemIndex);
        failedItems.set(outcome.tableName, failed);
      }
    }

    // Reconcile against the latest state so edits made while requests were
    // in flight aren't overwritten
    setEditors((current) => {
      const newEditors: Record<string, SchemaConfigEditorState> = {
        ...current,
      };
      for (const outcome of outcomes) {
        if (outcome.status !== 'fulfilled') continue;
        const editor = newEditors[outcome.tableName];
        if (editor !== undefined)
          newEditors[outcome.tableName] = outcome.request.reconcile(
            editor,
            outcome.result
          );
      }

      // Drop only the changed items that were saved successfully this round
      for (const [tableName, editor] of Object.entries(newEditors)) {
        const failed = failedItems.get(tableName);
        const snapshotEditor = snapshot[tableName];
        const saved = new Set(
          (snapshotEditor?.changedItems ?? []).filter(
            (index) =>
              failed?.has(index) !== true &&
              current[tableName]?.items[index] === snapshotEditor?.items[index]
          )
        );
        newEditors[tableName] = {
          ...editor,
          changedItems: editor.changedItems.filter(
            (index) => !saved.has(index)
          ),
        };
      }
      return newEditors;
    });

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
