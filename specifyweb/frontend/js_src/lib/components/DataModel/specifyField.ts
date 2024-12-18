/**
 * Classes for a specify field
 */

import type { LocalizedString } from 'typesafe-i18n';

import type { IR } from '../../utils/types';
import { localized } from '../../utils/types';
import { camelToHuman } from '../../utils/utils';
import { type UiFormatter, getUiFormatters } from '../FieldFormatters';
import { isTreeTable } from '../InitialContext/treeRanks';
import { getFrontEndPickLists } from '../PickLists/definitions';
import type { AnySchema } from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { schema, unescape } from './schema';
import { getFieldOverwrite, getGlobalFieldOverwrite } from './schemaOverrides';
import type { SpecifyTable } from './specifyTable';
import type { SchemaLocalization } from './tables';
import { getTable, strictGetTable } from './tables';
import type { PickList, Tables } from './types';

export type JavaType =
  // Strings
  // eslint-disable-next-line @typescript-eslint/sort-type-union-intersection-members
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

export type RelationshipType = (typeof relationshipTypes)[number];

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

export abstract class FieldBase {
  public readonly table: SpecifyTable;

  public readonly isRelationship: boolean = false;

  public readonly name: string;

  // eslint-disable-next-line functional/prefer-readonly-type
  public isHidden: boolean;

  // eslint-disable-next-line functional/prefer-readonly-type
  public isReadOnly: boolean;

  // eslint-disable-next-line functional/prefer-readonly-type
  public isVirtual: boolean = false;

  public readonly isRequired: boolean;

  /**
   * Overrides are used to overwrite the default data model settings and the
   * schema config settings. Overrides mostly affect Query Builder and the
   * WorkBench mapper. They are used to force-hide unsupported fields and
   * legacy fields. 
   */
  public readonly overrides: {
    // eslint-disable-next-line functional/prefer-readonly-type
    isRequired: boolean;
    // If relatedTable isHidden, this is set to true
    // eslint-disable-next-line functional/prefer-readonly-type
    isHidden: boolean;
    // If relatedTable isSystem, this is set to true
    // eslint-disable-next-line functional/prefer-readonly-type
    isReadOnly: boolean;
  };

  public readonly type: JavaType | RelationshipType;

  public readonly length?: number;

  public readonly databaseColumn?: string;

  public readonly localization: SchemaLocalization['items'][string];

  // User friendly name of the field from the schema config.
  public readonly label: LocalizedString;

  protected constructor(
    table: SpecifyTable,
    fieldDefinition: Omit<FieldDefinition, 'type'> & {
      readonly type: JavaType | RelationshipType;
    }
  ) {
    this.table = table;

    this.name = fieldDefinition.name;

    const globalFieldOverride = getGlobalFieldOverwrite(table.name, this.name);

    this.isReadOnly =
      globalFieldOverride?.visibility === 'readOnly' ||
      fieldDefinition.readOnly === true;

    this.isRequired =
      globalFieldOverride?.visibility === 'required'
        ? true
        : globalFieldOverride?.visibility === 'optional'
          ? false
          : fieldDefinition.required;
    this.type = fieldDefinition.type;
    this.length = fieldDefinition.length;
    this.databaseColumn = fieldDefinition.column;

    this.localization =
      this.table.localization.items[this.name.toLowerCase()] ?? {};

    this.label =
      typeof this.localization.name === 'string' &&
      this.localization.name.length > 0
        ? localized(unescape(this.localization.name))
        : camelToHuman(this.name);

    this.isHidden =
      globalFieldOverride?.visibility === 'hidden' ||
      (this.localization.ishidden ?? false);

    // Apply overrides
    const fieldOverwrite = getFieldOverwrite(this.table.name, this.name);

    let isRequired =
      fieldOverwrite?.visibility !== 'optional' && this.isRequired;
    let isHidden = this.isHidden;

    const isReadOnly =
      this.isReadOnly || fieldOverwrite?.visibility === 'readOnly';

    // Overwritten hidden fields are made not required
    if (fieldOverwrite?.visibility === 'hidden') {
      isRequired = false;
      isHidden = true;
    }
    // Other required fields are unhidden
    else if (isHidden && isRequired) isHidden = false;

    this.overrides = {
      isHidden,
      isRequired: isRequired && !isReadOnly,
      isReadOnly,
    };
  }

  // Returns the description of the field from the schema config.
  public getLocalizedDesc(): LocalizedString | undefined {
    const description = this.localization.desc;
    return description === null || description === undefined
      ? undefined
      : localized(unescape(description));
  }

  /*
   * Returns the name of the picklist definition if any is assigned to the field
   * by the schema configuration.
   */
  public getPickList(): string | undefined {
    return (
      this.localization.picklistname ??
      (getFrontEndPickLists() as IR<IR<SpecifyResource<PickList> | undefined>>)[
        this.table.name
      ]?.[this.name]?.get('name')
    );
  }

