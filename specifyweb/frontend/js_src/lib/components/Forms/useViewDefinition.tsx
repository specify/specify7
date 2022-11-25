import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { f } from '../../utils/functools';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { error } from '../Errors/assert';
import type { FormMode, FormType, ViewDescription } from '../FormParse';
import { fetchView, parseViewDefinition } from '../FormParse';
import { webOnlyViews } from '../FormParse/webOnlyViews';
import { usePref } from '../UserPreferences/usePref';
import { autoGenerateViewDefinition } from './generateFormDefinition';

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
  formType,
  mode,
}: {
  readonly model: SpecifyModel | undefined;
  readonly viewName?: string;
  readonly formType: FormType;
  readonly mode: FormMode;
}): ViewDescription | undefined {
  const [globalConfig] = usePref('form', 'preferences', 'useCustomForm');
  const useGeneratedForm = globalConfig[model?.name ?? 'Agent'] === false;
  const [viewDefinition] = useAsyncState<ViewDescription>(
    React.useCallback(async () => {
      if (model === undefined) return undefined;
      else if (viewName === 'ObjectAttachment')
        return {
          ...webOnlyViews().ObjectAttachment,
          model,
          formType,
          mode,
        };
      else if (useGeneratedForm)
        return autoGenerateViewDefinition(model, formType, mode);
      const resolvedViewName = viewName ?? model.view;
      return fetchView(
        resolvedViewName === originalAttachmentsView
          ? 'ObjectAttachment'
          : resolvedViewName
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
              : error('View definition model does not match resource model')
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
        );
    }, [useGeneratedForm, viewName, formType, mode, model]),
    false
  );

  useErrorContext('viewDefinition', viewDefinition);
  return viewDefinition;
}
