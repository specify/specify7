import collectionapi from './collectionapi';
import type { Tables } from './datamodel';
import type {
  AnySchema,
  AnyTree,
  CommonFields,
  SerializedModel,
  SerializedResource,
} from './datamodelutils';
import { getIcon } from './icons';
import type { SpecifyResource } from './legacytypes';
import ResourceBase from './resourceapi';
import type { SchemaLocalization } from './schema';
import { localization, schema } from './schema';
import { unescape } from './schemabase';
import { getTableOverwrite, modelViews } from './schemaoverrides';
import type { LiteralField, Relationship } from './specifyfield';
import {
  type FieldDefinition,
  type RelationshipDefinition,
} from './specifyfield';
import type { IR, RA } from './types';
import { defined } from './types';
import { camelToHuman } from './helpers';
import { f } from './functools';
import { isTreeResource } from './treedefinitions';

type FieldAlias = {
  readonly vname: string;
  readonly aname: string;
};

export type TableDefinition = {
  readonly classname: string;
  readonly idFieldName: string;
  readonly view?: string | null;
  readonly searchDialog?: string | null;
  readonly tableId: number;
  // Indicates the model is a system table.
  readonly system: boolean;
  readonly fieldAliases: RA<FieldAlias>;
  readonly fields: RA<FieldDefinition>;
  readonly relationships: RA<RelationshipDefinition>;
};

type CollectionConstructor<SCHEMA extends AnySchema> = new (
  props?: {
    readonly related?: SpecifyResource<AnySchema>;
    readonly field?: Relationship;
    readonly filters?: Partial<
      {
        readonly orderby: string;
        readonly domainfilter: boolean;
      } & SCHEMA['fields'] &
        CommonFields &
        // This is required to allow for filters like leftSide__isnull
        IR<string | boolean | number | null>
    >;
    readonly domainfilter?: boolean;
  },
  models?: RA<SpecifyResource<AnySchema>>
) => UnFetchedCollection<SCHEMA>;

export type UnFetchedCollection<SCHEMA extends AnySchema> = {
  readonly fetchPromise: (filter?: {
    readonly limit: number;
  }) => Promise<Collection<SCHEMA>>;
};

export type Collection<SCHEMA extends AnySchema> = {
  readonly field?: Relationship;
  readonly related?: SpecifyResource<AnySchema>;
  readonly _totalCount?: number;
  readonly models: RA<SpecifyResource<SCHEMA>>;
  readonly model: {
    readonly specifyModel: SpecifyModel<SCHEMA>;
  };
  readonly constructor: CollectionConstructor<SCHEMA>;
  /*
   * Shorthand method signature is used to prevent
   * https://github.com/microsoft/TypeScript/issues/48339
   * More info: https://stackoverflow.com/a/55992840/8584605
   */
  /* eslint-disable @typescript-eslint/method-signature-style */
  isComplete(): boolean;
  getTotalCount(): Promise<number>;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  toJSON<V extends IR<unknown>>(): RA<V>;
  add(resource: SpecifyResource<SCHEMA>): void;
  remove(resource: SpecifyResource<SCHEMA>): void;
  fetchPromise(filter?: {
    readonly limit: number;
  }): Promise<Collection<SCHEMA>>;
  trigger(eventName: string): void;
  on(eventName: string, callback: (...args: RA<never>) => void): void;
  once(eventName: string, callback: (...args: RA<never>) => void): void;
  off(eventName?: string, callback?: (...args: RA<never>) => void): void;
  /* eslint-enable @typescript-eslint/method-signature-style */
};

// TODO: tighten up schema field types (use literals / enums)
export class SpecifyModel<SCHEMA extends AnySchema = AnySchema> {
  /** Java classname of the Specify 6 ORM object */
  public readonly longName: string;

  public readonly name: SCHEMA['tableName'];

  public readonly idFieldName: string;

  public readonly isSystem: boolean;

  public readonly isHidden: boolean;

