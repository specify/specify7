import React from 'react';
import { useOutletContext } from 'react-router';
import { useNavigate, useParams } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { removeItem, replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { ReadOnlyContext } from '../Core/Contexts';
import { getTable } from '../DataModel/tables';
import { TableIcon } from '../Molecules/TableIcon';
import { NotFoundView } from '../Router/NotFoundView';
import { resolveRelative } from '../Router/queryString';
import type { FormEditorOutlet } from './index';
import { FormEditorContext } from './index';
import { getViewDefinitions } from './View';
import { jsonToXml, XmlNode, xmlToJson } from '../Syncer/xmlToJson';
import { GetSet } from '../../utils/types';
import { generateXmlEditor } from '../AppResources/TabDefinitions';
import { formDefinitionSpec } from './viewSpec';
import { xmlToString } from '../Syncer/xmlUtils';
import { formatXmlNode } from '../Syncer/formatXmlNode';
import { parseXml } from '../AppResources/codeMirrorLinters';
import _ from 'underscore';

export function FormEditorWrapper(): JSX.Element {
  const {
    tableName = '',
    viewName = '',
    viewDefinitionName = '',
  } = useParams();
  const table = getTable(tableName);
  const {
    viewSets: [viewSets, setViewSets],
  } = useOutletContext<FormEditorOutlet>();
  const view = React.useMemo(
    () =>
      viewSets.views.find(
        (view) => view.name === viewName && view.table === table
      ),
    [viewSets.views, viewName, table]
  );
  const viewDefinitionIndex = viewSets.viewDefs.findIndex(
    (viewDefinition) =>
      viewDefinition.name === viewDefinitionName &&
      viewDefinition.table === table
  );
  const viewDefinition = viewSets.viewDefs[viewDefinitionIndex];

  const isReadOnly = React.useContext(ReadOnlyContext);
  const navigate = useNavigate();

  return table === undefined ||
    view === undefined ||
    viewDefinition === undefined ? (
    <NotFoundView />
  ) : (
    <div className="flex flex-1 flex-col gap-2 overflow-auto">
      <div className="flex items-center gap-2">
        <h4
          className={`${className.headerPrimary} flex items-center gap-2 text-xl`}
        >
          <TableIcon label name={table.name} />
          {viewDefinition.name}
        </h4>
        <span className="-ml-2 flex-1" />
        {!isReadOnly && (
          <Button.Red
            onClick={(): void => {
              const newView = {
                ...view,
                altViews: {
                  ...view.altViews,
                  altViews: view.altViews.altViews.filter(
                    ({ viewDef }) => viewDef !== viewDefinition.name
                  ),
                },
              };
              const newViewDefs = removeItem(
                viewSets.viewDefs,
                viewDefinitionIndex
              );
              const remainingDefinitions = getViewDefinitions(
                newView,
                newViewDefs
              );
              const viewIndex = viewSets.views.indexOf(newView);
              setViewSets({
                ...viewSets,
                views:
                  // Remove view if there are no more view definitions
                  remainingDefinitions.length === 0
                    ? removeItem(viewSets.views, viewIndex)
                    : replaceItem(viewSets.views, viewIndex, newView),
                viewDefs: newViewDefs,
              });
              navigate(resolveRelative(`../../`));
            }}
          >
            {commonText.delete()}
          </Button.Red>
        )}
      </div>
      <Link.Default href={resolveRelative(`../../`)}>
        {icons.arrowLeft}
        {table.name}
      </Link.Default>
      <Editor
        key={`${tableName}_${viewName}_${viewDefinitionName}`}
        viewDefinition={[
          viewDefinition.raw,
          (raw): void =>
            setViewSets({
              ...viewSets,
              viewDefs: replaceItem(viewSets.viewDefs, viewDefinitionIndex, {
                ...viewDefinition,
                raw,
              }),
            }),
        ]}
      />
    </div>
  );
}

const XmlEditor = generateXmlEditor(formDefinitionSpec);
const debounceRate = 100;

/*
 * FIXME: handle rename. ensure name is unique
 * FIXME: show description
 * FIXME: allow editing column size definitions
 * FIXME: allow editing row size definitions
 * FIXME: allow editing business rules
 * FIXME: allow editing rows definitions
 * FIXME: show a live preview
 */
function Editor({
  viewDefinition: [definition, setDefinition],
}: {
  readonly viewDefinition: GetSet<XmlNode>;
}): JSX.Element {
  const initialXml = React.useMemo(
    () => xmlToString(jsonToXml(formatXmlNode(definition))),
    // Run this only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [xml, setXml] = React.useState(initialXml);

  const setRef = React.useRef(setDefinition);
  setRef.current = setDefinition;
  const update = React.useMemo(
    () =>
      _.debounce((node: string) => {
        const parsed = parseXml(node);
        if (typeof parsed === 'object') setRef.current(xmlToJson(parsed));
      }, debounceRate),
    []
  );

  function handleChange(xml: string): void {
    setXml(xml);
    update(xml);
  }

  const { appResource, resource, showValidationRef, directory } =
    React.useContext(FormEditorContext)!;
  return (
    <div className="flex-1 overflow-auto">
      <XmlEditor
        data={xml}
        onChange={handleChange}
        appResource={appResource}
        showValidationRef={showValidationRef}
        resource={resource}
        directory={directory}
      />
    </div>
  );
}
