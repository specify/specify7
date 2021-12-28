import type Backbone from './backbone';
import collectionapi from './collectionapi';
import { getIcon } from './icons';
import { load } from './initialcontext';
import ResourceBase from './resourceapi';
import schema, { unescape } from './schemabase';
import {
  Field,
  type FieldDefinition,
  Relationship,
  type RelationshipDefinition,
} from './specifyfield';
import type { IR, RA } from './types';

// The schema config / localization information is loaded dynamically.
export type SchemaLocalization = {
  readonly name: string | null;
  readonly desc: string | null;
  readonly format: string | null;
  readonly aggregator: string | null;
  readonly ishidden: 0 | 1;
  readonly items: IR<{
    readonly name: string | null;
    readonly desc: string | null;
    readonly format: string | null;
    readonly picklistname: string | null;
    readonly weblinkname: string | null;
    readonly isrequired: boolean;
    readonly ishidden: boolean;
  }>;
};
let localization: IR<SchemaLocalization> = undefined!;
export const fetchContext = load<IR<SchemaLocalization>>(
  '/context/schema_localization.json',
  'application/json'
).then((data) => {
  localization = data;
});

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


// TODO: SpecifyResource referecnes fix

type SchemaModelWritable = {
  LazyCollection: new (props: {
    readonly filters?: Partial<
      {
        readonly orderby: string;
        readonly id: number;
        readonly specifyuser: number;
        readonly domainfilter: boolean;
      } & IR<unknown>
    >;
  }) => SpecifyFetch;
  isHidden: () => boolean;
};

export default class SpecifyModel {
  // Java classname of the Specify 6 ORM object.
  public readonly longName: string;

  public readonly name: string;

  public readonly idFieldName: string;

  public readonly system: boolean;

  public readonly tableId: number;

  public readonly view?: string;

  public readonly searchDialog?: string;

  private readonly fieldAliases: RA<FieldAlias>;

  public readonly Resource: Backbone.View;

  public readonly LazyCollection: Backbone.View;

  public readonly StaticCollection: Backbone.View;

  public readonly DependentCollection: Backbone.View;

  public readonly ToOneCollection: Backbone.View;

  public readonly fields: RA<Field | Relationship>;

  public readonly localization: SchemaLocalization;

  public constructor(tableDefinition: TableDefinition) {
    this.longName = tableDefinition.classname;
    this.name = this.longName.split('.').slice(-1)[0];
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

    this.fields = [
      ...tableDefinition.fields.map(
        (fieldDefinition) => new Field(this, fieldDefinition)
      ),
      ...tableDefinition.relationships.map(
        (relationshipDefinition) =>
          new Relationship(this, relationshipDefinition)
      ),
    ];

    this.localization = localization[this.name.toLowerCase()] ?? {};
  }

  /**
   * Return a field object representing the named field of this model.
   * name can be either a dotted name string or an array and will traverse
   * relationships.
   */
  public getField(unparsedName: string): Field | Relationship | undefined {
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
      return field.getRelatedModel().getField(splitName.slice(1).join('.'));
    else throw new Error('Field is not a relationship');
  }

  public getRelationship(relationshipName: string): Relationship | undefined {
    const relationship = this.getField(relationshipName);
    if (typeof relationship === 'undefined') return undefined;
    else if (relationship instanceof Relationship) return relationship;
    else throw new Error('Field is not a relationship');
  }

  /**
   * Try and return the localized name from the schema localization. If there is no
   * localization information just return the name.
   */
  public getLocalizedName(): string {
    const name = this.localization.name;
    return name === null ? this.name : unescape(name);
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
    if (typeof up === 'undefined') return undefined;
    else return [...up.getRelatedModel().getScopingPath(), up.name];
  }
}
