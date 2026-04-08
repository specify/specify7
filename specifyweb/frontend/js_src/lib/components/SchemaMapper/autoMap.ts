import type { MappingField } from './types';
import type { Vocabulary } from './vocabulary';

/**
 * Auto-assign DwC terms to query fields based on field name matching.
 * Matches by comparing the field's fieldName (case-insensitive) against
 * the last element of each term's mappingPath.
 *
 * Does not overwrite fields that already have a term assigned.
 */
export function autoMapFields(
  fields: ReadonlyArray<MappingField>,
  vocabulary: Vocabulary
): ReadonlyArray<MappingField> {
  return fields.map((field) => {
    if (field.term !== undefined) return field;

    const fieldNameLower = field.fieldName.toLowerCase();

    for (const [iri, term] of Object.entries(vocabulary.terms)) {
      for (const mappingPath of term.mappingPaths) {
        if (mappingPath.length === 0) continue;

        // Match by last element of mappingPath (the actual Specify field name)
        const lastPathElement = mappingPath[mappingPath.length - 1];
        if (lastPathElement.toLowerCase() === fieldNameLower) {
          return { ...field, term: iri };
        }
      }
    }
    return field;
  });
}
