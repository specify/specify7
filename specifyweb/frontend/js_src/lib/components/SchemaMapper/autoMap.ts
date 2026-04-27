import type { MappingField } from './types';
import type { Vocabulary } from './vocabulary';

/**
 * Auto-assign DwC terms to query fields based on mappingPath matches.
 * Does not overwrite fields that already have a term assigned.
 */
export function autoMapFields(
  fields: ReadonlyArray<MappingField>,
  vocabulary: Vocabulary
): ReadonlyArray<MappingField> {
  return fields.map((field) => {
    if (field.term !== undefined) return field;

    for (const [iri, term] of Object.entries(vocabulary.terms)) {
      for (const mappingPath of term.mappingPaths) {
        const pathString = mappingPath.join('.');
        if (
          field.stringId.includes(pathString) ||
          field.fieldName === mappingPath[mappingPath.length - 1]
        ) {
          return { ...field, term: iri };
        }
      }
    }
    return field;
  });
}
