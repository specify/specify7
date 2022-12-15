import React from 'react';

import { useStableState } from '../../hooks/useContextState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { Form } from '../Atoms/Form';
import type { FormMetaType } from '../Core/Contexts';
import { FormContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import { fail } from '../Errors/Crash';
import { FormMeta } from '../FormMeta';
import type { FormMode } from '../FormParse';
import { TableIcon } from '../Molecules/TableIcon';
import { displaySpecifyNetwork, SpecifyNetworkBadge } from '../SpecifyNetwork';
import { usePref } from '../UserPreferences/usePref';
import { format } from './dataObjFormatters';
import { RenderForm } from './SpecifyForm';
import { useViewDefinition } from './useViewDefinition';
import { LoadingScreen } from '../Molecules/Dialog';

export type ResourceViewProps<SCHEMA extends AnySchema> = {
  readonly isLoading?: boolean;
  readonly resource: SpecifyResource<SCHEMA> | undefined;
  readonly mode: FormMode;
  readonly viewName?: string;
  readonly isSubForm: boolean;
};

export type ResourceViewState = {
  readonly formElement: HTMLFormElement | null;
  readonly formPreferences: JSX.Element;
  readonly form: (children?: JSX.Element, className?: string) => JSX.Element;
  readonly title: string;
  readonly formatted: string;
  readonly jsxFormatted: JSX.Element | string;
  readonly specifyNetworkBadge: JSX.Element | undefined;
};

export function useResourceView<SCHEMA extends AnySchema>({
  isLoading,
  resource,
  mode,
  viewName = resource?.specifyModel.view,
  isSubForm,
}: ResourceViewProps<SCHEMA>): ResourceViewState {
  // Update title when resource changes
  const [formatted, setFormatted] = React.useState('');
  React.useEffect(() => {
    setFormatted(resource?.specifyModel.label ?? commonText('loading'));
    return typeof resource === 'object'
      ? resourceOn(
          resource,
          'change',
          (): void => {
            if (resource === undefined) return undefined;
            format(resource)
              .then((title = '') => {
                setFormatted(title);
                return undefined;
              })
              .catch(fail);
          },
          true
        )
      : undefined;
  }, [resource]);

  const id = useId('resource-view');
  const [form, setForm] = React.useState<HTMLFormElement | null>(null);
  const formMeta = useStableState<FormMetaType>({
    triedToSubmit: false,
  });

  const viewDefinition = useViewDefinition({
    model: resource?.specifyModel,
    viewName,
    fallbackViewName: resource?.specifyModel.view,
    formType: 'form',
    mode,
  });

  const specifyForm =
    typeof resource === 'object' ? (
      <RenderForm
        display={isSubForm ? 'inline' : 'block'}
        isLoading={isLoading}
        resource={resource}
        viewDefinition={viewDefinition}
      />
    ) : isLoading === true ? (
      <LoadingScreen />
    ) : (
      <p>{formsText('noData')}</p>
    );

  const [tableNameInTitle] = usePref('form', 'behavior', 'tableNameInTitle');
  const [formHeaderFormat] = usePref('form', 'behavior', 'formHeaderFormat');
  const title = `${
    resource === undefined
      ? ''
      : resource.isNew()
      ? formsText('newResourceTitle', resource.specifyModel.label)
      : resource.specifyModel.label
  }${formatted.length > 0 ? `: ${formatted}` : ''}`;

  return {
    formatted: tableNameInTitle ? title : formatted,
    jsxFormatted:
      formHeaderFormat === 'name' ? (
        title
      ) : (
        <>
          {typeof resource === 'object' && (
            <TableIcon label name={resource.specifyModel.name} />
          )}
          {formHeaderFormat === 'full' ? title : formatted}
        </>
      ),
    title,
    formElement: form,
    formPreferences: (
      <FormMeta resource={resource} viewDescription={viewDefinition} />
    ),
    form: (children, className) =>
      isSubForm ? (
        <>
          {specifyForm}
          {children}
        </>
      ) : (
        <FormContext.Provider value={formMeta}>
          <Form className={className} forwardRef={setForm} id={id('form')}>
            {specifyForm}
            {children}
          </Form>
        </FormContext.Provider>
      ),
    specifyNetworkBadge: displaySpecifyNetwork(resource) ? (
      <SpecifyNetworkBadge resource={resource} />
    ) : undefined,
  };
}
