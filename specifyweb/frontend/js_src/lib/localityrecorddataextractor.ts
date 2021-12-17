import type { RA } from './types';
import type { MappingPath } from './components/wbplanviewmapper';
import dataObjectFormatters from './dataobjformatters';
import { localityPinFields, MAX_TO_MANY_INDEX } from './leafletconfig';
import type { LocalityData } from './leafletutils';
import {
  findRanksInMappings,
  formatCoordinate,
  getLocalityData,
} from './leafletutils';
import { deflateLocalityData } from './lifemapperhelper';
import {
  formatReferenceItem,
  formatTreeRank,
  mappingPathToString,
  splitJoinedMappingPath,
  valueIsReferenceItem,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';
import { generateMappingPathPreview } from './wbplanviewmappingpreview';
import dataModelStorage from './wbplanviewmodel';
import { getTableFromMappingPath } from './wbplanviewnavigator';
import { dataModelPromise } from './wbplanviewmodelfetcher';

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
  for (let index = 0; index < mappingPath.length; index += 1)
    if (
      valueIsTreeRank(mappingPath[index]) ||
      valueIsReferenceItem(mappingPath[index])
    )
      return splitMappingPath(mappingPath, index + (index === 0 ? 1 : 0));
  return [mappingPath, []];
}

type FilterFunction = (
  mappingPath: [
    pastParts: MappingPath,
    currentPart: MappingPath,
    nextParts: MappingPath
  ],
  resource: any
) => boolean;

export const defaultRecordFilterFunction: FilterFunction = (
  _mappingPathParts,
  resource
) =>
  typeof resource?.specifyModel?.name !== 'string' ||
  resource.specifyModel.name !== 'Determination' ||
  resource.get('isCurrent') === true;

async function recursiveResourceResolve(
  resource: any,
  mappingPath: MappingPath,
  filterFunction: FilterFunction,
  pastParts: RA<string> = []
): Promise<RA<string>> {
  if (mappingPath.length === 0) return [pastParts, resource];

  const [currentPart, nextPart] = getNextMappingPathPart(mappingPath);

  if (typeof resource === 'undefined' || resource === null) return [];

  if (
    typeof filterFunction !== 'undefined' &&
    !filterFunction([pastParts, currentPart, nextPart], resource)
  )
    return [];

  if (
    'fetchIfNotPopulated' in resource &&
    (typeof resource.related === 'undefined' || !resource.related.isNew())
  )
    await resource.fetchIfNotPopulated();

  if (valueIsTreeRank(currentPart[0])) {
    const treeTableName = getTableFromMappingPath({
      baseTableName: 'locality',
      mappingPath: pastParts,
    });
    const tableRanks = Object.entries(dataModelStorage.ranks[treeTableName]);
    const currentRank = tableRanks.find(
      ([, { rankId }]) => rankId === resource.get('rankId')
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
        Object.values(resource.models)
          .slice(0, MAX_TO_MANY_INDEX)
          .map(async (model: any, index) =>
            recursiveResourceResolve(model, nextPart, filterFunction, [
              ...pastParts,
              formatReferenceItem(index + 1),
            ])
          )
      ).then((result) => resolve(result.flat()))
    );
  } else {
    const overwriteAgent =
      currentPart[0] === 'agent' && currentPart[1] === 'lastname';
    const nextResource = overwriteAgent
      ? await dataObjectFormatters.format(resource)
      : await resource.rget(mappingPathToString(currentPart));

    return recursiveResourceResolve(nextResource, nextPart, filterFunction, [
      ...pastParts,
      ...(overwriteAgent ? ['agent', 'fullname'] : currentPart),
    ]);
  }
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

export const parsedLocalityPinFields: [
  RA<MappingPath> | undefined,
  RA<MappingPath> | undefined
] = [undefined, undefined];
export const parseLocalityPinFields = (
  quickFetch: boolean
): RA<MappingPath> => {
  const parsedResult = parsedLocalityPinFields[Number(quickFetch)];
  if (Array.isArray(parsedResult)) return parsedResult;

  const arrayOfMappings = localityPinFields
    .flatMap(({ pathsToFields }) => pathsToFields)
    .filter(
      (mappingPath) =>
        mappingPath[0] === 'locality' &&
        (!quickFetch || mappingPath.length === 2)
    )
    .map((mappingPath) => mappingPath.slice(1));

  const treeRanks = findRanksInMappings(arrayOfMappings);

  const filteredArrayOfMappings = arrayOfMappings.reduce<MappingPath[]>(
    (arrayOfMappings, mappingPath, index) => {
      const { groupName, treeRankLocation } = treeRanks[index];
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

  parsedLocalityPinFields[Number(quickFetch)] = filteredArrayOfMappings;
  return filteredArrayOfMappings;
};

export async function getLocalityDataFromLocalityResource(
  localityResource: any,
  // Don't fetch related tables. Only return data from the locality resource
  quickFetch = false,
  filterFunction: FilterFunction = defaultRecordFilterFunction
): Promise<LocalityData | false> {
  // Needed by generateMappingPathPreview
  await dataModelPromise;

  const filteredArrayOfMappings = parseLocalityPinFields(quickFetch);

  const results = await Promise.all(
    filteredArrayOfMappings.map(async (mappingPath) =>
      recursiveResourceResolve(localityResource, mappingPath, filterFunction)
    )
  );

  const localityData = formatLocalityDataObject(
    resultsIntoPairs(results.flat())
  );

  return typeof filterFunction === 'undefined' || localityData === false
    ? localityData
    : deflateLocalityData(localityData);
}

export function formatLocalityDataObject(
  results: RA<[MappingPath, string | null]>
): LocalityData | false {
  const rawLocalityData = Object.fromEntries(
    results
      .filter(([, fieldValue]) => fieldValue !== null)
      .map(
        ([mappingPath, fieldValue]) =>
          [
            mappingPathToString(['locality', ...mappingPath]),
            {
              headerName: generateMappingPathPreview('locality', mappingPath),
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
