import React from 'react';
import { useOutletContext } from 'react-router';
import { useNavigate, useParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';
import _ from 'underscore';

import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import type { GetSet } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { parseXml } from '../AppResources/codeMirrorLinters';
import { generateXmlEditor } from '../AppResources/TabDefinitions';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { ReadOnlyContext } from '../Core/Contexts';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTable } from '../DataModel/tables';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import type { ViewDescription } from '../FormParse';
import { parseViewDefinition } from '../FormParse';
import { SpecifyForm } from '../Forms/SpecifyForm';
import { TableIcon } from '../Molecules/TableIcon';
import { NotFoundView } from '../Router/NotFoundView';
import { resolveRelative } from '../Router/queryString';
import { formatXmlNode } from '../Syncer/formatXmlNode';
import type { XmlNode } from '../Syncer/xmlToJson';
import { jsonToXml, xmlToJson } from '../Syncer/xmlToJson';
import { xmlToString } from '../Syncer/xmlUtils';
import type { FormEditorOutlet } from './index';
import { FormEditorContext } from './index';
import { getViewDefinitions } from './View';
import { formDefinitionSpec } from './viewSpec';

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
  const [layout = 'horizontal', setLayout] = useCachedState(
    'formEditor',
    'layout'
  );
  const buttonTitle =
    layout === 'vertical'
      ? userText.switchToHorizontalLayout()
      : userText.switchToVerticalLayout();

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
              },[viewName]);
              navigate(resolveRelative(`../../`));
            }}
          >
            {commonText.delete()}
          </Button.Red>
        )}
      </div>
      <div className="flex flex-wrap gap-4">
        <Link.Default href={resolveRelative(`../../`)}>
          {icons.arrowLeft}
          {table.name}
        </Link.Default>
        <Button.Small
          aria-label={buttonTitle}
          title={buttonTitle}
          variant={className.blueButton}
          onClick={(): void =>
            setLayout(layout === 'vertical' ? 'horizontal' : 'vertical')
          }
        >
          {layout === 'horizontal'
            ? icons.switchVertical
            : icons.switchHorizontal}
        </Button.Small>
      </div>
      <Editor
        key={`${tableName}_${viewName}_${viewDefinitionName}`}
        table={table}
        viewDefinition={[
          viewDefinition.raw,
          (raw): void =>
            setViewSets({
              ...viewSets,
              viewDefs: replaceItem(viewSets.viewDefs, viewDefinitionIndex, {
                ...viewDefinition,
                raw,
              }),
            },[viewName]),
        ]}
      />
    </div>
  );
}

const debounceRate = 100;

/*
 * FIXME: handle rename. ensure name is unique
 * FIXME: show description
 * FIXME: allow editing column size definitions
 * FIXME: allow editing row size definitions
 * FIXME: allow editing business rules
 * FIXME: allow editing rows definitions
 */
function Editor({
  viewDefinition: [definition, setDefinition],
  table,
}: {
  readonly viewDefinition: GetSet<XmlNode>;
  readonly table: SpecifyTable;
}): JSX.Element {
  const initialXml = React.useMemo(
    () =>
      xmlToString(
        jsonToXml(
          formatXmlNode({
            ...definition,
            /*
             * Don't allow editing view definition attributes (for simplicity,
             * but also because there aren't many use cases for editing them -
             * sp7 does not support most of them)
             */
            attributes: {},
          })
        ),
        false
      ),
    // Run this only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [xml, setXml] = React.useState(initialXml);

  const updateRef = React.useRef(setDefinition);
  updateRef.current = setDefinition;
  const update = React.useMemo(
    () =>
      _.debounce((node: string) => {
        const parsed = parseXml(node);
        if (typeof parsed === 'object') updateRef.current(xmlToJson(parsed));
      }, debounceRate),
    []
  );

  const XmlEditor = React.useMemo(
    () => generateXmlEditor(() => formDefinitionSpec(table)),
    [table]
  );

  function handleChange(xml: string): void {
    setXml(xml);
    update(xml);
  }

  const [layout = 'horizontal'] = useCachedState('formEditor', 'layout');

  const { appResource, resource, showValidationRef, directory } =
    React.useContext(FormEditorContext)!;
  return (
    <div
      className={`
        flex flex-1 gap-4 
        ${
          layout === 'horizontal' ? 'overflow-auto' : 'flex-col overflow-hidden'
        }
      `}
    >
      <XmlEditor
        appResource={appResource}
        data={xml}
        directory={directory}
        resource={resource}
        showValidationRef={showValidationRef}
        className={layout === 'horizontal' ? '' : 'max-h-[50%] overflow-auto'}
        onChange={handleChange}
      />
      <ErrorBoundary dismissible>
        <FormPreview table={table} xml={xml} />
      </ErrorBoundary>
    </div>
  );
}

/*
 * FIXME: once form parsing is rewriten, instead of running spec again here,
 *  make it piggy back on the one from XmlEditor
 */
function FormPreview({
  xml,
  table,
}: {
  readonly xml: LocalizedString;
  readonly table: SpecifyTable;
}): JSX.Element {
  const [viewDefinition, setViewDefinition] = React.useState<
    ViewDescription | undefined
  >(undefined);
  React.useEffect(() => {
    try {
      const parsed = parseViewDefinition(
        {
          altviews: {
            [table.name]: {
              default: 'true',
              mode: 'edit',
              name: '',
              viewdef: table.name,
            },
          },
          busrules: '',
          class: table.longName,
          name: table.name,
          resourcelabels: 'true',
          viewdefs: {
            [table.name]: xml,
          },
          viewsetLevel: '',
          viewsetName: '',
          viewsetSource: '',
          viewsetId: null,
        },
        'form',
        'edit',
        table
      );
      setViewDefinition(parsed);
    } catch {}
  }, [xml, table]);
  const resource = React.useMemo(() => new table.Resource(), [table]);
  const [layout = 'horizontal'] = useCachedState('formEditor', 'layout');
  return (
    <div
      className={`flex flex-col gap-2 ${
        layout === 'horizontal' ? 'max-w-[50%]' : 'max-h-[50%]'
      }`}
    >
      <SpecifyForm
        display="block"
        resource={resource}
        viewDefinition={viewDefinition}
      />
    </div>
  );
}
