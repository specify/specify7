import type Leaflet from 'leaflet';
import React from 'react';

import { fetchCollection } from '../collection';
import type { Locality, Tables } from '../datamodel';
import { formatLocalityData } from '../leaflet';
import type { LocalityData } from '../leafletutils';
import type { SpecifyResource } from '../legacytypes';
import { fetchLocalityDataFromLocalityResource } from '../localityrecorddataextractor';
import { commonText } from '../localization/common';
import type { QueryFieldSpec } from '../queryfieldspec';
import type { SpecifyModel } from '../specifymodel';
import type { RA, WritableArray } from '../types';
import { filterArray } from '../types';
import { findLocalityColumnsInDataSet } from '../wblocalitydataextractor';
import { defaultColumnOptions } from '../wbplanviewlinesgetter';
import type { SplitMappingPath } from '../wbplanviewmappinghelper';
import {
  mappingPathToString,
  splitJoinedMappingPath,
} from '../wbplanviewmappinghelper';
import { Button } from './basic';
import { useAsyncState, useBooleanState } from './hooks';
import { LeafletMap } from './leaflet';
import { useSelectedResults } from './querytoforms';
import { deserializeResource } from './resource';
import { MappingPath } from './wbplanviewmapper';
import { schema } from '../schema';

export function QueryToMap({
  results,
  selectedRows,
  model,
  fieldSpecs,
}: {
  readonly results: RA<RA<number | string | null>>;
  readonly selectedRows: ReadonlySet<number>;
  readonly model: SpecifyModel;
  readonly fieldSpecs: RA<QueryFieldSpec>;
}): JSX.Element | null {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const ids = useSelectedResults(results, selectedRows, isOpen) as RA<number>;
  const localityMappings = useLocalityMappings(model.name, fieldSpecs);
  return localityMappings.length === 0 ? null : (
    <>
      <Button.Small disabled={results.length === 0} onClick={handleOpen}>
        {commonText('geoMap')}
      </Button.Small>
      {isOpen && ids.length > 0 ? (
        <Dialog
          ids={ids}
          localityMappings={localityMappings}
          onClose={handleClose}
        />
      ) : undefined}
    </>
  );
}

function useLocalityMappings(
  tableName: keyof Tables,
  fieldSpecs: RA<QueryFieldSpec>
): RA<string> {
  return React.useMemo(
    () =>
      findLocalityColumnsInDataSet(
        tableName,
        fieldSpecsToMappingPaths(fieldSpecs)
      ).map((localityColumns) => {
        const pathToLocalityField = splitJoinedMappingPath(
          localityColumns['locality.latitude1']
        );
        const pathToLocality = pathToLocalityField.slice(0, -1);
        const pathFromLocality = reverseMappingPath(tableName, pathToLocality);
        if (pathFromLocality === undefined)
          throw new Error(
            'Unable to find a reverse mapping from locality table'
          );
        const pathFromLocalityToId = [...pathFromLocality, 'id'];
        return pathFromLocalityToId.join('__');
      }),
    [tableName, fieldSpecs]
  );
}

// REFACTOR: reuse this utility in other places
function reverseMappingPath(
  tableName: keyof Tables,
  mappingPath: MappingPath
): MappingPath | undefined {
  const model = schema.models[tableName];
  const path = mappingPath
    .map((_part, index) => {
      const field = model.getField(mappingPath.slice(0, index + 1).join('.'))!;
      return field.isRelationship ? field.otherSideName : field.name;
    })
    .reverse();
  // Check if reverse mapping path exists
  return path.includes(undefined) ? undefined : filterArray(path);
}

const fieldSpecsToMappingPaths = (
  fieldSpecs: RA<QueryFieldSpec>
): RA<SplitMappingPath> =>
  fieldSpecs
    .map((fieldSpec) => fieldSpec.toMappingPath())
    .map((mappingPath) => ({
      headerName: mappingPathToString(mappingPath),
      mappingPath,
      columnOptions: defaultColumnOptions,
    }));

function Dialog({
  ids,
  localityMappings,
  onClose: handleClose,
}: {
  readonly ids: RA<number>;
  readonly localityMappings: RA<string>;
  readonly onClose: () => void;
}): JSX.Element | null {
  const localities = useLocalities(ids, localityMappings);
  const localityPoints = React.useMemo(
    () => localities?.map(({ localityData }) => localityData),
    [localities]
  );
  const fullLocalityData = React.useRef<
    WritableArray<LocalityData | false | undefined>
  >(
    // Creating a sparse array
    /* eslint-disable-next-line unicorn/no-new-array */
    new Array(ids.length)
  );
  return Array.isArray(localityPoints) ? (
    <LeafletMap
      localityPoints={localityPoints}
      /*
       * FEATURE: show "loading" while fetching more data (here, and in other
       *   places that use map markers
       */
      markerClickCallback={async (index, { target: marker }): Promise<void> =>
        (fullLocalityData.current[index] === undefined
          ? fetchLocalityDataFromLocalityResource(localities![index].resource)
          : Promise.resolve(fullLocalityData.current[index])
        ).then((localityData) => {
          fullLocalityData.current[index] = localityData;
          if (localityData !== false)
            (marker as Leaflet.Marker)
              .getPopup()
              ?.setContent(formatLocalityData(localityData!, undefined, true));
        })
      }
      onClose={handleClose}
    />
  ) : null;
}

type Entry = {
  readonly resource: SpecifyResource<Locality>;
  readonly localityData: LocalityData;
};

function useLocalities(
  ids: RA<number>,
  localityMappings: RA<string>
): RA<Entry> | undefined {
  return useAsyncState(
    React.useCallback(
      async () =>
        Promise.all(
          localityMappings.map(async (mapping) =>
            fetchCollection(
              'Locality',
              { limit: 0 },
              { [`${mapping}__in`]: ids.join(',') }
            ).then(({ records }) =>
              records
                .map(deserializeResource)
                .map(async (resource) =>
                  fetchLocalityDataFromLocalityResource(resource, true).then(
                    (localityData) => ({ resource, localityData })
                  )
                )
            )
          )
        )
          .then(async (results) => Promise.all(results.flat()))
          .then((results) =>
            results.filter(
              (entry): entry is Entry => entry.localityData !== false
            )
          ),
      [ids, localityMappings]
    ),
    true
  )[0];
}
