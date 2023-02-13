import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import { error } from '../Errors/assert';
import type { SpecToJson } from '../Syncer';
import { pipe, syncer } from '../Syncer';
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

export type InteractionEntry = Exclude<
  SpecToJson<ReturnType<typeof interactionEntries>>['entry'][number],
  undefined
>;

const specialActions = ['RET_LOAN', 'PRINT_INVOICE'] as const;

const interactionEntry = f.store(() =>
  createXmlSpec({
    name: pipe(
      syncers.xmlAttribute('name', 'required'),
      syncers.default<LocalizedString>('')
    ),
    table: pipe(
      syncers.xmlAttribute('table', 'required'),
      syncers.maybe(syncers.tableName)
    ),
    icon: syncers.xmlAttribute('icon', 'required'),
    label: syncers.xmlAttribute('label', 'skip'),
    action: pipe(
      syncers.xmlAttribute('type', 'required'),
      syncers.default<LocalizedString>(''),
      syncer(
        (value) => (f.includes(specialActions, value) ? value : undefined),
        (_value) => error('Not implemented')
      )
    ),
    tooltip: pipe(
      syncers.xmlAttribute('tooltip', 'empty'),
      syncers.default<LocalizedString>('')
    ),
    isFavorite: pipe(
      syncers.xmlAttribute('isOnLeft', 'required'),
      syncers.default<LocalizedString>(''),
      syncers.toBoolean
    ),
  })
);
