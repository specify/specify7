import type { IR } from '../../utils/types';
import type { LocalityData } from '../Leaflet/helpers';
import {
  deflateMappingPaths,
  mappingPathToString,
  splitJoinedMappingPath,
} from '../WbPlanView/mappingHelpers';

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
