import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import { tables } from '../DataModel/tables';
import { pipe, SpecToJson, syncer } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import type { SimpleXmlNode } from '../Syncer/xmlToJson';
import { createSimpleXmlNode } from '../Syncer/xmlToJson';
import { createXmlSpec } from '../Syncer/xmlUtils';

export const formDefinitionSpec = f.store(() =>
  createXmlSpec({
    columnDefinitions: pipe(
      syncers.xmlChildren('columnDef'),
      syncers.map(syncers.object(columnDefinitionSpec()))
    ),
    rowDefinition: pipe(
      syncers.xmlChild('rowDef', 'optional'),
      syncers.maybe(syncers.object(rowSizeDefinitionSpec()))
    ),
    legacyBusinessRules: pipe(
      syncers.xmlChild('enableRules', 'optional'),
      syncers.maybe(syncers.object(legacyBusinessRulesSpec()))
    ),
    rows: pipe(
      syncers.xmlChild('rows'),
      syncers.default<SimpleXmlNode>(() => createSimpleXmlNode('std')),
      syncers.xmlChildren('row'),
      syncers.map(
        pipe(
          syncers.xmlChildren('cell'),
          syncers.map(
            pipe(
              syncers.object(cellSpec()),
              syncers.switch(
                'rest',
                'definition',
                pipe(
                  syncers.xmlAttribute('type', 'required'),
                  syncers.default('field')
                ),
                {
                  label: 'Label',
                  field: 'Field',
                  separator: 'Separator',
                  subview: 'SubView',
                  panel: 'Panel',
                  command: 'Command',
                  iconview: 'IconView',
                } as const,
                {
                  Label: labelSpec,
                  Field: fieldSpec,
                  Separator: separatorSpec,
                  SubView: subViewSpec,
                  Panel: panelSpec,
                  Command: commandSpec,
                  IconView: iconViewSpec,
                  unknown: unknownCellSpec,
                } as const
              )
            )
          )
        )
      )
    ),
  })
);

type Cell = SpecToJson<
  ReturnType<typeof formDefinitionSpec>
>['rows'][number][number];

const columnDefinitionSpec = f.store(() =>
  createXmlSpec({
    // Commonly one of 'lnx', 'mac', 'exp'
    os: syncers.xmlAttribute('os', 'skip'),
    definition: syncers.xmlContent,
  })
);

const rowSizeDefinitionSpec = f.store(() =>
  createXmlSpec({
    auto: pipe(
      syncers.xmlAttribute('auto', 'skip'),
      syncers.default<LocalizedString>(''),
      syncers.toBoolean
    ),
    cell: syncers.xmlAttribute('cell', 'skip'),
    sep: syncers.xmlAttribute('cell', 'skip'),
    definition: syncers.xmlContent,
  })
);

const legacyBusinessRulesSpec = f.store(() =>
  createXmlSpec({
    id: syncers.xmlAttribute('id', 'required'),
    rule: syncers.xmlContent,
  })
);

/**
 * Build a list of tables for which the "formTable" display type should be
 * enabled. This list is not a perfect optimization of what tables have a
 * "formTable" display option in sp6 out of the box, but it's good enough
 */
const tablesWithFormTable = f.store(() =>
  Object.values(tables).filter(
    (table) => !table.isHidden && !table.overrides.isHidden && !table.isSystem
  )
);

