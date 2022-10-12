/**
 * Query Field spec is a Specify 6 concept for a query field.
 */

import { queryFieldFilters } from './FieldFilter';
import type { MappingPath } from '../WbPlanView/Mapper';
import type { SpQueryField, Tables } from '../DataModel/types';
import { f } from '../../utils/functools';
import { capitalize, insertItem, replaceItem } from '../../utils/utils';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getModelById, schema, strictGetModel } from '../DataModel/schema';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { isTreeModel } from '../InitialContext/treeRanks';
import type { RA, WritableArray } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import type { Parser } from '../../utils/parser/definitions';
import { resolveParser } from '../../utils/parser/definitions';
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
} from '../WbPlanView/mappingHelpers';

const reStringId = /^([^.]*)\.([^.]*)\.(.*)$/;

const reDatePart = /(.*)(NumericDay|NumericMonth|NumericYear)$/;

export type DatePart = 'day' | 'fullDate' | 'month' | 'year';

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

  // eslint-disable-next-line functional/prefer-readonly-type
  public joinPath: RA<LiteralField | Relationship> = [];

  // eslint-disable-next-line functional/prefer-readonly-type
  public table: SpecifyModel;

  // eslint-disable-next-line functional/prefer-readonly-type
  public datePart: DatePart | undefined = undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  public treeRank: string | undefined = undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  public parser: Parser = {};

  public constructor(baseTable: SpecifyModel) {
    this.baseTable = baseTable;
    this.table = this.baseTable;
  }

  public toSpQueryAttributes(): Pick<
    SpQueryField['fields'],
    'fieldName' | 'isRelFld' | 'stringId' | 'tableList'
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
                ? field === field.model.idField && this.treeRank !== anyTreeRank
                  ? 'ID'
                  : field.name === 'author'
                  ? 'Author'
                  : field.name === 'fullName' && this.treeRank !== anyTreeRank
                  ? ''
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
      stringId: [tableList, this.table.name, fieldName].join('.'),
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
    return this.joinPath.at(-1);
  }

  public toMappingPath(): MappingPath {
    let path = filterArray(
      this.joinPath.flatMap((field, index, { length }) => [
        field.name,
        field.isRelationship
          ? relationshipIsToMany(field)
            ? formatToManyIndex(1)
            : isTreeModel(field.relatedModel.name)
            ? formatTreeRank(
                index + 1 === length
                  ? this.treeRank ?? anyTreeRank
                  : anyTreeRank
              )
            : undefined
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
      path =
        path.length === 1
          ? insertItem(path, 0, formatTreeRank(this.treeRank))
          : replaceItem(path, path.length - 2, formatTreeRank(this.treeRank));
    if (isTreeModel(this.baseTable.name) && !valueIsTreeRank(path[0]))
      path = [formatTreeRank(anyTreeRank), ...path];

    // Format date field
    if (this.getField()?.isTemporal() === true)
      path = [
        ...path.slice(0, -1),
        formatPartialField(defined(path.at(-1)), this.datePart ?? 'fullDate'),
      ];

    return path;
  }

  private makeTableList(): string {
    const rest = filterArray(
      this.joinPath.map((field) =>
        field.isRelationship
          ? field.relatedModel.name.toLowerCase() === field.name.toLowerCase()
            ? field.relatedModel.tableId.toString()
            : `${field.relatedModel.tableId}-${field.name}`
          : undefined
      )
    );
    return [this.baseTable.tableId, ...rest].join(',');
  }

  public static fromPath(
    baseTableName: keyof Tables,
    path: RA<string>
  ): QueryFieldSpec {
    const rootTable = strictGetModel(baseTableName);
    const fieldSpec = new QueryFieldSpec(strictGetModel(baseTableName));

    const joinPath: WritableArray<LiteralField | Relationship> = [];
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
      const field = node.strictGetField(fieldName);

      if (field.isTemporal()) fieldSpec.datePart = datePart ?? 'fullDate';

      joinPath.push(field);
      if (field.isRelationship) node = field.relatedModel;
      else if (index + 1 !== path.length)
        throw new Error('Bad query field spec path');
      return true;
    });

    fieldSpec.joinPath = joinPath;
    fieldSpec.table = node;

    const field = fieldSpec.getField();
    fieldSpec.parser =
      field?.isRelationship === false
        ? resolveParser(field, { datePart: fieldSpec.datePart })
        : {};

    return fieldSpec;
  }

  public static fromStringId(
    stringId: string,
    isRelationship: boolean
  ): QueryFieldSpec {
    const match = defined(
      reStringId.exec(stringId) ?? undefined,
      `Unable to parse a string id: ${stringId}`
    );
    const [fullPath, _tableName, fullFieldName] = match.slice(1);
    const [baseTableId, ...path] = isRelationship
      ? fullPath.split(',').slice(0, -1)
      : fullPath.split(',');

    const baseTable = getModelById(Number.parseInt(baseTableId));

    let model = baseTable;
    const joinPath = path.map((element) => {
      const [tableId, fieldName] = element.split('-');
      const table = getModelById(Number.parseInt(tableId));
      const field = model.strictGetField(fieldName ?? table.name);
      model = table;
      return field;
    });

    const { fieldName, datePart } = extractDatePart(fullFieldName);
    const field = model.getField(fieldName);

    const fieldSpec = new QueryFieldSpec(baseTable);
    fieldSpec.joinPath = filterArray([...joinPath, field]);
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
      const parsedField = fieldSpec.table.getField(parts.at(-1)!);
      /*
       * If no field passed, entire fieldName string is a rank name
       * If no rank passed, use anyTreeRank
       */
      fieldSpec.treeRank =
        typeof parsedField === 'object'
          ? parts.slice(0, -1).join(' ') || anyTreeRank
          : typeof field === 'object'
          ? anyTreeRank
          : fieldName || anyTreeRank;
      fieldSpec.joinPath = filterArray([
        ...fieldSpec.joinPath,
        field === undefined
          ? parsedField ??
            // If no field provided, use fullName
            (fieldSpec.joinPath.at(-1)?.isRelationship &&
            fieldSpec.treeRank !== anyTreeRank
              ? fieldSpec.table.strictGetLiteralField('fullName')
              : undefined)
          : undefined,
      ]);
    }

    const newField = fieldSpec.getField();
    fieldSpec.parser =
      newField?.isRelationship === false
        ? resolveParser(newField, { datePart: fieldSpec.datePart })
        : {};
    fieldSpec.datePart =
      newField?.isTemporal() === true ? datePart ?? 'fullDate' : undefined;

    return fieldSpec;
  }
}
