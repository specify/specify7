import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { State } from 'typesafe-reducer';

import type { Tables } from '../DataModel/types';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { FormMode } from '../FormParse';
import { hasTablePermission } from '../Permissions/helpers';
import { Container } from '../Atoms';
import { DeleteButton } from './DeleteButton';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { useIsModified } from '../../hooks/useIsModified';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { ReportsView } from '../Reports';
import { SaveButton } from './Save';
import { Link } from '../Atoms/Link';
import { DataEntry } from '../Atoms/DataEntry';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { useBooleanState } from '../../hooks/useBooleanState';
import { AnySchema } from '../DataModel/helperTypes';
import { BaseResourceView } from './BaseResourceView';
import { AppTitle } from '../Molecules/AppTitle';
import { usePref } from '../UserPreferences/usePref';
import { getUserPref } from '../UserPreferences/helpers';

/**
 * There is special behavior required when creating one of these resources,
 * or some additional things need to be done after resource is created, or
 * resource clone operation needs to be handled in a special way.
 */
export const RESTRICT_ADDING = new Set<keyof Tables>([
  // Shouldn't clone preparations
  'Gift',
  'Borrow',
  'Loan',
  'ExchangeIn',
  'ExchangeOut',
  // Shouldn't allow creating new resources of this type
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
]);

/**
 * Like RESTRICT_ADDING, but also restricts cloning
 */
export const NO_ADD_ANOTHER = new Set<keyof Tables>([
  ...RESTRICT_ADDING,
  // See https://github.com/specify/specify7/issues/1754
  'Attachment',
]);

export const NO_CLONE = new Set<keyof Tables>([
  ...NO_ADD_ANOTHER,
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
  canAddAnother,
  deletionMessage,
  dialog = false,
  onSaving: handleSaving,
  onClose: handleClose,
  onSaved: handleSaved = handleClose,
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
  readonly canAddAnother: boolean;
  readonly extraButtons?: JSX.Element | undefined;
  readonly deletionMessage?: string | undefined;
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly onSaving?: (
    unsetUnloadProtect: () => void
  ) => false | undefined | void;
  readonly onSaved:
    | ((payload: {
        readonly newResource: SpecifyResource<SCHEMA> | undefined;
        readonly wasNew: boolean;
        readonly wasChanged: boolean;
      }) => void)
    | undefined;
  readonly onDeleted: (() => void) | undefined;
  readonly onClose: () => void;
  readonly children?: JSX.Element;
  readonly isSubForm: boolean;
  readonly isDependent: boolean;
  readonly title?: string;
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

  const navigate = useNavigate();
  return isDeleted ? (
    <Dialog
      buttons={<Link.Blue href="/specify/">{commonText('close')}</Link.Blue>}
      header={commonText('resourceDeletedDialogHeader')}
      onClose={(): void => navigate('/specify/')}
    >
      {commonText('resourceDeletedDialogText')}
    </Dialog>
  ) : (
    <BaseResourceView
      isLoading={isLoading}
      isSubForm={isSubForm}
      mode={mode}
      resource={resource}
      viewName={viewName}
    >
      {({
        formElement,
        formPreferences,
        form,
        title,
        formatted,
        jsxFormatted,
        specifyNetworkBadge,
      }): JSX.Element => {
        const saveButtonElement =
          !isDependent &&
          !isSubForm &&
          typeof resource === 'object' &&
          formElement !== null ? (
            <SaveButton
              canAddAnother={
                canAddAnother && !NO_ADD_ANOTHER.has(resource.specifyModel.name)
              }
              form={formElement}
              resource={resource}
              onSaved={(payload): void => {
                const printOnSave = getUserPref(
                  'form',
                  'preferences',
                  'printOnSave'
                );
                if (
                  printOnSave[resource.specifyModel.name] === true &&
                  payload.wasChanged
                )
                  setState({
                    type: 'Report',
                    onDone: () => handleSaved(payload),
                  });
                else handleSaved(payload);
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
            <ErrorBoundary dismissable>
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
                  {extraButtons ?? <span className="-ml-2 flex-1" />}
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
                  <AppTitle title={titleOverride ?? formatted} type="form" />
                  <DataEntry.Title>
                    {titleOverride ?? jsxFormatted}
                  </DataEntry.Title>
                  {headerComponents}
                </DataEntry.Header>
                {formattedChildren}
              </Container.Center>
            </Container.FullGray>
          );
        } else {
          /*
           * Make record selector dialog occupy full height so that the record
           * navigation buttons don't jump around a lot as you navigate between
           * records
           */
          const isFullHeight =
            dialog === 'modal' &&
            typeof headerButtons === 'function' &&
            !isSubForm;
          return (
            <Dialog
              buttons={
                isSubForm ? undefined : (
                  <>
                    {deleteButton}
                    {extraButtons ?? <span className="-ml-2 flex-1" />}
                    {isModified && !isDependent ? (
                      <Button.Red onClick={handleClose}>
                        {commonText('cancel')}
                      </Button.Red>
                    ) : (
                      <Button.Blue onClick={handleClose}>
                        {commonText('close')}
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
              showOrangeBar={!isSubForm}
              icon="none"
              modal={dialog === 'modal' || makeFormDialogsModal}
              onClose={(): void => {
                if (isModified) setShowUnloadProtect(true);
                else handleClose();
              }}
            >
              {form(children, 'overflow-y-hidden')}
              {showUnloadProtect && (
                <Dialog
                  buttons={
                    <>
                      <Button.DialogClose>
                        {commonText('cancel')}
                      </Button.DialogClose>
                      <Button.Red onClick={handleClose}>
                        {commonText('leave')}
                      </Button.Red>
                    </>
                  }
                  header={commonText('leavePageDialogHeader')}
                  onClose={(): void => setShowUnloadProtect(false)}
                >
                  {formsText('unsavedFormUnloadProtect')}
                </Dialog>
              )}
            </Dialog>
          );
        }
      }}
    </BaseResourceView>
  );
}
