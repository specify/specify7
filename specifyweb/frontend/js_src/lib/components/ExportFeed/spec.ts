import { f } from '../../utils/functools';
import type { SpecToJson } from '../Syncer';
import { pipe } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import { createXmlSpec } from '../Syncer/xmlUtils';

export const exportFeedSpec = f.store(() =>
  createXmlSpec({
    title: pipe(syncers.xmlChild('title'), syncers.maybe(syncers.xmlContent)),
    description: pipe(
      syncers.xmlChild('description'),
      syncers.maybe(syncers.xmlContent)
    ),
    language: pipe(
      syncers.xmlChild('language', 'optional'),
      syncers.maybe(syncers.xmlContent)
    ),
    items: pipe(
      syncers.xmlChildren('item'),
      syncers.map(syncers.object(itemSpec()))
    ),
  })
);

export type ExportFeedDefinition = SpecToJson<
  ReturnType<typeof exportFeedSpec>
>;

const itemSpec = f.store(() =>
  createXmlSpec({
    collectionId: pipe(
      syncers.xmlAttribute('collectionId', 'required'),
      syncers.maybe(syncers.toDecimal)
    ),
    userId: pipe(
      syncers.xmlAttribute('userId', 'required'),
      syncers.maybe(syncers.toDecimal)
    ),
    notifyUserId: pipe(
      syncers.xmlAttribute('notifyUserId', 'skip'),
      syncers.maybe(syncers.toDecimal)
    ),
    definition: syncers.xmlAttribute('definition', 'required'),
    metadata: syncers.xmlAttribute('metadata', 'required'),
    days: pipe(
      syncers.xmlAttribute('days', 'required'),
      syncers.maybe(syncers.toFloat)
    ),
    fileName: syncers.xmlAttribute('filename', 'required'),
    publish: pipe(
      syncers.xmlAttribute('publish', 'required'),
      syncers.maybe(syncers.toBoolean),
      syncers.fallback<boolean>(false)
    ),
    title: pipe(
      syncers.xmlChild('title', 'optional'),
      syncers.maybe(syncers.xmlContent)
    ),
    id: pipe(
      syncers.xmlChild('id', 'optional'),
      syncers.maybe(syncers.xmlContent)
    ),
    guid: pipe(
      syncers.xmlChild('guid', 'optional'),
      syncers.maybe(syncers.xmlContent)
    ),
    description: pipe(
      syncers.xmlChild('description', 'optional'),
      syncers.maybe(syncers.xmlContent)
    ),
  })
);
