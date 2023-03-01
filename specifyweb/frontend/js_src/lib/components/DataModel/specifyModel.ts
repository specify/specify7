/**
 * Class for a specify model (a database table)
 */

import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { getCache } from '../../utils/cache';
import type { IR, R, RA } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { camelToHuman } from '../../utils/utils';
import { error } from '../Errors/assert';
import { attachmentView } from '../FormParse/webOnlyViews';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import {
  DependentCollection,
  LazyCollection,
  ToOneCollection,
} from './collectionApi';
import type {
  AnySchema,
  CommonFields,
  SerializedModel,
  SerializedResource,
} from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { parseJavaClassName } from './resource';
import { ResourceBase } from './resourceApi';
import type { SchemaLocalization } from './schema';
import { getSchemaLocalization, schema } from './schema';
import { unescape } from './schemaBase';
import { schemaAliases } from './schemaExtras';
import { getTableOverwrite, modelViews } from './schemaOverrides';
import type { Relationship } from './specifyField';
import {
  type FieldDefinition,
  type RelationshipDefinition,
  LiteralField,
} from './specifyField';

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
        IR<boolean | number | string | null>
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
  add(resource: RA<SpecifyResource<SCHEMA>> | SpecifyResource<SCHEMA>): void;
  remove(resource: SpecifyResource<SCHEMA>): void;
  fetch(filter?: { readonly limit: number }): Promise<Collection<SCHEMA>>;
  trigger(eventName: string): void;
  on(eventName: string, callback: (...args: RA<never>) => void): void;
  once(eventName: string, callback: (...args: RA<never>) => void): void;
  off(eventName?: string, callback?: (...args: RA<never>) => void): void;
  /* eslint-enable @typescript-eslint/method-signature-style */
};

// FEATURE: tighten up schema field types (use literals / enums)
export class SpecifyModel<SCHEMA extends AnySchema = AnySchema> {
  /** Java classname of the Specify 6 ORM object */
  public readonly longName: string;

  public readonly name: SCHEMA['tableName'];

  public readonly idField: LiteralField;

  public readonly isSystem: boolean;

  public readonly isHidden: boolean;

  /**
   * Overrides are used to overwrite the default data model settings and the
   * schema config settings. Overrides mostly affect Query Builder and the
   * WorkBench mapper. They are used to force-hide unsupported fields and
   * legacy fields
   */
  public readonly overrides: {
    readonly isSystem: boolean;
    readonly isHidden: boolean;
    // Common tables are prioritized when listing in the UI
    readonly isCommon: boolean;
  };

  public readonly tableId: number;

  public readonly view: string;

  public readonly searchDialog?: string;

  public readonly fieldAliases: IR<string>;

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
  public readonly literalFields: RA<LiteralField> = [];

  /** All table relationships */
  public readonly relationships: RA<Relationship> = [];

  /** All table literal fields and relationships */
  public readonly fields: RA<LiteralField | Relationship> = [];

  public readonly field: IR<LiteralField | Relationship> = {};

  public readonly localization: SchemaLocalization;

  /** Localized name from the schema localization */
  public readonly label: LocalizedString;

  public constructor(tableDefinition: TableDefinition) {
    this.longName = tableDefinition.classname;
    this.name = parseJavaClassName(this.longName) as SCHEMA['tableName'];
    this.view =
      this.name === 'Attachment'
        ? // Render the attachment plugin rather than the form
          attachmentView
        : tableDefinition.view ?? modelViews[this.name] ?? this.name;
    this.searchDialog = tableDefinition.searchDialog ?? undefined;
    this.tableId = tableDefinition.tableId;
    this.isSystem = tableDefinition.system;
    this.fieldAliases = Object.fromEntries(
      Object.entries({
        ...Object.fromEntries(
          tableDefinition.fieldAliases.map(({ aname, vname }) => [vname, aname])
        ),
        ...schemaAliases[''],
        ...schemaAliases[this.name],
      }).map(([alias, fieldName]) => [alias.toLowerCase(), fieldName])
    );

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

    const useLabels = getCache('forms', 'useFieldLabels') ?? true;
    this.localization = getSchemaLocalization()[this.name.toLowerCase()] ?? {
      items: {},
    };
    if (!useLabels)
      this.localization = {
        ...this.localization,
        items: Object.fromEntries(
          Object.entries(this.localization.items).map(([fieldName, data]) => [
            fieldName,
            { ...data, name: fieldName as LocalizedString },
          ])
        ),
      };

    (this.localization.items as R<SchemaLocalization['items'][string]>)[
      tableDefinition.idFieldName.toLowerCase()
    ] ??= {
      name: useLabels
        ? commonText.id()
        : (tableDefinition.idFieldName as LocalizedString),
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
      readOnly: true,
    });

