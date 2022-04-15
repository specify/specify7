/**
 * Query Field spec is a Specify 6 concept for a query field.
 */

import { queryFieldFilters } from './components/querybuilderfieldfilter';
import type { MappingPath } from './components/wbplanviewmapper';
import type { SpQueryField } from './datamodel';
import { f } from './functools';
import { capitalize, insertItem, toLowerCase } from './helpers';
import type { SpecifyResource } from './legacytypes';
import { getModel, getModelById, schema } from './schema';
import type { LiteralField, Relationship } from './specifyfield';
import type { SpecifyModel } from './specifymodel';
import { isTreeModel } from './treedefinitions';
import type { RA } from './types';
import { defined, filterArray } from './types';
import type { Parser } from './uiparse';
import { resolveParser } from './uiparse';
import {
  anyTreeRank,
  formatPartialField,
  formattedEntry,
  formatToManyIndex,
  formatTreeRank,
  getNameFromTreeRankName,
  parsePartialField,
  relationshipIsToMany,
  valueIsPartialField,
  valueIsToManyIndex,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';

const reStringId = /^([^.]*)\.([^.]*)\.(.*)$/;

const reDatePart = /(.*)(NumericDay|NumericMonth|NumericYear)$/;

export type DatePart = 'fullDate' | 'day' | 'month' | 'year';

function extractDatePart(fieldName: string): {
  readonly fieldName: string;
  readonly datePart: DatePart | undefined;
} {
  const match = reDatePart.exec(fieldName);
  return Array.isArray(match)
    ? {
        fieldName: match[1],
        datePart: match[2].replace('Numeric', '').toLowerCase() as DatePart,
      }
    : {
        fieldName,
        datePart: undefined,
      };
}

export class QueryFieldSpec {
  public readonly baseTable: SpecifyModel;

  public joinPath: RA<LiteralField | Relationship> = [];

  public table: SpecifyModel;

  public datePart: DatePart | undefined = undefined;

  public treeRank: string | undefined = undefined;

  public parser: Parser = {};

  public constructor(baseTable: SpecifyModel) {
    this.baseTable = baseTable;
    this.table = this.baseTable;
  }

  public toSpQueryAttributes(): Pick<
    SpQueryField['fields'],
    'tableList' | 'stringId' | 'fieldName' | 'isRelFld'
  > {
    const fieldName = filterArray([
      this.treeRank === anyTreeRank ? undefined : this.treeRank,
      typeof this.treeRank === 'string' &&
      this.treeRank !== anyTreeRank &&
      this.getField()?.name === 'fullName'
        ? undefined
        : `${
            f.maybe(this.getField(), (field) =>
              /*
               * Back-end expects "taxonId" and other id fields for tree ranks
               * to be called "ID" (case-sensitive)
               */
              typeof this.treeRank === 'string'
                ? field === field.model.idField
                  ? 'ID'
                  : field.name === 'author'
                  ? 'Author'
                  : field.name
                : field.name
            ) ?? ''
          }${
            typeof this.datePart === 'string' && this.datePart !== 'fullDate'
              ? `Numeric${capitalize(this.datePart)}`
              : ''
          }`,
    ]).join(' ');
    const tableList = this.makeTableList();

    return {
      tableList,
      stringId: [tableList, toLowerCase(this.table.name), fieldName].join('.'),
      fieldName,
      isRelFld: this.getField()?.isRelationship === true,
    };
  }

  public toSpQueryField(): SpecifyResource<SpQueryField> {
    const attributes = this.toSpQueryAttributes();
    return new schema.models.SpQueryField.Resource()
      .set('isDisplay', true)
      .set('isNot', false)
      .set('startValue', '')
      .set('operStart', queryFieldFilters.any.id)
      .set('sortType', 0)
      .set('tableList', attributes.tableList)
      .set('stringId', attributes.stringId)
      .set('fieldName', attributes.fieldName)
      .set('isRelFld', attributes.isRelFld);
  }

  public getField(): LiteralField | Relationship | undefined {
    return this.joinPath.slice(-1)[0];
  }

  public toMappingPath(): MappingPath {
    let path = filterArray(
      this.joinPath.flatMap((field) => [
        field.name,
        field.isRelationship && relationshipIsToMany(field)
          ? formatToManyIndex(1)
          : undefined,
      ])
    );

    /*
     * Replace Taxon with Taxon->(formatted)
     * Replace (empty) with (formatted)
     */
    if (this.getField()?.isRelationship === true || this.joinPath.length === 0)
      path = [...path, formattedEntry];

    // Insert rank name (or anyRank) into the path
    if (typeof this.treeRank === 'string')
      path = insertItem(path, -1, formatTreeRank(this.treeRank));

    // Format date field
    if (this.getField()?.isTemporal() === true)
      path = [
        ...path.slice(0, -1),
        formatPartialField(
          defined(path.slice(-1)[0]),
          this.datePart ?? 'fullDate'
        ),
      ];

    return path;
  }

  private makeTableList(): string {
    const rest = filterArray(
      this.joinPath.map((field) =>
        field.isRelationship
          ? field.relatedModel.name.toLowerCase() === field.name.toLowerCase()
            ? field.relatedModel.tableId.toString()
            : `${field.relatedModel.tableId}-${field.name.toLowerCase()}`
          : undefined
      )
    );
    return [this.baseTable.tableId, ...rest].join(',');
  }

  public static fromPath(pathIn: RA<string>): QueryFieldSpec {
    const [baseTableName, ...path] = Array.from(pathIn);
    const rootTable = defined(getModel(baseTableName));
    const fieldSpec = new QueryFieldSpec(defined(getModel(baseTableName)));

    const joinPath: (LiteralField | Relationship)[] = [];
    let node = rootTable;
    path.every((rawFieldName, index) => {
      const [fieldName, datePart] =
        index + 1 === path.length && valueIsPartialField(rawFieldName)
          ? parsePartialField<DatePart>(rawFieldName)
          : [rawFieldName, undefined];

      if (fieldName === formattedEntry) return false;
      else if (valueIsToManyIndex(fieldName)) return true;
      else if (valueIsTreeRank(fieldName)) {
        fieldSpec.treeRank = getNameFromTreeRankName(fieldName);
        return true;
      }
      const field = defined(node.getField(fieldName));

      if (field.isTemporal()) fieldSpec.datePart = datePart ?? 'fullDate';

      joinPath.push(field);
      if (field.isRelationship) node = defined(field.relatedModel);
      else if (index + 1 !== path.length)
        throw new Error('Bad query field spec path');
      return true;
    });

    fieldSpec.joinPath = joinPath;
    fieldSpec.table = node;

    const field = fieldSpec.getField();
    fieldSpec.parser =
      field?.isRelationship === false
        ? resolveParser(field, { datePart: fieldSpec.datePart }) ?? {}
        : {};

    return fieldSpec;
  }

  public static fromStringId(
    stringId: string,
    isRelationship: boolean
  ): QueryFieldSpec {
    const match = defined(reStringId.exec(stringId) ?? undefined);
    const [fullPath, _tableName, fullFieldName] = match.slice(1);
    const [baseTableId, ...path] = isRelationship
      ? fullPath.split(',').slice(0, -1)
      : fullPath.split(',');

    const baseTable = getModelById(Number.parseInt(baseTableId));

    let model = baseTable;
    const joinPath = path.map((element) => {
      const [tableId, fieldName] = element.split('-');
      const table = getModelById(Number.parseInt(tableId));
      const field = defined(model.getField(fieldName ?? table.name));
      model = table;
      return field;
    });

    const { fieldName, datePart } = extractDatePart(fullFieldName);
    const field = model.getField(fieldName);

    const fieldSpec = new QueryFieldSpec(baseTable);
    fieldSpec.joinPath =
      typeof field === 'object' ? [...joinPath, field] : joinPath;
    fieldSpec.table =
      typeof field === 'object' && field.isRelationship
        ? field.relatedModel
        : model;

    if (isTreeModel(fieldSpec.table.name)) {
      /*
       * Parses such cases:
       * Kingdom Author (becomes Kingdom->Author)
       * Kingdom (becomes Kingdom->fullName)
       * Author (becomes AnyRank->Author)
       * (empty) (becomes AnyRank->Formatted)
       */
      const parts = fieldName.split(' ');
      const parsedField = fieldSpec.table.getField(parts.slice(-1)[0]);
      fieldSpec.joinPath = filterArray([
        ...fieldSpec.joinPath,
        // If no field provided, use fullName
        fieldSpec.joinPath.slice(-1)[0]?.isRelationship
          ? defined(fieldSpec.table.getField('fullName'))
          : typeof field === 'undefined'
          ? parsedField
          : undefined,
      ]);
      /*
       * If no field passed, entire fieldName string is a rank name
       * If no rank passed, use anyTreeRank
       */
      fieldSpec.treeRank =
        typeof parsedField === 'object'
          ? parts.slice(0, -1).join(' ') || anyTreeRank
          : typeof field === 'object'
          ? anyTreeRank
          : fieldName;
    }

    const newField = fieldSpec.getField();
    fieldSpec.parser =
      newField?.isRelationship === false
        ? resolveParser(newField, { datePart: fieldSpec.datePart }) ?? {}
        : {};
    fieldSpec.datePart =
      newField?.isTemporal() === true ? datePart ?? 'fullDate' : undefined;

    return fieldSpec;
  }
}