const cellSpec = f.store(() =>
  createXmlSpec({
    id: syncers.xmlAttribute('id', 'skip'),
    /*type: pipe(
      syncers.xmlAttribute('type', 'required'),
      syncers.preserveInvalid(
        syncers.enum([
          'label',
          'field',
          'separator',
          'subview',
          'panel',
          'command',
          'iconview',
        ] as const)
      )
    ),*/
    // Make cell occupy more than one column
    colSpan: pipe(
      syncers.xmlAttribute('colSpan', 'skip'),
      syncers.maybe(syncers.toDecimal),
      syncers.default<number>(1)
    ),
    description: syncers.xmlAttribute('desc', 'skip'),
    // When invisible, field is rendered with visibility="hidden"
    invisible: pipe(
      syncers.xmlAttribute('visible', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    // FIXME: add commonInit
    initialize: pipe(
      syncers.xmlAttribute('initialize', 'skip'),
      syncers.default<LocalizedString>(''),
      // FIXME: make this production ready
      syncer(
        (value) =>
          Object.fromEntries(
            value.split(';').map((part) => {
              const [name, ...values] = part.split('=');
              return [
                name.toLowerCase(),
                values.join('=').replaceAll('%3B', ';'),
              ] as const;
            })
          ),
        (properties) =>
          Object.entries(properties)
            .map(
              ([key, value]) =>
                `${key.toLowerCase()}=${value.replaceAll(';', '%3B')}`
            )
            .join(';')
      ),
      syncers.captureLogContext()
    ),
    // FIXME: check how this handles duplicate attributes (especially when they were modified)
    rest: syncers.captureLogContext(),
    // In sp6, if true, disconnects the field from the database
    legacyIgnore: pipe(
      syncers.xmlAttribute('ignore', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
  })
);

const labelSpec = f.store(() =>
  createXmlSpec({
    label: syncers.xmlAttribute('label', 'skip'),
    labelForCellId: syncers.xmlAttribute('labelFor', 'skip'),
    icon: syncers.xmlAttribute('icon', 'skip'),
  })
);

const fieldSpec = (cell: SpecToJson<ReturnType<typeof cellSpec>>) =>
  createXmlSpec({
    name: syncers.xmlAttribute('name', 'required'),
  });

const separatorSpec = f.store(() =>
  createXmlSpec({
    label: syncers.xmlAttribute('label', 'skip'),
    icon: syncers.xmlAttribute('icon', 'skip'),
    forClass: pipe(
      syncers.xmlAttribute('forClass', 'skip'),
      syncers.maybe(syncers.tableName)
    ),
    canCollapse: pipe(
      syncers.xmlAttribute('collapse', 'skip'),
      syncers.default<LocalizedString>(''),
      syncers.toBoolean
    ),
  })
);

const subViewSpec = (cell: SpecToJson<ReturnType<typeof cellSpec>>) =>
  createXmlSpec({
    // FIXME: parse further
    name: syncers.xmlAttribute('name', 'required'),
    defaultType: pipe(
      syncers.xmlAttribute('defaultType', 'skip'),
      syncers.maybe(syncers.enum(['form', 'table', 'icon'] as const))
    ),
    label: syncers.xmlAttribute('label', 'skip'),
    viewSetName: syncers.xmlAttribute('viewSetName', 'skip'),
    viewName: syncers.xmlAttribute('viewName', 'skip'),
    isReadOnly: pipe(
      syncers.xmlAttribute('readOnly', 'skip'),
      syncers.default<LocalizedString>(''),
      syncers.toBoolean
    ),
    legacyRows: pipe(
      syncers.xmlAttribute('rows', 'skip'),
      syncers.maybe(syncers.toDecimal)
    ),
    legacyValidationType: pipe(
      syncers.xmlAttribute('valType', 'skip'),
      syncers.maybe(syncers.enum(['Changed', 'Focus', 'None', 'OK'] as const))
    ),
    // FIXME: add initialize
    // FIXME: handle common init
    // FIXME: handle border init
  });

const panelSpec = (cell: SpecToJson<ReturnType<typeof cellSpec>>) =>
  createXmlSpec({});

const commandSpec = (cell: SpecToJson<ReturnType<typeof cellSpec>>) =>
  createXmlSpec({});

const iconViewSpec = (cell: SpecToJson<ReturnType<typeof cellSpec>>) =>
  createXmlSpec({
    viewSetName: syncers.xmlAttribute('viewSetName', 'skip'),
    viewName: syncers.xmlAttribute('viewName', 'skip'),
  });

// FIXME: test that this carries over attributes and contents correctly
// FIXME: test changing cell type (and preserving attributes in the process???)
const unknownCellSpec = f.store(() => createXmlSpec({}));

export const exportsForTests = {
  tablesWithFormTable,
};
