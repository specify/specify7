import schema, { unescape } from './schemabase';
import type SpecifyModel from './specifymodel';
import { SchemaLocalization } from './specifymodel';
import type { UIFormatter } from './uiformatters';
import * as uiformatters from './uiformatters';
import schema, { getModel } from './schema';

export type JavaType =
  // Strings
  | 'text'
  | 'java.lang.String'
  // Numbers
  | 'java.lang.Byte'
  | 'java.lang.Short'
  | 'java.lang.Integer'
  | 'java.lang.Float'
  | 'java.lang.Double'
  | 'java.lang.Long'
  | 'java.math.BigDecimal'
  // Bools
  | 'java.lang.Boolean'
  // Dates
  | 'java.sql.Timestamp'
  | 'java.util.Calendar'
  | 'java.util.Date';

type RelationshipType =
  | 'one-to-one'
  | 'one-to-many'
  | 'many-to-one'
  | 'many-to-many'
  | 'zero-to-one';

export type FieldDefinition = {
  readonly column?: string;
  readonly indexed: boolean;
  readonly length?: number;
  readonly name: string;
  readonly required: boolean;
  readonly type: JavaType;
  readonly unique: boolean;
  readonly readOnly?: boolean;
};

export type RelationshipDefinition = {
  readonly column?: string;
  readonly dependent: boolean;
  readonly name: string;
  readonly otherSideName: string;
  readonly relatedModelName: string;
  readonly required: boolean;
  readonly type: RelationshipType;
  readonly readOnly?: boolean;
};

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

// Define a JS object constructor to represent fields of Specify data objects.
export class Field {
  // The data object model this field belongs to.
  public readonly model: SpecifyModel;

  // Whether the field represents a relationship.
  public readonly isRelationship: boolean;

  public readonly name: string;

  public readonly dottedName: string;

  public readOnly: boolean;

  public isRequired: boolean;

  public readonly type: JavaType | RelationshipType;

  public readonly length?: number;

  public readonly dbColumn?: string;

  public readonly localization: SchemaLocalization['items'][string];

  public constructor(
    model: SpecifyModel,
    fieldDefinition: Omit<FieldDefinition, 'type'> & {
      readonly type: JavaType | RelationshipType;
    }
  ) {
    this.model = model;
    this.isRelationship = 'otherSideName' in (fieldDefinition ?? {});

    this.name = fieldDefinition.name;
    this.dottedName = `${model.name}.${this.name}`;

    this.readOnly =
      fieldDefinition.readOnly === true ||
      (this.name === 'guid' &&
        model.name !== 'Taxon' &&
        model.name !== 'Geography') ||
      this.name === 'timestampcreated';

    this.isRequired = fieldDefinition.required;
    this.type = fieldDefinition.type;
    this.length = fieldDefinition.length;
    this.dbColumn = fieldDefinition.column;

    this.localization = model.localization.items[this.name.toLowerCase()] ?? {};
  }

  // Returns the user friendly name of the field from the schema config.
  public getLocalizedName(): string | undefined {
    const name = this.localization.name;
    return name === null ? undefined : unescape(name);
  }

  // Returns the description of the field from the schema config.
  public getLocalizedDesc(): string | undefined {
    const description = this.localization.desc;
    return description === null ? undefined : unescape(description);
  }

  // Returns the name of the UIFormatter for the field from the schema config.
  public getFormat(): string | undefined {
    return this.localization.format ?? undefined;
  }

  // Returns the UIFormatter for the field specified in the schema config.
  public getUIFormatter(): ReturnType<typeof UIFormatter> | undefined {
    const format = this.getFormat();
    return typeof format === 'undefined'
      ? undefined
      : uiformatters.getByName(format);
  }

  /*
   * Returns the name of the picklist definition if any is assigned to the field
   * by the schema configuration.
   */
  public getPickList(): string | undefined {
    return this.localization.picklistname ?? undefined;
  }

  // Returns the weblink definition name if any is assigned to the field.
  public getWebLinkName(): string | undefined {
    return this.localization.weblinkname ?? undefined;
  }

  /*
   * Returns true if the field is required by the schema configuration.
   * NB the field maybe required for other reasons.
   */
  public isRequiredBySchemaLocalization(): boolean {
    return this.localization.isrequired;
  }

  // Returns true if the field is marked hidden in the schema configuration.
  public isHidden(): boolean {
    return this.localization.ishidden;
  }

  // Returns true if the field represents a time value.
  public isTemporal(): boolean {
    return ['java.util.Date', 'java.util.Calendar'].includes(this.type);
  }

  public isDependent(): boolean {
    return false;
  }
}

/*
 * Define a JS object constructor to represent relationship fields of Specify data objects.
 * Extends the Field object.
 */
export class Relationship extends Field {
  public otherSideName: string;

  public relatedModelName: string;

  public dependent: boolean;

  public constructor(
    model: SpecifyModel,
    relationshipDefinition: RelationshipDefinition
  ) {
    super(model, { ...relationshipDefinition, indexed: false, unique: false });

    this.otherSideName = relationshipDefinition.otherSideName;
    this.relatedModelName = relationshipDefinition.relatedModelName;
    this.dependent = relationshipDefinition.dependent;
  }

  /*
   * Returns true if the field represents a dependent relationship. ie one where
   * the data in the related object(s) is automatically included by the API.
   * eg CollectionObject.determinations.
   */
  public isDependent(): boolean {
    return this.model.name == 'CollectionObject' &&
      this.name == 'collectingEvent'
      ? schema.embeddedCollectingEvent
      : this.model.name.toLowerCase() == schema.paleoContextChildTable &&
        this.name == 'paleoContext'
      ? schema.embeddedPaleoContext
      : this.dependent;
  }

  // Returns the related model for relationship fields.
  public getRelatedModel() {
    if (!this.isRelationship)
      throw new Error(`${this.dottedName} is not a relationship field`);
    return getModel(this.relatedModelName);
  }

  // Returns the field of the related model that is the reverse of this field.
  public getReverse() {
    const relModel = this.getRelatedModel();
    return (
      this.otherSideName && relModel && relModel.getField(this.otherSideName)
    );
  }
}
