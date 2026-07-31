import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { icons } from '../Atoms/Icons';
import { Button } from '../Atoms/Button';
import { Submit } from '../Atoms/Submit';
import { Dialog } from '../Molecules/Dialog';
import { MappingFileSetup } from './MappingFileSetup';
import type {
  MappingFileColumns,
  MappingFileRow,
  MatchingMode,
} from './types';

export function MatchingModeDialog({
  onContinue: handleContinue,
  onClose: handleClose,
  initialMode,
  initialColumns,
  initialData,
}: {
  readonly onContinue: (
    mode: MatchingMode | null,
    columns?: MappingFileColumns,
    data?: RA<MappingFileRow>
  ) => void;
  readonly onClose: () => void;
  readonly initialMode?: MatchingMode | null;
  readonly initialColumns?: MappingFileColumns;
  readonly initialData?: RA<MappingFileRow>;
}): JSX.Element {
  const [mode, setMode] = React.useState<MatchingMode | null>(
    initialMode ?? null
  );
  const [mappingColumns, setMappingColumns] = React.useState<
    MappingFileColumns | undefined
  >(initialColumns);
  const [mappingData, setMappingData] = React.useState<
    RA<MappingFileRow> | undefined
  >(initialData);

  const canContinue =
    (mode === null || mode === undefined) ||
    (mode === 'mappingFile' &&
      mappingColumns !== undefined &&
      mappingData !== undefined &&
      mappingData.length > 0);

  return (
    <Dialog
      icon={icons.photos}
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Submit.Success
            disabled={!canContinue}
            onClick={() =>
              handleContinue(mode, mappingColumns, mappingData)
            }
          >
            {commonText.proceed()}
          </Submit.Success>
        </>
      }
      header={attachmentsText.matchingMode()}
      onClose={handleClose}
    >
      <div className="flex flex-col gap-4">
        <div className="text-sm">{attachmentsText.chooseMatchingMode()}</div>

        <label
          className={`flex cursor-pointer items-start gap-3 rounded border p-3 ${
            mode === null
              ? 'border-brand-300 bg-brand-50'
              : 'border-gray-300'
          }`}
        >
          <input
            checked={mode === null}
            className="mt-0.5"
            name="matchingMode"
            type="radio"
            onChange={() => setMode(null)}
          />
          <div className="flex flex-col gap-1">
            <span className="font-semibold">
              {attachmentsText.matchByFilename()}
            </span>
            <span className="text-sm text-gray-500">
              {attachmentsText.matchByFilenameDescription()}
            </span>
          </div>
        </label>

        <label
          className={`flex cursor-pointer items-start gap-3 rounded border p-3 ${
            mode === 'mappingFile'
              ? 'border-brand-300 bg-brand-50'
              : 'border-gray-300'
          }`}
        >
          <input
            checked={mode === 'mappingFile'}
            className="mt-0.5"
            name="matchingMode"
            type="radio"
            onChange={() => setMode('mappingFile')}
          />
          <div className="flex w-full flex-col gap-1">
            <span className="font-semibold">
              {attachmentsText.matchByMappingFile()}
            </span>
            <span className="text-sm text-gray-500">
              {attachmentsText.matchByMappingFileDescription()}
            </span>
            {mode === 'mappingFile' && (
              <div className="mt-3">
                <MappingFileSetup
                  initialColumns={mappingColumns}
                  initialData={mappingData}
                  onColumnsSelected={(columns, data) => {
                    setMappingColumns(columns);
                    setMappingData(data);
                  }}
                />
              </div>
            )}
          </div>
        </label>
      </div>
    </Dialog>
  );
}
