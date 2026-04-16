import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { expressSearchConfigText } from '../../localization/expressSearchConfig';
import { ajax } from '../../utils/ajax';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { Tabs } from '../AppResources/Tabs';
import { Container } from '../Atoms';
import { RelatedTablesTab } from './RelatedTablesTab';
import { ResultsOrderingTab } from './ResultsOrderingTab';
import { SearchFieldsTab } from './SearchFieldsTab';

const UNINITIALIZED_RESOURCE_KEY = '__uninitialized_resource_key__';

function xmlToConfig(xml: string | null | undefined): any {
  if (typeof xml !== 'string' || xml.trim().length === 0)
    return { tables: [], relatedQueries: [] };

  try {
    const parsed = new DOMParser().parseFromString(xml, 'application/xml');
    if (parsed.getElementsByTagName('parsererror').length > 0)
      return { tables: [], relatedQueries: [] };

    const getChildText = (
      parent: Element,
      tagName: string
    ): string | undefined => {
      const child = Array.from(parent.children).find(
        (element) => element.tagName === tagName
      );
      return child?.textContent ?? undefined;
    };

    const tableElements = Array.from(
      parsed.getElementsByTagName('searchtable')
    );
    const tables = tableElements.map((tableElement) => {
      const searchFields = Array.from(
        tableElement.getElementsByTagName('searchfield'),
        (fieldElement) => {
          const fieldName = getChildText(fieldElement, 'fieldName') ?? '';
          const orderValue = getChildText(fieldElement, 'order');
          const sortDirection =
            getChildText(fieldElement, 'sortDirection') ?? 'None';
          const order = Number.parseInt(orderValue ?? '0', 10);

          return {
            fieldName,
            order: Number.isFinite(order) ? order : 0,
            sortDirection,
          };
        }
      );

      const displayFields = Array.from(
        tableElement.getElementsByTagName('displayfield'),
        (fieldElement) => ({
          fieldName: getChildText(fieldElement, 'fieldName') ?? '',
        })
      );

      const tableName = getChildText(tableElement, 'tableName') ?? '';
      const displayOrderValue = getChildText(tableElement, 'displayOrder');
      const displayOrder = Number.parseInt(displayOrderValue ?? '0', 10);

      return {
        tableName,
        displayOrder: Number.isFinite(displayOrder) ? displayOrder : 0,
        searchFields,
        displayFields,
      };
    });

    const relatedQueries = Array.from(
      parsed.getElementsByTagName('relatedquery'),
      (queryElement) => {
        const id = getChildText(queryElement, 'id') ?? '';
        const displayOrderValue = getChildText(queryElement, 'displayOrder');
        const displayOrder = Number.parseInt(displayOrderValue ?? '0', 10);
        const isActiveText =
          getChildText(queryElement, 'isActive') ??
          queryElement.getAttribute('isactive') ??
          'false';
        const isSystemText =
          getChildText(queryElement, 'isSystem') ??
          queryElement.getAttribute('issystem') ??
          'false';

        return {
          id,
          displayOrder: Number.isFinite(displayOrder) ? displayOrder : 0,
          isActive: isActiveText.toLowerCase() === 'true',
          isSystem: isSystemText.toLowerCase() === 'true',
        };
      }
    );

    return { tables, relatedQueries };
  } catch {
    return { tables: [], relatedQueries: [] };
  }
}

