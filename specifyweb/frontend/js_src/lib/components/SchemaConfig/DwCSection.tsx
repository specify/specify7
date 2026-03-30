import React from 'react';
import { Label } from '../Atoms/Form';
import { useBooleanState } from '../../hooks/useBooleanState';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import jsonTerms from '../../data/dwcTerms.json';
import { darwinCoreText } from '../../localization/dwc';
import { Tables } from '../DataModel/types';

export function DwCSection({
  tableName,
  fieldName,
}: {
  readonly tableName: keyof Tables;
  readonly fieldName: string;
}): JSX.Element {
  const [isOpen, _, __, handleOpen] = useBooleanState(false);

  const terms = jsonTerms.dwc.terms;

  const matchingTerms = terms.filter((termObj: any) => {
    const iri = Object.keys(termObj)[0];
    const term = termObj[iri];

    // mappingPath format: "table:collectionObject → field:startDateOrEndDate"
    const match = term.mappingPath.match(/table:(\w+)\s*→\s*field:(\w+)/);
    if (!match) return false;

    const [, termTable, termField] = match;

    return (
      termTable.toLowerCase() === String(tableName).toLowerCase() &&
      termField.toLowerCase() === fieldName.toLowerCase()
    );
  });

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <Label.Block>{darwinCoreText.darwinCore()}</Label.Block>
        <Button.Icon
          className="ml-1"
          icon={isOpen ? 'chevronDown' : 'chevronRight'}
          title="collapse"
          onClick={handleOpen}
        />
      </div>

      {isOpen && (
        <div className="mt-2">
          {matchingTerms.length === 0 ? (
            <p>{darwinCoreText.noDwCTerm()}</p>
          ) : (
            <div className="space-y-4">
              {matchingTerms.map((termObj: any, index: number) => {
                const iri = Object.keys(termObj)[0];
                const term = termObj[iri];

                return (
                  <div key={index} className="p-3">
                    {/* Term name */}
                    <div className="mb-2">
                      <span className="text-sm font-semibold mr-2">Term:</span>
                      <span className="inline-block px-2 py-1 text-sm bg-gray-200 rounded-md text-brand-300">
                        {term.termName}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="text-sm mb-1">
                      <span className="font-semibold">Description:</span>{' '}
                      {term.description}
                    </div>

                    {/* IRI */}
                    <div className="text-sm mb-1 mt-2">
                      <span className="font-semibold">IRI:</span>
                      <Link.NewTab href={iri} className="ml-1">
                        {iri}
                      </Link.NewTab>
                    </div>

                    {/* Vocabulary */}
                    <div className="text-sm mt-2">
                      <span className="font-semibold">Vocabulary:</span>{' '}
                      {jsonTerms.dwc.vocabularyURI}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
