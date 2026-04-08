import React from 'react';

import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { Dialog } from '../Molecules/Dialog';
import type { DwcVocabulary } from './types';

const vocabularies: ReadonlyArray<DwcVocabulary> = [
  {
    key: 'dwc',
    name: 'Darwin Core',
    abbreviation: 'dwc',
    description:
      'Core terms for sharing biodiversity occurrence data and related information.',
    uri: 'http://rs.tdwg.org/dwc/terms/',
    terms: {},
  },
  {
    key: 'dc',
    name: 'Dublin Core',
    abbreviation: 'dc',
    description:
      'General-purpose metadata terms for describing resources.',
    uri: 'http://purl.org/dc/terms/',
    terms: {},
  },
  {
    key: 'ac',
    name: 'Audubon Core',
    abbreviation: 'ac',
    description:
      'Terms for describing biodiversity-related multimedia resources.',
    uri: 'http://rs.tdwg.org/ac/terms/',
    terms: {},
  },
];

export function VocabularyDialog({
  onClose: handleClose,
  onSelected: handleSelected,
}: {
  readonly onClose: () => void;
  readonly onSelected: (vocabularyKey: string) => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={
        <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
      }
      header={headerText.selectVocabulary()}
      icon={icons.documentSearch}
      onClose={handleClose}
    >
      <ul className="flex flex-col gap-2">
        {vocabularies.map((vocabulary) => (
          <li key={vocabulary.key}>
            <button
              className="w-full rounded border border-gray-300 px-4 py-3
                text-left hover:bg-gray-50 dark:border-neutral-600
                dark:hover:bg-neutral-700"
              type="button"
              onClick={() => handleSelected(vocabulary.key)}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">{vocabulary.name}</span>
                <span className="text-sm text-gray-500">
                  ({vocabulary.abbreviation})
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400">
                {vocabulary.description}
              </p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-neutral-500">
                {vocabulary.uri}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
