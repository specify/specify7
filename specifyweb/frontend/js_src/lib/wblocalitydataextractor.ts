import type { IR, R, RA } from './components/wbplanview';
import type { MappingPath } from './components/wbplanviewmapper';
import type { LocalityPinFields } from './leafletconfig';
import { localityPinFields } from './leafletconfig';
import { findSubArray } from './wbplanviewhelper';
import type { SplitMappingPath } from './wbplanviewhelper';
import {
  formatReferenceItem,
  mappingPathToString,
  splitJoinedMappingPath,
  valueIsReferenceItem,
} from './wbplanviewmodelhelper';

const addBaseTableName = (
  baseTableName: string,
  arrayOfMappings: RA<SplitMappingPath>
): RA<SplitMappingPath> =>
  arrayOfMappings.map(({ mappingPath, ...rest }) => ({
    ...rest,
    mappingPath: [baseTableName, ...mappingPath],
  }));

// Replaces all to-many reference numbers with #1
const getCanonicalMappingPath = (mappingPath: MappingPath): MappingPath =>
  mappingPath.map((mappingPathPart) =>
    valueIsReferenceItem(mappingPathPart)
      ? formatReferenceItem(1)
      : mappingPathPart
  );

const matchLocalityPinFields = (
  arrayOfMappings: RA<SplitMappingPath>
): RA<
  LocalityPinFields & { readonly matchedPathsToRelationship: RA<MappingPath> }
> =>
  localityPinFields
    .map(({ pathToRelationship, pathsToFields }) => ({
      pathsToFields,
      pathToRelationship,
      matchedPathsToRelationship: [
        ...new Set(
          arrayOfMappings
            .map(({ mappingPath }) => {
              const subArrayPosition = findSubArray(
                getCanonicalMappingPath(mappingPath),
                pathToRelationship
              );
              return subArrayPosition === -1
                ? undefined
                : mappingPathToString(mappingPath.slice(0, subArrayPosition));
            })
            .filter(
              (mappingPath): mappingPath is string =>
                typeof mappingPath === 'string'
            )
        ),
      ].map(splitJoinedMappingPath),
    }))
    .filter(
      ({ matchedPathsToRelationship }) => matchedPathsToRelationship.length > 0
    );

type SplitMappingPathWithFieldName = SplitMappingPath & {
  readonly fieldName: string;
};

const filterArrayOfMappings = (
  matchedLocalityGroups: RA<
    LocalityPinFields & { readonly matchedPathsToRelationship: RA<MappingPath> }
  >,
  arrayOfMappings: RA<SplitMappingPath>
): RA<SplitMappingPathWithFieldName> =>
  matchedLocalityGroups
    .flatMap(({ matchedPathsToRelationship, pathsToFields }) =>
      matchedPathsToRelationship.flatMap((mappingPath) =>
        pathsToFields.flatMap((pathToField) => {
          const splitMappingPath = arrayOfMappings.find(
            (splitMappingPath) =>
              mappingPathToString(splitMappingPath.mappingPath) ===
              mappingPathToString([
                ...mappingPath.filter(
                  (mappingPathPart) => mappingPathPart !== ''
                ),
                ...pathToField,
              ])
          );
          return typeof splitMappingPath === 'undefined'
            ? undefined
            : {
                ...splitMappingPath,
                fieldName: mappingPathToString(pathToField),
              };
        })
      )
    )
    .filter(
      (splitMappingPath): splitMappingPath is SplitMappingPathWithFieldName =>
        typeof splitMappingPath !== 'undefined'
    );

function groupLocalityColumns(
  arrayOfMappings: RA<SplitMappingPathWithFieldName>
): RA<IR<string>> {
  const groupedLocalityColumns: R<R<string>> = {};
  const globalLocalityColumns: R<string> = {};
  arrayOfMappings.forEach(({ mappingPath, fieldName, headerName }) => {
    const indexOfLocality = mappingPath.indexOf('locality');
    if (indexOfLocality === -1) globalLocalityColumns[fieldName] = headerName;
    else {
      const groupName = mappingPathToString(
        mappingPath.slice(0, indexOfLocality)
      );
      groupedLocalityColumns[groupName] ??= {};
      groupedLocalityColumns[groupName][fieldName] = headerName;
    }
  });
  return Object.values(groupedLocalityColumns).map((groupOfColumns) => ({
    ...groupOfColumns,
    ...globalLocalityColumns,
  }));
}

const findLocalityColumns = (
  arrayOfMappings: RA<SplitMappingPath>
): RA<IR<string>> =>
  groupLocalityColumns(
    filterArrayOfMappings(
      matchLocalityPinFields(arrayOfMappings),
      arrayOfMappings
    )
  );

export const findLocalityColumnsInDataSet = (
  baseTableName: string,
  arrayOfMappings: RA<SplitMappingPath>
): RA<IR<string>> =>
  findLocalityColumns(addBaseTableName(baseTableName, arrayOfMappings));
