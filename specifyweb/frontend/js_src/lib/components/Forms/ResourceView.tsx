import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useIsModified } from '../../hooks/useIsModified';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { Container } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { DataEntry } from '../Atoms/DataEntry';
import { Link } from '../Atoms/Link';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Tables } from '../DataModel/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import type { FormMode } from '../FormParse';
import { AppTitle } from '../Molecules/AppTitle';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { hasTablePermission } from '../Permissions/helpers';
import { ReportsView } from '../Reports';
import { UnloadProtectDialog } from '../Router/Router';
import { getUserPref } from '../UserPreferences/helpers';
import { usePref } from '../UserPreferences/usePref';
import { useResourceView } from './BaseResourceView';
import { DeleteButton } from './DeleteButton';
import { SaveButton } from './Save';

/**
 * There is special behavior required when creating one of these resources,
 * or some additional things need to be done after resource is created, or
 * resource clone operation needs to be handled in a special way.
 */
export const FORBID_ADDING = new Set<keyof Tables>([
  'TaxonTreeDef',
  'TaxonTreeDefItem',
  'GeographyTreeDef',
  'GeographyTreeDefItem',
  'StorageTreeDef',
  'StorageTreeDefItem',
  'GeologicTimePeriodTreeDef',
  'GeologicTimePeriodTreeDefItem',
  'LithoStratTreeDef',
  'LithoStratTreeDefItem',
  'Institution',
  'Division',
  'Discipline',
  'Collection',
  // See https://github.com/specify/specify7/issues/1754
  'Attachment',
]);

/**
 * Same as FORBID_ADDING, but only apply for query combo boxes
 */
export const RESTRICT_ADDING = new Set<keyof Tables>([
  ...FORBID_ADDING,
  // Preparations should be created though their own workflow (interactions dialog)
  'Gift',
  'Borrow',
  'Loan',
  'ExchangeIn',
  'ExchangeOut',
]);

/**
 * Same as FORBID_ADDING, but apply only to "Clone" and "Carry Forward"
 */
export const NO_CLONE = new Set<keyof Tables>([
  ...FORBID_ADDING,
  // To properly clone a user need to also clone their roles and policies
  'SpecifyUser',
]);

export function augmentMode(
  initialMode: FormMode,
  isNew: boolean,
  tableName: keyof Tables | undefined
): FormMode {
  if (tableName === undefined) return 'view';
  else if (initialMode === 'edit')
    return hasTablePermission(tableName, isNew ? 'create' : 'update')
      ? 'edit'
      : 'view';
  else return initialMode;
}

