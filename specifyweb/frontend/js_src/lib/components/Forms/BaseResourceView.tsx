import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useId } from '../../hooks/useId';
import { useStateForContext } from '../../hooks/useStateForContext';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { localized } from '../../utils/types';
import { Form } from '../Atoms/Form';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { format } from '../Formatters/formatters';
import { FormMeta } from '../FormMeta';
import type { FormMode } from '../FormParse';
import { LoadingScreen } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { userPreferences } from '../Preferences/userPreferences';
import { displaySpecifyNetwork, SpecifyNetworkBadge } from '../SpecifyNetwork';
import { SpecifyForm, useFirstFocus } from './SpecifyForm';
import { useViewDefinition } from './useViewDefinition';

export type ResourceViewProps<SCHEMA extends AnySchema> = {
  readonly isLoading?: boolean;
  readonly resource: SpecifyResource<SCHEMA> | undefined;
  readonly mode: FormMode;
  readonly viewName?: string;
  readonly isSubForm: boolean;
  readonly containerRef?: React.RefObject<HTMLDivElement>;
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

const tableNamesToHide = new Set<keyof Tables>([
  'SpAppResource',
  'SpViewSetObj',
]);

export function useResourceView<SCHEMA extends AnySchema>({
  isLoading,
  resource,
  mode,
  viewName = resource?.specifyTable.view,
  isSubForm,
  containerRef,
}: ResourceViewProps<SCHEMA>): ResourceViewState {
  // Update title when resource changes
  const [formatted, setFormatted] = React.useState(localized(''));
  React.useEffect(() => {
    setFormatted(resource?.specifyTable.label ?? commonText.loading());
    return typeof resource === 'object'
      ? resourceOn(
          resource,
          'change',
          (): void => {
            if (resource === undefined) return undefined;
            format(resource)
              .then((title) => {
                setFormatted(title ?? localized(''));
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
    table: resource?.specifyTable,
    viewName,
    fallbackViewName: resource?.specifyTable.view,
    formType: 'form',
    mode,
  });

  const specifyForm =
    typeof resource === 'object' ? (
      <SpecifyForm
        containerRef={containerRef}
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

  const [tableNameInTitle] = userPreferences.use(
    'form',
    'behavior',
    'tableNameInTitle'
  );

  const [formHeaderFormat] = userPreferences.use(
    'form',
    'behavior',
    'formHeaderFormat'
  );
  const formattedTableName =
    resource === undefined
      ? localized('')
      : resource.isNew()
        ? formsText.newResourceTitle({ tableName: resource.specifyTable.label })
        : resource.specifyTable.label;
  const title =
    formatted.length === 0
      ? formattedTableName
      : resource?.specifyTable.name &&
          tableNamesToHide.has(resource.specifyTable.name)
        ? formatted
        : commonText.colonLine({
            label: formattedTableName,
            value: formatted,
          });

  const formRef = React.useRef(form);
  formRef.current = form;
  const focusFirstField = useFirstFocus(formRef);
  React.useEffect(() => {
    focusFirstField();
  }, [resource?.specifyTable, focusFirstField]);

  return {
    formatted: tableNameInTitle ? title : formatted,
    jsxFormatted:
      formHeaderFormat === 'name' ? (
        title
      ) : (
        <>
          {typeof resource === 'object' && (
            <TableIcon label name={resource.specifyTable.name} />
          )}
          {formHeaderFormat === 'full' ? title : formatted}
        </>
      ),
    title,
    /**
     ** Note: Although it is advised not to use the
     * value of a ref during render due to potential bugs caused by
     * ref updates not triggering re-renders, this specific
     * instance is an exception. The ref (formRef.current) is
     * updated on each render (line 127), ensuring that its value
     * is always up to date and can be safely accessed here. **
     */
    formElement: formRef.current,
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
      <ErrorBoundary>
        <SpecifyNetworkBadge resource={resource} />
      </ErrorBoundary>
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
      | undefined,
  ]
>([
  {
    // FIXME: remove if not used
    triedToSubmit: false,
  },
  undefined,
]);
FormContext.displayName = 'FormContext';
