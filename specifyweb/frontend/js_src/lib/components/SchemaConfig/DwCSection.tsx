import React from 'react';
import { Label } from '../Atoms/Form';
import { useBooleanState } from '../../hooks/useBooleanState';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import jsonTerms from '../../data/dwcTerms.json';
import { darwinCoreText } from '../../localization/dwc';

export function DwCSection({}: {}): JSX.Element {
  const [isOpen, _, __, handleOpen] = useBooleanState(false);

  const terms = jsonTerms.dwc.terms;

  return (
    <div className="flex flex-col">
      <div className="flex">
        <Label.Block>{darwinCoreText.darwinCore()}</Label.Block>
        <Button.Icon
          className={`ml-1`}
          icon={isOpen ? 'chevronDown' : 'chevronRight'}
          title="collapse"
          onClick={handleOpen}
        />
      </div>

      {isOpen && (
        <div className="space-y-4">
          {terms.map((termObj, index) => {
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
  );
}
