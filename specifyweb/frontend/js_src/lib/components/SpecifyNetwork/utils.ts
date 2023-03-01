import type { IR } from '../../utils/types';
import { R, RA } from '../../utils/types';
import { Field, LocalityData } from '../Leaflet/helpers';
import {
  deflateMappingPaths,
  getCanonicalMappingPath,
  mappingPathToString,
  splitJoinedMappingPath,
} from '../WbPlanView/mappingHelpers';
import { MappingPath } from '../WbPlanView/Mapper';
import { findArrayDivergencePoint } from '../../utils/utils';

const fieldOrder: IR<{ readonly after: string }> = {
  'gbif:acceptedScientificName': { after: 'dwc:scientificName' },
  'dwc:datasetName': { after: 'dwc:specificEpithet' },
};

export function reorderBrokerFields<T>(mappedTable: IR<T>): IR<T> {
  let reorderedTable = mappedTable;
  Object.entries(fieldOrder)
    .filter(
      ([fieldName, position]) =>
        !(fieldName in reorderedTable) ||
        !('after' in position) ||
        !(position.after in reorderedTable)
    )
    .forEach(([fieldName, { after }]) => {
      const table = Object.entries(reorderedTable);
      const keys = Object.keys(reorderedTable);
      const currentPosition = keys.indexOf(fieldName);
      let targetPosition = keys.indexOf(after);
      const currentEntry = table.splice(currentPosition, 1)[0];
      if (currentPosition > targetPosition) targetPosition += 1;

      table.splice(targetPosition, 0, currentEntry);
      reorderedTable = Object.fromEntries(table);
    });

  return reorderedTable;
}

export function deflateLocalityData(localityData: LocalityData): LocalityData {
  const deflatedMappingPaths = deflateMappingPaths(
    Object.keys(localityData).map(splitJoinedMappingPath)
  );
  return Object.fromEntries(
    Object.values(localityData).map((value, index) => [
      mappingPathToString(deflatedMappingPaths[index]),
      value,
    ])
  );
}

/*
 * Separates locality data for given -to-many mapping path into separate
 * locality data objects.
 *
 * For example, given this input:
 * localityData = {
 *   'locality.collectingevents.#2.collectionobjects.#1.catalognumber': 123,
 *   'locality.collectingevents.#3.collectionobjects.#4.catalognumber': 231,
 *   'locality.localityname': 'Lawrence',
 * }
 * filterMappingPath = ['locality','collectingevents','#1','collectionobjects']
 *
 * The result is:
 * [
 *   {
 *     'locality.collectingevents.#2.collectionobjects.#1.catalognumber': 123,
 *     'locality.localityname': 'Lawrence',
 *   }
 *   {
 *     'locality.collectingevents.#3.collectionobjects.#4.catalognumber': 231,
 *     'locality.localityname': 'Lawrence',
 *   }
 * ]
 */
export function splitLocalityData(
  localityData: LocalityData,
  filterMappingPath: MappingPath
): RA<LocalityData> {
  const filter = getCanonicalMappingPath(filterMappingPath);
  const groups = Object.entries(localityData).reduce<
    R<R<Field<number | string>>>
  >(
    (groups, [mappingPathString, field]) => {
      const mappingPath = splitJoinedMappingPath(mappingPathString);
      const canonicalMappingPath = getCanonicalMappingPath(mappingPath);
      const divergence = findArrayDivergencePoint(canonicalMappingPath, filter);
      const key =
        divergence === -1
          ? ''
          : mappingPathToString(mappingPath.slice(0, divergence));
      groups[key] ??= {};
      groups[key][mappingPathToString(mappingPath.slice(divergence))] = field;
      return groups;
    },
    { '': {} }
  );

  return Object.entries(groups)
    .filter(([key]) => key !== '')
    .map(([groupKey, groupData]) =>
      deflateLocalityData({
        ...groups[''],
        ...Object.fromEntries(
          Object.entries(groupData).map(([mappingPathString, field]) => [
            mappingPathToString([
              ...splitJoinedMappingPath(groupKey),
              ...splitJoinedMappingPath(mappingPathString),
            ]),
            field,
          ])
        ),
      })
    );
}
