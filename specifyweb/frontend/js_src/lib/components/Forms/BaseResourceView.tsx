import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useId } from '../../hooks/useId';
import { useStateForContext } from '../../hooks/useStateForContext';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { Form } from '../Atoms/Form';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import { softFail } from '../Errors/Crash';
import { FormMeta } from '../FormMeta';
import type { FormMode } from '../FormParse';
import { LoadingScreen } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { displaySpecifyNetwork, SpecifyNetworkBadge } from '../SpecifyNetwork';
import { usePref } from '../UserPreferences/usePref';
import { format } from './dataObjFormatters';
import { SpecifyForm } from './SpecifyForm';
import { useViewDefinition } from './useViewDefinition';

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
  readonly title: LocalizedString;
  readonly formatted: LocalizedString;
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
  const [formatted, setFormatted] = React.useState<LocalizedString>('');
  React.useEffect(() => {
    setFormatted(resource?.specifyModel.label ?? commonText.loading());
    return typeof resource === 'object'
      ? resourceOn(
          resource,
          'change',
          (): void => {
            if (resource === undefined) return undefined;
            format(resource)
              .then((title) => {
                setFormatted(title ?? '');
                return undefined;
              })
              .catch(softFail);
          },
          true
        )
      : undefined;
  }, [resource]);

  const id = useId('resource-view');
  const [form, setForm] = React.useState<HTMLFormElement | null>(null);
  const formMeta = useStateForContext<FormMetaType>({
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
      <SpecifyForm
        display={isSubForm ? 'inline' : 'block'}
        isLoading={isLoading}
        resource={resource}
        viewDefinition={viewDefinition}
      />
    ) : isLoading === true ? (
      <LoadingScreen />
    ) : (
      <p>{formsText.noData()}</p>
    );

  const [tableNameInTitle] = usePref('form', 'behavior', 'tableNameInTitle');
  const [formHeaderFormat] = usePref('form', 'behavior', 'formHeaderFormat');
  const formattedTableName =
    resource === undefined
      ? ''
      : resource.isNew()
      ? formsText.newResourceTitle({ tableName: resource.specifyModel.label })
      : resource.specifyModel.label;
  const title =
    formatted.length > 0
      ? commonText.colonLine({
          label: formattedTableName,
          value: formatted,
        })
      : formattedTableName;

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
          <Form
            className={`h-full ${className ?? ''}`}
            forwardRef={setForm}
            id={id('form')}
          >
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

export type FormMetaType = {
  /*
   * Whether user tried to submit a form. This causes deferred save blockers
   * to appear
   */
  readonly triedToSubmit: boolean;
};
export const FormContext = React.createContext<
  readonly [
    meta: FormMetaType,
    setMeta:
      | ((
          newState: FormMetaType | ((oldMeta: FormMetaType) => FormMetaType)
        ) => void)
      | undefined
  ]
>([
  {
    triedToSubmit: false,
  },
  undefined,
]);
FormContext.displayName = 'FormContext';
