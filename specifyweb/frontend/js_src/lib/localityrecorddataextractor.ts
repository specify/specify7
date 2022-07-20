/**
 * Extracts data from localities and related records in a format that can be
 * shown in pop-up bubbles in Leaflet
 *
 * @module
 */

import type { MappingPath } from './components/wbplanviewmapper';
import type { Locality } from './datamodel';
import type { AnySchema, AnyTree } from './datamodelutils';
import { format } from './dataobjformatters';
import { localityPinFields, MAX_TO_MANY_INDEX } from './leafletconfig';
import type { LocalityData } from './leafletutils';
import {
  findRanksInMappings,
  formatCoordinate,
  getLocalityData,
} from './leafletutils';
import type { SpecifyResource } from './legacytypes';
import { hasTablePermission, hasTreeAccess } from './permissionutils';
import type { Collection } from './specifymodel';
import { deflateLocalityData } from './specifynetworkhelper';
import { getTreeDefinitionItems, treeRanksPromise } from './treedefinitions';
import type { RA } from './types';
import { defined, filterArray } from './types';
import {
  formatToManyIndex,
  formatTreeRank,
  mappingPathToString,
  splitJoinedMappingPath,
  valueIsToManyIndex,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';
import { generateMappingPathPreview } from './wbplanviewmappingpreview';
import { getTableFromMappingPath } from './wbplanviewnavigator';
import { pathStartsWith } from './wbplanviewutils';

const splitMappingPath = (
  mappingPath: MappingPath,
  index: number
): readonly [MappingPath, MappingPath] => [
  mappingPath.slice(0, index),
  mappingPath.slice(index),
];

function getNextMappingPathPart(
  mappingPath: MappingPath
): readonly [MappingPath, MappingPath] {
  for (let index = 0; index < mappingPath.length; index += 1)
    if (
      valueIsTreeRank(mappingPath[index]) ||
      valueIsToManyIndex(mappingPath[index])
    )
      return splitMappingPath(mappingPath, index + (index === 0 ? 1 : 0));
  return [mappingPath, []];
}

type FilterFunction = (
  mappingPath: readonly [
    pastParts: MappingPath,
    currentPart: MappingPath,
    nextParts: MappingPath
  ],
  resource: Collection<AnySchema> | SpecifyResource<AnySchema>
) => boolean;

export const defaultRecordFilterFunction: FilterFunction = (
  _mappingPathParts,
  resource
) =>
  !('specifyModel' in resource) ||
  resource.specifyModel.name !== 'Determination' ||
  resource.get('isCurrent');

async function recursiveResourceResolve(
  resource:
    | Collection<AnySchema>
    | SpecifyResource<AnySchema>
    | string
    | null
    | undefined,
  mappingPath: MappingPath,
  filterFunction: FilterFunction,
  pastParts: RA<string> = []
): Promise<RA<readonly [MappingPath, string]>> {
  if (mappingPath.length === 0)
    return [[pastParts, resource?.toString() ?? '']];

  const [currentPart, nextPart] = getNextMappingPathPart(mappingPath);

  if (resource === undefined || resource === null) return [];

  if (
    typeof filterFunction === 'function' &&
    typeof resource === 'object' &&
    !filterFunction([pastParts, currentPart, nextPart], resource)
  )
    return [];

  if (
    typeof resource === 'object' &&
    'fetch' in resource &&
    (!('related' in resource) || resource.related?.isNew() !== true)
  )
    if (
      hasTablePermission(
        defined(
          ('specifyModel' in resource
            ? resource?.specifyModel?.name
            : undefined) ??
            ('related' in resource
              ? resource?.related?.specifyModel?.name
              : undefined) ??
            ('field' in resource ? resource?.field?.model.name : undefined)
        ),
        'read'
      )
    )
      await resource.fetch();
    else return [];

  if (
    valueIsTreeRank(currentPart[0]) &&
    typeof resource === 'object' &&
    'get' in resource
  ) {
    const treeTableName = getTableFromMappingPath('Locality', pastParts);
    if (!hasTreeAccess(treeTableName as AnyTree['tableName'], 'read'))
      return [];
    const tableRanks = defined(
      getTreeDefinitionItems(treeTableName as 'Geography', false)
    );
    const currentRank = tableRanks.find(
      ({ rankId }) => rankId === resource.get('rankId')
    );
    if (currentRank === undefined) throw new Error('Failed to fetch tree name');
    const currentRankName = formatTreeRank(currentRank.name);
    return [
      [
        [...pastParts, currentRankName, ...nextPart],
        await resource.rgetPromise(nextPart[0]),
      ],
    ];
  } else if (
    valueIsToManyIndex(currentPart[0]) &&
    typeof resource === 'object' &&
    'models' in resource
  ) {
    return Promise.all(
      Object.values(resource.models)
        .slice(0, MAX_TO_MANY_INDEX)
        .map(async (model, index) =>
          recursiveResourceResolve(model, nextPart, filterFunction, [
            ...pastParts,
            formatToManyIndex(index + 1),
          ])
        )
    ).then((result) => result.flat());
  } else if (typeof resource === 'object' && 'rgetPromise' in resource) {
    const overwriteAgent =
      currentPart[0] === 'agent' && currentPart[1] === 'lastname';
    const nextResource = overwriteAgent
      ? await format(resource)
      : await resource.rgetPromise(mappingPathToString(currentPart));

    return recursiveResourceResolve(nextResource, nextPart, filterFunction, [
      ...pastParts,
      ...(overwriteAgent ? ['agent', 'fullname'] : currentPart),
    ]);
  } else return [];
}

// eslint-disable-next-line functional/prefer-readonly-type
export const parsedLocalityPinFields: [
  RA<MappingPath> | undefined,
  RA<MappingPath> | undefined
] = [undefined, undefined];
export const parseLocalityPinFields = (
  quickFetch: boolean
): RA<MappingPath> => {
  const parsedResult = parsedLocalityPinFields[Number(quickFetch)];
  if (Array.isArray(parsedResult)) return parsedResult;

  const mappingPaths = localityPinFields
    .flatMap(({ pathsToFields }) => pathsToFields)
    .filter(
      (mappingPath) =>
        mappingPath[0].toLowerCase() === 'locality' &&
        (!quickFetch || mappingPath.length === 2)
    )
    .map((mappingPath) => mappingPath.slice(1));

  const treeRanks = findRanksInMappings(mappingPaths);

  const filteredMappingPaths = filterArray(
    mappingPaths.map((mappingPath, index) => {
      const { groupName, treeRankLocation } = treeRanks[index];
      if (treeRankLocation === -1) {
        return mappingPath;
      } else if (
        /*
         * Replace first occurrence of a tree with fullName, and disregard
         * subsequent occurrences
         */
        mappingPaths.findIndex((existingGroupName) =>
          pathStartsWith(existingGroupName, splitJoinedMappingPath(groupName))
        ) === index
      )
        return [
          ...splitJoinedMappingPath(groupName),
          mappingPath[treeRankLocation],
          'fullname',
        ];
      else return undefined;
    })
  );

  parsedLocalityPinFields[Number(quickFetch)] = filteredMappingPaths;
  return filteredMappingPaths;
};

export async function fetchLocalityDataFromLocalityResource(
  localityResource: SpecifyResource<Locality>,
  // Don't fetch related tables. Only return data from the locality resource
  quickFetch = false,
  filterFunction: FilterFunction = defaultRecordFilterFunction
): Promise<LocalityData | false> {
  await treeRanksPromise;
  const filteredMappingPaths = parseLocalityPinFields(quickFetch);

  const results = await Promise.all(
    filteredMappingPaths.map(async (mappingPath) =>
      recursiveResourceResolve(localityResource, mappingPath, filterFunction)
    )
  );

  const localityData = formatLocalityDataObject(results.flat());

  return filterFunction === undefined || localityData === false
    ? localityData
    : deflateLocalityData(localityData);
}

export function formatLocalityDataObject(
  results: RA<readonly [MappingPath, string | null]>
): LocalityData | false {
  const rawLocalityData = Object.fromEntries(
    results
      .filter(([, fieldValue]) => fieldValue !== null)
      .map(
        ([mappingPath, fieldValue]) =>
          [
            mappingPathToString(['locality', ...mappingPath]),
            {
              headerName: generateMappingPathPreview('Locality', mappingPath),
              value: fieldValue?.toString() ?? '',
            },
          ] as const
      )
  );

  return getLocalityData(
    Object.fromEntries(
      Object.entries(rawLocalityData).map(([fieldName, { headerName }]) => [
        fieldName,
        headerName,
      ])
    ),
    (fieldName) => rawLocalityData[fieldName] ?? { headerName: '', value: '' },
    (fieldName) => ({
      headerName: rawLocalityData[fieldName].headerName ?? '',
      value: formatCoordinate(rawLocalityData[fieldName].value ?? ''),
    })
  );
}
