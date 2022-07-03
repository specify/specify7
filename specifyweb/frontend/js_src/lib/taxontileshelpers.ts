import d3 from 'd3';
import { filterArray, RA, RR } from './types';
import { index, sortFunction } from './helpers';

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
    if (typeof parent === 'object') parent.children.push(node);
    else console.warn('Taxon node with missing parent', { node });
  });

  return pairedNodes;
}

type PairedNode = Node & { children: PairedNode[] };

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
    count += nodeCount;
    if (count >= TILE_LIMIT) break;
    threshold = Number.parseInt(childrenCount);
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
    console.error('Detected more than one tree root', { roots });
  return roots[0];
}

function pullUp(node: PairedNode, threshold: number): number {
  const children = [];
  let thisCount = node.count;
  let totalCount = node.count;
  node.children.forEach((child) => {
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

export function makeTreeMap(container: HTMLElement, root: PairedNode) {
  const treeMap = d3.layout
    .treemap()
    .size([container.clientWidth, container.clientHeight])
    .sort(sortFunction(({ id }) => id))
    .value(({ count }) => count);

  const color = d3.scale.category20c();
  const chart = d3
    .select(container)
    .selectAll('.node')
    // FIXME: refactor this
    .data(treeMap.nodes(root).filter((node) => !Array.isArray(node.children)))
    .enter()
    .append('div')
    .attr('class', 'node')
    .call(position)
    .attr('class', 'node border dark:border-neutral-700 absolute opacity-80')
    // FIXME: refactor this
    .style('background', (node) =>
      Array.isArray(node.children) ? null : color(node.name)
    );

  return chart;
}

export const getTitleGenerator =
  (genusRankId: number | undefined): ((node: MapNode) => string) =>
  (node) =>
    filterArray(recurseTreeTiles(node, genusRankId) ?? []).join(' ') ||
    node.name;

type MapNode = {
  readonly name: string;
  readonly parent: MapNode;
  readonly rankId: number;
  readonly children: RA<MapNode | undefined>;
};

const recurseTreeTiles = (
  node: MapNode,
  genusRankId: number | undefined
): RA<string | undefined> | undefined =>
  genusRankId === undefined || node.rankId >= genusRankId
    ? [
        ...(recurseTreeTiles(node.parent, genusRankId) ?? []),
        Array.isArray(node.children) ? node.name : undefined,
      ]
    : undefined;

// FIXME: refactor this
function position() {
  this.style('left', (node) => `${node.x}px`)
    .style('top', (node) => `${node.y}px`)
    .style('width', (node) => `${Math.max(0, node.dx - 1)}px`)
    .style('height', (node) => `${Math.max(0, node.dy - 1)}px`);
}
