import type { RA } from './components/wbplanview';
import type { MappingPath } from './components/wbplanviewmapper';
import { localityPinFields } from './leafletconfig';
import type { LocalityData } from './leafletutils';
import { formatCoordinate, getLocalityData } from './leafletutils';
import { generateMappingPathPreview } from './wbplanviewhelper';
import fetchDataModelPromise from './wbplanviewmodelfetcher';
import {
  formatReferenceItem,
  formatTreeRank,
  mappingPathToString,
  splitJoinedMappingPath,
  valueIsReferenceItem,
  valueIsTreeRank,
} from './wbplanviewmodelhelper';
import dataModelStorage from './wbplanviewmodel';
import { getMappingLineData } from './wbplanviewnavigator';

const splitMappingPath = (
  mappingPath: MappingPath,
  index: number
): [MappingPath, MappingPath] => [
  mappingPath.slice(0, index),
  mappingPath.slice(index),
];

function getNextMappingPathPart(
  mappingPath: MappingPath
): [MappingPath, MappingPath] {
  for (let index = 0; index < mappingPath.length; index++)
    if (
      valueIsTreeRank(mappingPath[index]) ||
      valueIsReferenceItem(mappingPath[index])
    )
      return splitMappingPath(mappingPath, index + (index === 0 ? 1 : 0));
  return [mappingPath, []];
}

async function recursiveResourceResolve(
  resource: any,
  mappingPath: MappingPath,
  pastParts: RA<string> = []
): Promise<RA<string>> {
  if (mappingPath.length === 0) return [pastParts, resource];

  const [currentPart, nextPart] = getNextMappingPathPart(mappingPath);

  if ('fetchIfNotPopulated' in resource) await resource.fetchIfNotPopulated();

  if (valueIsTreeRank(currentPart[0])) {
    const treeTableName = getMappingLineData({
      baseTableName: 'locality',
      mappingPath: pastParts,
    }).slice(-1)[0].tableName;
    if (typeof treeTableName === 'undefined')
      throw new Error('Failed to fetch tree name');
    const tableRanks = Object.entries(dataModelStorage.ranks[treeTableName]);
    const currentRank = tableRanks.find(
      ([, { rankId }]) => rankId === resource.get('rankid')
    );
    if (typeof currentRank === 'undefined')
      throw new Error('Failed to fetch tree name');
    const currentRankName = formatTreeRank(currentRank[0]);
    return [
      [...pastParts, currentRankName, ...nextPart],
      await resource.rget(nextPart[0]),
    ];
  } else if (valueIsReferenceItem(currentPart[0])) {
    return new Promise(async (resolve) =>
      Promise.all<RA<string>>(
        Object.values(resource.models).map(async (model: any, index) =>
          recursiveResourceResolve(model, nextPart, [
            ...pastParts,
            formatReferenceItem(index + 1),
          ])
        )
      ).then((result) => resolve(result.flat()))
    );
  } else
    return recursiveResourceResolve(
      await resource.rget(mappingPathToString(currentPart)),
      nextPart,
      [...pastParts, ...currentPart]
    );
}

const resultsIntoPairs = (
  results: RA<string | null | MappingPath>
): RA<[MappingPath, string | null]> =>
  results
    .map((element, index) =>
      index % 2 === 0 ? ([element, results[index + 1]] as const) : undefined
    )
    .filter(
      (pair): pair is [MappingPath, string | null] =>
        typeof pair !== 'undefined'
    );

export async function getLocalityDataFromLocalityResource(
  localityResource: any
): Promise<LocalityData | false> {
  // Needed by generateMappingPathPreview
  await fetchDataModelPromise();

  const arrayOfMappings = localityPinFields
    .flatMap(({ pathsToFields }) => pathsToFields)
    .filter((mappingPath) => mappingPath[0] === 'locality')
    .map((mappingPath) => mappingPath.slice(1));

  const findRanksInMappings = arrayOfMappings
    .map((mappingPath) => ({
      mappingPath,
      treeRankLocation: mappingPath.findIndex((mappingPathPart) =>
        valueIsTreeRank(mappingPathPart)
      ),
    }))
    .map(({ mappingPath, treeRankLocation }) =>
      treeRankLocation === -1
        ? { groupName: '', treeRankLocation }
        : {
            treeRankLocation,
            groupName: mappingPathToString(
              mappingPath.slice(0, treeRankLocation)
            ),
          }
    );

  const filteredArrayOfMappings = arrayOfMappings.reduce<MappingPath[]>(
    (arrayOfMappings, mappingPath, index) => {
      const { groupName, treeRankLocation } = findRanksInMappings[index];
      if (treeRankLocation === -1) {
        arrayOfMappings.push(mappingPath);
      } else if (
        arrayOfMappings.every(
          (existingGroupName) =>
            !mappingPathToString(existingGroupName).startsWith(groupName)
        )
      )
        arrayOfMappings.push([
          ...splitJoinedMappingPath(groupName),
          mappingPath[treeRankLocation],
          'fullname',
        ]);

      return arrayOfMappings;
    },
    []
  );

  const results = await Promise.all(
    filteredArrayOfMappings.map(async (mappingPath) =>
      recursiveResourceResolve(localityResource, mappingPath)
    )
  );

  const rawLocalityData = Object.fromEntries(
    resultsIntoPairs(results.flat())
      .filter(([, fieldValue]) => fieldValue !== null)
      .map(
        ([mappingPath, fieldValue]) =>
          [
            mappingPathToString(['locality', ...mappingPath]),
            {
              headerName: generateMappingPathPreview(
                'locality',
                mappingPath
              )[1],
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
