import React from 'react';

import { ajax } from '../ajax';
import { welcomeText } from '../localization/welcome';
import { getTreeDefinitionItems, treeRanksPromise } from '../treedefinitions';
import type { RA } from '../types';
import { useAsyncState } from './hooks';
import {
  getTitleGenerator,
  makeTreeMap,
  mergeNodes,
  pairNodes,
} from '../taxontileshelpers';

export function TaxonTiles(): JSX.Element {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
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
    const genusId = typeof genusRankId === 'number' ? genusRankId : undefined;
    const titleGenerator = getTitleGenerator(genusId);
    const chart = makeTreeMap(container, treeData.root);
    chart
      .attr('title', titleGenerator)
      .on('mouseover', (node) => setTitle(titleGenerator(node)));
    setTitle(treeData.root.name);
    // FIXME: add a chart destructor
  }, [container, genusRankId, treeData]);

  return (
    <div className="h-[473px] w-full text-xl flex relative">
      <p
        className="top-3 left-3 dark:bg-black opacity-80 absolute z-10 px-2 py-0 bg-white border"
        title={
          typeof treeData === 'object'
            ? welcomeText('taxonTilesDescription', treeData.threshold)
            : undefined
        }
      >
        {welcomeText('taxonTiles')}
      </p>
      {typeof title === 'string' && (
        <p className="top-3 right-3 dark:bg-black opacity-80 absolute z-10 px-2 py-0 bg-white border">
          {title}
        </p>
      )}
      <div ref={setContainer} className="relative flex-1 w-full" />
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
            [
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
            data.map((cell) => ({
              id: cell[0],
              rankId: cell[1],
              parentId: cell[2],
              name: cell[3],
              count: cell[4],
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
