import type { RA } from '../../utils/types';
import type { MappingPath } from '../WbPlanView/Mapper';

/* These fields should be present for locality to be mappable */
export const requiredLocalityColumns: RA<string> = [
  'locality.latitude1',
  'locality.longitude1',
];

// All fields that can affect how locality is mapped
export const mappingLocalityColumns: RA<string> = [
  ...requiredLocalityColumns,
  'locality.latitude2',
  'locality.longitude2',
  'locality.latlongtype',
  'locality.latlongaccuracy',
];

// Fields required to map locality in query builder
export const queryMappingLocalityColumns: RA<string> = [
  ...mappingLocalityColumns,
  'locality.localityId',
];

/**
 * The fields to display in a Leaflet pin's pop-up box
 * `pathToRelationship` is a mappingPath that shows how to get from
 * the table that contains the field to the locality table and vice versa.
 * To-many relationships in `pathToRelationship` should be represented as '#1'
 * `pathToFields` is an array of mappingPaths that shows a path to a field
 * Both `pathToRelationship` and each `pathToFields` should begin with the
 * same table name.
 * The order of fields in this array would determine the order in the pop-up
 * window
 */
export type LocalityPinFields = {
  readonly pathToRelationship: MappingPath;
  readonly pathsToFields: RA<MappingPath>;
};

/**
 * Applies only to the Leaflet map on the Locality form and the CO
 *  Lifemapper badge.
 * Defined the maximum number of -to-many records to fetch at any point of the
 *   mapping path.
 * Leaflet map in the workbench does not have such limit.
 */
export const MAX_TO_MANY_INDEX = 10;

/*
 * FEATURE: allow configuring this
 *   See https://github.com/specify/specify7/issues/2431
 */
/**
 * NOTE:
 * Leaflet map on the Locality form and the CO Lifemapper badge is going
 * to display `$rank > fullname` for a single rank that is attached to a given
 * record, instead of `$rank > name` for each rank specified in this definition.
 *
 * Similarly, those maps are going to display `agent > fullname`, instead of
 * `agent > lastname`
 *
 */
export const localityPinFields: RA<LocalityPinFields> = [
  {
    pathToRelationship: ['CollectionObject', 'collectingEvent', 'locality'],
    pathsToFields: [
      ['CollectionObject', 'determinations', '#1', 'taxon', '$Genus', 'name'],
      ['CollectionObject', 'determinations', '#1', 'taxon', '$Species', 'name'],
      [
        'CollectionObject',
        'determinations',
        '#1',
        'taxon',
        '$Subspecies',
        'name',
      ],
      ['CollectionObject', 'catalogNumber'],
      ['CollectionObject', 'fieldNumber'],
    ],
  },
  {
    pathToRelationship: ['Locality', 'collectingEvents', '#1'],
    pathsToFields: [
      [
        'Locality',
        'collectingEvents',
        '#1',
        'collectionObjects',
        '#1',
        'determinations',
        '#1',
        'taxon',
        '$Genus',
        'name',
      ],
      [
        'Locality',
        'collectingEvents',
        '#1',
        'collectionObjects',
        '#1',
        'determinations',
        '#1',
        'taxon',
        '$Species',
        'name',
      ],
      [
        'Locality',
        'collectingEvents',
        '#1',
        'collectionObjects',
        '#1',
        'determinations',
        '#1',
        'taxon',
        '$Subspecies',
        'name',
      ],
      [
        'Locality',
        'collectingEvents',
        '#1',
        'collectionObjects',
        '#1',
        'catalogNumber',
      ],
      ['Locality', 'collectingEvents', '#1', 'stationFieldNumber'],
      [
        'Locality',
        'collectingEvents',
        '#1',
        'collectionObjects',
        '#1',
        'fieldNumber',
      ],
      [
        'Locality',
        'collectingEvents',
        '#1',
        'collectors',
        '#1',
        'agent',
        'lastName',
      ],
      ['Locality', 'collectingEvents', '#1', 'startDate'],
    ],
  },
  {
    pathToRelationship: ['Locality'],
    pathsToFields: [
      ['Locality', 'localityName'],
      ['Locality', 'latitude1'],
      ['Locality', 'longitude1'],
      ['Locality', 'latitude2'],
      ['Locality', 'longitude2'],
      ['Locality', 'latLongType'],
      ['Locality', 'latLongAccuracy'],
      ['Locality', 'geography', '$Country', 'name'],
      ['Locality', 'geography', '$State', 'name'],
      ['Locality', 'geography', '$County', 'name'],
    ],
  },
  {
    pathToRelationship: ['CollectingEvent', 'locality'],
    pathsToFields: [
      ['CollectingEvent', 'collectors', '#1', 'agent', 'lastName'],
      ['CollectingEvent', 'startDate'],
      ['CollectingEvent', 'stationFieldNumber'],
    ],
  },
];
