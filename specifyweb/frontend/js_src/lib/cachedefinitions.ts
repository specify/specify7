/**
 * Typings for the cache buckets
 *
 * @module
 */

import type hot from 'handsontable';

import type { SortConfig } from './components/common';
import type { Query } from './components/toolbar/query';
import type { SearchPreferences } from './components/wbadvancedsearch';
import type { LeafletCacheSalt, MarkerLayerName } from './leaflet';
import type { R, RA } from './types';
import type {
  DataModelListOfTables,
  DataModelRanks,
  DataModelTables,
  OriginalRelationships,
  TreeRankData,
} from './wbplanviewmodelfetcher';

/** The types of cached values are defined here */
export type CacheDefinitions = {
  readonly wbPlanViewUi: {
    readonly showHiddenTables: boolean;
    readonly showHiddenFields: boolean;
    readonly showMappingView: boolean;
    readonly mappingViewHeight: number;
  };
  readonly leaflet: {
    readonly // Remembers the selected base layer
    [Property in `currentLayer${LeafletCacheSalt}`]: string;
  } & {
    readonly // Remembers the chosen overlays (markers/polygons/boundaries/...)
    [Property in `show${Capitalize<MarkerLayerName>}`]: boolean;
  };
  readonly wbPlanViewDataModel: {
    // Data on the fields in the tables that are included in wbplanview
    readonly tables: DataModelTables;
    // List of base tables to be shown on the base table selection screen
    readonly listOfBaseTables: DataModelListOfTables;
    // List of tree ranks for each table
    readonly ranks: DataModelRanks;
    // The name of the root rank for each table (Life, Storage, Earth, ...)
    readonly rootRanks: R<[string, TreeRankData]>;
    /*
     * Preserves the original relationship type for a fields that had it's
     * relationship type changed though aliasRelationshipTypes object.
     */
    readonly originalRelationships: OriginalRelationships;
  };
  readonly wbPlanViewNavigatorTables: {
    readonly // Output of getMappingLineData()
    [key in string]: string;
  };
  readonly workbench: {
    readonly searchProperties: SearchPreferences;
  };
  readonly tree: {
    readonly [key in `collapsedRanks${string}`]: RA<number>;
  };
  readonly workBenchSortConfig: {
    readonly [key in `${number}_${number}`]: RA<hot.columnSorting.Config>;
  };
  readonly sortConfig: {
    readonly listOfQueries: SortConfig<keyof Query & ('name' | 'dateCreated')>;
    readonly listOfDataSets: SortConfig<
      'name' | 'dateCreated' | 'dateUploaded'
    >;
  };
  readonly common: {
    readonly listOfQueryTables: RA<string>;
  };
};

export const safeToTrim: RA<keyof CacheDefinitions> = [
  'wbPlanViewDataModel',
  'wbPlanViewNavigatorTables',
];
