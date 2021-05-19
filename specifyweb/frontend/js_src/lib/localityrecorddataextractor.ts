import type { RA } from './components/wbplanview';
import type { MappingPath } from './components/wbplanviewmapper';
import { localityPinFields } from './leafletconfig';
import type { LocalityData } from './leafletutils';
import { formatCoordinate, getLocalityData } from './leafletutils';
import { generateMappingPathPreview } from './wbplanviewhelper';
import fetchDataModelPromise from './wbplanviewmodelfetcher';
import {
  formatReferenceItem,
  mappingPathToString,
  valueIsReferenceItem,
  valueIsTreeRank,
} from './wbplanviewmodelhelper';

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
  mappingPath: RA<string>,
  pastParts: RA<string> = []
): Promise<RA<string>> {
  if (mappingPath.length === 0) return [pastParts, resource];

  const [currentPart, nextPart] = getNextMappingPathPart(mappingPath);

  if ('fetchIfNotPopulated' in resource) await resource.fetchIfNotPopulated();

  if (valueIsTreeRank(currentPart[0]))
    // TODO: fix not fetching higher level ranks
    return [
      [...pastParts, ...currentPart, ...nextPart],
      await resource.rget(nextPart[0]),
    ];
  else if (valueIsReferenceItem(currentPart[0])) {
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

  const results = await Promise.all(
    arrayOfMappings.map(async (mappingPath) =>
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
