import React from 'react';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { useAsyncState } from '../../hooks/useAsyncState';
import { ajax } from '../../utils/ajax';
import { Container } from '../Atoms';
import { Tabs } from '../AppResources/Tabs';
import { expressSearchConfigText } from '../../localization/expressSearchConfig';

import { SearchFieldsTab } from './SearchFieldsTab';
import { RelatedTablesTab } from './RelatedTablesTab';
import { ResultsOrderingTab } from './ResultsOrderingTab';

/** Serialize the in-memory config JSON back to minimal valid XML. */
function configToXml(config: any): string {
  if (!config)
    return '<search><tables></tables><relatedQueries></relatedQueries></search>';
  const escape = (s: string | null | undefined) =>
    (s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const tables = (config.tables ?? [])
    .map((tbl: any) => {
      const sfs = (tbl.searchFields ?? [])
        .map(
          (sf: any) =>
            `<searchfield><fieldName>${escape(sf.fieldName)}</fieldName><order>${sf.order ?? 0}</order><sortDirection>${escape(sf.sortDirection ?? 'None')}</sortDirection></searchfield>`
        )
        .join('');
      const dfs = (tbl.displayFields ?? [])
        .filter((df: any) => df.inUse !== false)
        .map(
          (df: any) =>
            `<displayfield><fieldName>${escape(df.fieldName)}</fieldName></displayfield>`
        )
        .join('');
      return `<searchtable><tableName>${escape(tbl.tableName)}</tableName><displayOrder>${tbl.displayOrder ?? 0}</displayOrder><searchFields>${sfs}</searchFields><displayFields>${dfs}</displayFields></searchtable>`;
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
}: {
  readonly onChange?: AppResourceTabProps['onChange'];
  readonly onChangeJSON?: (json: any) => void;
  readonly onSetCleanup?: AppResourceTabProps['onSetCleanup'];
}): JSX.Element {

  // Keep a stable ref to `onChange` so effects that use it don't need to list
  // it as a dependency (the parent recreates it on every render, which would
  // cause an infinite loop if it were in a dep array).
  const onChangeRef = React.useRef(onChange);
  React.useLayoutEffect(() => {
    onChangeRef.current = onChange;
  });

  const [initialDataResult] = useAsyncState(
    React.useCallback(
      () =>
        ajax('/express_search/config/', {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }).then((res) => res.data as any),
      []
    ),
    false
  );

  const [activeConfig, setActiveConfig] = React.useState<any>(null);

  React.useEffect(() => {
    if (initialDataResult) {
      const normalizedConfig = normalizeConfigForEditing(initialDataResult.config);
      setActiveConfig(normalizedConfig);
      onChangeJSON?.(normalizedConfig);
    }
  }, [initialDataResult, onChangeJSON]);

  // Stable handler — uses the ref so it never needs to be recreated.
  const handleChangeConfig = React.useCallback((newConfig: any) => {
    setActiveConfig(newConfig);
    onChangeRef.current?.(() => configToXml(newConfig));
    onChangeJSON?.(newConfig);
  }, [onChangeJSON]); // stable

  const [tabIndex, setTabIndex] = React.useState(0);

  if (!activeConfig || !initialDataResult) {
    return <div>{expressSearchConfigText.loading()}</div>;
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
        relatedQueriesDefinitions={initialDataResult.related_queries_definitions}
        onChangeConfig={handleChangeConfig}
      />
    ),
    [expressSearchConfigText.resultsOrderingTab()]: (
      <ResultsOrderingTab
        config={activeConfig}
        relatedQueriesDefinitions={initialDataResult.related_queries_definitions}
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
      onChange={props.onChange}
      onSetCleanup={props.onSetCleanup}
    />
  );
}
