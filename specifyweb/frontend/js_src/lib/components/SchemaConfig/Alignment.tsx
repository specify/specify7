import React from 'react';

import { schemaText } from '../../localization/schema';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { Link } from '../Atoms/Link';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import gbifCores from '../ExportFeed/data/gbifCores.json';
import { coreTermPatterns } from '../DwcaDefinition/data/coreTermPatterns';
import gbifExtensions from '../ExportFeed/data/gbifExtensions.json';

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
    if (!patterns.some((pattern) => fieldIdentity.includes(pattern))) return;
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
            <table className="grid-table grid-cols-[minmax(12rem,auto)_1fr] gap-2 rounded-md border border-gray-400 p-2">
              <thead>
                <tr>
                  <th scope="col">{schemaText.term()}</th>
                  <th scope="col">{schemaText.description()}</th>
                </tr>
              </thead>
              <tbody>
                {terms.map((term) => (
                  <tr key={term.name}>
                    <td>
                      <Link.NewTab href={term.iri}>
                        {localized(term.title ?? term.name)}
                      </Link.NewTab>
                    </td>
                    <td>{localized(term.description ?? '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))
      )}
    </fieldset>
  );
}
