import React from 'react';

import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import type { DwcTerm } from './types';

export function TermDropdown({
  selectedIri,
  vocabularyTerms,
  onChange: handleChange,
}: {
  readonly selectedIri: string | undefined;
  readonly vocabularyTerms: Readonly<Record<string, DwcTerm>>;
  readonly onChange: (iri: string | undefined) => void;
}): JSX.Element {
  const [search, setSearch] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [showCustomIri, setShowCustomIri] = React.useState(false);
  const [customIri, setCustomIri] = React.useState('');

  const filteredTerms = React.useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return Object.entries(vocabularyTerms).filter(
      ([iri, term]) =>
        term.label.toLowerCase().includes(lowerSearch) ||
        iri.toLowerCase().includes(lowerSearch)
    );
  }, [vocabularyTerms, search]);

  const selectedTerm =
    selectedIri === undefined ? undefined : vocabularyTerms[selectedIri];

  const isCustomIriValid =
    customIri.startsWith('http://') || customIri.startsWith('https://');

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Input.Text
          placeholder={commonText.search()}
          value={isOpen ? search : (selectedTerm?.label ?? selectedIri ?? '')}
          onFocus={() => setIsOpen(true)}
          onValueChange={(value) => {
            setSearch(value);
            setIsOpen(true);
          }}
        />
        {selectedIri !== undefined && (
          <Button.Icon
            icon="x"
            title={commonText.remove()}
            onClick={() => {
              handleChange(undefined);
              setSearch('');
            }}
          />
        )}
      </div>
      {isOpen && (
        <ul
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded
            border border-gray-300 bg-white shadow-lg dark:border-neutral-600
            dark:bg-neutral-800"
        >
          {filteredTerms.length === 0 && !showCustomIri ? (
            <li className="px-3 py-2 text-gray-500">
              {commonText.noResults()}
            </li>
          ) : (
            filteredTerms.map(([iri, term]) => (
              <li key={iri}>
                <button
                  className="w-full px-3 py-2 text-left hover:bg-gray-100
                    dark:hover:bg-neutral-700"
                  type="button"
                  onClick={() => {
                    handleChange(iri);
                    setSearch('');
                    setIsOpen(false);
                    setShowCustomIri(false);
                  }}
                >
                  <span className="font-medium">{term.label}</span>
                  <span className="ml-2 text-sm text-gray-500">{iri}</span>
                </button>
              </li>
            ))
          )}
          <li className="border-t border-gray-200 dark:border-neutral-600">
            {showCustomIri ? (
              <div className="flex flex-col gap-1 px-3 py-2">
                <Input.Text
                  placeholder={headerText.enterCustomIri()}
                  value={customIri}
                  onValueChange={setCustomIri}
                />
                {customIri.length > 0 && !isCustomIriValid && (
                  <span className="text-xs text-yellow-600 dark:text-yellow-400">
                    {headerText.customIriWarning()}
                  </span>
                )}
                <Button.Small
                  onClick={() => {
                    if (customIri.length > 0) {
                      handleChange(customIri);
                      setCustomIri('');
                      setShowCustomIri(false);
                      setSearch('');
                      setIsOpen(false);
                    }
                  }}
                >
                  {commonText.apply()}
                </Button.Small>
              </div>
            ) : (
              <button
                className="w-full px-3 py-2 text-left text-sm italic
                  text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-700"
                type="button"
                onClick={() => setShowCustomIri(true)}
              >
                {headerText.enterCustomIri()}
              </button>
            )}
          </li>
        </ul>
      )}
    </div>
  );
}
