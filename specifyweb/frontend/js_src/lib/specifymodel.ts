import collectionapi from './collectionapi';
import type { AnySchema } from './datamodelutils';
import { SerializedModel } from './datamodelutils';
import { getIcon } from './icons';
import type { SpecifyResource } from './legacytypes';
import ResourceBase from './resourceapi';
import type { SchemaLocalization } from './schema';
import { localization } from './schema';
import schema, { unescape } from './schemabase';
import {
  type FieldDefinition,
  LiteralField,
  Relationship,
  type RelationshipDefinition,
} from './specifyfield';
import type { IR, RA } from './types';
import { defined } from './types';
import { Tables } from './datamodel';

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

type CollectionConstructor<SCHEMA extends AnySchema> = new (props?: {
  readonly filters?: Partial<
    {
      readonly orderby: string;
      readonly id: number;
      readonly specifyuser: number;
      readonly domainfilter: boolean;
    } & SCHEMA['fields'] &
      IR<unknown>
  >;
  readonly domainfilter?: boolean;
}) => UnFetchedCollection<SpecifyResource<SCHEMA>>;

export type UnFetchedCollection<RESOURCE extends SpecifyResource<AnySchema>> = {
  readonly fetch: (filter?: {
    readonly limit: number;
  }) => Promise<Collection<RESOURCE>>;
  readonly fetchIfNotPopulated: (filter?: {
    readonly limit: number;
  }) => Promise<Collection<RESOURCE>>;
};

export type Collection<RESOURCE extends SpecifyResource<AnySchema>> = {
  readonly getTotalCount: () => Promise<number>;
  readonly toJSON: <V extends IR<unknown>>() => RA<V>;
  readonly models: RESOURCE extends null ? [] : RA<RESOURCE>;
  readonly isComplete: () => boolean;
  readonly model: RESOURCE;
  readonly add: (resource: RESOURCE) => void;
  readonly remove: (resource: RESOURCE) => void;
};

// TODO: tighten up schema field types (use literals / enums)
export class SpecifyModel<SCHEMA extends AnySchema = AnySchema> {
  // Java classname of the Specify 6 ORM object.
  public readonly longName: string;

  public readonly name: SCHEMA['tableName'];

  public readonly idFieldName: string;

  public readonly system: boolean;

  public readonly tableId: number;

  public readonly view?: string;

  public readonly searchDialog?: string;

  private readonly fieldAliases: RA<FieldAlias>;

  // TODO: make newly created resources have default values for fields
  public readonly Resource: new (
    props?: Partial<SerializedModel<SCHEMA>>
  ) => SpecifyResource<SCHEMA>;

  public readonly LazyCollection: CollectionConstructor<SCHEMA>;

  public readonly StaticCollection: CollectionConstructor<SCHEMA>;

  public readonly DependentCollection: CollectionConstructor<SCHEMA>;

  public readonly ToOneCollection: CollectionConstructor<SCHEMA>;

  public readonly fields: RA<LiteralField | Relationship>;

  public readonly localization: SchemaLocalization;

  public static parseClassName(className: string): string {
    return className.split('.').slice(-1)[0];
  }

  public constructor(tableDefinition: TableDefinition) {
    this.longName = tableDefinition.classname;
    this.name = SpecifyModel.parseClassName(
      this.longName
    ) as SCHEMA['tableName'];
    this.idFieldName = tableDefinition.idFieldName;
    this.view = tableDefinition.view ?? undefined;
    this.searchDialog = tableDefinition.searchDialog ?? undefined;
    this.tableId = tableDefinition.tableId;
    this.system = tableDefinition.system;
    this.fieldAliases = tableDefinition.fieldAliases;

    // A Backbone model resource for accessing the API for items of this type.
    this.Resource = ResourceBase.extend(
      { __name__: `${this.name}Resource` },
      { specifyModel: this }
    );

    // A Backbone collection for lazy loading a collection of items of this type.
    this.LazyCollection = collectionapi.Lazy.extend({
      __name__: `${this.name}LazyCollection`,
      model: this.Resource,
    });

    // A Backbone collection for loading a fixed collection of items of this type.
    this.StaticCollection = collectionapi.Static.extend({
      __name__: `${this.name}StaticCollection`,
      model: this.Resource,
    });

    /*
     * A Backbone collection for loading a dependent collection of items of this type as a
     * -to-many collection of some other resource.
     */
    this.DependentCollection = collectionapi.Dependent.extend({
      __name__: `${this.name}DependentCollection`,
      model: this.Resource,
    });

    /*
     * A Backbone collection for loading a collection of items of this type as a backwards
     * -to-one collection of some other resource.
     */
    this.ToOneCollection = collectionapi.ToOne.extend({
      __name__: `${this.name}ToOneCollection`,
      model: this.Resource,
    });

    this.localization = localization[this.name.toLowerCase()] ?? { items: [] };

    this.fields = [
      ...tableDefinition.fields.map(
        (fieldDefinition) =>
          new LiteralField(this as unknown as SpecifyModel, fieldDefinition)
      ),
      ...tableDefinition.relationships.map(
        (relationshipDefinition) =>
          new Relationship(
            this as unknown as SpecifyModel,
            relationshipDefinition
          )
      ),
    ];
  }

  /**
   * Return a field object representing the named field of this model.
   * name can be either a dotted name string or an array and will traverse
   * relationships.
   */
  public getField(
    unparsedName: string
  ): LiteralField | Relationship | undefined {
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
      if (typeof alias !== 'undefined') field = this.getField(alias.aname);
    }

    if (splitName.length === 1 || typeof field === 'undefined') return field;
    else if (field instanceof Relationship)
      return defined(field.getRelatedModel()).getField(
        splitName.slice(1).join('.')
      );
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

  /**
   * Try and return the localized name from the schema localization. If there is no
   * localization information just return the name.
   */
  public getLocalizedName(): string {
    const name = this.localization.name;
    return name === null || typeof name === 'undefined'
      ? this.name
      : unescape(name);
  }

  public getFormat(): string | undefined {
    return this.localization.format ?? undefined;
  }

  public getAggregator(): string | undefined {
    return this.localization.aggregator ?? undefined;
  }

  public getIcon(): string {
    return getIcon(this.name.toLowerCase());
  }

  public isHidden(): boolean {
    return this.localization.ishidden === 1;
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
          typeof field !== 'undefined' && field.type === 'many-to-one'
      );
  }

  /**
   * Returns a list of relationship field names traversing the
   * scoping hierarchy.
   */
  public getScopingPath(): RA<string> | undefined {
    if (this.name.toLowerCase() === schema.orgHierarchy.slice(-1)[0]) return [];
    const up = this.getScopingRelationship();
    return typeof up === 'undefined'
      ? undefined
      : [...defined(up.getRelatedModel()?.getScopingPath()), up.name];
  }
}

// TODO: this won't be needed if typings were to be improved
/** Checks if SpecifyResource has a desired table name and cast's its type */
export function isResourceOfType<TABLE_NAME extends keyof Tables>(
  resource: SpecifyResource<AnySchema>,
  tableName: TABLE_NAME
): resource is SpecifyResource<Tables[TABLE_NAME]> {
  return resource.specifyModel.name === tableName;
}
