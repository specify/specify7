import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import type { SpecToJson } from '../Syncer';
import { pipe } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import { createXmlSpec } from '../Syncer/xmlUtils';

export const dialogsSpec = f.store(() =>
  createXmlSpec({
    dialogs: pipe(
      syncers.xmlChildren('dialog'),
      syncers.map(syncers.object(dialogSpec()))
    ),
  })
);

export type SearchDialogDefinition = SpecToJson<
  ReturnType<typeof dialogsSpec>
>['dialogs'][number];

const dialogSpec = f.store(() =>
  createXmlSpec({
    name: pipe(
      syncers.xmlAttribute('name', 'required'),
      syncers.default<LocalizedString>('')
    ),
    title: pipe(
      syncers.xmlAttribute('name', 'skip'),
      syncers.default<LocalizedString>('')
    ),
    type: pipe(
      syncers.xmlAttribute('type', 'required'),
      syncers.default<LocalizedString>('')
    ),
    view: syncers.xmlAttribute('view', 'skip'),
    viewSet: syncers.xmlAttribute('viewSet', 'skip'),
    // Note, not all class="" refer to table names
    table: syncers.xmlAttribute('class', 'skip'),
    idField: syncers.xmlAttribute('idField', 'skip'),
    helpContext: syncers.xmlAttribute('helpContext', 'skip'),
  })
);
