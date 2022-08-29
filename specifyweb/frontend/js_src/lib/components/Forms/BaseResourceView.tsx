import React from 'react';

import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { Form } from '../Atoms/Form';
import type { FormMeta } from '../Core/Contexts';
import { FormContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import { fail } from '../Errors/Crash';
import type { FormMode } from '../FormParse';
import { FormPreferences } from '../FormPreferences';
import { displaySpecifyNetwork, SpecifyNetworkBadge } from '../SpecifyNetwork';
import { format } from './dataObjFormatters';
import { SpecifyForm } from './SpecifyForm';
import { TableIcon } from '../Molecules/TableIcon';
import { usePref } from '../UserPreferences/usePref';

export type ResourceViewProps<SCHEMA extends AnySchema> = {
  readonly isLoading?: boolean;
  readonly resource: SpecifyResource<SCHEMA> | undefined;
  readonly mode: FormMode;
  readonly viewName?: string;
  readonly isSubForm: boolean;
  readonly children: (props: {
    readonly formElement: HTMLFormElement | null;
    readonly formPreferences: JSX.Element;
    readonly form: (children?: JSX.Element, className?: string) => JSX.Element;
    readonly title: string;
    readonly formatted: string;
    readonly jsxFormatted: JSX.Element | string;
    readonly specifyNetworkBadge: JSX.Element | undefined;
  }) => JSX.Element;
};

export function BaseResourceView<SCHEMA extends AnySchema>({
  isLoading,
  resource,
  children,
  mode,
  viewName = resource?.specifyModel.view,
  isSubForm,
}: ResourceViewProps<SCHEMA>): JSX.Element | null {
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
  const formMeta = React.useState<FormMeta>({
    triedToSubmit: false,
  });

  const specifyForm =
    typeof resource === 'object' ? (
      <SpecifyForm
        display={isSubForm ? 'inline' : 'block'}
        formType="form"
        isLoading={isLoading}
        mode={mode}
        resource={resource}
        viewName={viewName}
      />
    ) : (
      <p>{formsText('noData')}</p>
    );

  const [tableNameInTitle] = usePref('form', 'behavior', 'tableNameInTitle');
  const [formHeaderFormat] = usePref('form', 'behavior', 'formHeaderFormat');
  const title = `${
    resource === undefined
      ? ''
      : resource.isNew()
      ? commonText('newResourceTitle', resource.specifyModel.label)
      : resource.specifyModel.label
  }${formatted.length > 0 ? `: ${formatted}` : ''}`;

  return children({
    formatted: tableNameInTitle ? title : formatted,
    jsxFormatted:
      formHeaderFormat === 'name' ? (
        title
      ) : (
        <>
          {typeof resource === 'object' && (
            <TableIcon label name={resource.specifyModel.name} />
          )}
          {formHeaderFormat === 'full' && title}
        </>
      ),
    title,
    formElement: form,
    formPreferences: <FormPreferences resource={resource} />,
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
  });
}
