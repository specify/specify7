import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { f } from '../../utils/functools';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { softFail } from '../Errors/Crash';
import type { FormMode, FormType, ViewDescription } from '../FormParse';
import { fetchView, parseViewDefinition } from '../FormParse';
import { attachmentView, webOnlyViews } from '../FormParse/webOnlyViews';
import { autoGenerateViewDefinition } from './generateFormDefinition';
import { userPreferences } from '../Preferences/userPreferences';

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
  viewName,
  // If can't find the view by viewName, could use a fallback view name
  fallbackViewName,
  formType,
  mode,
}: {
  readonly model: SpecifyModel | undefined;
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
    Array.isArray(globalConfig) && f.includes(globalConfig, model?.name);
  const [viewDefinition] = useAsyncState<ViewDescription>(
    React.useCallback(async () => {
      if (model === undefined) return undefined;
      else if (viewName === attachmentView)
        return {
          ...webOnlyViews()[attachmentView],
          model,
          name: attachmentView,
          formType,
          mode,
        };
      else if (useGeneratedForm)
        return autoGenerateViewDefinition(model, formType, mode);
      const resolvedViewName = viewName || model.view;
      return fetchViewDefinition(resolvedViewName, model, formType, mode)
        .then(
          (definition) =>
            definition ??
            (typeof fallbackViewName === 'string' &&
            fallbackViewName !== resolvedViewName &&
            fallbackViewName !== attachmentView
              ? fetchViewDefinition(fallbackViewName, model, formType, mode)
              : undefined)
        )
        .then(
          (definition) =>
            definition ?? autoGenerateViewDefinition(model, formType, mode)
        );
    }, [useGeneratedForm, viewName, formType, mode, model]),
    false
  );

  useErrorContext('viewDefinition', viewDefinition);
  return viewDefinition;
}

const fetchViewDefinition = async (
  viewName: string,
  model: SpecifyModel,
  formType: FormType,
  mode: FormMode
): Promise<ViewDescription | undefined> =>
  fetchView(
    viewName === originalAttachmentsView ? 'ObjectAttachment' : viewName
  )
    .then((viewDefinition) =>
      typeof viewDefinition === 'object'
        ? parseViewDefinition(viewDefinition, formType, mode)
        : undefined
    )
    .then((viewDefinition) => {
      if (typeof viewDefinition === 'object') {
        if (viewDefinition.model !== model)
          softFail(
            new Error('View definition model does not match resource model')
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
            model,
          })
        );
    });
