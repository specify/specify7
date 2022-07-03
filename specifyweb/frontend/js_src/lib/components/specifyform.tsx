/**
 * Renderer for Specify forms
 */

import React from 'react';

import { Http } from '../ajax';
import { error } from '../assert';
import type { AnySchema } from '../datamodelutils';
import { f } from '../functools';
import { autoGenerateViewDefinition } from '../generateformdefinitions';
import type { SpecifyResource } from '../legacytypes';
import type { FormMode, FormType, ViewDescription } from '../parseform';
import { getView, parseViewDefinition } from '../parseform';
import { setCurrentComponent } from '../specifyapp';
import type { SpecifyModel } from '../specifymodel';
import { hijackBackboneAjax } from '../startapp';
import { webOnlyViews } from '../webonlyviews';
import { DataEntry } from './basic';
import { useAsyncState, useId } from './hooks';
import { NotFoundView } from './notfoundview';
import { usePref } from './preferenceshooks';
import { loadingGif } from './queryresultstable';
import { FormCell } from './specifyformcell';

/**
 * By default, Specify 7 replaces all ObjectAttachment forms with
 * AttachmentPlugin. To see the original form, render SpecifyForm with
 * viewName=originalAttachmentsView
 */
export const originalAttachmentsView = 'originalObjectAttachment';

/**
 * A hook to get information needed to display a form
 * Can be used independently of <SpecifyForm> if need to get form definition
 * for alternative purposes (i.e a different renderer)
 */
export function useViewDefinition({
  model,
  viewName = model.view,
  formType,
  mode,
}: {
  readonly model: SpecifyModel;
  readonly viewName?: string;
  readonly formType: FormType;
  readonly mode: FormMode;
}): ViewDescription | undefined {
  const [viewDefinition] = useAsyncState<ViewDescription>(
    React.useCallback(
      async () =>
        viewName === 'ObjectAttachment'
          ? {
              ...webOnlyViews().ObjectAttachment,
              model,
              formType,
              mode,
            }
          : getView(
              viewName === originalAttachmentsView
                ? 'ObjectAttachment'
                : viewName
            )
              .then((viewDefinition) =>
                typeof viewDefinition === 'object'
                  ? parseViewDefinition(viewDefinition, formType, mode)
                  : undefined
              )
              .then((viewDefinition) =>
                typeof viewDefinition === 'object'
                  ? viewDefinition.model === model
                    ? viewDefinition
                    : error(
                        'View definition model does not match resource model'
                      )
                  : f.maybe(
                      webOnlyViews()[viewName as keyof typeof webOnlyViews],
                      ({ columns, rows }) => ({
                        columns,
                        rows,
                        formType,
                        mode,
                        model,
                      })
                    ) ?? autoGenerateViewDefinition(model, formType, mode)
              ),
      [viewName, formType, mode, model]
    ),
    false
  );
  return viewDefinition;
}

/** Renders a form and populates it with data from a resource */
export function SpecifyForm({
  isLoading,
  resource,
  viewName = resource.specifyModel.view,
  formType,
  mode,
  display,
}: {
  readonly isLoading?: boolean;
  readonly resource: SpecifyResource<AnySchema>;
  readonly viewName?: string;
  readonly formType: FormType;
  readonly mode: FormMode;
  readonly display: 'inline' | 'block';
}): JSX.Element {
  const viewDefinition = useViewDefinition({
    model: resource.specifyModel,
    viewName,
    formType,
    mode,
  });

  return (
    <RenderForm
      isLoading={isLoading}
      resource={resource}
      viewDefinition={viewDefinition}
      display={display}
    />
  );
}

const FormLoadingContext = React.createContext<boolean>(false);
FormLoadingContext.displayName = 'FormLoadingContext';

/**
 * Renders a form from ViewDescription
 * Useful when need to render a hard-coded front-end only form
 */
export function RenderForm<SCHEMA extends AnySchema>({
  isLoading,
  resource,
  viewDefinition,
  display,
}: {
  readonly isLoading?: boolean;
  readonly resource: SpecifyResource<SCHEMA>;
  readonly viewDefinition: ViewDescription | undefined;
  readonly display: 'inline' | 'block';
}): JSX.Element {
  const id = useId(
    `form-${resource.specifyModel.name ?? viewDefinition?.model?.name ?? ''}`
  );
  const oldResourceRef = React.useRef<SpecifyResource<SCHEMA> | undefined>(
    undefined
  );
  React.useEffect(
    () => () => {
      oldResourceRef.current = resource;
    },
    [resource]
  );

  const [loadedResource] = useAsyncState(
    React.useCallback(
      async () =>
        hijackBackboneAjax(
          [Http.OK, Http.NOT_FOUND],
          async () => resource.fetch(),
          (status) =>
            status === Http.NOT_FOUND
              ? setCurrentComponent(<NotFoundView />)
              : undefined
        ),
      [resource]
    ),
    false
  );
  const isShowingOldResource =
    loadedResource === undefined && typeof oldResourceRef.current === 'object';
  const resolvedResource = loadedResource ?? oldResourceRef.current;
  const formIsLoaded =
    typeof viewDefinition === 'object' && typeof resolvedResource === 'object';

  // If parent resource is loading, don't duplicate the loading bar in children
  const isAlreadyLoading = React.useContext(FormLoadingContext);
  const showLoading =
    !formIsLoaded ||
    (!isAlreadyLoading && (isLoading === true || isShowingOldResource));
  const [flexibleColumnWidth] = usePref(
    'form',
    'definition',
    'flexibleColumnWidth'
  );
  return (
    <FormLoadingContext.Provider value={isAlreadyLoading || showLoading}>
      <div className={`overflow-auto ${showLoading ? 'relative' : ''}`}>
        {showLoading && (
          <div
            className={`${
              /*
               * If form is not yet visible, the logo should be reserving
               * some space for itself so as not to overlap with the
               * form header and the save button
               */
              formIsLoaded ? 'absolute' : ''
            } z-10 flex items-center justify-center w-full h-full`}
          >
            {loadingGif}
          </div>
        )}
        {formIsLoaded && (
          <DataEntry.Grid
            viewDefinition={viewDefinition}
            aria-hidden={showLoading}
            className={
              showLoading ? 'opacity-50 pointer-events-none' : undefined
            }
            flexibleColumnWidth={flexibleColumnWidth}
            display={viewDefinition?.columns.length === 1 ? 'block' : display}
          >
            {viewDefinition.rows.map((cells, index) => (
              <React.Fragment key={index}>
                {/*
                 * This is used to help with debugging only. Previous implementation
                 * was wrapping row in div.contents, but that caused elements
                 * within to be not focusable when rendered inside a dialog because
                 * of this bug: https://github.com/reactjs/react-modal/issues/905
                 */}
                {process.env.NODE_ENV !== 'production' && (
                  <span
                    className="contents"
                    aria-hidden
                    data--row-index={index}
                  />
                )}
                {cells.map(
                  (
                    { colSpan, align, visible, id: cellId, ...cellData },
                    index
                  ) => (
                    <DataEntry.Cell
                      key={index}
                      colSpan={colSpan}
                      align={align}
                      visible={visible}
                    >
                      <FormCell
                        align={align}
                        resource={resolvedResource}
                        mode={viewDefinition.mode}
                        formType={viewDefinition.formType}
                        cellData={cellData}
                        id={cellId}
                        formatId={id}
                      />
                    </DataEntry.Cell>
                  )
                )}
              </React.Fragment>
            ))}
          </DataEntry.Grid>
        )}
      </div>
    </FormLoadingContext.Provider>
  );
}
