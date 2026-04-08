import React from 'react';

import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { Dialog } from '../Molecules/Dialog';
import type { MappingRecord } from './types';
import { VocabularyDialog } from './VocabularyDialog';

type AvailableQuery = {
  readonly id: number;
  readonly name: string;
  readonly contextTableId: number;
};

export function NewMappingDialog({
  existingMappings,
  onClose: handleClose,
  onCreateFromScratch: handleCreateFromScratch,
  onCreateFromQuery: handleCreateFromQuery,
  onCloneExisting: handleCloneExisting,
}: {
  readonly existingMappings: ReadonlyArray<MappingRecord>;
  readonly onClose: () => void;
  readonly onCreateFromScratch: (
    type: 'Core' | 'Extension',
    vocabularyKey: string,
    name: string
  ) => void;
  readonly onCreateFromQuery: (
    type: 'Core' | 'Extension',
    name: string,
    queryId: number
  ) => void;
  readonly onCloneExisting: (mappingId: number) => void;
}): JSX.Element {
  const [mappingName, setMappingName] = React.useState('');
  const [mappingType, setMappingType] = React.useState<
    'Core' | 'Extension' | undefined
  >(undefined);
  const [showVocabulary, setShowVocabulary] = React.useState(false);
  const [availableQueries, setAvailableQueries] = React.useState<
    ReadonlyArray<AvailableQuery> | undefined
  >(undefined);

  // Fetch available queries when user reaches the type selection step
  React.useEffect(() => {
    if (mappingType === undefined) return;
    let cancelled = false;
    fetch('/export/list_queries/', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as ReadonlyArray<AvailableQuery>;
        if (!cancelled) setAvailableQueries(data);
      })
      .catch(() => {
        if (!cancelled) setAvailableQueries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [mappingType]);

  return (
    <>
      <Dialog
        buttons={
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
        }
        header={headerText.newMapping()}
        onClose={handleClose}
      >
        {mappingType === undefined ? (
          <div className="flex flex-col gap-4">
            <Label.Block>
              {'Mapping Name'}
              <Input.Text
                placeholder="e.g. Botany Occurrence Export"
                value={mappingName}
                onValueChange={setMappingName}
              />
            </Label.Block>
            <h3 className="font-semibold">
              {headerText.selectMappingType()}
            </h3>
            <div className="flex gap-4">
              <Button.Info
                disabled={mappingName.trim().length === 0}
                onClick={() => setMappingType('Core')}
              >
                {headerText.coreOccurrence()}
              </Button.Info>
              <Button.Info
                disabled={mappingName.trim().length === 0}
                onClick={() => setMappingType('Extension')}
              >
                {headerText.extension()}
              </Button.Info>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold">
              {mappingType === 'Core'
                ? headerText.coreMappings()
                : headerText.extensionMappings()}
            </h3>
            <Button.Info onClick={() => setShowVocabulary(true)}>
              {headerText.createFromScratch()}
            </Button.Info>

            {/* Use Existing Query */}
            {availableQueries !== undefined && availableQueries.length > 0 && (
              <div>
                <h4 className="mb-2 font-medium">
                  {'Use Existing Query'}
                </h4>
                <p className="mb-2 text-xs text-gray-500">
                  {'Pick a Collection Object query you already built. Its fields will become the columns in your DwC export.'}
                </p>
                <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
                  {availableQueries.map((query) => (
                    <div
                      className="flex items-center gap-2 py-1"
                      key={query.id}
                    >
                      <span className="truncate">{query.name}</span>
                      <Button.Small
                        onClick={() =>
                          handleCreateFromQuery(
                            mappingType,
                            mappingName.trim(),
                            query.id
                          )
                        }
                      >
                        {'Use'}
                      </Button.Small>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clone Existing Mapping */}
            <div>
              <h4 className="mb-2 font-medium">
                {headerText.cloneExistingMapping()}
              </h4>
              {existingMappings.filter(
                (mapping) => mapping.mappingType === mappingType
              ).length === 0 ? (
                <p className="text-sm text-gray-500">
                  No existing mappings available. Create one from scratch to get
                  started.
                </p>
              ) : (
                existingMappings
                  .filter((mapping) => mapping.mappingType === mappingType)
                  .map((mapping) => (
                    <div
                      className="flex items-center gap-2 py-1"
                      key={mapping.id}
                    >
                      <span>{mapping.name}</span>
                      {mapping.isDefault && (
                        <span className="text-xs text-gray-500">
                          ({headerText.defaultMapping()})
                        </span>
                      )}
                      <Button.Small
                        onClick={() => handleCloneExisting(mapping.id)}
                      >
                        {headerText.clone()}
                      </Button.Small>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </Dialog>
      {showVocabulary && mappingType !== undefined && (
        <VocabularyDialog
          onClose={() => setShowVocabulary(false)}
          onSelected={(vocabularyKey) => {
            setShowVocabulary(false);
            handleCreateFromScratch(mappingType, vocabularyKey, mappingName.trim());
          }}
        />
      )}
    </>
  );
}
