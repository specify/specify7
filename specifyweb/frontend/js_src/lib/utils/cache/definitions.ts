/**
 * Typings for the cache categories
 *
 * @module
 */

import type hot from 'handsontable';
import type { State } from 'typesafe-reducer';

import type { AppResourcesConformation } from '../../components/AppResources/Aside';
import type { AppResourceFilters } from '../../components/AppResources/filtersHelpers';
import type { AnyTree } from '../../components/DataModel/helperTypes';
import type {
  Attachment,
  SpQuery,
  Tables,
} from '../../components/DataModel/types';
import type {
  pageSizes,
  Paginators,
} from '../../components/Molecules/Paginator';
import type { SortConfig } from '../../components/Molecules/Sorting';
import type { PartialPreferences } from '../../components/Preferences/BasePreferences';
import type { collectionPreferenceDefinitions } from '../../components/Preferences/CollectionDefinitions';
import type { userPreferenceDefinitions } from '../../components/Preferences/UserDefinitions';
import type { Conformations } from '../../components/TreeView/helpers';
import type { WbSearchPreferences } from '../../components/WorkBench/AdvancedSearch';
import type { IR, RA, RR } from '../types';
import { ensure } from '../types';

/** The types of cached values are defined here */
export type CacheDefinitions = {
  readonly header: {
    readonly isCollapsed: boolean;
  };
  readonly general: {
    readonly clearCacheOnException: boolean;
  };
  readonly forms: {
    readonly readOnlyMode: boolean;
    readonly useFieldLabels: boolean;
  };
  readonly wbPlanViewUi: {
    /** Whether to show less commonly used tables when selected base table */
    readonly showHiddenTables: boolean;
    /** Whether to show fields hidden in schema in the mapper */
    readonly showHiddenFields: boolean;
    /** Whether to show Mapping Editor in the mapper */
    readonly showMappingView: boolean;
    readonly mappingViewHeight: number;
  };
  readonly wbImport: {
    readonly hasHeader: boolean;
  };
  readonly queryBuilder: {
    /** Whether to show fields hidden in schema in the query builder */
    readonly showHiddenFields: boolean;
    readonly showMappingView: boolean;
    readonly mappingViewHeight: number;
  };
  readonly schemaConfig: {
    readonly showHiddenTables: boolean;
    readonly sortByHiddenFields: boolean;
  };
  /** Remembers the chosen overlays (markers/polygons/boundaries/...) */
  readonly leafletOverlays: IR<boolean>;
  readonly leafletCurrentLayer: IR<string>;
  readonly workbench: {
    readonly searchProperties: WbSearchPreferences;
  };
  readonly coordinateConverter: {
    readonly includeSymbols: boolean;
    readonly applyAll: boolean;
  };
  readonly tree: {
    /** Collapsed ranks in a given tree */
    readonly [key in `collapsedRanks${AnyTree['tableName']}`]: RA<number>;
  } & {
    /** Open nodes in a given tree */
    readonly [key in `conformations${AnyTree['tableName']}`]: Conformations;
  } & {
    readonly [key in `definition${AnyTree['tableName']}`]: number;
  } & {
    readonly [key in `focusPath${AnyTree['tableName']}`]: RA<number>;
  } & {
    readonly hideEmptyNodes: boolean;
    readonly isSplit: boolean;
    readonly isHorizontal: boolean;
  };
  readonly workBenchSortConfig: {
    /**
     * WorkBench column sort setting in a given dataset
     * {Collection ID}_{Dataset ID}
     */
    readonly [key in `${number}_${number}`]: RA<
      Pick<hot.plugins.ColumnSorting.Config, 'column' | 'sortOrder'> & {
        readonly physicalCol: number;
      }
    >;
  };
  readonly sortConfig: {
    readonly [KEY in keyof SortConfigs]: SortConfig<SortConfigs[KEY]>;
  };
  readonly attachments: {
    readonly sortOrder:
      | `-${string & keyof Attachment['fields']}`
      | (string & keyof Attachment['fields']);
    readonly filter:
      | State<'all'>
      | State<'byTable', { readonly tableName: keyof Tables }>
      | State<'unused'>;
    /** Attachments grid scale */
    readonly scale: number;
  };
  /** Remember dialog window dimensions and positions from the last session */
  readonly dialogs: {
    readonly sizes: IR<readonly [width: number, height: number]>;
    readonly positions: IR<readonly [x: number, y: number]>;
  };
  readonly userPreferences: {
    /**
     * User preferences are cached here, because, unlike most other initial
     * context resources, preferences are not cached by the browser, since they
     * are fetched using the standard resource API.
     * Additionally, since preferences contain the schema language to load,
     * schema can not be fetched until preferences are fetched.
     * Finally, a splash screen may be rendered before preferences are fetched,
     * causing Specify to flash user its white mode, or font size to change
     * on the fly.
     */
    readonly cached: PartialPreferences<typeof userPreferenceDefinitions>;
    /**
     * Admins may change default preferences. These defaults override original
     * defaults for items for which these are provided
     */
    readonly defaultCached: PartialPreferences<
      typeof userPreferenceDefinitions
    >;
  };
  readonly collectionPreferences: {
    readonly cached: PartialPreferences<typeof collectionPreferenceDefinitions>;
  };
  readonly securityTool: {
    readonly policiesLayout: 'horizontal' | 'vertical';
    readonly previewCollapsed: boolean;
    readonly advancedPreviewCollapsed: boolean;
    readonly institutionPoliciesExpanded: boolean;
  };
  readonly appResources: {
    readonly conformation: RA<AppResourcesConformation>;
    readonly filters: AppResourceFilters;
    readonly showHiddenTables: boolean;
  };
  readonly pageSizes: RR<Paginators, (typeof pageSizes)[number]>;
  readonly formEditor: {
    readonly layout: 'horizontal' | 'vertical';
  };
  readonly merging: {
    readonly showMatchingFields: boolean;
    readonly warningDialog: boolean;
  };

  readonly statistics: {
    readonly statsValue: RA<
      RA<RA<{ readonly itemName: string; readonly value: number | string }>>
    >;
  };
};