    this.label = (
      useLabels
        ? typeof this.localization.name === 'string' &&
          this.localization.name.length > 0
          ? unescape(this.localization.name)
          : camelToHuman(this.name)
        : this.name
    ) as LocalizedString;

    this.isHidden = this.localization.ishidden;

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
   *
   * REFACTOR: replace this with a direct access on indexed fields dict for static
   *   references
   */
  public getField(
    unparsedName: string
  ): LiteralField | Relationship | undefined {
    return this.getFields(unparsedName)?.at(-1);
  }

  // REFACTOR: use this where appropriate
  public getFields(
    unparsedName: string
  ): RA<LiteralField | Relationship> | undefined {
    if (unparsedName === '') return undefined;
    if (typeof unparsedName !== 'string') throw new Error('Invalid field name');

    const splitName = unparsedName.toLowerCase().trim().split('.');
    let fields = filterArray([
      this.fields.find((field) => field.name.toLowerCase() === splitName[0]),
    ]);

    // If can't find the field by name, try looking for aliases
    if (fields.length === 0) {
      if (
        unparsedName.toLowerCase() === this.idField.name.toLowerCase() ||
        unparsedName.toLowerCase() === 'id'
      )
        return [this.idField];

      const alias = this.fieldAliases[splitName[0]];
      if (typeof alias === 'string') {
        const aliasFields = this.getFields(
          [alias, ...splitName.slice(1)].join('.')
        );
        if (Array.isArray(aliasFields)) fields = aliasFields;
        else
          console.warn(
            `Alias ${unparsedName} was resolved to unknown field ${alias}`
          );
      }
    }

    // Handle calls like localityModel.getField('Locality.localityName')
    if (
      splitName.length > 1 &&
      splitName[0].toLowerCase() === this.name.toLowerCase()
    )
      return this.getFields(splitName.slice(1).join('.'));
    else if (fields.length === 0) return undefined;
    else if (splitName.length === 1) return fields;
    else if (splitName.length > 1 && fields[0].isRelationship) {
      const subFields = defined(fields[0].relatedModel).getFields(
        splitName.slice(1).join('.')
      );
      if (subFields === undefined) return undefined;
      return [...fields, ...subFields];
    } else throw new Error(`Field ${unparsedName} is not a relationship`);
  }

  public strictGetField(unparsedName: string): LiteralField | Relationship {
    const field = this.getField(unparsedName);
    if (field === undefined)
      throw new Error(`Tried to get unknown field: ${unparsedName}`);
    return field;
  }

  public getLiteralField(literalName: string): LiteralField | undefined {
    const field = this.getField(literalName);
    if (field === undefined) return undefined;
    else if (field.isRelationship)
      error(`Field ${literalName} is a relationship`, {
        model: this,
        literalName,
      });
    else return field;
  }

  public strictGetLiteralField(unparsedName: string): LiteralField {
    return defined(
      this.getLiteralField(unparsedName),
      `Tried to get unknown literal field: ${unparsedName}`
    );
  }

  public getRelationship(relationshipName: string): Relationship | undefined {
    const relationship = this.getField(relationshipName);
    if (relationship === undefined) return undefined;
    else if (relationship.isRelationship) return relationship;
    else throw new Error(`Field ${relationshipName} is not a relationship`);
  }

  public strictGetRelationship(unparsedName: string): Relationship {
    return defined(
      this.getRelationship(unparsedName),
      `Tried to get unknown relationship field: ${unparsedName}`
    );
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
          field?.isRelationship === true && !relationshipIsToMany(field)
      );
  }

  /**
   * Returns a list of relationship field names traversing the
   * scoping hierarchy.
   */
  public getScopingPath(): RA<string> | undefined {
    if (this.name === schema.orgHierarchy.at(-1)) return [];
    const up = this.getScopingRelationship();
    return up === undefined
      ? undefined
      : [...defined(up.relatedModel.getScopingPath()), up.name.toLowerCase()];
  }

  /**
   * Instead of serializing the entire object, return a string.
   * Serializing entire object is not advisable as it has relationships to
   * other tables resulting in entire data model getting serialized (which
   * would result in 2.3mb of wasted space)
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public toJSON(): string {
    return `[table ${this.name}]`;
  }
}
