import { f } from '../../utils/functools';
import { localized } from '../../utils/types';
import { pipe } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import { createXmlSpec } from '../Syncer/xmlUtils';

export const interactionEntries = f.store(() =>
  createXmlSpec({
    entry: pipe(
      syncers.xmlChildren('entry'),
      syncers.map(syncers.object(interactionEntry()))
    ),
  })
);

const interactionEntry = f.store(() =>
  createXmlSpec({
    table: pipe(
      syncers.xmlAttribute('table', 'required'),
      syncers.maybe(syncers.tableName)
    ),
    action: pipe(
      syncers.xmlAttribute('action', 'required'),
      syncers.default(localized(''))
    ),
    isFavorite: pipe(
      syncers.xmlAttribute('isOnLeft', 'required'),
      syncers.maybe(syncers.toBoolean),
      syncers.fallback(false)
    ),
  })
);
