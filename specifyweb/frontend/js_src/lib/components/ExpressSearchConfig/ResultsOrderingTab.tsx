import React from 'react';

import {
  expressSearchConfigText,
  getExpressSearchQueryTitle,
} from '../../localization/expressSearchConfig';
import { camelToHuman } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { genericTables } from '../DataModel/tables';

function tableLabel(tableName: string): string {
  return (
    (genericTables[tableName as keyof typeof genericTables]?.label as string | undefined) ??
    camelToHuman(tableName)
  );
}

export function ResultsOrderingTab({ config, relatedQueriesDefinitions = [], onChangeConfig }: any) {
  const baseTables = config.tables
    .filter((t: any) => t.searchFields.some((sf: any) => sf.inUse !== false))
    .map((t: any) => ({
      type: 'table',
      id: t.tableName,
      label: tableLabel(t.tableName),
      displayOrder: t.displayOrder ?? 1000,
    }));

  const activeQueries = config.relatedQueries
    .filter((rq: any) => rq.isActive)
    .map((rq: any) => {
      const def = relatedQueriesDefinitions.find((def: any) => def.id === rq.id);
      const title = def?.name ? getExpressSearchQueryTitle(def.name) : undefined;

      if (!def || !title || title === String(def.name)) {
        return undefined;
      }

      return {
        type: 'query',
        id: rq.id,
        label: expressSearchConfigText.relatedQueryLabel({
          query: title,
        }),
        displayOrder: rq.displayOrder ?? 1000,
      };
    })
    .filter(Boolean);

  const allItems = [...baseTables, ...activeQueries].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  const moveItem = (index: number, direction: 'down' | 'up') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === allItems.length - 1) return;

    const newItems = Array.from(allItems);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    const temporary = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temporary;

    const newConfig = JSON.parse(JSON.stringify(config));

    newItems.forEach((item, newOrder) => {
      if (item.type === 'table') {
        const t = newConfig.tables.find((t: any) => t.tableName === item.id);
        if (t) t.displayOrder = newOrder;
      } else {
        const rq = newConfig.relatedQueries.find((r: any) => r.id === item.id);
        if (rq) rq.displayOrder = newOrder;
      }
    });

    newConfig.tables.sort(
      (a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    );
    newConfig.relatedQueries.sort(
      (a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    );

    onChangeConfig(newConfig);
  };

  return (
    <div className="flex flex-col gap-2 h-full min-h-[400px]">
      <h3 className="font-bold mb-2">{expressSearchConfigText.configureResultsOrdering()}</h3>
      <p className="text-sm text-gray-500 mb-4">
        {expressSearchConfigText.reorderResultsOrderingDescription()}
      </p>

      <ul className="space-y-2 border rounded p-4 max-w-2xl bg-gray-50 dark:bg-zinc-800 overflow-auto max-h-[600px]">
        {allItems.map((item, index) => (
          <li
            className="flex justify-between items-center bg-white dark:bg-zinc-700 p-3 border rounded shadow-sm"
            key={`${item.type}-${item.id}`}
          >
            <span className="font-medium">{item.label}</span>
            <div className="flex gap-2">
              <Button.BorderedGray disabled={index === 0} onClick={() => moveItem(index, 'up')}>
                {icons.chevronUp}
              </Button.BorderedGray>
              <Button.BorderedGray
                disabled={index === allItems.length - 1}
                onClick={() => moveItem(index, 'down')}
              >
                {icons.chevronDown}
              </Button.BorderedGray>
            </div>
          </li>
        ))}
        {allItems.length === 0 && (
          <span className="text-gray-500">
            {expressSearchConfigText.noDisplayItemsConfigured()}
          </span>
        )}
      </ul>
    </div>
  );
}
