import React from 'react';

import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { Button } from '../Atoms/Button';
import { Dialog } from '../Molecules/Dialog';
import type { MappingRecord } from './types';
import { VocabularyDialog } from './VocabularyDialog';

export function NewMappingDialog({
  existingMappings,
  onClose: handleClose,
  onCreateFromScratch: handleCreateFromScratch,
  onCloneExisting: handleCloneExisting,
}: {
  readonly existingMappings: ReadonlyArray<MappingRecord>;
  readonly onClose: () => void;
  readonly onCreateFromScratch: (
    type: 'Core' | 'Extension',
    vocabularyKey: string
  ) => void;
  readonly onCloneExisting: (mappingId: number) => void;
}): JSX.Element {
  const [mappingType, setMappingType] = React.useState<
    'Core' | 'Extension' | undefined
  >(undefined);
  const [showVocabulary, setShowVocabulary] = React.useState(false);

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
            <h3 className="font-semibold">
              {headerText.selectMappingType()}
            </h3>
            <div className="flex gap-4">
              <Button.Info onClick={() => setMappingType('Core')}>
                {headerText.coreOccurrence()}
              </Button.Info>
              <Button.Info onClick={() => setMappingType('Extension')}>
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
            <div>
              <h4 className="mb-2 font-medium">
                {headerText.cloneExistingMapping()}
              </h4>
              {existingMappings
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
                ))}
            </div>
          </div>
        )}
      </Dialog>
      {showVocabulary && mappingType !== undefined && (
        <VocabularyDialog
          onClose={() => setShowVocabulary(false)}
          onSelected={(vocabularyKey) => {
            setShowVocabulary(false);
            handleCreateFromScratch(mappingType, vocabularyKey);
          }}
        />
      )}
    </>
  );
}
