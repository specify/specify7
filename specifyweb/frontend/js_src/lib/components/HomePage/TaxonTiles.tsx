import React from 'react';
import _ from 'underscore';

import { useAsyncState } from '../../hooks/useAsyncState';
import { welcomeText } from '../../localization/welcome';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { schema } from '../DataModel/schema';
import {
  getTreeDefinitionItems,
  treeRanksPromise,
} from '../InitialContext/treeRanks';
import {
  getTitleGenerator,
  makeTreeMap,
  mergeNodes,
  pairNodes,
} from './taxonTileHelpers';

export function TaxonTiles(): JSX.Element {
  const [container, setContainer] = React.useState<SVGElement | null>(null);
  const genusRankId = useGenusRankId();
  const treeData = useTreeData();

  const [title, setTitle] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (
      container === null ||
      genusRankId === undefined ||
      treeData === undefined
    )
      return undefined;

    const resizeObserver = new ResizeObserver(_.debounce(render, 50));

    resizeObserver.observe(container);

    const genusId = typeof genusRankId === 'number' ? genusRankId : undefined;
    const titleGenerator = getTitleGenerator(genusId);

    let chart: ReturnType<typeof makeTreeMap> | undefined = undefined;

    function render(): void {
      if (container === null || treeData === undefined) return;
      void chart?.remove();
      chart = makeTreeMap(container, treeData.root);
      chart
        .attr('title', titleGenerator)
        .on('mouseover', (_event, node) => setTitle(titleGenerator(node)))
        .on('click', (_event, node) =>
          window.open(
            `/specify/query/fromtree/taxon/${node.data.id}/`,
            '_blank'
          )
        );
    }
    render();

    setTitle(treeData.root.name);
    return () => {
      void chart?.remove();
      resizeObserver.disconnect();
    };
  }, [container, genusRankId, treeData]);

  return (
    <div className="relative flex h-[473px] w-full text-xl">
      <p
        className="absolute top-3 left-3 z-10 border bg-white px-2 py-0 opacity-80 dark:bg-black"
        title={
          typeof treeData === 'object'
            ? welcomeText.taxonTilesDescription({
                collectionObjectTable: schema.models.CollectionObject.label,
                count: treeData.threshold,
              })
            : undefined
        }
      >
        {welcomeText.taxonTiles()}
      </p>
      {typeof title === 'string' && (
        <p className="absolute top-3 right-3 z-10 border bg-white px-2 py-0 opacity-80 dark:bg-black">
          {title}
        </p>
      )}
      <svg
        className="w-full flex-1 bg-black dark:bg-neutral-700"
        ref={setContainer}
      />
    </div>
  );
}

function useGenusRankId(): number | false | undefined {
  const [genusRankId] = useAsyncState(
    React.useCallback(
      async () =>
        treeRanksPromise.then(
          () =>
            getTreeDefinitionItems('Taxon', false)!.find(
              (item) => (item.name || item.title)?.toLowerCase() === 'genus'
            )?.rankId ?? false
        ),
      []
    ),
    false
  );
  return genusRankId;
}

function useTreeData(): ReturnType<typeof mergeNodes> | undefined {
  const [treeData] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<
          RA<
            readonly [
              id: number,
              rankId: number,
              parentId: number,
              name: string,
              count: number
            ]
          >
        >('/barvis/taxon_bar/', {
          headers: { Accept: 'application/json' },
        })
          .then(({ data }) =>
            data.map(([id, rankId, parentId, name, count]) => ({
              id,
              rankId,
              parentId,
              name,
              count,
            }))
          )
          .then(pairNodes)
          .then(mergeNodes),
      []
    ),
    false
  );
  return treeData;
}
