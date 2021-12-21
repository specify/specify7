/**
 * TypeScript types for some JS files
 *
 * @module
 * */

import type { RelationshipType } from './components/wbplanviewmapper';
import type { IR, RA } from './types';

export type SchemaModelTableField = {
  readonly name: string;
  readonly getLocalizedName: () => string | null;
  readonly getPickList: () => string | null | undefined;
  readonly isRequired: boolean;
  readonly isHidden: () => number;
  readonly isRelationship: boolean;
};

export type SchemaModelTableRelationship = SchemaModelTableField & {
  readonly otherSideName: string;
  readonly type: RelationshipType;
  readonly relatedModelName: string;
  readonly readOnly: boolean;
};

type SpecifyFetch = (filter: { readonly filters: object }) => {
  fetch: (filter: {
    readonly limit: number;
  }) => JqueryPromise<DomainTreeDefinitionItem>;
};

type SchemaModelTableData = {
  readonly longName: string;
  readonly getLocalizedName: () => string;
  readonly system: boolean;
  readonly fields: RA<SchemaModelTableField>;
  readonly LazyCollection: SpecifyFetch;
  readonly isHidden: () => boolean;
};

type SchemaModels<T> = IR<T>;

export type Schema = {
  readonly models: SchemaModels<SchemaModelTableData>;
  readonly orgHierarchy: RA<string>;
};

type DomainTreeDefinitionItem = {
  readonly get: (fieldName: string) => number | string;
  readonly rget: (fieldName: string) => Promise<DomainTreeDefinitionItem>;
  readonly attributes: { name: string; rankid: number; parent: string };
};

type DomainRequest = IR<unknown>;

type SpecifyRequest = (parameter: DomainRequest) => JqueryPromise<void>;

type DomainTreeDefinitionItems = {
  readonly fetch: SpecifyRequest;
  readonly models: SchemaModels<DomainTreeDefinitionItem>;
};

type DomainTreeDefinition = {
  readonly rget: (
    fieldName: string
  ) => JqueryPromise<DomainTreeDefinitionItems>;
};

export type JqueryPromise<T> = {
  readonly done: (callback: (t: T) => void) => void;
};

export type Domain = {
  readonly getTreeDef: (
    tableName: string
  ) => JqueryPromise<DomainTreeDefinition>;
};
