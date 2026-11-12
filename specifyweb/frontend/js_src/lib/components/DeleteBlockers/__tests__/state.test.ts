import { waitFor } from '@testing-library/react';

import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import type { PromiseQueue } from '../../../utils/promiseQueue';
import type { RA } from '../../../utils/types';
import { tables } from '../../DataModel/tables';
import { DELETE_BLOCKER_LIMIT } from '../deleteBlockers';
import type { DeleteBlockerLRUPage} from '../pageCache';
import { makeBlockerKey } from '../pageCache';
import { DeleteBlockerState, resourceToStringIdentifier } from '../state';

requireContext();

const accessionId = 1;
const coBlockerIds = [11, 12];
const initialPage = {
  table: 'collectionobject',
  field: 'accession',
  ids: coBlockerIds,
  limit: DELETE_BLOCKER_LIMIT,
  complete: true,
  anchor: null,
  backwards: false,
};

const initialBlockers = jest.fn(() => ({
  results: [initialPage],
  next: [],
}));

const makeAccessionCountsResponse = (count: number) => ({
  results: [{ table: 'collectionobject', field: 'accession', count }],
  total_count: count,
});
const fetchCounts = jest.fn(() => makeAccessionCountsResponse(2));

function firstPage(
  result: DeleteBlockerLRUPage | RA<DeleteBlockerLRUPage> | false | undefined
): DeleteBlockerLRUPage | undefined {
  if (result === false || result === undefined) return undefined;
  return Array.isArray(result) ? result[0] : result;
}

overrideAjax(
  `/delete_blockers/delete_blockers/accession/${accessionId}/?limit=${DELETE_BLOCKER_LIMIT}`,
  initialBlockers
);

const newCoId = 13;
overrideAjax(
  `/delete_blockers/delete_blockers/accession/${accessionId}/`,
  {
    results: [
      {
        ...initialPage,
        ids: [newCoId],
        anchor: coBlockerIds.at(-1),
      },
    ],
    next: [],
  },
  {
    method: 'POST',
    body: {
      filters: [
        {
          table: 'collectionobject',
          field: 'accession',
          anchor: coBlockerIds.at(-1),
          backwards: false,
          limit: DELETE_BLOCKER_LIMIT,
        },
      ],
    },
  }
);
overrideAjax(`/delete_blockers/count/accession/${accessionId}/`, fetchCounts);

type DeleteBlockerStateQueues = {
  readonly countPromiseQueue: PromiseQueue<string, unknown>;
  readonly pagePromiseQueue: PromiseQueue<
    string,
    RA<DeleteBlockerLRUPage> | undefined
  >;
};

const getStateQueues = (state: DeleteBlockerState): DeleteBlockerStateQueues =>
  state as unknown as DeleteBlockerStateQueues;

describe('DeleteBlockerState: Accession -> CollectionObject blockers', () => {
  beforeEach(() => {
    initialBlockers.mockClear();
    fetchCounts.mockClear();
    fetchCounts.mockImplementation(() => makeAccessionCountsResponse(2));
  });

  test('seeds blocker pages and loads resource counts', async () => {
    const state = new DeleteBlockerState();
    const resource = new tables.Accession.Resource({ id: accessionId });

    await state.seedBlockers(resource);
    await state.fetchCountsForResource(resource);

    const page = firstPage(
      await state.filterBlockers(resource, 'CollectionObject', 'accession')
    );
    const node = state.getNode(resourceToStringIdentifier(resource));

    expect(page?.ids).toEqual(coBlockerIds);
    expect(node?.count).toBe(coBlockerIds.length);
    expect(
      [...(node?.relationshipMetaData.values() ?? [])].map(
        (relationship) => relationship.count
      )
    ).toEqual([coBlockerIds.length]);
    expect(initialBlockers).toHaveBeenCalledTimes(1);
    expect(fetchCounts).toHaveBeenCalledTimes(1);

    state.destroy();
  });

  test('fetches and returns a filtered blocker page', async () => {
    const state = new DeleteBlockerState();
    const resource = new tables.Accession.Resource({ id: accessionId });

    const pages = await state.filterBlockers(
      resource,
      'CollectionObject',
      'accession',
      coBlockerIds.at(-1)
    );
    if (!Array.isArray(pages)) {
      throw new Error('Expected the filtered blocker request to return pages');
    }
    fetchCounts.mockImplementationOnce(() => makeAccessionCountsResponse(1));
    await state.fetchCountsForResource(resource);

    expect(pages.map((page) => page.ids)).toEqual([[newCoId]]);
    expect(state.getNode(resourceToStringIdentifier(resource))?.count).toBe(2);
    expect(fetchCounts).toHaveBeenCalledTimes(1);

    state.destroy();
  });

  test('removes a deleted blocker from cached pages and refreshes counts', async () => {
    const state = new DeleteBlockerState();
    const resource = new tables.Accession.Resource({ id: accessionId });
    await state.seedBlockers(resource);
    await state.fetchCountsForResource(resource);

    const accessionKey = resourceToStringIdentifier(resource);

    fetchCounts.mockImplementationOnce(() => makeAccessionCountsResponse(1));
    const coToRemove = makeBlockerKey(
      tables.CollectionObject.name.toLowerCase(),
      coBlockerIds.at(0)
    );
    state.removeResource(coToRemove);
    await waitFor(() => expect(state.getNode(accessionKey)?.count).toBe(1));

    const page = firstPage(
      await state.filterBlockers(resource, 'CollectionObject', 'accession')
    );
    const node = state.getNode(accessionKey);

    expect(page?.ids).toEqual([coBlockerIds.at(1)]);
    expect(node?.count).toBe(1);
    expect(
      [...(node?.relationshipMetaData.values() ?? [])].map(
        (relationship) => relationship.count
      )
    ).toEqual([1]);
    expect(fetchCounts).toHaveBeenCalledTimes(2);

    state.destroy();
  });

  test('destroy clears queued count and page requests and cached nodes', async () => {
    const state = new DeleteBlockerState();
    const resource = new tables.Accession.Resource({ id: accessionId });
    await state.seedBlockers(resource);
    await waitFor(() =>
      expect(state.getNode(resourceToStringIdentifier(resource))?.count).toBe(2)
    );

    const queues = getStateQueues(state);
    const activeResolvers: (() => void)[] = [];
    const activeRequest = jest.fn(
      async () =>
        new Promise<RA<DeleteBlockerLRUPage> | undefined>((resolve) => {
          activeResolvers.push(() => resolve(undefined));
        })
    );
    const queuedCount = jest.fn(async () => Promise.resolve());
    const queuedPage = jest.fn(async () =>
      Promise.resolve<RA<DeleteBlockerLRUPage>>([])
    );
    const activeCountPromise = queues.countPromiseQueue.enqueue(
      'active-count',
      activeRequest
    );
    const activePagePromises = [
      queues.pagePromiseQueue.enqueue('active-page-1', activeRequest),
      queues.pagePromiseQueue.enqueue('active-page-2', activeRequest),
      queues.pagePromiseQueue.enqueue('active-page-3', activeRequest),
    ];
    queues.countPromiseQueue.enqueue('queued-count', queuedCount);
    queues.pagePromiseQueue.enqueue('queued-page', queuedPage);

    expect(queues.countPromiseQueue.get('queued-count')).toBe(false);
    expect(queues.pagePromiseQueue.get('queued-page')).toBe(false);
    expect(state.getNode(resourceToStringIdentifier(resource))).toBeDefined();
    expect(activeCountPromise).not.toBe(false);
    expect(activePagePromises.every((promise) => promise !== false)).toBe(true);

    state.destroy();

    expect(queues.countPromiseQueue.get('queued-count')).toBeUndefined();
    expect(queues.pagePromiseQueue.get('queued-page')).toBeUndefined();
    expect(state.getNode(resourceToStringIdentifier(resource))).toBeUndefined();

    activeResolvers.forEach((resolve) => resolve());
    await Promise.all([
      activeCountPromise === false ? Promise.resolve() : activeCountPromise,
      ...activePagePromises.map(async (promise) =>
        promise === false ? Promise.resolve() : promise
      ),
    ]);

    expect(queuedCount).not.toHaveBeenCalled();
    expect(queuedPage).not.toHaveBeenCalled();
  });
});

