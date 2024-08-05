import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined, localized } from '../../utils/types';
import { getUniqueName } from '../../utils/uniquifyName';
import { strictParseXml } from '../AppResources/parseXml';
import type { ViewDefinition } from '../FormParse';
import type { SpecToJson } from '../Syncer';
import { pipe, syncer } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import type { SimpleXmlNode, XmlNode } from '../Syncer/xmlToJson';
import {
  createSimpleXmlNode,
  toSimpleXmlNode,
  xmlToJson,
} from '../Syncer/xmlToJson';
import {
  createXmlSpec,
  getOriginalSyncerInput,
  setOriginalSyncerInput,
} from '../Syncer/xmlUtils';
import { getBusinessRuleClassFromTable } from './helpers';

export const viewSetsSpec = f.store(() =>
  createXmlSpec({
    views: pipe(
      syncers.xmlChild('views'),
      syncers.fallback(createSimpleXmlNode),
      syncers.xmlChildren('view'),
      syncers.map(resolvedViewSpec())
    ),
    viewDefs: pipe(
      syncers.xmlChild('viewdefs'),
      syncers.fallback(createSimpleXmlNode),
      syncers.xmlChildren('viewdef'),
      syncers.map(resolvedViewDefSpec())
    ),
    name: pipe(
      syncers.xmlAttribute('name', 'empty'),
      syncers.default<string>('')
    ),
  })
);

type RawViewSets = SpecToJson<ReturnType<typeof viewSetsSpec>>;
export type ViewSets = Omit<RawViewSets, 'viewDefs'> & {
  readonly viewDefs: RA<
    Omit<RawViewSets['viewDefs'][number], 'raw'> & { readonly raw: XmlNode }
  >;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const resolvedViewSpec = () =>
  pipe(
    syncers.object(viewSpec()),
    syncer(
      ({ table, ...node }) => ({
        ...node,
        table: table.parsed,
        legacyTable: table.bad,
      }),
      ({ table, legacyTable, businessRules, ...node }) => ({
        ...node,
        table: { parsed: table, bad: legacyTable },
        businessRules:
          f.trim(businessRules ?? '') === ''
            ? localized(
                typeof table === 'object'
                  ? getBusinessRuleClassFromTable(table.name)
                  : ''
              )
            : businessRules,
      })
    )
  );

export function parseFormView(definition: ViewDefinition) {
  const view = resolvedViewSpec().serializer(
    toSimpleXmlNode(xmlToJson(strictParseXml(definition.view)))
  );
  const usedDefinitions = new Set(
    view.altViews.altViews.map(({ viewDef }) => viewDef)
  );
  return {
    view,
    viewDefinitions: Object.values(definition.viewdefs)
      .map((definition) =>
        resolvedViewDefSpec().serializer(
          toSimpleXmlNode(xmlToJson(strictParseXml(definition)))
        )
      )
      .filter(({ name }) =>
        /*
         * Only duplicate view definitions that were used in altviews. I.e,
         * if "ObjectAttachment" viewdef view was referenced by
         * "CollectionObjectAttachment Table" viewdef, don't create another
         * ObjectAttachment
         */
        usedDefinitions.has(name)
      ),
  };
}

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
      syncers.default(localized(''))
    ),
    altViews: pipe(
      syncers.xmlChild('altviews'),
      syncers.fallback<SimpleXmlNode>(createSimpleXmlNode),
      syncers.object(altViewsSpec())
    ),
    legacyIsInternal: pipe(
      syncers.xmlAttribute('isInternal', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
    // Not used in the code, but specified in the xml often
    legacyIsExternal: pipe(
      syncers.xmlAttribute('isExternal', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
    legacyUseBusinessRules: pipe(
      syncers.xmlAttribute('useDefBusRule', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(true)
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
          // Use viewDef as name if name not provided (to match sp6 behavior)
          syncers.change(
            'name',
            ({ name }) => name,
            ({ name, viewDef }) => name ?? viewDef
          )
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
    // Present in the sp6 source code, but never used for anything
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
      syncers.default<string>('')
    ),
    viewDef: syncers.xmlAttribute('viewDef', 'required'),
    mode: pipe(
      syncers.xmlAttribute('mode', 'required'),
      syncers.maybe(syncers.enum(['edit', 'view', 'search'] as const)),
      syncers.fallback<'edit' | 'search' | 'view'>('view' as const)
    ),
    default: pipe(
      syncers.xmlAttribute('default', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    legacyTitle: syncers.xmlAttribute('title', 'skip'),
    legacyLabel: syncers.xmlAttribute('label', 'skip'),
    legacyValidated: pipe(
      syncers.xmlAttribute('validated', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
    legacySelectorValue: syncers.xmlAttribute('selector_value', 'skip', false),
  })
);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const resolvedViewDefSpec = () =>
  pipe(
    syncers.object(viewDefSpec()),
    syncer(
      ({ table, ...node }) => ({
        ...node,
        table: table.parsed,
        legacyTable: table.bad,
      }),
      ({ table, legacyTable, ...node }) => {
        const result = {
          ...node,
          table: {
            parsed: table,
            bad: legacyTable,
          },
          legacyGetTable: localized(
            node.legacyGetTable ??
              (node.name?.endsWith('Search') === true
                ? 'edu.ku.brc.af.ui.forms.DataGetterForHashMap'
                : 'edu.ku.brc.af.ui.forms.DataGetterForObj')
          ),
          legacySetTable: localized(
            node.legacySetTable ??
              (node.name?.endsWith('Search') === true
                ? 'edu.ku.brc.af.ui.forms.DataSetterForHashMap'
                : 'edu.ku.brc.af.ui.forms.DataSetterForObj')
          ),
        };
        setOriginalSyncerInput(result, node.raw);
        return result;
      }
    )
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
      syncers.maybe(
        syncers.enum(['form', 'formtable', 'iconview', 'rstable'] as const)
      ),
      /*
       * REFACTOR: try improving type inference to not require explicitly
       *   specifying generic
       */
      syncers.fallback<'form' | 'formtable' | 'iconview' | 'rstable'>('form')
    ),
    legacyGetTable: syncers.xmlAttribute('getTable', 'required'),
    legacySetTable: syncers.xmlAttribute('setTable', 'required'),
    legacyEditableDialog: pipe(
      syncers.xmlAttribute('editableDlg', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(true)
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
        attributes: {},
      }),
      toSimpleXmlNode
    ),
  })
);
