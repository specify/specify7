import React from 'react';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import {
  expressSearchConfigText,
  getExpressSearchQueryTitle,
  getExpressSearchQueryDescription,
} from '../../localization/expressSearchConfig';

export function RelatedTablesTab({
  config,
  relatedQueriesDefinitions,
  onChangeConfig,
}: any) {
  const [selectedRqId, setSelectedRqId] = React.useState<string | null>(null);

  const inUseQueries = relatedQueriesDefinitions;

  const handleToggle = (id: string, isActive: boolean) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    let rq = newConfig.relatedQueries.find((r: any) => r.id === id);
    if (!rq) {
      rq = {
        id,
        isActive,
        isSystem: true,
        displayOrder: newConfig.relatedQueries.length,
      };
      newConfig.relatedQueries.push(rq);
    } else {
      rq.isActive = isActive;
    }
    onChangeConfig(newConfig);
  };

  const setAll = (isActive: boolean) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    inUseQueries.forEach((def: any) => {
      let rq = newConfig.relatedQueries.find((r: any) => r.id === def.id);
      if (!rq) {
        rq = {
          id: def.id,
          isActive,
          isSystem: true,
          displayOrder: newConfig.relatedQueries.length,
        };
        newConfig.relatedQueries.push(rq);
      } else {
        rq.isActive = isActive;
      }
    });
    onChangeConfig(newConfig);
  };

  const selectedQuery =
    selectedRqId !== null
      ? inUseQueries.find((q: any) => q.id === selectedRqId)
      : undefined;

  const selectedDescription =
    selectedQuery != null
      ?
        getExpressSearchQueryDescription(selectedQuery.name) ??
        selectedQuery.description ??
        expressSearchConfigText.noDescriptionAvailable()
      : expressSearchConfigText.selectRelatedQueryDescription();

  const selectedName =
    selectedQuery != null
      ?
        getExpressSearchQueryTitle(selectedQuery.name) ||
        selectedQuery.name ||
        String(selectedRqId)
      : null;

  return (
    <div className="flex flex-row gap-4 h-full min-h-[400px]">
      <div className="w-1/2 border rounded p-2 overflow-auto">
        <div className="flex gap-2 mb-2">
          <Button.Secondary onClick={() => setAll(true)}>
            {expressSearchConfigText.selectAllQueries()}
          </Button.Secondary>
          <Button.Secondary onClick={() => setAll(false)}>
            {expressSearchConfigText.deselectAllQueries()}
          </Button.Secondary>
        </div>
        <ul className="space-y-1">
          {inUseQueries.map((def: any) => {
            const rq = config.relatedQueries.find((r: any) => r.id === def.id);
            const isActive = rq?.isActive ?? false;
            const isSelected = selectedRqId === def.id;
            const title = getExpressSearchQueryTitle(def.name) || def.name || String(def.id);
            return (
              <li
                key={def.id}
                className={`flex justify-between items-center p-2 rounded cursor-pointer border-b ${
                  isSelected
                    ? 'bg-brand-100 dark:bg-brand-400 dark:!text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-zinc-700'
                }`}
                onClick={() => setSelectedRqId(def.id)}
              >
                <span className="text-sm">{title}</span>
                <Input.Checkbox
                  checked={isActive}
                  onChange={(e) =>
                    handleToggle(def.id, (e.target as HTMLInputElement).checked)
                  }
                />
              </li>
            );
          })}
          {inUseQueries.length === 0 && (
            <span className="text-gray-500 text-sm">
              {expressSearchConfigText.noRelatedQueriesAvailable()}
            </span>
          )}
        </ul>
      </div>

      <div className="w-1/2 border rounded p-4 bg-gray-50 dark:bg-zinc-800 overflow-auto">
        {selectedName ? (
          <>
            <h3 className="font-bold mb-2">{selectedName}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {selectedDescription}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            {expressSearchConfigText.selectRelatedQueryDescription()}
          </p>
        )}
      </div>
    </div>
  );
}