export type SortConfigs = {
  readonly listOfQueries: keyof SpQuery['fields'] &
    ('name' | 'timestampCreated' | 'timestampModified');
  readonly listOfRecordSets: 'name' | 'timestampCreated';
  readonly listOfDataSets: 'dateCreated' | 'dateUploaded' | 'name';
  readonly listOfReports: 'name' | 'timestampCreated';
  readonly listOfLabels: 'name' | 'timestampCreated';
  readonly schemaViewerFields:
    | 'databaseColumn'
    | 'description'
    | 'isHidden'
    | 'isReadOnly'
    | 'isRequired'
    | 'label'
    | 'length'
    | 'name'
    | 'type';
  readonly schemaViewerRelationships:
    | 'databaseColumn'
    | 'description'
    | 'isDependent'
    | 'isHidden'
    | 'isReadOnly'
    | 'isRequired'
    | 'label'
    | 'name'
    | 'otherSideName'
    | 'relatedTable'
    | 'type';
  readonly schemaViewerTables:
    | 'fieldCount'
    | 'isHidden'
    | 'isSystem'
    | 'label'
    | 'name'
    | 'relationshipCount'
    | 'tableId';
  readonly attachmentImport:
    | 'fileSize'
    | 'matchedId'
    | 'selectedFileName'
    | 'status';
  readonly attachmentDatasets:
    | 'name'
    | 'timestampCreated'
    | 'timestampModified';
  readonly listOfBatchEditDataSets: 'dateCreated' | 'dateUploaded' | 'name';
};

// Some circular types can't be expressed without interfaces
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface CacheValueDict extends IR<CacheValue> {}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface CacheValues extends RA<CacheValue> {}

type CacheValue =
  | CacheValueDict
  | CacheValues
  | boolean
  | number
  | string
  | null
  | undefined;

/**
 * This will trigger a TypeScript type error if any cache definition
 * contains a value that is not JSON-Serializable.
 */
ensure<IR<IR<CacheValue>>>()({} as unknown as CacheDefinitions);
