import type { Tables } from './datamodel';
import type { SchemaLocalization } from './schema';
import { getModel, schema } from './schema';
import { unescape } from './schemabase';
import { getFieldOverwrite, getGlobalFieldOverwrite } from './schemaoverrides';
import type { SpecifyModel } from './specifymodel';
import { isTreeModel } from './treedefinitions';
import { defined } from './types';
import { type UiFormatter, uiFormatters } from './uiformatters';
import { camelToHuman } from './wbplanviewhelper';

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

const relationshipTypes = [
  'one-to-one',
  'one-to-many',
  'many-to-one',
  'many-to-many',
  'zero-to-one',
] as const;

export type RelationshipType = typeof relationshipTypes[number];

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
  readonly otherSideName?: string;
  readonly relatedModelName: keyof Tables | 'UserGroupScope';
  readonly required: boolean;
  readonly type: RelationshipType;
  readonly readOnly?: boolean;
};

abstract class FieldBase {
  public readonly model: SpecifyModel;

  public readonly isRelationship: boolean = false;

  public readonly name: string;

  public readonly dottedName: string;

  public isHidden: boolean;

  public readonly isReadOnly: boolean;

  public readonly isRequired: boolean;

  public overrides: {
    readonly isRequired: boolean;
    // If relatedModel isHidden, this is set to true
    isHidden: boolean;
    // If relatedModel isSystem, this is set to true
    isReadOnly: boolean;
  };

  public readonly type: JavaType | RelationshipType;

  public readonly length?: number;

  public readonly dbColumn?: string;

  public readonly localization: SchemaLocalization['items'][string];

  // User friendly name of the field from the schema config.
  public readonly label: string;

  public constructor(
    model: SpecifyModel,
    fieldDefinition: Omit<FieldDefinition, 'type'> & {
      readonly type: JavaType | RelationshipType;
    }
  ) {
    this.model = model;

    this.name = fieldDefinition.name;
    this.dottedName = `${model.name}.${this.name}`;

    const globalFieldOverride = getGlobalFieldOverwrite(model.name, this.name);

    this.isReadOnly =
      globalFieldOverride === 'readOnly' || fieldDefinition.readOnly === true;

    this.isRequired =
      globalFieldOverride === 'required'
        ? true
        : globalFieldOverride === 'optional'
        ? false
        : fieldDefinition.required;
    this.type = fieldDefinition.type;
    this.length = fieldDefinition.length;
    this.dbColumn = fieldDefinition.column;

    this.localization =
      this.model.localization.items[this.name.toLowerCase()] ?? {};

    this.label =
      typeof this.localization.name === 'string'
        ? unescape(this.localization.name)
        : camelToHuman(this.name);

    this.isHidden = this.localization.ishidden;

    // Apply overrides
    const fieldOverwrite = getFieldOverwrite(this.model.name, this.name);

    let isRequired = fieldOverwrite !== 'optional' && this.isRequired;
    let isHidden = this.isHidden;

    // Overwritten hidden fields are made not required
    if (fieldOverwrite === 'hidden') {
      isRequired = false;
      isHidden = true;
    }
    // Other required fields are unhidden
    else if (isHidden && isRequired) isHidden = false;

    this.overrides = {
      isHidden,
      isRequired,
      isReadOnly:
        this.isReadOnly ||
        fieldOverwrite === 'readOnly' ||
        (this.isRelationship && isTreeModel(this.model.name)),
    };
  }

  /*
   * TODO: make sure this is displayed on forms in mouseovers
   * Returns the description of the field from the schema config.
   */
  public getLocalizedDesc(): string | undefined {
    const description = this.localization.desc;
    return description === null || typeof description === 'undefined'
      ? undefined
      : unescape(description);
  }

  // Returns the name of the UIFormatter for the field from the schema config.
  public getFormat(): string | undefined {
    return this.localization.format ?? undefined;
  }

  // Returns the UIFormatter for the field specified in the schema config.
  public getUiFormatter(): UiFormatter | undefined {
    return uiFormatters[this.getFormat() ?? ''];
  }

  /*
   * Returns the name of the picklist definition if any is assigned to the field
   * by the schema configuration.
   */
  public getPickList(): string | undefined {
    return this.model.name === 'Agent' && this.name === 'agentType'
      ? 'AgentTypeComboBox'
      : this.localization.picklistname ?? undefined;
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

  // Returns true if the field represents a time value.
  public isTemporal(): boolean {
    return [
      'java.util.Date',
      'java.util.Calendar',
      'java.sql.Timestamp',
    ].includes(this.type);
  }

  public isDependent(): boolean {
    return false;
  }
}

/** Non-relationship field */
export class LiteralField extends FieldBase {
  public isRelationship: false = false;
}

export class Relationship extends FieldBase {
  public otherSideName?: string;

  public readonly relatedModel: SpecifyModel;

  public readonly type: RelationshipType;

  public dependent: boolean;

  public isRelationship: true = true;

  public constructor(
    model: SpecifyModel,
    relationshipDefinition: RelationshipDefinition
  ) {
    super(model, {
      ...relationshipDefinition,
      indexed: false,
      unique: false,
    });

    this.type = relationshipDefinition.type;
    this.otherSideName = relationshipDefinition.otherSideName;
    this.dependent = relationshipDefinition.dependent;
    const relatedModelName =
      model.name === 'SpPrincipal' &&
      relationshipDefinition.name === 'scope' &&
      relationshipDefinition.relatedModelName === 'UserGroupScope'
        ? 'Division'
        : relationshipDefinition.relatedModelName;
    this.relatedModel = defined(getModel(relatedModelName));

    this.overrides.isHidden ||= this.relatedModel.overrides.isHidden;
    this.overrides.isReadOnly ||= this.relatedModel.overrides.isSystem;
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

  // Returns the field of the related model that is the reverse of this field.
  public getReverse(): Relationship | undefined {
    return this.otherSideName
      ? this.relatedModel.getRelationship(this.otherSideName)
      : undefined;
  }
}
