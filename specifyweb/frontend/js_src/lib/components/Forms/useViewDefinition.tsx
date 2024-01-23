import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { f } from '../../utils/functools';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { softFail } from '../Errors/Crash';
import type { FormMode, FormType, ViewDescription } from '../FormParse';
import { fetchView, parseViewDefinition } from '../FormParse';
import { attachmentView, webOnlyViews } from '../FormParse/webOnlyViews';
import { userPreferences } from '../Preferences/userPreferences';
import { autoGenerateViewDefinition } from './generateFormDefinition';

/**
 * By default, Specify 7 replaces all ObjectAttachment forms with
 * AttachmentPlugin. To see the original form, render SpecifyForm with
 * viewName=originalAttachmentsView
 */
export const originalAttachmentsView = 'originalObjectAttachment';

export const propsToFormMode = (
  isReadOnly: boolean,
  isInSearchDialog: boolean
): FormMode => (isInSearchDialog ? 'search' : isReadOnly ? 'view' : 'edit');

/**
 * A hook to get information needed to display a form
 * Can be used independently of <SpecifyForm> if need to get form definition
 * for alternative purposes (i.e a different renderer)
 */
export function useViewDefinition({
  table,
  viewName,
  // If can't find the view by viewName, could use a fallback view name
  fallbackViewName,
  formType,
  mode,
}: {
  readonly table: SpecifyTable | undefined;
  readonly viewName?: string;
  readonly fallbackViewName?: string;
  readonly formType: FormType;
  readonly mode: FormMode;
}): ViewDescription | undefined {
  const [globalConfig] = userPreferences.use(
    'form',
    'preferences',
    'useCustomForm'
  );
  const useGeneratedForm =
    Array.isArray(globalConfig) && f.includes(globalConfig, table?.name);
  const [viewDefinition] = useAsyncState<ViewDescription>(
    React.useCallback(async () => {
      if (table === undefined) return undefined;
      else if (viewName === attachmentView)
        return {
          ...webOnlyViews()[attachmentView],
          table,
          name: attachmentView,
          formType,
          mode,
        };
      else if (useGeneratedForm)
        return autoGenerateViewDefinition(table, formType, mode);
      const resolvedViewName = viewName ?? table.view;
      return fetchViewDefinition(resolvedViewName, table, formType, mode)
        .then(
          async (definition) =>
            definition ??
            (typeof fallbackViewName === 'string' &&
            fallbackViewName !== resolvedViewName &&
            fallbackViewName !== attachmentView
              ? fetchViewDefinition(fallbackViewName, table, formType, mode)
              : undefined)
        )
        .then(
          (definition) =>
            definition ?? autoGenerateViewDefinition(table, formType, mode)
        );
    }, [useGeneratedForm, viewName, formType, mode, table, fallbackViewName]),
    false
  );

  useErrorContext('viewDefinition', viewDefinition);
  return viewDefinition;
}

const fetchViewDefinition = async (
  viewName: string,
  table: SpecifyTable,
  formType: FormType,
  mode: FormMode
): Promise<ViewDescription | undefined> =>
  fetchView(
    viewName === originalAttachmentsView ? 'ObjectAttachment' : viewName
  )
    .then((viewDefinition) =>
      typeof viewDefinition === 'object'
        ? parseViewDefinition(viewDefinition, formType, mode, table)
        : undefined
    )
    .then((viewDefinition) => {
      if (typeof viewDefinition === 'object') {
        if (viewDefinition.table !== table)
          softFail(
            new Error('View definition table does not match resource table')
          );
        return viewName === originalAttachmentsView
          ? {
              ...viewDefinition,
              name: originalAttachmentsView,
            }
          : viewDefinition;
      } else
        return f.maybe(
          webOnlyViews()[viewName as keyof typeof webOnlyViews],
          ({ columns, rows }) => ({
            columns,
            rows,
            name: '',
            formType,
            mode,
            table,
          })
        );
    });
