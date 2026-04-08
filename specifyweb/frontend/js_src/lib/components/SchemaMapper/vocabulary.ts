// Types and fetch function for DwC schema terms vocabulary

export type DwcTerm = {
  readonly name: string;
  readonly description: string;
  readonly group: string;
  readonly mappingPaths: ReadonlyArray<ReadonlyArray<string>>;
};

export type Vocabulary = {
  readonly name: string;
  readonly abbreviation: string;
  readonly vocabularyURI: string;
  readonly description: string;
  readonly terms: Readonly<Record<string, DwcTerm>>;
};

export type SchemaTerms = {
  readonly vocabularies: Readonly<Record<string, Vocabulary>>;
};

let cachedTerms: SchemaTerms | undefined;

export async function fetchSchemaTerms(): Promise<SchemaTerms> {
  if (cachedTerms !== undefined) return cachedTerms;
  const response = await fetch('/export/schema_terms/');
  cachedTerms = await response.json();
  return cachedTerms!;
}

export function findTermByIri(
  vocabularies: SchemaTerms['vocabularies'],
  iri: string
): { vocabulary: Vocabulary; term: DwcTerm } | undefined {
  for (const vocab of Object.values(vocabularies)) {
    const term = vocab.terms[iri];
    if (term !== undefined) return { vocabulary: vocab, term };
  }
  return undefined;
}
