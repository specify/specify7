// FIXME: figure out if "<?xml version="1.0" encoding="UTF-8"?>" should be added

import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import type { RA, RR } from '../../utils/types';
import { defined } from '../../utils/types';
import type { Tables } from '../DataModel/types';
import { pipe, SpecToJson, syncer } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import {
  createSimpleXmlNode,
  SimpleXmlNode,
  toSimpleXmlNode,
  XmlNode,
} from '../Syncer/xmlToJson';
import { createXmlSpec, getOriginalSyncerInput } from '../Syncer/xmlUtils';
import { getUniqueName } from '../../utils/uniquifyName';

export const viewSetsSpec = f.store(() =>
  createXmlSpec({
    views: pipe(
      syncers.xmlChild('views'),
      syncers.default(createSimpleXmlNode),
      syncers.xmlChildren('view'),
      syncers.map(
        pipe(
          syncers.object(viewSpec()),
          syncer(
            ({ businessRules: _, table, ...node }) => ({
              ...node,
              table: table.parsed,
              legacyTable: table.bad,
            }),
            ({ table, legacyTable, ...node }) => ({
              // FIXME: consier how altview definitions should be handled
              ...node,
              table: { parsed: table, bad: legacyTable },
              businessRules:
                typeof table === 'object'
                  ? `edu.ku.brc.specify.datamodel.busrules.${
                      businessRules[table.name] ?? table.name
                    }BusRules`
                  : '',
            })
          )
        )
      )
    ),
    viewDefs: pipe(
      syncers.xmlChild('viewdefs'),
      syncers.default(createSimpleXmlNode),
      syncers.xmlChildren('viewdef'),
      syncers.map(
        pipe(
          syncers.object(viewDefSpec()),
          syncer(
            ({ table, ...node }) => ({
              ...node,
              table: table.parsed,
              legacyTable: table.bad,
            }),
            ({ table, legacyTable, ...node }) => ({
              ...node,
              table: {
                parsed: table,
                bad: legacyTable,
              },
              legacyGetTable:
                node.legacyGetTable ??
                (node.name?.endsWith('Search') === true
                  ? 'edu.ku.brc.af.ui.forms.DataGetterForHashMap'
                  : 'edu.ku.brc.af.ui.forms.DataGetterForObj'),
              legacySetTable:
                node.legacySetTable ??
                (node.name?.endsWith('Search') === true
                  ? 'edu.ku.brc.af.ui.forms.DataSetterForHashMap'
                  : 'edu.ku.brc.af.ui.forms.DataSetterForObj'),
            })
          )
        )
      )
    ),
  })
);

type RawViewSets = SpecToJson<ReturnType<typeof viewSetsSpec>>;
export type ViewSets = Omit<RawViewSets, 'viewDefs'> & {
  readonly viewDefs: RA<
    Omit<RawViewSets['viewDefs'][number], 'raw'> & { readonly raw: XmlNode }
  >;
};

/**
 * Most of the time business rules class name can be inferred from table name.
 * Exceptions:
 */
const businessRules: Partial<RR<keyof Tables, string>> = {
  Shipment: 'LoanGiftShipment',
};

const viewSpec = f.store(() =>
  createXmlSpec({
    name: syncers.xmlAttribute('name', 'required'),
    // Used for tooltips in sp6
    title: syncers.xmlAttribute('objTitle', 'skip'),
    description: pipe(
      syncers.xmlChild('desc', 'optional'),
      syncers.maybe(syncers.xmlContent)
    ),
    table: pipe(
      syncers.xmlAttribute('class', 'required'),
      syncers.preserveInvalid(syncers.javaClassName(false))
    ),
    businessRules: pipe(
      syncers.xmlAttribute('busrules', 'skip'),
      syncers.default<LocalizedString>('')
    ),
    altViews: pipe(
      syncers.xmlChild('altviews'),
      syncers.default<SimpleXmlNode>(createSimpleXmlNode),
      syncers.object(altViewsSpec())
    ),
    legacyIsInternal: pipe(
      syncers.xmlAttribute('isInternal', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
    legacyIsExternal: pipe(
      syncers.xmlAttribute('isExternal', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
    legacyUseBusinessRules: pipe(
      syncers.xmlAttribute('useDefBusRule', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
    legacyResourceLabels: pipe(
      syncers.xmlAttribute('resourceLabels', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
  })
);

const altViewsSpec = f.store(() =>
  createXmlSpec({
    altViews: pipe(
      syncers.xmlChildren('altview'),
      syncers.map(
        pipe(
          syncers.object(altViewSpec()),
          syncer(f.id, (rest) => ({
            ...rest,
            name: rest.name ?? rest.viewDef,
          }))
        )
      ),
      // Sp6 expects altView names to be unique
      syncer(f.id, (altViews) =>
        altViews.map(({ name, ...altView }, index) => ({
          ...altView,
          name: getUniqueName(
            name,
            altViews.slice(0, index).map(({ name }) => name)
          ),
        }))
      )
    ),
    legacySelector: syncers.xmlAttribute('selector', 'skip'),
    legacyDefaultMode: pipe(
      syncers.xmlAttribute('defaultMode', 'skip'),
      syncers.maybe(syncers.enum(['view', 'edit', 'search'] as const))
    ),
  })
);

const altViewSpec = f.store(() =>
  createXmlSpec({
    name: pipe(
      syncers.xmlAttribute('name', 'required'),
      syncers.default<LocalizedString>('')
    ),
    viewDef: syncers.xmlAttribute('viewDef', 'required'),
    mode: pipe(
      syncers.xmlAttribute('mode', 'required'),
      syncers.default<LocalizedString>('view'),
      syncers.enum(['edit', 'view', 'search'] as const)
    ),
    default: pipe(
      syncers.xmlAttribute('default', 'skip'),
      // FIXME: test that default does not add value when not needed
      // FIXME: consider making default return undefined if value matches default
      syncers.default<LocalizedString>(''),
      syncers.toBoolean
    ),
    legacyTitle: syncers.xmlAttribute('title', 'skip'),
    legacyLabel: syncers.xmlAttribute('label', 'skip'),
    legacyValidated: pipe(
      syncers.xmlAttribute('validated', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
    legacySelectorValue: syncers.xmlAttribute('selector_value', 'skip'),
  })
);

const viewDefSpec = f.store(() =>
  createXmlSpec({
    name: syncers.xmlAttribute('name', 'required'),
    table: pipe(
      syncers.xmlAttribute('class', 'required'),
      syncers.preserveInvalid(syncers.javaClassName(false))
    ),
    type: pipe(
      syncers.xmlAttribute('type', 'required'),
      syncers.default<LocalizedString>('form'),
      syncers.enum(['form', 'formtable', 'iconview', 'rstable'] as const)
    ),
    legacyGetTable: syncers.xmlAttribute('getTable', 'required'),
    legacySetTable: syncers.xmlAttribute('setTable', 'required'),
    legacyEditableDialog: pipe(
      syncers.xmlAttribute('editableDlg', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
    legacyUseResourceLabels: pipe(
      syncers.xmlAttribute('useResourceLabels', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
    /*
     * Not parsing the rest of the form definition but leaving it as is so
     * as not to slow down the performance too much for big files.
     * Instead, the contents of the form definition will validated by
     * formDefinitionSpec() later on
     */
    raw: syncer<SimpleXmlNode, XmlNode>(
      (node) => ({
        ...defined(getOriginalSyncerInput(node), ''),
        // Remove attributes so that they don't overwrite the values above
        attributes: {},
      }),
      toSimpleXmlNode
    ),
  })
);
