// FIXME: figure out if "<?xml version="1.0" encoding="UTF-8"?>" should be added

import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import type { RR } from '../../utils/types';
import type { Tables } from '../DataModel/types';
import { pipe, SpecToJson, syncer } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import { createSimpleXmlNode, SimpleXmlNode } from '../Syncer/xmlToJson';
import { createXmlSpec } from '../Syncer/xmlUtils';
import { getUniqueName } from '../../utils/uniquifyName';

export const viewSetsSpec = f.store(() =>
  createXmlSpec({
    views: pipe(
      syncers.xmlChild('views'),
      syncers.default(() => createSimpleXmlNode('views')),
      syncers.xmlChildren('view'),
      syncers.map(
        pipe(
          syncers.object(viewSpec()),
          syncer(
            ({ businessRules: _, ...rest }) => rest,
            (rest) => ({
              ...rest,
              businessRules:
                typeof rest.table === 'object'
                  ? `edu.ku.brc.specify.datamodel.busrules.${
                      businessRules[rest.table.name] ?? rest.table.name
                    }BusRules`
                  : '',
            })
          )
        )
      )
    ),
    viewDefs: pipe(
      syncers.xmlChild('viewdefs'),
      syncers.default(() => createSimpleXmlNode('viewdefs')),
      syncers.xmlChildren('viewdef'),
      syncers.map(syncers.object(viewDefSpec()))
    ),
  })
);

export type ViewSets = SpecToJson<ReturnType<typeof viewSetsSpec>>;

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
    title: syncers.xmlAttribute('objTitle', 'skip'),
    description: pipe(
      syncers.xmlChild('desc', 'optional'),
      syncers.maybe(syncers.xmlContent)
    ),
    table: pipe(
      syncers.xmlAttribute('class', 'required'),
      syncers.maybe(syncers.javaClassName)
    ),
    businessRules: pipe(
      syncers.xmlAttribute('busrules', 'skip'),
      syncers.default<LocalizedString>('')
    ),
    altViews: pipe(
      syncers.xmlChildren('altviews'),
      syncers.map(syncers.object(altViewsSpec()))
    ),
  })
);

const altViewsSpec = f.store(() =>
  createXmlSpec({
    altView: pipe(
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
  })
);

const altViewSpec = f.store(() =>
  createXmlSpec({
    default: pipe(
      syncers.xmlAttribute('default', 'skip'),
      syncers.default<LocalizedString>(''),
      syncers.toBoolean
    ),
    name: pipe(
      syncers.xmlAttribute('name', 'required'),
      syncers.default<LocalizedString>('')
    ),
    mode: pipe(
      syncers.xmlAttribute('mode', 'required'),
      syncers.default<LocalizedString>('view'),
      syncers.enum(['edit', 'view', 'search'])
    ),
    viewDef: syncers.xmlAttribute('viewDef', 'required'),
  })
);

const viewDefSpec = f.store(() =>
  createXmlSpec({
    name: syncers.xmlAttribute('name', 'required'),
    table: pipe(
      syncers.xmlAttribute('class', 'required'),
      syncers.maybe(syncers.javaClassName)
    ),
    type: pipe(
      syncers.xmlAttribute('type', 'required'),
      syncers.default<LocalizedString>('form'),
      syncers.enum(['form', 'formtable', 'iconview', 'rstable'])
    ),
    raw: syncer<SimpleXmlNode, SimpleXmlNode>(
      (node) => ({
        ...node,
        // Remove attributes so that they don't overwrite the values above
        attributes: {},
        children: node.children,
      }),
      f.id
    ),
  })
);