// REFACTOR: split this into smaller components
export function ResourceView<SCHEMA extends AnySchema>({
  isLoading,
  resource,
  extraButtons,
  headerButtons,
  deletionMessage,
  dialog = false,
  onSaving: handleSaving,
  onClose: handleClose,
  onSaved: handleSaved = handleClose,
  onAdd: handleAdd,
  onDeleted: handleDeleted = handleClose,
  children,
  mode: initialMode,
  viewName,
  title: titleOverride,
  /*
   * The presence of these attributes kind of breaks the abstraction, but they
   * are required to change the behaviour in certain ways:
   */
  isSubForm,
  isDependent,
}: {
  readonly isLoading?: boolean;
  readonly resource: SpecifyResource<SCHEMA> | undefined;
  readonly mode: FormMode;
  readonly viewName?: string;
  readonly headerButtons?: (
    specifyNetworkBadge: JSX.Element | undefined
  ) => JSX.Element;
  readonly extraButtons?: JSX.Element | undefined;
  readonly deletionMessage?: string | undefined;
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly onSaving?: (
    unsetUnloadProtect: () => void
  ) => false | undefined | void;
  readonly onSaved: (() => void) | undefined;
  readonly onAdd: ((newResource: SpecifyResource<SCHEMA>) => void) | undefined;
  readonly onDeleted: (() => void) | undefined;
  readonly onClose: () => void;
  readonly children?: JSX.Element;
  readonly isSubForm: boolean;
  readonly isDependent: boolean;
  readonly title?: LocalizedString;
}): JSX.Element {
  const mode = augmentMode(
    initialMode,
    resource?.isNew() === true,
    resource?.specifyModel.name
  );

  const [isDeleted, setDeleted, setNotDeleted] = useBooleanState();
  // Remove isDeleted status when resource changes
  React.useEffect(setNotDeleted, [resource, setNotDeleted]);

  function handleDelete(): void {
    setDeleted();
    handleDeleted();
  }

  const isModified = useIsModified(resource);

  const [showUnloadProtect, setShowUnloadProtect] = React.useState(false);

  const [state, setState] = React.useState<
    State<'Main'> | State<'Report', { readonly onDone: () => void }>
  >({ type: 'Main' });

  const [makeFormDialogsModal] = usePref(
    'form',
    'behavior',
    'makeFormDialogsModal'
  );

  const {
    formElement,
    formPreferences,
    form,
    title,
    formatted,
    jsxFormatted,
    specifyNetworkBadge,
  } = useResourceView({
    isLoading,
    isSubForm,
    mode,
    resource,
    viewName,
  });

  const navigate = useNavigate();
  if (isDeleted)
    return (
      <Dialog
        buttons={<Link.Blue href="/specify/">{commonText.close()}</Link.Blue>}
        header={formsText.resourceDeleted()}
        onClose={(): void => navigate('/specify/', { replace: true })}
      >
        {formsText.resourceDeletedDescription()}
      </Dialog>
    );

  const saveButtonElement =
    !isDependent &&
    !isSubForm &&
    typeof resource === 'object' &&
    formElement !== null ? (
      <SaveButton
        form={formElement}
        resource={resource}
        onAdd={handleAdd}
        onSaved={(): void => {
          const printOnSave = getUserPref('form', 'preferences', 'printOnSave');
          if (printOnSave[resource.specifyModel.name] === true)
            setState({
              type: 'Report',
              onDone: () => handleSaved(),
            });
          else handleSaved();
        }}
        onSaving={handleSaving}
      />
    ) : undefined;

  const report =
    state.type === 'Report' && typeof resource === 'object' ? (
      <ReportsView
        autoSelectSingle
        model={resource.specifyModel}
        resourceId={resource.id}
        onClose={(): void => {
          state.onDone();
          setState({ type: 'Main' });
        }}
      />
    ) : undefined;

  const deleteButton =
    !isDependent &&
    !isSubForm &&
    typeof resource === 'object' &&
    !resource.isNew() &&
    hasTablePermission(resource.specifyModel.name, 'delete') ? (
      <ErrorBoundary dismissible>
        <DeleteButton
          deletionMessage={deletionMessage}
          resource={resource}
          onDeleted={handleDelete}
        />
      </ErrorBoundary>
    ) : undefined;

  const headerContent = (
    <>
      {specifyNetworkBadge}
      {formPreferences}
    </>
  );

  if (dialog === false) {
    const formattedChildren = (
      <>
        {report}
        {form(children, 'overflow-y-auto')}
        {typeof deleteButton === 'object' ||
        typeof saveButtonElement === 'object' ||
        typeof extraButtons === 'object' ? (
          <DataEntry.Footer>
            {deleteButton}
            {extraButtons ?? <span className="-ml-2 md:flex-1" />}
            {saveButtonElement}
          </DataEntry.Footer>
        ) : undefined}
      </>
    );

    const headerComponents = headerButtons?.(headerContent) ?? (
      <>
        <span className="-ml-2 flex-1" />
        {headerContent}
      </>
    );

    return isSubForm ? (
      <DataEntry.SubForm>
        <DataEntry.SubFormHeader>
          <DataEntry.SubFormTitle>
            {titleOverride ?? jsxFormatted}
          </DataEntry.SubFormTitle>
          {headerComponents}
        </DataEntry.SubFormHeader>
        {formattedChildren}
      </DataEntry.SubForm>
    ) : (
      <Container.FullGray>
        <Container.Center className="!w-auto">
          <DataEntry.Header>
            <AppTitle title={titleOverride ?? formatted} />
            <DataEntry.Title>{titleOverride ?? jsxFormatted}</DataEntry.Title>
            {headerComponents}
          </DataEntry.Header>
          {formattedChildren}
        </Container.Center>
      </Container.FullGray>
    );
  }

  /*
   * Make record selector dialog occupy full height so that the record
   * navigation buttons don't jump around a lot as you navigate between
   * records
   */
  const isFullHeight =
    dialog === 'modal' && typeof headerButtons === 'function' && !isSubForm;
  return (
    <Dialog
      buttons={
        isSubForm ? undefined : (
          <>
            {deleteButton}
            {extraButtons ?? <span className="-ml-2 flex-1" />}
            {isModified && !isDependent ? (
              <Button.Red onClick={handleClose}>
                {commonText.cancel()}
              </Button.Red>
            ) : (
              <Button.Blue onClick={handleClose}>
                {commonText.close()}
              </Button.Blue>
            )}
            {saveButtonElement}
          </>
        )
      }
      className={{
        container: `${dialogClassNames.normalContainer} ${
          isFullHeight ? 'h-full' : ''
        }`,
        content: `${className.formStyles} ${dialogClassNames.flexContent}`,
      }}
      dimensionsKey={viewName ?? resource?.specifyModel.view}
      header={titleOverride ?? title}
      headerButtons={
        <>
          {headerButtons?.(specifyNetworkBadge) ?? (
            <>
              <DataEntry.Visit resource={resource} />
              <span className="-ml-4 flex-1" />
              {headerContent}
            </>
          )}
        </>
      }
      icon="none"
      modal={dialog === 'modal' || makeFormDialogsModal}
      showOrangeBar={!isSubForm}
      onClose={(): void => {
        if (isModified) setShowUnloadProtect(true);
        else handleClose();
      }}
    >
      {form(children, 'overflow-y-hidden')}
      {showUnloadProtect && (
        <UnloadProtectDialog
          onCancel={(): void => setShowUnloadProtect(false)}
          onConfirm={handleClose}
        >
          {formsText.unsavedFormUnloadProtect()}
        </UnloadProtectDialog>
      )}
    </Dialog>
  );
}
