import type { SpecifyResource } from './components/wbplanview';
import type { RelationshipType } from './components/wbplanviewmapper';
import type { IR, RA } from './types';

export type SchemaModelTableField = {
  readonly name: string;
  readonly getLocalizedName: () => string | null;
  readonly getPickList: () => string | null | undefined;
  readonly isRequired: boolean;
  readonly isHidden: () => number;
  readonly isRelationship: boolean;
  readonly length: number | undefined;
  readonly readOnly: boolean;
  readonly type: RelationshipType;
};

export type SchemaModelTableRelationship = SchemaModelTableField & {
  readonly otherSideName: string;
  readonly relatedModelName: string;
};

type SpecifyFetch = {
  readonly fetch: (filter: {
    readonly limit: number;
  }) => JqueryPromise<DomainTreeDefinitionItem>;
  readonly models: RA<SpecifyResource>;
};

type SchemaModelTableData = {
  readonly longName: string;
  readonly name: string;
  readonly getLocalizedName: () => string;
  readonly system: boolean;
  readonly tableId: number;
  readonly fields: RA<SchemaModelTableField | SchemaModelTableRelationship>;
  readonly LazyCollection: new (props: {
    readonly filters?: Partial<
      {
        readonly orderby: string;
        readonly id: number;
        readonly specifyuser: number;
        readonly domainfilter: boolean;
      } & IR<unknown>
    >;
  }) => SpecifyFetch;
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
  readonly then: (callback: (t: T) => void) => void;
};

export type Domain = {
  readonly getTreeDef: (
    tableName: string
  ) => JqueryPromise<DomainTreeDefinition>;
};