  public readonly overrides: {
    readonly isSystem: boolean;
    readonly isHidden: boolean;
    readonly isCommon: boolean;
  };

  public readonly tableId: number;

  public readonly view: string;

  public readonly searchDialog?: string;

  private readonly fieldAliases: RA<FieldAlias>;

  /**
   * A Backbone model resource for accessing the API for items of this type.
   *
   * @remarks
   * RESOURCE generic is needed as a workaround for
   * https://github.com/microsoft/TypeScript/issues/48339
   */
  public readonly Resource: new <RESOURCE extends AnySchema = SCHEMA>(
    props?: Partial<
      | SerializedResource<RESOURCE>
      | SerializedModel<RESOURCE>
      /*
       * Even though id is already a part of SerializedResource, for some reason
       * I need to specify it again here
       */
      | { readonly id?: number }
    >,
    options?: Partial<{
      readonly noBusinessRules: boolean;
      readonly noValidation: boolean;
    }>
  ) => SpecifyResource<RESOURCE>;

  /** A Backbone collection for lazy loading a collection of items of this type. */
  public readonly LazyCollection: CollectionConstructor<SCHEMA>;

  /**
   * A Backbone collection for loading a dependent collection of items of this
   * type as a -to-many collection of some other resource.
   */
  public readonly DependentCollection: CollectionConstructor<SCHEMA>;

  /**
   * A Backbone collection for loading a collection of items of this type as a
   * backwards -to-one collection of some other resource.
   */
  public readonly ToOneCollection: CollectionConstructor<SCHEMA>;

  /** All table non-relationship fields */
  public literalFields: RA<LiteralField> = [];

  /** All table relationships */
  public relationships: RA<Relationship> = [];

  /** All table literal fields and relationships */
  public fields: RA<LiteralField | Relationship> = [];

  public readonly localization: SchemaLocalization;

  /** Localized name from the schema localization */
  public readonly label: string;

  public static parseClassName(className: string): string {
    return className.split('.').slice(-1)[0] as keyof Tables;
  }

  public constructor(tableDefinition: TableDefinition) {
    this.longName = tableDefinition.classname;
    this.name = SpecifyModel.parseClassName(
      this.longName
    ) as SCHEMA['tableName'];
    this.idFieldName = tableDefinition.idFieldName;
    this.view = tableDefinition.view ?? modelViews[this.name] ?? this.name;
    this.searchDialog = tableDefinition.searchDialog ?? undefined;
    this.tableId = tableDefinition.tableId;
    this.isSystem = tableDefinition.system;
    this.fieldAliases = tableDefinition.fieldAliases;

    this.Resource = ResourceBase.extend(
      { __name__: `${this.name}Resource` },
      { specifyModel: this }
    );

    this.LazyCollection = collectionapi.Lazy.extend({
      __name__: `${this.name}LazyCollection`,
      model: this.Resource,
    });

    this.DependentCollection = collectionapi.Dependent.extend({
      __name__: `${this.name}DependentCollection`,
      model: this.Resource,
    });

    this.ToOneCollection = collectionapi.ToOne.extend({
      __name__: `${this.name}ToOneCollection`,
      model: this.Resource,
    });

    this.localization = localization[this.name.toLowerCase()] ?? { items: [] };

    this.label =
      typeof this.localization.name === 'string'
        ? unescape(this.localization.name)
        : camelToHuman(this.name);

    this.isHidden = this.localization.ishidden === 1;

    const tableOverride = getTableOverwrite(this.name);
    this.overrides = {
      isHidden: this.isHidden || tableOverride === 'hidden',
      isSystem: this.isSystem || tableOverride === 'system',
      isCommon: tableOverride === 'commonBaseTable',
    };
  }

