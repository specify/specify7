import type { LocalizedString } from 'typesafe-i18n';

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
      syncers.default<SimpleXmlNode>(() => createSimpleXmlNode('std')),
      syncers.xmlChildren('view'),
      syncers.map(syncers.object(dataEntryItem()))
    ),
  })
);

const dataEntryItem = f.store(() =>
  createXmlSpec({
    title: pipe(
      syncers.xmlAttribute('title', 'empty'),
      syncers.default<LocalizedString>('')
    ),
    viewName: syncers.xmlAttribute('view', 'required'),
    icon: pipe(
      syncers.xmlAttribute('iconName', 'empty'),
      syncers.default<LocalizedString>('')
    ),
  })
);
