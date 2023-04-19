import { f } from '../../utils/functools';
import { pipe } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import type { SimpleXmlNode } from '../Syncer/xmlToJson';
import { createSimpleXmlNode } from '../Syncer/xmlToJson';
import { createXmlSpec } from '../Syncer/xmlUtils';

export const dataEntryItems = f.store(() =>
  createXmlSpec({
    items: pipe(
      syncers.xmlChild('std'),
      syncers.fallback<SimpleXmlNode>(createSimpleXmlNode),
      syncers.xmlChildren('view'),
      syncers.map(syncers.object(dataEntryItem()))
    ),
  })
);

const dataEntryItem = f.store(() =>
  createXmlSpec({
    viewName: syncers.xmlAttribute('view', 'required'),
  })
);
