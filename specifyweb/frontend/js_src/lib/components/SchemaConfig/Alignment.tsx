import React from 'react';

import { schemaText } from '../../localization/schema';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import {
  formatTermExampleText,
  TermInfoDialog,
} from '../DwcaDefinition/DwcaDefinition';
import gbifCores from '../DwcaDefinition/data/gbifCores.json';
import { coreTermPatterns } from '../DwcaDefinition/data/coreTermPatterns';
import gbifExtensions from '../DwcaDefinition/data/gbifExtensions.json';

type Vocabulary = (typeof gbifCores)[number] | (typeof gbifExtensions)[number];
type VocabularyField = Vocabulary['fields'][number];

export type FieldAlignment = {
  readonly term: VocabularyField;
  readonly vocabulary: Vocabulary;
};

const vocabularies: readonly Vocabulary[] = [...gbifCores, ...gbifExtensions];

const normalizeFieldIdentity = (field: LiteralField | Relationship): string =>
  `${field.table.name}.${field.name}`.toLowerCase();

export function getFieldAlignments(
  field: LiteralField | Relationship
): RA<FieldAlignment> {
  const fieldIdentity = normalizeFieldIdentity(field);
  const alignments: FieldAlignment[] = [];
  const seen = new Set<string>();

  Object.entries(coreTermPatterns).forEach(([termName, patterns]) => {
    if (!patterns.some((pattern) => fieldIdentity.endsWith(pattern))) return;
    vocabularies.forEach((vocabulary) => {
      const term = vocabulary.fields.find(({ name }) => name === termName);
      if (term === undefined) return;
      const key = `${vocabulary.rowType}:${term.name}`;
      if (seen.has(key)) return;
      seen.add(key);
      alignments.push({ term, vocabulary });
    });
  });

  return alignments;
}

export function SchemaConfigAlignment({
  field,
}: {
  readonly field: LiteralField | Relationship;
}): JSX.Element {
  const [selectedAlignment, setSelectedAlignment] = React.useState<
    FieldAlignment | undefined
  >(undefined);
  const alignments = React.useMemo(() => getFieldAlignments(field), [field]);
  const alignmentsByVocabulary = React.useMemo(() => {
    const grouped = new Map<
      string,
      { vocabulary: Vocabulary; terms: RA<VocabularyField> }
    >();
    alignments.forEach(({ term, vocabulary }) => {
      const key = vocabulary.rowType;
      const group = grouped.get(key);
      if (group === undefined) {
        grouped.set(key, { vocabulary, terms: [term] });
      } else {
        grouped.set(key, { ...group, terms: [...group.terms, term] });
      }
    });
    return [...grouped.values()];
  }, [alignments]);
  return (
    <fieldset>
      {alignments.length === 0 ? (
        <p>{schemaText.noDataModelAlignment()}</p>
      ) : (
        alignmentsByVocabulary.map(({ vocabulary, terms }) => (
          <section className="flex flex-col gap-1" key={vocabulary.rowType}>
            <h3 className="font-semibold">
              {localized(vocabulary.title ?? vocabulary.name)}
            </h3>
            <ul className="divide-y divide-gray-300 rounded-md border border-gray-400">
              {terms.map((term) => {
                const alignment = alignments.find(
                  (candidate) =>
                    candidate.vocabulary === vocabulary &&
                    candidate.term === term
                );
                return (
                  <li
                    className="flex flex-col gap-1 p-2 [overflow-wrap:anywhere]"
                    key={term.name}
                  >
                    <Button.LikeLink
                      className="font-semibold"
                      onClick={(): void => {
                        if (alignment !== undefined)
                          setSelectedAlignment(alignment);
                      }}
                    >
                      {localized(term.title ?? term.name)}
                    </Button.LikeLink>
                    <p>
                      {formatTermExampleText(localized(term.description ?? ''))}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
      {selectedAlignment !== undefined && (
        <TermInfoDialog
          term={selectedAlignment.term}
          extension={gbifExtensions.some(
            ({ rowType }) => rowType === selectedAlignment.vocabulary.rowType
          )}
          onClose={(): void => setSelectedAlignment(undefined)}
        />
      )}
    </fieldset>
  );
}