  // Returns the weblink definition name if any is assigned to the field.
  public getWebLinkName(): string | undefined {
    return this.localization.weblinkname ?? undefined;
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

  /**
   * Instead of serializing the entire object, return a string.
   * Serializing entire object is not advisable as it has relationships to
   * other tables resulting in entire data model getting serialized (which
   * would result in 2.3mb of wasted space)
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public toJSON(): string {
    return `[${this.isRelationship ? 'relationship' : 'literalField'} ${
      this.table.name
    }.${this.name}]`;
  }

  public static fromJson(
    value: string
  ): LiteralField | Relationship | undefined {
    if (!value.endsWith(']')) return undefined;
    const name = value.startsWith('[literalField')
      ? 'literalField'
      : value.startsWith('[relationship')
        ? 'relationship'
        : undefined;
    if (name === undefined) return undefined;
    const parts = value.replace(`[${name} `, '').replace(']', '').split('.');
    if (parts.length !== 2) return undefined;
    return getTable(parts[0])?.getField(parts[1]);
  }
}

/** Non-relationship field */
export class LiteralField extends FieldBase {
  public readonly type: JavaType;

  public readonly isRelationship: false = false;

  // Indicates white space should not be ignored in the field
  public readonly whiteSpaceSensitive: boolean;

  public readonly datamodelDefinition: FieldDefinition;

  public constructor(table: SpecifyTable, fieldDefinition: FieldDefinition) {
    super(table, fieldDefinition);
    this.datamodelDefinition = fieldDefinition;
    this.type = fieldDefinition.type;

    const globalFieldOverride = getGlobalFieldOverwrite(table.name, this.name);
    const fieldOverwrite = getFieldOverwrite(table.name, this.name);

    this.whiteSpaceSensitive =
      (globalFieldOverride?.whiteSpaceSensitive ?? false) ||
      (fieldOverwrite?.whiteSpaceSensitive ?? false);
  }

  // Returns the name of the UIFormatter for the field from the schema config.
  public getFormat(_resource?: SpecifyResource<AnySchema>): string | undefined {
    return this.localization.format ?? undefined;
  }

  // Returns the UIFormatter for the field specified in the schema config.
  public getUiFormatter(
    resource?: SpecifyResource<AnySchema>
  ): UiFormatter | undefined {
    return getUiFormatters()[this.getFormat(resource) ?? ''];
  }
}

export class Relationship extends FieldBase {
  // eslint-disable-next-line functional/prefer-readonly-type
  public otherSideName?: string;

  public readonly relatedTable: SpecifyTable;

  public readonly type: RelationshipType;

  public readonly datamodelDefinition: RelationshipDefinition;

  private readonly dependent: boolean;

  public readonly isRelationship: true = true;

  public constructor(
    table: SpecifyTable,
    relationshipDefinition: RelationshipDefinition
  ) {
    super(table, {
      ...relationshipDefinition,
      indexed: false,
      unique: false,
    });
    this.datamodelDefinition = relationshipDefinition;

    this.type = relationshipDefinition.type;
    this.otherSideName = relationshipDefinition.otherSideName;
    this.dependent = relationshipDefinition.dependent;
    const relatedTableName =
      table.name === 'SpPrincipal' &&
      relationshipDefinition.name === 'scope' &&
      relationshipDefinition.relatedModelName === 'UserGroupScope'
        ? 'Division'
        : relationshipDefinition.relatedModelName;
    this.relatedTable = strictGetTable(relatedTableName);

    if (isTreeTable(this.table.name)) this.overrides.isReadOnly = true;

    this.overrides.isRequired =
      this.overrides.isRequired &&
      !this.overrides.isReadOnly &&
      !this.relatedTable.overrides.isSystem;
    this.overrides.isHidden ||=
      !this.overrides.isRequired &&
      this.relatedTable.overrides.isHidden &&
      this.relatedTable !== this.table;
  }

  /*
   * Returns true if the field represents a dependent relationship. ie one where
   * the data in the related object(s) is automatically included by the API.
   * eg CollectionObject.determinations.
   */
  public isDependent(): boolean {
    // REFACTOR: move this into SchemaExtras.ts
    return this.table.name === 'CollectionObject' &&
      this.name === 'collectingEvent'
      ? schema.embeddedCollectingEvent
      : this.table.name.toLowerCase() === schema.paleoContextChildTable &&
          this.name === 'paleoContext'
        ? schema.embeddedPaleoContext
        : this.dependent;
  }

  // Returns the field of the related table that is the reverse of this field.
  public getReverse(): Relationship | undefined {
    return this.otherSideName
      ? this.relatedTable.getRelationship(this.otherSideName)
      : undefined;
  }
}
