/**
 * Renderer for Specify forms
 */

import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { useId } from '../../hooks/useId';
import { hijackBackboneAjax } from '../../utils/ajax/backboneAjax';
import { Http } from '../../utils/ajax/definitions';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { DataEntry } from '../Atoms/DataEntry';
import { AttachmentsPlugin } from '../Attachments/Plugin';
import { ReadOnlyContext, SearchDialogContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { FormCell } from '../FormCells';
import type { ViewDescription } from '../FormParse';
import { attachmentView } from '../FormParse/webOnlyViews';
import { loadingGif } from '../Molecules';
import { userPreferences } from '../Preferences/userPreferences';
import { unsafeTriggerNotFound } from '../Router/Router';
import { FormSkeleton } from '../SkeletonLoaders/Form';

const SpecifyFormContext = React.createContext<{
  // Used to avoid duplicate loading bars
  readonly isLoading: boolean;
  // Used to detect recursion
  readonly parents: RA<string>;
}>({ isLoading: false, parents: [] });
SpecifyFormContext.displayName = 'SpecifyFormContext';

/**
 * Renders a form from ViewDescription and populates it with data from the
 * resource
 */
export function SpecifyForm<SCHEMA extends AnySchema>({
  isLoading = false,
  resource,
  viewDefinition,
  display,
  containerRef,
}: {
  readonly isLoading?: boolean;
  readonly resource: SpecifyResource<SCHEMA>;
  readonly viewDefinition: ViewDescription | undefined;
  readonly display: 'block' | 'inline';
  readonly containerRef?: React.RefObject<HTMLDivElement>;
}): JSX.Element {
  const id = useId(
    `form-${resource.specifyTable.name ?? viewDefinition?.table?.name ?? ''}`
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
          [Http.NOT_FOUND],
          async () => resource.fetch(),
          (status) =>
            status === Http.NOT_FOUND ? unsafeTriggerNotFound() : undefined
        ),
      [resource]
    ),
    false
  );
  useErrorContext('loadedResource', loadedResource);

  const isShowingOldResource =
    loadedResource === undefined && typeof oldResourceRef.current === 'object';
  const resolvedResource = loadedResource ?? oldResourceRef.current;
  const formIsLoaded =
    typeof viewDefinition === 'object' && typeof resolvedResource === 'object';

  // If parent resource is loading, don't duplicate the loading bar in children
  const formContext = React.useContext(SpecifyFormContext);
  const isAlreadyLoading = formContext.isLoading;
  const showLoading = !isAlreadyLoading && (isLoading || isShowingOldResource);
  const viewName = viewDefinition?.name;
  const newFormContext = React.useMemo(
    () => ({
      isLoading: isAlreadyLoading || showLoading,
      parents: filterArray([...formContext.parents, viewName]),
    }),
    [formContext, isAlreadyLoading, showLoading, viewName]
  );
  const [flexibleColumnWidth] = userPreferences.use(
    'form',
    'definition',
    'flexibleColumnWidth'
  );

  const isReadOnly =
    React.useContext(ReadOnlyContext) || viewDefinition?.mode === 'view';
  const isInSearchDialog =
    React.useContext(SearchDialogContext) || viewDefinition?.mode === 'search';
  const [language] = userPreferences.use('form', 'schema', 'language');

  return viewDefinition?.name === attachmentView ? (
    <AttachmentsPlugin resource={resource} />
  ) : (
    <SpecifyFormContext.Provider value={newFormContext}>
      <div
        className={`
          shrink-0
          overflow-auto
          ${showLoading ? 'relative' : ''}
        `}
        lang={language}
      >
        {showLoading && (
          <div
            className={`
               z-10 flex h-full w-full items-center justify-center
               ${
                 /*
                  * If form is not yet visible, the logo should be reserving
                  * some space for itself so as not to overlap with the
                  * form header and the save button
                  */
                 formIsLoaded ? 'absolute' : ''
               }
             `}
          >
            {loadingGif}
          </div>
        )}
        {formIsLoaded ? (
          <DataEntry.Grid
            aria-hidden={showLoading}
            className={`
              w-full 
              ${showLoading ? 'pointer-events-none opacity-50' : ''}
            `}
            display={viewDefinition?.columns.length === 1 ? 'block' : display}
            flexibleColumnWidth={flexibleColumnWidth}
            viewDefinition={viewDefinition}
            forwardRef={containerRef}
            // This shouldn't be an error
          >
            <ReadOnlyContext.Provider value={isReadOnly}>
              <SearchDialogContext.Provider value={isInSearchDialog}>
                {viewDefinition.rows.map((cells, index) => (
                  <React.Fragment key={index}>
                    {cells.map(
                      (
                        {
                          colSpan,
                          align,
                          visible,
                          verticalAlign,
                          id: cellId,
                          ...cellData
                        },
                        index
                      ) => (
                        <DataEntry.Cell
                          align={align}
                          colSpan={colSpan}
                          key={index}
                          verticalAlign={verticalAlign}
                          visible={visible}
                        >
                          <FormCell
                            align={align}
                            cellData={cellData}
                            formatId={id}
                            formType={viewDefinition.formType}
                            id={cellId}
                            resource={resolvedResource}
                            verticalAlign={verticalAlign}
                          />
                        </DataEntry.Cell>
                      )
                    )}
                  </React.Fragment>
                ))}
              </SearchDialogContext.Provider>
            </ReadOnlyContext.Provider>
          </DataEntry.Grid>
        ) : (
          <FormSkeleton />
        )}
      </div>
    </SpecifyFormContext.Provider>
  );
}

export function useFirstFocus(
  form: React.RefObject<HTMLDivElement | HTMLElement | null>
) {
  const [focusFirstFieldPref] = userPreferences.use(
    'form',
    'behavior',
    'focusFirstField'
  );

  const refTimeout = React.useRef<ReturnType<typeof setTimeout>>();

  return React.useCallback(() => {
    if (!focusFirstFieldPref) return;
    // Timeout needed to wait for the form to be render and find the first focusubale element
    clearTimeout(refTimeout.current);
    refTimeout.current = setTimeout(() => {
      const firstFocusableElement = form.current?.querySelector<HTMLElement>(
        'button, a, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
      )!;

      firstFocusableElement?.focus();
    }, 100);
  }, [focusFirstFieldPref]);
}
