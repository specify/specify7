import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useIsModified } from '../../hooks/useIsModified';
import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { RA } from '../../utils/types';
import { Container } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { DataEntry } from '../Atoms/DataEntry';
import { Link } from '../Atoms/Link';
import { ReadOnlyContext, SearchDialogContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Tables } from '../DataModel/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { InFormEditorContext } from '../FormEditor/Context';
import { AppTitle } from '../Molecules/AppTitle';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { IsNotReadOnly } from '../Molecules/ResourceLink';
import { hasTablePermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { reportEvents } from '../Reports/events';
import { UnloadProtectDialog } from '../Router/UnloadProtect';
import { useResourceView } from './BaseResourceView';
import { DeleteButton } from './DeleteButton';
import { SaveButton } from './Save';
import { propsToFormMode } from './useViewDefinition';

/**
 * There is special behavior required when creating one of these resources,
 * or some additional things need to be done after resource is created, or
 * resource clone operation needs to be handled in a special way.
 */
export const FORBID_ADDING = new Set<keyof Tables>([
  'TaxonTreeDef',
  'GeographyTreeDef',
  'StorageTreeDef',
  'GeologicTimePeriodTreeDef',
  'GeologicTimePeriodTreeDefItem',
  'TectonicUnitTreeDef',
  'LithoStratTreeDef',
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

/**
 * Make form read only if you don't have create/update permission
 */
export const augmentMode = (
  isReadOnly: boolean,
  isNew: boolean,
  tableName: keyof Tables | undefined
): boolean =>
  isReadOnly ||
  tableName === undefined ||
  !hasTablePermission(tableName, isNew ? 'create' : 'update');

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
  viewName,
  title: titleOverride,
  /*
   * The presence of these attributes kind of breaks the abstraction, but they
   * are required to change the behaviour in certain ways:
   */
  isSubForm,
  isDependent,
  isCollapsed,
  preHeaderButtons,
  containerRef,
  isInRecordSet,
}: {
  readonly isLoading?: boolean;
  readonly resource: SpecifyResource<SCHEMA> | undefined;
  readonly viewName?: string;
  readonly headerButtons?: (
    specifyNetworkBadge: JSX.Element | undefined
  ) => JSX.Element;
  readonly extraButtons?: JSX.Element | undefined;
  readonly deletionMessage?: string | undefined;
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly onSaving?: (unsetUnloadProtect: () => void) => false | void;
  readonly onSaved: (() => void) | undefined;
  readonly onAdd:
    | ((resources: RA<SpecifyResource<SCHEMA>>) => void)
    | undefined;
  readonly onDeleted: (() => void) | undefined;
  readonly onClose: () => void;
  readonly children?: JSX.Element;
  readonly isSubForm: boolean;
  readonly isDependent: boolean;
  readonly title?:
    | LocalizedString
    | ((formatted: LocalizedString) => LocalizedString);
  readonly isCollapsed?: boolean;
  readonly preHeaderButtons?: JSX.Element | undefined;
  readonly containerRef?: React.RefObject<HTMLDivElement>;
  readonly isInRecordSet?: boolean;
}): JSX.Element {
  const [isDeleted, setDeleted, setNotDeleted] = useBooleanState();
  // Remove isDeleted status when resource changes
  React.useEffect(setNotDeleted, [resource, setNotDeleted]);

  function handleDelete(): void {
    setDeleted();
    handleDeleted();
  }

  const isModified = useIsModified(resource);

  const [showUnloadProtect, setShowUnloadProtect] = React.useState(false);

  const [makeFormDialogsModal] = userPreferences.use(
    'form',
    'behavior',
    'makeFormDialogsModal'
  );

  const isReadOnly = augmentMode(
    React.useContext(ReadOnlyContext),
    resource?.isNew() === true,
    resource?.specifyTable.name
  );
  const isInSearchDialog = React.useContext(SearchDialogContext);
  const isInFormEditor = React.useContext(InFormEditorContext);

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
    mode: propsToFormMode(isReadOnly, isInSearchDialog),
    resource,
    viewName,
    containerRef,
  });

  const [openAsReadOnly] = userPreferences.use(
    'form',
    'behavior',
    'openAsReadOnly'
  );

  const hasOwnButton =
    !isDependent &&
    !isSubForm &&
    typeof resource === 'object' &&
    formElement !== null;

  const isNotReadOnlyContext = React.useContext(IsNotReadOnly);

  const [temporaryReadOnly, setTemporaryReadOnly] = useTriggerState(
    !isReadOnly &&
      openAsReadOnly &&
      hasOwnButton &&
      !resource.isNew() &&
      !isNotReadOnlyContext
  );

  const navigate = useNavigate();
  if (isDeleted)
    return (
      <Dialog
        buttons={<Link.Info href="/specify/">{commonText.close()}</Link.Info>}
        header={formsText.resourceDeleted()}
        onClose={(): void => navigate('/specify/', { replace: true })}
      >
        {formsText.resourceDeletedDescription()}
      </Dialog>
    );

  const editRecord = (
    <Button.Secondary onClick={(): void => setTemporaryReadOnly(false)}>
      {commonText.edit()}
    </Button.Secondary>
  );

  const saveButtonElement = hasOwnButton ? (
    temporaryReadOnly ? (
      editRecord
    ) : (
      <SaveButton
        form={formElement}
        isInRecordSet={isInRecordSet}
        resource={resource}
        onAdd={handleAdd}
        onSaved={(): void => {
          const printOnSave = userPreferences.get(
            'form',
            'preferences',
            'printOnSave'
          );
          if (printOnSave[resource.specifyTable.name] === true)
            reportEvents.trigger('createReport', resource);
          handleSaved();
        }}
        onSaving={handleSaving}
      />
    )
  ) : undefined;

  const deleteButton =
    !isDependent &&
    !isSubForm &&
    typeof resource === 'object' &&
    !resource.isNew() &&
    hasTablePermission(resource.specifyTable.name, 'delete') &&
    !isInFormEditor ? (
      <ErrorBoundary dismissible>
        <DeleteButton
          deletionMessage={deletionMessage}
          resource={resource}
          onDeleted={handleDelete}
        />
      </ErrorBoundary>
    ) : undefined;

  const hasNoData =
    !resource || (Array.isArray(resource) && resource.length === 0);

  const headerContent = (
    <>
      {specifyNetworkBadge}
      {formPreferences}
    </>
  );
  const customTitle =
    typeof titleOverride === 'function'
      ? titleOverride(formatted)
      : titleOverride;

  const formComponent = (
    <ReadOnlyContext.Provider value={isReadOnly || temporaryReadOnly}>
      {form(children, dialog === false ? 'overflow-y-auto' : undefined)}
    </ReadOnlyContext.Provider>
  );

  if (dialog === false) {
    const formattedChildren = (
      <>
        {formComponent}
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
          {preHeaderButtons}
          <DataEntry.SubFormTitle>
            {customTitle ?? jsxFormatted}
          </DataEntry.SubFormTitle>
          {headerComponents}
        </DataEntry.SubFormHeader>
        <div
          className={
            isCollapsed
              ? 'hidden'
              : hasNoData
                ? ''
                : 'border border-gray-500 border-t-0 rounded-b p-1'
          }
        >
          {formattedChildren}
        </div>
      </DataEntry.SubForm>
    ) : (
      <Container.FullGray>
        <Container.Center className="!w-auto">
          <DataEntry.Header>
            <AppTitle title={customTitle ?? formatted} />
            <DataEntry.Title>{customTitle ?? jsxFormatted}</DataEntry.Title>
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
  const isFullSize =
    dialog === 'modal' && typeof headerButtons === 'function' && !isSubForm;

  return (
    <Dialog
      buttons={
        isSubForm ? undefined : (
          <>
            {deleteButton}
            {extraButtons ?? <span className="-ml-2 flex-1" />}
            {isModified && !isDependent ? (
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
            ) : (
              <Button.Info onClick={handleClose}>
                {commonText.close()}
              </Button.Info>
            )}
            {saveButtonElement}
          </>
        )
      }
      className={{
        container: `${dialogClassNames.normalContainer} ${
          isFullSize ? 'h-full w-full' : ''
        }`,
        content: `${className.formStyles} ${dialogClassNames.flexContent}`,
      }}
      dimensionsKey={viewName ?? resource?.specifyTable.view}
      header={customTitle ?? title}
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
      specialMode={isSubForm ? undefined : 'orangeBar'}
      onClose={(): void => {
        if (isModified) setShowUnloadProtect(true);
        else handleClose();
      }}
    >
      {formComponent}
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