  /**
   * Return a field object representing the named field of this model.
   * name can be either a dotted name string or an array and will traverse
   * relationships.
   */
  public getField(
    unparsedName: string
  ): LiteralField | Relationship | undefined {
    if (unparsedName === '') return undefined;
    if (typeof unparsedName !== 'string') throw new Error('Invalid field name');

    const splitName = unparsedName.toLowerCase().split('.');
    let field = this.fields.find(
      (field) => field.name.toLowerCase() === splitName[0]
    );

    // If can't find the field by name, try looking for aliases
    if (typeof field === 'undefined') {
      const alias = this.fieldAliases.find(
        (alias) => alias.vname.toLowerCase() === splitName[0]
      );
      if (typeof alias === 'object') field = this.getField(alias.aname);
    }

    if (splitName.length === 1 || typeof field === 'undefined') return field;
    else if (field.isRelationship)
      return defined(field.relatedModel).getField(splitName.slice(1).join('.'));
    else throw new Error('Field is not a relationship');
  }

  public getLiteralField(literalName: string): LiteralField | undefined {
    const field = this.getField(literalName);
    if (typeof field === 'undefined') return undefined;
    else if (field.isRelationship) throw new Error('Field is a relationship');
    else return field;
  }

  public getRelationship(relationshipName: string): Relationship | undefined {
    const relationship = this.getField(relationshipName);
    if (typeof relationship === 'undefined') return undefined;
    else if (relationship.isRelationship) return relationship;
    else throw new Error('Field is not a relationship');
  }

  public getFormat(): string | undefined {
    return this.localization.format ?? undefined;
  }

  public getAggregator(): string | undefined {
    return this.localization.aggregator ?? undefined;
  }

  public getIcon(): string {
    return this.overrides.isSystem
      ? '/images/system.png'
      : getIcon(this.name.toLowerCase());
  }

  /**
   * Returns the relationship field of this model that places it in
   * the collection -> discipline -> division -> institution scoping
   * hierarchy.
   */
  public getScopingRelationship(): Relationship | undefined {
    return schema.orgHierarchy
      .map((fieldName) => this.getField(fieldName))
      .find(
        (field): field is Relationship =>
          typeof field === 'object' && field.type === 'many-to-one'
      );
  }

  /**
   * Returns a list of relationship field names traversing the
   * scoping hierarchy.
   */
  public getScopingPath(): RA<string> | undefined {
    if (this.name === schema.orgHierarchy.slice(-1)[0]) return [];
    const up = this.getScopingRelationship();
    return typeof up === 'undefined'
      ? undefined
      : [...defined(up.relatedModel?.getScopingPath()), up.name.toLowerCase()];
  }
}

export const isResourceOfType = <TABLE_NAME extends keyof Tables>(
  resource: SpecifyResource<AnySchema>,
  tableName: TABLE_NAME
  // @ts-expect-error
): resource is SpecifyResource<Tables[TABLE_NAME]> =>
  resource.specifyModel.name === tableName;

export const toTable = <TABLE_NAME extends keyof Tables>(
  resource: SpecifyResource<AnySchema>,
  tableName: TABLE_NAME
): SpecifyResource<Tables[TABLE_NAME]> | undefined =>
  resource.specifyModel.name === tableName ? resource : undefined;

export const toTreeTable = (
  resource: SpecifyResource<AnySchema>
): SpecifyResource<AnyTree> | undefined =>
  isTreeResource(resource) ? resource : undefined;

export const toTables = <TABLE_NAME extends keyof Tables>(
  resource: SpecifyResource<AnySchema>,
  tableNames: RA<TABLE_NAME>
): SpecifyResource<Tables[TABLE_NAME]> | undefined =>
  f.includes(tableNames, resource.specifyModel.name) ? resource : undefined;

// If this is true, then you can use {domainfilter:true} when fetching that model
export const hasHierarchyField = (model: SpecifyModel): boolean =>
  [
    'collectionObject',
    'collection',
    'discipline',
    'division',
    'institution',
  ].some((fieldName) =>
    model.relationships.some(({ name }) => name === fieldName)
  );
