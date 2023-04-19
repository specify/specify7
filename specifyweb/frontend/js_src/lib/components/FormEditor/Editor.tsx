import React from 'react';
import { useOutletContext } from 'react-router';
import { useNavigate, useParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';
import _ from 'underscore';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { f } from '../../utils/functools';
import type { GetSet } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { parseXml } from '../AppResources/codeMirrorLinters';
import { generateXmlEditor } from '../AppResources/TabDefinitions';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import {
  LoadingContext,
  ReadOnlyContext,
  useLoadingLogic,
} from '../Core/Contexts';
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
import { InFormEditorContext } from './Context';
import type { FormEditorOutlet } from './index';
import { FormEditorContext } from './index';
import { getViewDefinitionIndexes } from './Table';
import { formDefinitionSpec } from './viewSpec';

export function FormEditorWrapper(): JSX.Element {
  const { tableName = '', viewName = '' } = useParams();
  const table = getTable(tableName);
  const {
    viewSets: [viewSets, setViewSets],
  } = useOutletContext<FormEditorOutlet>();
  const viewIndex = React.useMemo(
    () =>
      viewSets.views.findIndex(
        (view) => view.name === viewName && view.table === table
      ),
    [viewSets.views, viewName, table]
  );
  const view = viewSets.views[viewIndex];
  const viewDefinitionIndex = getViewDefinitionIndexes(
    view,
    viewSets.viewDefs
  )[0];
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
    viewDefinition === undefined ||
    viewDefinitionIndex === -1 ? (
    <NotFoundView container={false} />
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
              const remainingViewDefinitions = filterArray(
                f
                  .unique(
                    view.altViews.altViews.filter(
                      ({ viewDef }) => viewDef !== viewDefinition.name
                    )
                  )
                  .map(({ name }) =>
                    viewSets.viewDefs.find(
                      (definition) => definition.name === name
                    )
                  )
              );

              const newViews = removeItem(viewSets.views, viewIndex);

              /*
               * This is unlikely, but the code checks that view definitions
               * are not used by any other view, before deleting them
               *
               * Also, rather than deleting all unused view definitions, only
               * delete the ones that would become unused after this view is
               * deleted
               */
              const usedViewDefinitions = new Set(
                newViews.flatMap(({ altViews }) =>
                  altViews.altViews.map(({ viewDef }) => viewDef)
                )
              );

              const unusedViewDefinitions = new Set(
                remainingViewDefinitions.filter(
                  ({ name }) => !usedViewDefinitions.has(name)
                )
              );

              const newViewDefs = viewSets.viewDefs.filter(
                (viewDefinition, index) =>
                  index !== viewDefinitionIndex &&
                  !unusedViewDefinitions.has(viewDefinition)
              );

              setViewSets(
                {
                  ...viewSets,
                  views: newViews,
                  viewDefs: newViewDefs,
                },
                [viewName]
              );
              navigate(resolveRelative(`../`));
            }}
          >
            {commonText.delete()}
          </Button.Red>
        )}
      </div>
      <div className="flex flex-wrap gap-4">
        <Link.Default href={resolveRelative(`../`)}>
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
        key={`${tableName}_${viewName}`}
        table={table}
        viewDefinition={[
          viewDefinition.raw,
          (raw): void =>
            setViewSets(
              {
                ...viewSets,
                viewDefs: replaceItem(viewSets.viewDefs, viewDefinitionIndex, {
                  ...viewDefinition,
                  raw: {
                    ...raw,
                    attributes: viewDefinition.raw.attributes,
                  },
                }),
              },
              [viewName]
            ),
        ]}
      />
    </div>
  );
}

const debounceRate = 100;

/**
 * Note: renaming an existing view is not allowed because the old name might be
 * used in a subview in this OR a different file. To make it worse, some
 * references to this view name in a different file might actually refer to a
 * different view by the same name (i.e, CollectionObject view, but from a
 * different collection).
 * To avoid all that complexity, renaming is not allowed. If someone really
 * needs to rename, they can create a new view with proper name based on the old
 * one and then delete the old one.
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

  // Was originally called "XmlEditor", but can't use that name due to IDE bug
  const EditXml = React.useMemo(
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
      <EditXml
        appResource={appResource}
        className={layout === 'horizontal' ? '' : 'max-h-[50%] overflow-auto'}
        data={xml}
        directory={directory}
        resource={resource}
        showValidationRef={showValidationRef}
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
          view: '',
          resourcelabels: 'true',
          viewdefs: {
            [table.name]: xml,
          },
          viewsetLevel: '',
          viewsetName: '',
          viewsetSource: '',
          viewsetFile: null,
          viewsetId: null,
        },
        'form',
        'edit',
        table
      );
      setViewDefinition(parsed);
    } catch {
      // Ignore errors, as they would already be reported by the editor
    }
  }, [xml, table]);
  const resource = React.useMemo(() => new table.Resource(), [table]);
  const [layout = 'horizontal'] = useCachedState('formEditor', 'layout');

  const [isLoading, handleLoading, handleLoaded] = useBooleanState();
  const loadingHandler = useLoadingLogic(handleLoading, handleLoaded);

  return (
    <div
      className={`flex flex-col gap-2 ${
        layout === 'horizontal' ? 'max-w-[50%]' : 'max-h-[50%]'
      }`}
    >
      <InFormEditorContext.Provider value>
        <LoadingContext.Provider value={loadingHandler}>
          <SpecifyForm
            display="block"
            isLoading={isLoading}
            resource={resource}
            viewDefinition={viewDefinition}
          />
        </LoadingContext.Provider>
      </InFormEditorContext.Provider>
    </div>
  );
}