const collectionObjectId = 2;
const determinationIds = [21, 22];
const nextDeterminations = jest.fn(() => ({
  results: [],
  next: [
    {
      table: 'determination',
      field: 'collectionobject',
      ids: determinationIds,
      limit: DELETE_BLOCKER_LIMIT,
      complete: true,
      anchor: null,
      backwards: false,
    },
  ],
}));
const determinationBlockers = determinationIds.map((id) =>
  jest.fn(() => ({
    results: [
      {
        table: 'determination',
        field: 'taxon',
        ids: [id],
        limit: DELETE_BLOCKER_LIMIT,
        complete: true,
        anchor: null,
        backwards: false,
      },
    ],
    next: [],
  }))
);
const cascadeCounts = jest.fn(() => ({ results: [], total_count: 0 }));
const determinationCounts = determinationIds.map(() =>
  jest.fn(() => ({
    results: [{ table: 'determination', field: 'taxon', count: 1 }],
    total_count: 1,
  }))
);

overrideAjax(
  `/delete_blockers/delete_blockers/collectionobject/${collectionObjectId}/?limit=40`,
  nextDeterminations
);
overrideAjax(
  `/delete_blockers/count/collectionobject/${collectionObjectId}/`,
  cascadeCounts
);
determinationIds.forEach((id, index) => {
  overrideAjax(
    `/delete_blockers/delete_blockers/determination/${id}/?limit=40`,
    determinationBlockers[index]
  );
  overrideAjax(
    `/delete_blockers/count/determination/${id}/`,
    determinationCounts[index]
  );
});

describe('DeleteBlockerState: Next/Cascaded blockers', () => {
  beforeEach(() => {
    nextDeterminations.mockClear();
    cascadeCounts.mockClear();
    determinationBlockers.forEach((request) => request.mockClear());
    determinationCounts.forEach((request) => request.mockClear());
  });

  test('fetches blockers for every record in a cascade next page', async () => {
    const state = new DeleteBlockerState();
    const resource = new tables.CollectionObject.Resource({
      id: collectionObjectId,
    });
    await state.seedBlockers(resource);

    await waitFor(() => {
      determinationBlockers.forEach((request) =>
        expect(request).toHaveBeenCalledTimes(1)
      );
      determinationCounts.forEach((request) =>
        expect(request).toHaveBeenCalledTimes(1)
      );
    });

    expect(
      state.getNode(resourceToStringIdentifier(resource))?.cascadeChildren
    ).toEqual(
      new Set(
        determinationIds.map((id) =>
          makeBlockerKey(tables.Determination.name.toLowerCase(), id)
        )
      )
    );

    for (const [index, id] of determinationIds.entries()) {
      const determination = new tables.Determination.Resource({ id });
      const page = firstPage(
        await state.filterBlockers(determination, 'Determination', 'taxon')
      );
      expect(page?.ids).toEqual([determinationIds[index]]);
      expect(
        state.getNode(resourceToStringIdentifier(determination))?.count
      ).toBe(1);
    }

    state.destroy();
  });
});