/** Serialize the in-memory config JSON back to minimal valid XML. */
function configToXml(config: any): string {
  if (!config)
    return '<search><tables></tables><relatedQueries></relatedQueries></search>';
  const escape = (s: string | null | undefined) =>
    (s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');

  const tables = (config.tables ?? [])
    .map((table: any) => {
      const activeSearchFields = (table.searchFields ?? [])
        .filter((sf: any) => sf.inUse !== false)
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

      const sfs = activeSearchFields
        .map(
          (sf: any, index: number) =>
            `<searchfield><fieldName>${escape(sf.fieldName)}</fieldName><order>${index}</order><sortDirection>${escape(sf.sortDirection ?? 'None')}</sortDirection></searchfield>`
        )
        .join('');
      const dfs = (table.displayFields ?? [])
        .filter((df: any) => df.inUse !== false)
        .map(
          (df: any) =>
            `<displayfield><fieldName>${escape(df.fieldName)}</fieldName></displayfield>`
        )
        .join('');
      return `<searchtable><tableName>${escape(table.tableName)}</tableName><displayOrder>${table.displayOrder ?? 0}</displayOrder><searchFields>${sfs}</searchFields><displayFields>${dfs}</displayFields></searchtable>`;
    })
    .join('');

  const rqs = (config.relatedQueries ?? [])
    .map(
      (rq: any) =>
        `<relatedquery isactive="${rq.isActive ? 'true' : 'false'}" issystem="${rq.isSystem ? 'true' : 'false'}"><id>${escape(rq.id)}</id><displayOrder>${rq.displayOrder ?? 0}</displayOrder></relatedquery>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><search><tables>${tables}</tables><relatedQueries>${rqs}</relatedQueries></search>`;
}

function normalizeConfigForEditing(config: any): any {
  return {
    ...config,
    tables: (config?.tables ?? []).map((table: any) => ({
      ...table,
      searchFields: (table?.searchFields ?? []).map((field: any) => ({
        ...field,
        inUse: field?.inUse ?? true,
      })),
      displayFields: (table?.displayFields ?? []).map((field: any) => ({
        ...field,
        inUse: field?.inUse ?? true,
      })),
    })),
    relatedQueries: (config?.relatedQueries ?? []).map((query: any) => ({
      ...query,
      isActive: query?.isActive ?? false,
      isSystem: query?.isSystem ?? true,
    })),
  };
}

export function ExpressSearchConfigEditor({
  onChange,
  onChangeJSON,
  initialXmlData,
  useResolvedConfig = true,
  resourceKey,
}: {
  readonly onChange?: AppResourceTabProps['onChange'];
  readonly onChangeJSON?: (json: any) => void;
  readonly initialXmlData?: string | null;
  readonly useResolvedConfig?: boolean;
  readonly resourceKey?: string;
  readonly onSetCleanup?: AppResourceTabProps['onSetCleanup'];
}): JSX.Element {
  /*
   * Keep a stable ref to `onChange` so effects that use it don't need to list
   * it as a dependency (the parent recreates it on every render, which would
   * cause an infinite loop if it were in a dep array).
   */
  const onChangeRef = React.useRef(onChange);
  React.useLayoutEffect(() => {
    onChangeRef.current = onChange;
  });

  const [initialDataResult] = useAsyncState(
    React.useCallback(
      async () =>
        ajax('/express_search/config/', {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }).then((res) => res.data as any),
      []
    ),
    false
  );

  const [activeConfig, setActiveConfig] = React.useState<any>(null);
  const lastInitializedResourceKeyRef = React.useRef<string>(
    UNINITIALIZED_RESOURCE_KEY
  );

  React.useEffect(() => {
    if (!initialDataResult) return;

    /*
     * In app-resource mode, parent updates `data` on every edit.
     * Re-initializing from that prop causes confusing state resets.
     */
    if (!useResolvedConfig) {
      const normalizedResourceKey = resourceKey ?? '__default_resource__';
      if (lastInitializedResourceKeyRef.current === normalizedResourceKey)
        return;
      lastInitializedResourceKeyRef.current = normalizedResourceKey;
    }

    const baseConfig = useResolvedConfig
      ? initialDataResult.config
      : xmlToConfig(initialXmlData);
    const normalizedConfig = normalizeConfigForEditing(baseConfig);
    setActiveConfig(normalizedConfig);
    onChangeJSON?.(normalizedConfig);
  }, [
    initialDataResult,
    onChangeJSON,
    initialXmlData,
    useResolvedConfig,
    resourceKey,
  ]);

  // Stable handler — uses the ref so it never needs to be recreated.
  const handleChangeConfig = React.useCallback(
    (newConfig: any) => {
      setActiveConfig(newConfig);
      onChangeRef.current?.(() => configToXml(newConfig));
      onChangeJSON?.(newConfig);
    },
    [onChangeJSON]
  ); // Stable

  const [tabIndex, setTabIndex] = React.useState(0);

  if (!activeConfig || !initialDataResult) {
    return <div>{expressSearchConfigText.loadingConfig()}</div>;
  }

  const tabs = {
    [expressSearchConfigText.searchFieldsTab()]: (
      <SearchFieldsTab
        config={activeConfig}
        schemaMetadata={initialDataResult.schema_metadata}
        onChangeConfig={handleChangeConfig}
      />
    ),
    [expressSearchConfigText.relatedTablesTab()]: (
      <RelatedTablesTab
        config={activeConfig}
        relatedQueriesDefinitions={
          initialDataResult.related_queries_definitions
        }
        onChangeConfig={handleChangeConfig}
      />
    ),
    [expressSearchConfigText.resultsOrderingTab()]: (
      <ResultsOrderingTab
        config={activeConfig}
        relatedQueriesDefinitions={
          initialDataResult.related_queries_definitions
        }
        onChangeConfig={handleChangeConfig}
      />
    ),
  };

  return (
    <Container.Base className="flex flex-1 flex-col overflow-auto p-4 gap-4">
      <Tabs index={[tabIndex, setTabIndex]} tabs={tabs} />
    </Container.Base>
  );
}

export function ExpressSearchConfigResourceEditor(
  props: AppResourceTabProps
): JSX.Element {
  return (
    <ExpressSearchConfigEditor
      initialXmlData={props.data}
      resourceKey={String(props.resource.resource_uri)}
      useResolvedConfig={false}
      onChange={props.onChange}
      onSetCleanup={props.onSetCleanup}
    />
  );
}
