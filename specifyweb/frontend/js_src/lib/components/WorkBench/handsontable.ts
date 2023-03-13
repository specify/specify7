import type Handsontable from 'handsontable';

import { getCache } from '../../utils/cache';
import { writable } from '../../utils/types';
import { schema } from '../DataModel/schema';
import { getUserPref } from '../UserPreferences/helpers';
import type { WbMapping } from './mapping';
import type { WbPickLists } from './pickLists';
import { Dataset } from '../WbPlanView/Wrapped';

export function configureHandsontable(
  hot: Handsontable,
  mappings: WbMapping | undefined,
  dataset: Dataset,
  pickLists: WbPickLists
): void {
  identifyDefaultValues(hot, mappings);
  identifyPickLists(hot, pickLists);
  setSort(hot, dataset);
}

function identifyDefaultValues(
  hot: Handsontable,
  mappings: WbMapping | undefined
): void {
  if (mappings === undefined) return;
  hot.updateSettings({
    columns: (index) => ({ placeholder: mappings.defaultValues[index] }),
  });
}

function identifyPickLists(hot: Handsontable, pickLists: WbPickLists): void {
  hot.updateSettings({
    cells: (_physicalRow, physicalCol, _property) =>
      physicalCol in pickLists
        ? {
            type: 'autocomplete',
            source: writable(pickLists[physicalCol].items),
            strict: pickLists[physicalCol].readOnly,
            allowInvalid: true,
            filter:
              getUserPref('workBench', 'editor', 'filterPickLists') === 'none',
            filteringCaseSensitive:
              getUserPref('workBench', 'editor', 'filterPickLists') ===
              'case-sensitive',
            sortByRelevance: false,
            trimDropdown: false,
          }
        : { type: 'text' },
  });
}

function setSort(hot: Handsontable, dataset: Dataset): void {
  const sortConfig = getCache(
    'workBenchSortConfig',
    `${schema.domainLevelIds.collection}_${dataset.id}`
  );
  if (!Array.isArray(sortConfig)) return;
  const visualSortConfig = sortConfig.map(({ physicalCol, ...rest }) => ({
    ...rest,
    column: hot.toVisualColumn(physicalCol),
  }));
  getHotPlugin(hot, 'multiColumnSorting').sort(visualSortConfig);
}

/**
 * Cached retrieved HOT plugins
 * This improved performance in earlier versions
 * REFACTOR: check if this is still necessary
 */
const hotPlugins = new WeakMap<
  Handsontable,
  // eslint-disable-next-line functional/prefer-readonly-type
  {
    [key in keyof Handsontable.PluginsCollection]?:
      | Handsontable.PluginsCollection[key]
      | undefined;
  }
>();

export function getHotPlugin<NAME extends keyof Handsontable.PluginsCollection>(
  hot: Handsontable,
  pluginName: NAME
): Handsontable.PluginsCollection[NAME] {
  let plugins = hotPlugins.get(hot);
  if (plugins === undefined) {
    plugins = {};
    hotPlugins.set(hot, plugins);
  }
  if (plugins[pluginName] === undefined)
    plugins[pluginName] = hot.getPlugin(pluginName);
  return plugins[pluginName]!;
}
