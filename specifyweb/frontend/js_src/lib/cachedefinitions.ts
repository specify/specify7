import type { AutoMapperResults } from './automapper';
import type { SearchPreferences } from './components/wbadvancedsearch';
import type { IR, R } from './components/wbplanview';
import type { LeafletCacheSalt, MarkerLayerName } from './leaflet';
import type {
  DataModelListOfTables,
  DataModelRanks,
  DataModelTables,
  OriginalRelationships,
} from './wbplanviewmodelfetcher';

// The types of cached values are defined here
export type Cachedefinitions = IR<IR<unknown>> & {
  readonly 'wbplanview-ui': {
    readonly showHiddenTables: boolean;
    readonly showHiddenFields: boolean;
    readonly showMappingView: boolean;
    readonly mappingViewHeight: number;
  };
  readonly 'wbplanview-automapper': {
    readonly [key in string]: AutoMapperResults;
  };
  readonly leaflet: {
    readonly [Property in `currentLayer${LeafletCacheSalt}`]: string;
  } &
    {
      readonly [Property in `show${Capitalize<MarkerLayerName>}`]: boolean;
    };
  readonly 'wbplanview-datamodel': {
    readonly tables: DataModelTables;
    readonly listOfBaseTables: DataModelListOfTables;
    readonly ranks: DataModelRanks;
    readonly rootRanks: R<string>;
    readonly originalRelationships: OriginalRelationships;
  };
  readonly workbench: {
    readonly 'search-properties': SearchPreferences;
  };
};
