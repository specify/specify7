import type { MappingPath } from './components/wbplanviewmapper';
import type { SpQueryField, Tables } from './datamodel';
import type { SerializedModel, SerializedResource } from './datamodelutils';
import type { DatePart } from './queryfieldspec';
import { QueryFieldSpec } from './queryfieldspec';
import type { RA } from './types';
import { defined } from './types';
import { getParser } from './uiparse';
import { sortFunction } from './wbplanviewhelper';
import { mappingPathIsComplete } from './wbplanviewutils';

type DateField = {
  type: 'dateField';
  datePart: DatePart;
};

// TODO: find a better icon for sortType=undefined
const sortTypes = [undefined, 'ascending', 'descending'];

export type QueryField = {
  // Used as a React [key] prop only in order to optimize rendering
  readonly id: number;
  readonly mappingPath: MappingPath;
  readonly sortType: typeof sortTypes[number];
  // TODO: replace with "keyof"
  readonly filter: string;
  readonly startValue: string;
  readonly endValue: string;
  readonly details: DateField | undefined;
  readonly isNot: boolean;
  readonly isDisplay: boolean;
};

export function parseQueryFields(
  queryFields: RA<SerializedResource<SpQueryField>>
): RA<QueryField> {
  return Array.from(queryFields)
    .sort(sortFunction(({ position }) => position))
    .map(({ id, isNot, isDisplay, ...field }) => {
      const fieldSpec = QueryFieldSpec.fromStringId(
        field.stringId,
        field.isRelFld ?? false
      );
      const parser = getParser(defined(fieldSpec.getField())) ?? {};

      return {
        id,
        mappingPath: fieldSpec.joinPath.map(({ name }) => name.toLowerCase()),
        sortType: sortTypes[field.sortType],
        filter: 'any',
        startValue: field.startValue ?? '',
        endValue: field.endValue ?? '',
        details:
          parser.type === 'date'
            ? {
                type: 'dateField',
                datePart: fieldSpec.datePart ?? 'fullDate',
              }
            : undefined,
        isNot,
        isDisplay,
      };
    });
}

export const unParseQueryFields = (
  baseTableName: Lowercase<keyof Tables>,
  fields: RA<QueryField>
): RA<Partial<SerializedModel<SpQueryField>>> =>
  fields
    .filter(({ mappingPath }) => mappingPathIsComplete(mappingPath))
    .map((field, index) => {
      const fieldSpec = QueryFieldSpec.fromPath([
        baseTableName,
        ...field.mappingPath,
      ]);

      return {
        ...fieldSpec.toSpQueryAttributes(),
        sorttype: sortTypes.indexOf(field.sortType),
        position: index,
        startvalue: field.startValue,
        endvalue: field.endValue,
      };
    });

export function hasLocalityColumns(fields: RA<QueryField>): boolean {
  const fieldNames = new Set(
    fields
      .filter(({ isDisplay }) => isDisplay)
      .map(({ mappingPath }) => mappingPath.slice(-1)[0])
  );
  return fieldNames.has('latitude1') && fieldNames.has('longitude1');
}
