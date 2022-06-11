import React from 'react';
import type { State } from 'typesafe-reducer';

import { fetchCollection } from '../collection';
import type { RecordSet, Tables } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { format } from '../dataobjformatters';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import type { FormMode } from '../parseform';
import { hasTablePermission } from '../permissions';
import { getResourceViewUrl, resourceOn } from '../resource';
import { Button, className, Container, DataEntry, Form } from './basic';
import { AppTitle } from './common';
import type { FormMeta } from './contexts';
import { FormContext } from './contexts';
import { DeleteButton } from './deletebutton';
import { crash } from './errorboundary';
import { useAsyncState, useBooleanState, useId, useIsModified } from './hooks';
import { Dialog, dialogClassNames } from './modaldialog';
import { goTo, pushUrl } from './navigation';
import { usePref } from './preferenceshooks';
import { RecordSet as RecordSetView } from './recordselectorutils';
import { ReportsView } from './reports';
import { SaveButton } from './savebutton';
import { SpecifyForm } from './specifyform';
import { displaySpecifyNetwork, SpecifyNetworkBadge } from './specifynetwork';

/**
 * There is special behavior required when creating one of these resources,
 * or some additional things need to be done after resource is created, or
 * resource clone operation needs to be handled in a special way.
 */
export const RESTRICT_ADDING: Set<keyof Tables> = new Set([
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
 * That is why "Add another" button is disabled for these tables.
 */
export const NO_ADD_ANOTHER: Set<keyof Tables> = new Set([
  ...RESTRICT_ADDING,
  // TODO: remove these two after #124 is fixed
  'Permit',
  'RepositoryAgreement',
]);

export const NO_CLONE: Set<keyof Tables> = new Set([
  ...NO_ADD_ANOTHER,
  // To properly clone a user need to also clone their roles and policies
  'SpecifyUser',
]);

export type ResourceViewProps<SCHEMA extends AnySchema> = {
  readonly isLoading?: boolean;
  readonly resource: SpecifyResource<SCHEMA> | undefined;
  readonly mode: FormMode;
  readonly viewName?: string;
  readonly isSubForm: boolean;
  readonly children: (props: {
    readonly formElement: HTMLFormElement | null;
    readonly formMeta: FormMeta;
    readonly title: string;
    readonly formatted: string;
    readonly form: (
      children: JSX.Element | undefined,
      className?: string
    ) => JSX.Element;
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
            if (typeof resource === 'undefined') return undefined;
            format(resource)
              .then((title) => {
                setFormatted(title ?? '');
                return undefined;
              })
              .catch(crash);
          },
          true
        )
      : undefined;
  }, [resource]);

  const id = useId('resource-view');
  const [form, setForm] = React.useState<HTMLFormElement | null>(null);
  const formMeta = React.useState<FormMeta>({
    printOnSave: undefined,
    triedToSubmit: false,
  });

  const specifyForm =
    typeof resource === 'object' ? (
      <SpecifyForm
        isLoading={isLoading}
        resource={resource}
        mode={mode}
        viewName={viewName}
        formType="form"
        display={isSubForm ? 'inline' : 'block'}
      />
    ) : (
      <p>{formsText('noData')}</p>
    );

  const [tableNameInTitle] = usePref('form', 'behavior', 'tableNameInTitle');
  const title = `${
    typeof resource === 'undefined'
      ? ''
      : resource.isNew()
      ? commonText('newResourceTitle', resource.specifyModel.label)
      : resource.specifyModel.label
  }${formatted.length > 0 ? `: ${formatted}` : ''}`;

  return children({
    formatted: tableNameInTitle ? title : formatted,
    title,
    formElement: form,
    formMeta: formMeta[0],
    form: (children, className) =>
      isSubForm ? (
        <>
          {specifyForm}
          {children}
        </>
      ) : (
        <FormContext.Provider value={formMeta}>
          <Form
            id={id('form')}
            forwardRef={(newForm): void => setForm(newForm ?? form)}
            className={className}
          >
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

const resourceDeletedDialog = (
  <Dialog
    header={commonText('resourceDeletedDialogHeader')}
    buttons={commonText('close')}
    onClose={(): void => goTo('/')}
  >
    {commonText('resourceDeletedDialogText')}
  </Dialog>
);

export const augmentMode = (
  initialMode: FormMode,
  isNew: boolean,
  tableName: keyof Tables | undefined
): FormMode =>
  typeof tableName === 'undefined'
    ? 'view'
    : initialMode === 'edit'
    ? hasTablePermission(tableName, isNew ? 'create' : 'update')
      ? 'edit'
      : 'view'
    : initialMode;

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
  readonly dialog: false | 'modal' | 'nonModal';
  readonly onSaving?: () => void | undefined | false;
  readonly onSaved:
    | ((payload: {
        readonly newResource: SpecifyResource<SCHEMA> | undefined;
        readonly wasNew: boolean;
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

  return isDeleted ? (
    resourceDeletedDialog
  ) : (
    <BaseResourceView
      isLoading={isLoading}
      resource={resource}
      mode={mode}
      viewName={viewName}
      isSubForm={isSubForm}
    >
      {({
        form,
        formElement,
        formMeta,
        title,
        formatted,
        specifyNetworkBadge,
      }): JSX.Element => {
        const saveButtonElement =
          !isDependent &&
          !isSubForm &&
          typeof resource === 'object' &&
          formElement !== null ? (
            <SaveButton
              resource={resource}
              form={formElement}
              canAddAnother={
                canAddAnother && !NO_ADD_ANOTHER.has(resource.specifyModel.name)
              }
              onSaving={handleSaving}
              onSaved={(payload): void =>
                formMeta.printOnSave === true && payload.wasChanged
                  ? setState({
                      type: 'Report',
                      onDone: () => handleSaved(payload),
                    })
                  : handleSaved(payload)
              }
            />
          ) : undefined;
        const report =
          state.type === 'Report' && typeof resource === 'object' ? (
            <ReportsView
              model={resource.specifyModel}
              resourceId={resource.id}
              autoSelectSingle={true}
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
            <DeleteButton
              resource={resource}
              deletionMessage={deletionMessage}
              onDeleted={handleDelete}
            />
          ) : undefined;
        if (dialog === false) {
          const formattedChildren = (
            <>
              {report}
              {form(children)}
              {typeof deleteButton === 'object' ||
              typeof saveButtonElement === 'object' ||
              typeof extraButtons === 'object' ? (
                <DataEntry.Footer>
                  {deleteButton}
                  {extraButtons ?? <span className="flex-1 -ml-2" />}
                  {saveButtonElement}
                </DataEntry.Footer>
              ) : undefined}
            </>
          );
          return isSubForm ? (
            <DataEntry.SubForm>
              <DataEntry.SubFormHeader>
                <DataEntry.SubFormTitle>
                  {titleOverride ?? title}
                </DataEntry.SubFormTitle>
                {headerButtons?.(specifyNetworkBadge) ?? (
                  <>
                    <span className="flex-1 -ml-2" />
                    {specifyNetworkBadge}
                  </>
                )}
              </DataEntry.SubFormHeader>
              {formattedChildren}
            </DataEntry.SubForm>
          ) : (
            <Container.FullGray>
              <Container.Center className="!w-auto">
                <DataEntry.Header>
                  <AppTitle title={titleOverride ?? formatted} type="form" />
                  <DataEntry.Title>{titleOverride ?? title}</DataEntry.Title>
                  {headerButtons?.(specifyNetworkBadge) ?? (
                    <>
                      <span className="flex-1 -ml-4" />
                      {specifyNetworkBadge}
                    </>
                  )}
                </DataEntry.Header>
                {formattedChildren}
              </Container.Center>
            </Container.FullGray>
          );
        } else
          return (
            <Dialog
              header={titleOverride ?? title}
              icon="none"
              modal={dialog === 'modal' || makeFormDialogsModal}
              headerButtons={
                <>
                  {headerButtons?.(specifyNetworkBadge) ?? (
                    <>
                      <DataEntry.Visit resource={resource} />
                      <span className="flex-1 -ml-4" />
                      {specifyNetworkBadge}
                    </>
                  )}
                </>
              }
              buttons={
                isSubForm ? undefined : (
                  <>
                    {deleteButton}
                    {extraButtons ?? <span className="flex-1 -ml-2" />}
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
                content: `${className.formStyles} ${dialogClassNames.flexContent}`,
              }}
              onClose={(): void => {
                if (isModified) setShowUnloadProtect(true);
                else handleClose();
              }}
            >
              {form(children)}
              {showUnloadProtect && (
                <Dialog
                  header={commonText('leavePageDialogHeader')}
                  onClose={(): void => setShowUnloadProtect(false)}
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
                >
                  {formsText('unsavedFormUnloadProtect')}
                </Dialog>
              )}
            </Dialog>
          );
      }}
    </BaseResourceView>
  );
}

export function ShowResource({
  resource: initialResource,
  recordSet: initialRecordSet,
}: {
  resource: SpecifyResource<AnySchema>;
  recordSet: SpecifyResource<RecordSet> | undefined;
}): JSX.Element | null {
  const [{ resource, recordSet }, setRecord] = React.useState({
    resource: initialResource,
    recordSet: initialRecordSet,
  });

  React.useEffect(
    () =>
      pushUrl(
        getResourceViewUrl(
          resource.specifyModel.name,
          resource.id,
          recordSet?.id
        )
      ),
    [resource, recordSet]
  );

  const [recordSetItemIndex] = useAsyncState(
    React.useCallback(async () => {
      if (resource.isNew()) return 0;
      return typeof recordSet === 'object'
        ? fetchCollection('RecordSetItem', {
            recordSet: recordSet.id,
            limit: 1,
            recordId: resource.id,
          })
            .then(({ records }) =>
              f.maybe(records[0]?.id, (recordSetItemId) =>
                fetchCollection(
                  'RecordSetItem',
                  {
                    recordSet: recordSet.id,
                    limit: 1,
                  },
                  { id__lt: recordSetItemId }
                ).then(({ totalCount }) => totalCount)
              )
            )
            .catch(crash)
        : undefined;
    }, [recordSet, resource]),
    true
  );

  return typeof recordSet === 'object' ? (
    typeof recordSetItemIndex === 'undefined' ? null : (
      <RecordSetView
        dialog={false}
        mode="edit"
        model={resource.specifyModel}
        onClose={(): void => goTo('/')}
        onAdd={f.void}
        onSlide={f.void}
        recordSet={recordSet}
        defaultResourceIndex={recordSetItemIndex}
        canAddAnother={true}
      />
    )
  ) : (
    <ResourceView
      resource={resource}
      onClose={f.never}
      canAddAnother={true}
      dialog={false}
      isSubForm={false}
      mode="edit"
      viewName={resource.specifyModel.view}
      onDeleted={f.void}
      onSaved={({ wasNew, newResource }): void => {
        if (typeof newResource === 'object')
          setRecord({ resource: newResource, recordSet });
        else if (wasNew) goTo(resource.viewUrl());
        else {
          const reloadResource = new resource.specifyModel.Resource({
            id: resource.id,
          });
          reloadResource.recordsetid = resource.recordsetid;
          reloadResource
            .fetch()
            .then(async () =>
              setRecord({ resource: reloadResource, recordSet })
            );
        }
      }}
      isDependent={false}
    />
  );
}
