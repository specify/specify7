export const OCCURRENCE_ID_IRI = 'http://rs.tdwg.org/dwc/terms/occurrenceID';

export type MappingSummary = {
  readonly id: number;
  readonly name: string;
  readonly mappingType: string;
};

export type MappingRecord = {
  readonly id: number;
  readonly name: string;
  readonly mappingType: 'Core' | 'Extension';
  readonly isDefault: boolean;
  readonly queryId: number;
  readonly vocabulary: string;
  readonly totalFields: number;
  readonly unmappedFields: number;
};

export type MappingField = {
  readonly id: number;
  readonly position: number;
  readonly stringId: string;
  readonly fieldName: string;
  readonly term: string | undefined;
  readonly isStatic: boolean;
  readonly staticValue: string | undefined;
};

export type DwcTerm = {
  readonly iri: string;
  readonly label: string;
  readonly definition: string;
  readonly comments: string;
  readonly examples: string;
};

export type DwcVocabulary = {
  readonly key: string;
  readonly name: string;
  readonly abbreviation: string;
  readonly description: string;
  readonly uri: string;
  readonly terms: Readonly<Record<string, DwcTerm>>;
};
