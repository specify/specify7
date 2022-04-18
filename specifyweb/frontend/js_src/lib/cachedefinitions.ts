/**
 * Typings for the cache buckets
 *
 * @module
 */

import type hot from 'handsontable';
import type { State } from 'typesafe-reducer';

import type { SortConfig } from './components/common';
import type { SearchPreferences } from './components/wbadvancedsearch';
import type { Attachment, SpQuery, Tables } from './datamodel';
import type { LeafletCacheSalt, MarkerLayerName } from './leaflet';
import type { RA } from './types';

/** The types of cached values are defined here */
export type CacheDefinitions = {
  readonly forms: {
    readonly printOnSave: boolean;
  };
  readonly wbPlanViewUi: {
    readonly showHiddenTables: boolean;
    readonly showHiddenFields: boolean;
    readonly showMappingView: boolean;
    readonly mappingViewHeight: number;
  };
  readonly queryBuilder: {
    readonly showHiddenFields: boolean;
    readonly mappingViewHeight: number;
  };
  readonly leaflet: {
    // eslint-disable-next-line multiline-comment-style, capitalized-comments
    // prettier-ignore
    // Remembers the selected base layer
    readonly [Property in `currentLayer${LeafletCacheSalt}`]: string;
  } & {
    // eslint-disable-next-line multiline-comment-style, capitalized-comments
    // prettier-ignore
    // Remembers the chosen overlays (markers/polygons/boundaries/...)
    readonly [Property in `show${Capitalize<MarkerLayerName>}`]: boolean;
  };
  readonly workbench: {
    readonly searchProperties: SearchPreferences;
  };
  readonly tree: {
    readonly [key in `collapsedRanks${string}`]: RA<number>;
  } & {
    readonly [key in `conformation${string}`]: string;
  };
  readonly workBenchSortConfig: {
    // eslint-disable-next-line multiline-comment-style, capitalized-comments
    // prettier-ignore
    // {Collection ID}_{Dataset ID}
    readonly [key in `${number}_${number}`]: RA<hot.columnSorting.Config>;
  };
  readonly sortConfig: {
    readonly listOfQueries: SortConfig<
      keyof SpQuery['fields'] & ('name' | 'timestampCreated')
    >;
    readonly listOfDataSets: SortConfig<
      'name' | 'dateCreated' | 'dateUploaded'
    >;
  };
  readonly attachments: {
    readonly sortOrder:
      | keyof Attachment['fields']
      | `-${keyof Attachment['fields']}`;
    readonly filter:
      | State<'all'>
      | State<'unused'>
      | State<'byTable', { readonly tableName: keyof Tables }>;
    readonly scale: number;
  };
  readonly geoLocate: {
    readonly width: number;
    readonly height: number;
  };
};
