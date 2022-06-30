/**
 * Class for a specify model (a database table)
 */

import { error } from './assert';
import {
  DependentCollection,
  LazyCollection,
  ToOneCollection,
} from './collectionapi';
import type { Tables } from './datamodel';
import type {
  AnySchema,
  AnyTree,
  CommonFields,
  SerializedModel,
  SerializedResource,
} from './datamodelutils';
import { f } from './functools';
import { camelToHuman } from './helpers';
import type { SpecifyResource } from './legacytypes';
import { commonText } from './localization/common';
import { parseClassName } from './resource';
import { ResourceBase } from './resourceapi';
import type { SchemaLocalization } from './schema';
import { getSchemaLocalization, schema } from './schema';
import { unescape } from './schemabase';
import { getTableOverwrite, modelViews } from './schemaoverrides';
import type { Relationship } from './specifyfield';
import {
  type FieldDefinition,
  LiteralField,
  type RelationshipDefinition,
} from './specifyfield';
import { isTreeResource } from './treedefinitions';
import type { IR, R, RA } from './types';
import { defined } from './types';

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
  readonly fetch: (filter?: {
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
  add(resource: SpecifyResource<SCHEMA> | RA<SpecifyResource<SCHEMA>>): void;
  remove(resource: SpecifyResource<SCHEMA>): void;
  fetch(filter?: { readonly limit: number }): Promise<Collection<SCHEMA>>;
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

  public readonly idField: LiteralField;

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

  public constructor(tableDefinition: TableDefinition) {
    this.longName = tableDefinition.classname;
    this.name = parseClassName(this.longName) as SCHEMA['tableName'];
    this.view =
      this.name === 'Attachment'
        ? // Render the attachment plugin rather than the form
          'ObjectAttachment'
        : tableDefinition.view ?? modelViews[this.name] ?? this.name;
    this.searchDialog = tableDefinition.searchDialog ?? undefined;
    this.tableId = tableDefinition.tableId;
    this.isSystem = tableDefinition.system;
    this.fieldAliases = tableDefinition.fieldAliases;

    this.Resource = ResourceBase.extend(
      { __name__: `${this.name}Resource` },
      { specifyModel: this }
    );

    this.LazyCollection = LazyCollection.extend({
      __name__: `${this.name}LazyCollection`,
      model: this.Resource,
    });

    this.DependentCollection = DependentCollection.extend({
      __name__: `${this.name}DependentCollection`,
      model: this.Resource,
    });

    this.ToOneCollection = ToOneCollection.extend({
      __name__: `${this.name}ToOneCollection`,
      model: this.Resource,
    });

    this.localization = getSchemaLocalization()[this.name.toLowerCase()] ?? {
      items: {},
    };
    (this.localization.items as R<SchemaLocalization['items'][string]>)[
      tableDefinition.idFieldName.toLowerCase()
    ] ??= {
      name: commonText('id'),
      desc: null,
      format: null,
      picklistname: null,
      weblinkname: null,
      isrequired: false,
      ishidden: true,
    };

    this.idField = new LiteralField(this, {
      name: tableDefinition.idFieldName,
      required: false,
      type: 'java.lang.Integer',
      column: tableDefinition.idFieldName,
      indexed: true,
      unique: true,
      readOnly: false,
    });

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
   *
   * @remarks
   * Since field name can be invalid, this function can return undefined.
   * If you are absolutely sure that field exists, wrap the call to this.getField
   * in defined()
   */

  /*
   * TODO: replace this with a direct access on indexed fields dict for static
   *   references
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
      if (
        unparsedName.toLowerCase() === this.idField.name.toLowerCase() ||
        unparsedName.toLowerCase() === 'id'
      )
        return this.idField;

      const alias = this.fieldAliases.find(
        (alias) => alias.vname.toLowerCase() === splitName[0]
      );
      if (typeof alias === 'object') field = this.getField(alias.aname);
    }

    // Handle calls like localityModel.getField('Locality.localityName')
    if (
      splitName.length > 1 &&
      splitName[0].toLowerCase() === this.name.toLowerCase()
    )
      return this.getField(splitName.slice(1).join('.'));
    if (splitName.length === 1 || typeof field === 'undefined') return field;
    else if (field.isRelationship)
      return defined(field.relatedModel).getField(splitName.slice(1).join('.'));
    else throw new Error('Field is not a relationship');
  }

  public getLiteralField(literalName: string): LiteralField | undefined {
    const field = this.getField(literalName);
    if (typeof field === 'undefined') return undefined;
    else if (field.isRelationship)
      error('Field is a relationship', {
        model: this,
        literalName,
      });
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

  /**
   * Instead of serializing the entire object, return a string.
   * Serializing entire object is not advisable as it has relationships to
   * other tables resulting in entire data model getting serialized (which
   * would result in 2.3mb of wasted space)
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public toJSON(): string {
    return `[object ${this.name}]`;
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
