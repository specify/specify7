import { RelationshipType } from './components/wbplanviewmapper';

export interface SchemaModelTableField {
  readonly name: string,
  readonly getLocalizedName: () => string,
  readonly isRequired: boolean,
  readonly isHidden: () => number,
  readonly isRelationship: boolean
}

export interface SchemaModelTableRelationship extends SchemaModelTableField {
  readonly otherSideName: string,
  readonly type: RelationshipType,
  readonly relatedModelName: string,
  readonly readOnly: boolean,
}

type SpecifyFetch = (filter: {filters: object}) => {
  fetch: (filter: {limit: number}) => JqueryPromise<DomainTreeDefinitionItem>
}

interface SchemaModelTableData {
  readonly longName: string,
  readonly getLocalizedName: () => string
  readonly system: boolean,
  readonly fields: SchemaModelTableField[]
  readonly LazyCollection: SpecifyFetch
}

type SchemaModels<T> = Readonly<Record<string, T>>;

export interface Schema {
  readonly models: SchemaModels<SchemaModelTableData>;
  readonly orgHierarchy: string[];
}

interface DomainTreeDefinitionItem {
  readonly get: (fieldName: string) => number | string,
  readonly rget: (fieldName: string) => Promise<DomainTreeDefinitionItem>,
  readonly attributes: {name: string, rankid: number, parent: string}
}

type DomainRequest = Readonly<Record<string, unknown>>

type SpecifyRequest = (param: DomainRequest) => JqueryPromise<void>;

export interface DomainTreeDefinitionItems {
  readonly fetch: SpecifyRequest;
  readonly models: SchemaModels<DomainTreeDefinitionItem>
}

interface DomainTreeDefinition {
  readonly rget: (
    fieldName: string,
  ) => JqueryPromise<DomainTreeDefinitionItems>,
}

export interface JqueryPromise<T> {
  readonly done: (callback: ((t: T) => void)) => void,
}

export interface Domain {
  readonly getTreeDef: (
    tableName: string,
  ) => JqueryPromise<DomainTreeDefinition>,
}