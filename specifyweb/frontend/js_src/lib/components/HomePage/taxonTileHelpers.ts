import type { HierarchyNode } from 'd3';
import { hierarchy, scaleOrdinal, select, treemap, treemapBinary } from 'd3';

import type { RA, RR, WritableArray } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { index, sortFunction } from '../../utils/utils';
import { softFail } from '../Errors/Crash';

type Node = {
  readonly id: number;
  readonly rankId: number;
  readonly parentId: number | null;
  readonly name: string;
  readonly count: number;
};

export function pairNodes(nodes: RA<Node>): RA<PairedNode> {
  const pairedNodes: RA<PairedNode> = nodes.map((cell) => ({
    ...cell,
    children: [],
  }));

  const indexedCells = index(pairedNodes);

  pairedNodes.forEach((node) => {
    if (typeof node?.parentId !== 'number') return;
    const parent = indexedCells[node.parentId];
    if (typeof parent === 'object') parent.children?.push(node);
    else console.warn('Taxon node with missing parent', { node });
  });

  return pairedNodes;
}

type PairedNode = Node & {
  // eslint-disable-next-line functional/prefer-readonly-type
  children: WritableArray<PairedNode> | undefined;
};

/**
 * Limit the number of tree squares to ~1000.
 * This is achieved by merging nodes that have fewer children than
 * the threshold. Such nodes are absorbed into their parent.
 */
export function mergeNodes(nodes: RA<PairedNode>): {
  readonly root: PairedNode;
  readonly threshold: number;
} {
  const threshold = calculateThreshold(nodes);
  const root = findRoot(nodes);
  pullUp(root, threshold);
  return { root, threshold };
}

/**
 * Calculate a threshold for a minimum number of children a node must have so
 * as not to be absorbed into the parent tile. The goal of the threshold is to
 * limit the number of nodes to ~1000.
 */
function calculateThreshold(nodes: RA<PairedNode>): number {
  const counts = Object.entries(
    countOccurrences(nodes.map(({ count }) => count))
  ).reverse();
  let count = 0;
  let threshold = Number.POSITIVE_INFINITY;
  for (const [childrenCount, nodeCount] of counts) {
    threshold = Number.parseInt(childrenCount);
    count += nodeCount;
    if (count >= TILE_LIMIT) break;
  }
  return threshold;
}

/** Calculate the number of occurrences of a items in an array */
const countOccurrences = (raw: RA<number>): RR<number, number> =>
  raw.reduce<Record<number, number>>((counts, occurrence) => {
    counts[occurrence] ??= 0;
    counts[occurrence] += 1;
    return counts;
  }, {});

/**
 * By not rendering small nodes, performance is improved, and the tiles look
 * nicer
 */
const TILE_LIMIT = 1000;

function findRoot(nodes: RA<PairedNode>): PairedNode {
  const roots = nodes.filter(({ parentId }) => parentId === null);
  if (roots.length > 1)
    softFail(new Error('Detected more than one tree root'), { roots });
  return roots[0];
}

function pullUp(node: PairedNode, threshold: number): number {
  const children = [];
  let thisCount = node.count;
  let totalCount = node.count;
  node.children?.forEach((child) => {
    const childCount = pullUp(child, threshold);
    totalCount += childCount;
    // Absorb children below the threshold
    if (childCount < threshold) thisCount += childCount;
    else children.push(child);
  });
  if (thisCount > threshold)
    children.push({
      ...node,
      count: thisCount,
      children: undefined,
    });
  node.children = children;
  return totalCount;
}

export function makeTreeMap(container: SVGElement, rawRoot: PairedNode) {
  const root = hierarchy(rawRoot)
    .sum(({ count }) => count)
    .sort(sortFunction(({ data }) => data.id));

  const svg = select(container);

  treemap()
    .tile(treemapBinary)
    .size([container.clientWidth, container.clientHeight])
    .round(true)(root);

  const tileColors = [
    '#b3d5e7',
    '#91cf93',
    '#fec08a',
    '#828282',
    '#ed794a',
    '#62b677',
    '#9188c1',
    '#6199ca',
    '#e1e1e1',
    '#b2d5e7',
  ];

  const color = scaleOrdinal().range(tileColors);
  return svg
    .selectAll('rect')
    .data(root.leaves())
    .enter()
    .append('rect')
    .attr('x', (d) => nodeRead(d, 'x0'))
    .attr('y', (d) => nodeRead(d, 'y0'))
    .attr('width', (d) => nodeRead(d, 'x1') - nodeRead(d, 'x0'))
    .attr('height', (d) => nodeRead(d, 'y1') - nodeRead(d, 'y0'))
    .attr(
      'class',
      'cursor-pointer stroke-2 stroke-white dark:stroke-neutral-700'
    )
    .attr('fill', (d) => color(d.data.name) as string);
}

/** Fix for incorrect typing for d3.HierarchyNode */
const nodeRead = (
  node: HierarchyNode<PairedNode>,
  key: 'x0' | 'x1' | 'y0' | 'y1'
): number => (node as unknown as Record<typeof key, number>)[key];

export const getTitleGenerator =
  (
    genusRankId: number | undefined
  ): ((node: HierarchyNode<PairedNode>) => string) =>
  (node) =>
    filterArray(recurseTreeTiles(node, genusRankId) ?? []).join(' ') ||
    node.data.name;

const recurseTreeTiles = (
  node: HierarchyNode<PairedNode>,
  genusRankId: number | undefined
): RA<string | undefined> | undefined =>
  genusRankId === undefined || node.data.rankId >= genusRankId
    ? [
        ...(node.parent === null
          ? []
          : (recurseTreeTiles(node.parent, genusRankId) ?? [])),
        Array.isArray(node.children) ? node.data.name : undefined,
      ]
    : undefined;
