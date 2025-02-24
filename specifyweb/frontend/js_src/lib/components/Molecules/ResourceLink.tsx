import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import type { PartialBy } from '../../utils/types';
import { className } from '../Atoms/className';
import { Link } from '../Atoms/Link';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceViewUrl } from '../DataModel/resource';
import { deserializeResource } from '../DataModel/serializers';
import { LazyResourceView } from '../Forms/LazyResourceView';
import type { ResourceView } from '../Forms/ResourceView';

/**
 * Context created to set a resource not
 * readOnly when opened by ex from an edit button
 */
export const IsNotReadOnly = React.createContext(false);
IsNotReadOnly.displayName = 'IsNotReadOnly';

export function ResourceLink<COMPONENT extends (typeof Link)['Icon']>({
  resource,
  component: Component,
  props: rawProps,
  resourceView,
  children,
  autoClose = true,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly component: COMPONENT;
  readonly props: 'title' extends keyof Omit<Parameters<COMPONENT>[0], 'href'>
    ? PartialBy<Omit<Parameters<COMPONENT>[0], 'href'>, 'title'>
    : Omit<Parameters<COMPONENT>[0], 'href'>;
  readonly children?: Parameters<COMPONENT>[0]['children'];
  readonly resourceView: PartialBy<
    Omit<
      Parameters<typeof ResourceView>[0],
      'isDependent' | 'isSubForm' | 'resource'
    >,
    'dialog' | 'onAdd' | 'onClose' | 'onSaved'
  >;
  readonly autoClose?: boolean;
}): JSX.Element {
  const [isOpen, _, handleClose, handleToggle] = useBooleanState();
  React.useEffect(() => {
    if (autoClose) handleClose();
  }, [resource]);

  function handleClosed(): void {
    handleClose();
    resourceView.onClose?.();
  }

  const props = rawProps as Omit<Parameters<COMPONENT>[0], 'href'>;
  const disabled = resource === undefined || props['aria-disabled'] === true;
  const allProps: Parameters<COMPONENT>[0] = {
    ...props,
    'aria-disabled': disabled,
    'aria-pressed': isOpen,
    href: resource?.isNew()
      ? getResourceViewUrl(resource.specifyTable.name, undefined)
      : resource?.viewUrl()!,
    title: props.title ?? commonText.view(),
    onClick: (event): void => {
      event.preventDefault();
      if (disabled) return;
      handleToggle();
      props.onClick?.(event);
    },
    children,
  };
  const AnyComponent = Component as (props: typeof allProps) => JSX.Element;

  return (
    <>
      <AnyComponent {...allProps} />
      {isOpen && (
        <IsNotReadOnly.Provider value>
          <LazyResourceView
            dialog="modal"
            onAdd={undefined}
            onSaved={(): void => {
              resourceView.onSaved?.();
              handleClose();
            }}
            {...resourceView}
            isDependent={false}
            isSubForm={false}
            resource={resource}
            onClose={handleClosed}
          />
        </IsNotReadOnly.Provider>
      )}
    </>
  );
}

export function ResourceEdit({
  resource,
  onSaved: handleSaved,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly onSaved?: () => void;
}): JSX.Element {
  return (
    <ResourceLink
      component={Link.Icon}
      props={{
        className: className.dataEntryEdit,
        title: commonText.edit(),
        icon: 'pencil',
      }}
      resource={resource}
      resourceView={{
        onDeleted: undefined,
        onSaved: handleSaved,
      }}
    />
  );
}

export function RecordEdit({
  resource,
  onSaved: handleSaved,
}: {
  readonly resource: SerializedResource<AnySchema>;
  readonly onSaved?: () => void;
}): JSX.Element {
  const record = React.useMemo(() => deserializeResource(resource), [resource]);
  return <ResourceEdit resource={record} onSaved={handleSaved} />;
}
