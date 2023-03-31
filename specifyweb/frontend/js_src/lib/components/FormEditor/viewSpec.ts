import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import { tables } from '../DataModel/tables';
import { pipe } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import type { SimpleXmlNode } from '../Syncer/xmlToJson';
import { createSimpleXmlNode } from '../Syncer/xmlToJson';
import { createXmlSpec } from '../Syncer/xmlUtils';

const formDefinitionSpec = f.store(() =>
  createXmlSpec({
    columnDefinitions: pipe(
      syncers.xmlChildren('columnDef'),
      syncers.map(syncers.object(columnDefinitionSpec()))
    ),
    rowDefinition: pipe(
      syncers.xmlChild('rowDef', 'optional'),
      syncers.maybe(syncers.object(rowSizeDefinitionSpec()))
    ),
    rows: pipe(
      syncers.xmlChild('rows'),
      syncers.default<SimpleXmlNode>(() => createSimpleXmlNode('std')),
      syncers.xmlChildren('row'),
      syncers.map(
        pipe(
          syncers.xmlChildren('cell'),
          syncers.map(syncers.object(cellSpec()))
        )
      )
    ),
  })
);

const columnDefinitionSpec = f.store(() =>
  createXmlSpec({
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
    name: syncers.xmlAttribute('name', 'skip'),
    type: syncers.xmlAttribute('type', 'required'),
    // Make cell occupy more than one column
    colSpan: pipe(
      syncers.xmlAttribute('colSpan', 'skip'),
      syncers.maybe(syncers.toDecimal),
      syncers.default<number>(1)
    ),
    cols: pipe(
      syncers.xmlAttribute('cols', 'skip'),
      syncers.maybe(syncers.toDecimal)
    ),
    rows: pipe(
      syncers.xmlAttribute('colSpan', 'skip'),
      syncers.maybe(syncers.toDecimal)
    ),
    /*
     * In sp6, if false, might make the field invisible. Not used by sp7
     * as it is not implemented consistently by sp6
     */
    legacyVisible: pipe(
      syncers.xmlAttribute('visible', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
    // When invisible, field is rendered with visibility="hidden"
    invisible: pipe(
      syncers.xmlAttribute('visible', 'skip'),
      syncers.maybe(syncers.toBoolean),
      syncers.default<boolean>(false)
    ),
    // In sp6, if true, disconnects the field from the database
    legacyIgnore: pipe(
      syncers.xmlAttribute('ignore', 'skip'),
      syncers.maybe(syncers.toBoolean)
    ),
  })
);

export const exportsForTests = {
  tablesWithFormTable,
};
