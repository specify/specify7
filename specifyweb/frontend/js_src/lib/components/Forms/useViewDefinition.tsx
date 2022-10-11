import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { f } from '../../utils/functools';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { error } from '../Errors/assert';
import type { FormMode, FormType, ViewDescription } from '../FormParse';
import { fetchView, parseViewDefinition } from '../FormParse';
import { webOnlyViews } from '../FormParse/webOnlyViews';
import { autoGenerateViewDefinition } from './generateFormDefinition';
import { originalAttachmentsView } from './SpecifyForm';
import { usePref } from '../UserPreferences/usePref';

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
  const [globalConfig] = usePref('form', 'preferences', 'useCustomForm');
  const useCustomForm = globalConfig[model.name] ?? true;
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
          : useCustomForm
          ? fetchView(
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
              )
          : autoGenerateViewDefinition(model, formType, mode),
      [useCustomForm, viewName, formType, mode, model]
    ),
    false
  );

  useErrorContext('viewDefinition', viewDefinition);
  return viewDefinition;
}
