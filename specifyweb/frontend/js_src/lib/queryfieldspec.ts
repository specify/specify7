import type { MappingPath } from './components/wbplanviewmapper';
import type { SpQueryField } from './datamodel';
import type { Tables } from './datamodel';
import { getModel, getModelById } from './schema';
import type { LiteralField, Relationship } from './specifyfield';
import type { SpecifyModel } from './specifymodel';
import { isTreeModel } from './treedefinitions';
import type { RA } from './types';
import { defined, filterArray } from './types';
import { capitalize, toLowerCase } from './wbplanviewhelper';
import {
  formatTreeRank,
  getNameFromTreeRankName,
  relationshipIsToMany,
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
        datePart: match[2].replace('Numeric', '') as DatePart,
      }
    : {
        fieldName,
        datePart: undefined,
      };
}

export class QueryFieldSpec {
  private readonly baseTable: SpecifyModel;

  public joinPath: RA<LiteralField | Relationship> = [];

  public table: SpecifyModel;

  public datePart: DatePart | undefined = undefined;

  public treeRank: Readonly<[rankName: string, fieldName: string]> | undefined =
    undefined;

  public constructor(baseTable: SpecifyModel) {
    this.baseTable = baseTable;
    this.table = this.baseTable;
  }

  public toSpQueryAttributes(): Pick<
    SpQueryField['fields'],
    'tableList' | 'stringId' | 'fieldName' | 'isRelFld'
  > {
    const { tableList, tableName, fieldName } = this.makeStringId(
      this.makeTableList()
    );

    return {
      tableList,
      stringId: [tableList, tableName, fieldName].join('.'),
      fieldName,
      isRelFld: this.isRelationship(),
    };
  }

  public getField(): LiteralField | Relationship | undefined {
    return this.joinPath.slice(-1)[0];
  }

  public toMappingPath(): MappingPath {
    const path = this.joinPath.flatMap((field) => [
      isTreeModel(field.model.name) && !Array.isArray(this.treeRank)
        ? formatTreeRank('_any')
        : undefined,
      field.name,
      field.isRelationship && relationshipIsToMany(field) ? '#1' : undefined,
    ]);
    if (Array.isArray(this.treeRank)) {
      const [rankName, fieldName] = this.treeRank;
      path.push(formatTreeRank(rankName), fieldName);
    }

    if (this.joinPath.slice(-1)[0].isRelationship) path.push('_formatted');

    return filterArray(path);
  }

  private isRelationship(): boolean {
    return (
      typeof this.treeRank === 'undefined' &&
      this.getField()?.isRelationship === true
    );
  }

  private makeTableList(): string {
    const path = (
      Array.isArray(this.treeRank) ||
      this.joinPath.length === 0 ||
      this.isRelationship()
        ? this.joinPath
        : this.joinPath.slice(0, -1)
    ) as RA<Relationship>;

    const rest = path.map((field) => {
      const relatedModel = field.relatedModel;
      return relatedModel.name.toLowerCase() === field.name.toLowerCase()
        ? relatedModel.tableId.toString()
        : `${relatedModel.tableId}-${field.name.toLowerCase()}`;
    });
    return [this.baseTable.tableId, ...rest].join(',');
  }

  private makeStringId(tableList: string): {
    readonly tableList: string;
    readonly tableName: Lowercase<keyof Tables>;
    readonly fieldName: string;
  } {
    let fieldName = Array.isArray(this.treeRank)
      ? this.treeRank[0] === '_any'
        ? this.treeRank[1]
        : this.treeRank[1] === 'name'
        ? this.treeRank[0]
        : this.treeRank.join(' ')
      : this.joinPath.length > 0
      ? defined(this.getField()).name
      : '';
    if (typeof this.datePart === 'string' && this.datePart !== 'fullDate')
      fieldName += `Numeric${capitalize(this.datePart)}`;
    return {
      tableList,
      tableName: toLowerCase(this.table.name),
      fieldName,
    };
  }

  public static fromPath(pathIn: RA<string>): QueryFieldSpec {
    const [baseTableName, ...path] = Array.from(pathIn);
    const rootTable = defined(getModel(baseTableName));
    const fieldSpec = new QueryFieldSpec(defined(getModel(baseTableName)));

    const joinPath: (LiteralField | Relationship)[] = [];
    let node = rootTable;
    path.every((fieldName, index) => {
      if (fieldName === '_formatted') return false;
      else if (valueIsToManyIndex(fieldName)) return true;
      else if (valueIsTreeRank(fieldName)) {
        fieldSpec.treeRank = [
          getNameFromTreeRankName(fieldName),
          defined(path[index + 1]).toLowerCase(),
        ];
        return false;
      }
      const field = defined(node.getField(fieldName));
      joinPath.push(field);
      if (field.isRelationship) node = defined(field.relatedModel);
      else if (index + 1 !== path.length)
        throw new Error('Bad query field spec path');
      return true;
    });

    fieldSpec.joinPath = joinPath;
    fieldSpec.table = node;
    fieldSpec.datePart = joinPath.slice(-1)[0]?.isTemporal()
      ? 'fullDate'
      : undefined;
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

    let node = baseTable;
    const joinPath = path.map((element) => {
      const [tableId, fieldName] = element.split('-');
      const table = getModelById(Number.parseInt(tableId));
      const field = defined(node.getField(fieldName ?? table.name));
      node = table;
      return field;
    });

    const { fieldName, datePart } = extractDatePart(fullFieldName);
    const field = node.getField(fieldName);

    const fieldSpec = new QueryFieldSpec(baseTable);
    fieldSpec.joinPath =
      typeof field === 'object' ? [...joinPath, field] : joinPath;
    fieldSpec.table = node;
    if (typeof field === 'undefined') {
      /*
       * This is really ugly
       * Field names and rank names are represented identically in string id
       * If rank also has a field name, they are separated by a space,
       * except, rank name itself can contain a space too
       */
      const parts = fieldName.split(' ');
      fieldSpec.treeRank =
        parts.length === 1
          ? [parts[0], 'name']
          : typeof node.getField(parts.slice(-1)[0]) === 'object'
          ? [parts.slice(0, -1).join(' '), parts.slice(-1)[0]]
          : [fieldName, 'name'];
    }
    fieldSpec.datePart =
      field?.isTemporal() === true ? datePart ?? 'fullDate' : undefined;
    return fieldSpec;
  }
}
