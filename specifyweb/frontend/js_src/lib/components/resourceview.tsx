import React from 'react';

import { error } from '../assert';
import { fetchCollection } from '../collection';
import type { RecordSet, Tables } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { format } from '../dataobjformatters';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import * as navigation from '../navigation';
import type { FormMode } from '../parseform';
import { hasPermission, hasTablePermission } from '../permissions';
import reports from '../reports';
import { getResourceViewUrl } from '../resource';
import { Button, Container, DataEntry, Form } from './basic';
import { LoadingContext } from './contexts';
import { DeleteButton } from './deletebutton';
import { crash } from './errorboundary';
import { useAsyncState, useBooleanState, useId } from './hooks';
import { displaySpecifyNetwork, SpecifyNetworkBadge } from './lifemapper';
import { Dialog } from './modaldialog';
import { RecordSet as RecordSetView } from './recordselectorutils';
import { SaveButton } from './savebutton';
import { SpecifyForm } from './specifyform';

const NO_ADD_ANOTHER: Set<keyof Tables> = new Set([
  'Gift',
  'Borrow',
  'Loan',
  'ExchangeIn',
  'ExchangeOut',
  'Permit',
  'RepositoryAgreement',
]);

export type ResourceViewProps<SCHEMA extends AnySchema> = {
  readonly resource: SpecifyResource<SCHEMA> | undefined;
  readonly mode: FormMode;
  readonly viewName?: string;
  readonly isSubForm: boolean;
  readonly children: (props: {
    readonly isModified: boolean;
    readonly formElement: HTMLFormElement | null;
    readonly title: string;
    // Delete button component has to be created manually
    readonly saveButton?: (props: {
      readonly canAddAnother: boolean;
      readonly onSaving?: () => void | undefined | false;
      readonly onSaved: (payload: {
        readonly newResource: SpecifyResource<SCHEMA> | undefined;
        readonly wasNew: boolean;
      }) => void;
    }) => JSX.Element | undefined;
    readonly form: JSX.Element;
    readonly specifyNetworkBadge: JSX.Element | undefined;
  }) => JSX.Element;
};

export type FormMeta = {
  // Undefined if form does not have a printOnSave button
  readonly printOnSave: undefined | boolean;
};

export const FormContext = React.createContext<
  Readonly<
    [
      meta: FormMeta,
      setMeta: (newState: FormMeta | ((oldMeta: FormMeta) => FormMeta)) => void
    ]
  >
>([{ printOnSave: false }, (): void => error('Form context is not defined')]);
FormContext.displayName = 'FormContext';

function BaseResourceView<SCHEMA extends AnySchema>({
  resource,
  children,
  mode,
  viewName = resource?.specifyModel.view,
  isSubForm,
}: ResourceViewProps<SCHEMA>): JSX.Element | null {
  // Update title when resource changes
  const [title, setTitle] = React.useState(
    resource?.specifyModel.label ?? commonText('loading')
  );
  React.useEffect(() => {
    if (typeof resource === 'undefined') {
      setTitle(commonText('loading'));
      return;
    }

    function updateTitle(): void {
      if (typeof resource === 'undefined') return undefined;
      const title = resource.isNew()
        ? commonText('newResourceTitle')(resource.specifyModel.label)
        : resource.specifyModel.label;
      format(resource)
        .then(
          (formatted) =>
            `${title}${typeof formatted === 'string' ? `: ${formatted}` : ''}`
        )
        .then((title) => {
          setTitle(title);
          return undefined;
        })
        .catch(crash);
    }

    resource.on('change', updateTitle);
    updateTitle();
    return (): void => resource.off('change', updateTitle);
  }, [resource]);

  const id = useId('resource-view');
  const [form, setForm] = React.useState<HTMLFormElement | null>(null);
  const formMeta = React.useState<FormMeta>({
    printOnSave: undefined,
  });

  const specifyForm =
    typeof resource === 'object' ? (
      <SpecifyForm
        resource={resource}
        mode={mode}
        viewName={viewName}
        formType="form"
      />
    ) : (
      <p>{formsText('noData')}</p>
    );

  const loading = React.useContext(LoadingContext);
  return children({
    isModified: resource?.needsSaved ?? false,
    title,
    formElement: form,
    form: isSubForm ? (
      specifyForm
    ) : (
      <FormContext.Provider value={formMeta}>
        <Form
          id={id('form')}
          forwardRef={(newForm): void => setForm(newForm ?? form)}
        >
          {specifyForm}
        </Form>
      </FormContext.Provider>
    ),
    saveButton:
      mode === 'view' && form !== null && typeof resource === 'undefined'
        ? undefined
        : ({ onSaving: handleSaving, onSaved: handleSaved, canAddAnother }) =>
            form === null || typeof resource === 'undefined' ? undefined : (
              <SaveButton
                resource={resource}
                form={form}
                onSaving={handleSaving}
                onSaved={(payload): void => {
                  if (formMeta[0].printOnSave === true)
                    loading(
                      reports({
                        tblId: resource.specifyModel.tableId,
                        recordToPrintId: resource.id,
                        autoSelectSingle: true,
                        done: (): void => handleSaved(payload),
                      }).then((view) => view.render())
                    );
                  else handleSaved(payload);
                }}
                canAddAnother={
                  canAddAnother &&
                  !NO_ADD_ANOTHER.has(resource.specifyModel.name)
                }
              />
            ),
    specifyNetworkBadge:
      resource?.isNew() === false &&
      displaySpecifyNetwork(resource) &&
      hasTablePermission('Locality', 'read') &&
      hasPermission('/querybuilder/query', 'execute') &&
      ['CollectionObject', 'Locality'].includes(resource.specifyModel.name) ? (
        <SpecifyNetworkBadge resource={resource} />
      ) : undefined,
  });
}

const resourceDeletedDialog = (
  <Dialog
    title={commonText('resourceDeletedDialogTitle')}
    header={commonText('resourceDeletedDialogHeader')}
    buttons={commonText('close')}
    onClose={(): void => {
      navigation.go('/');
    }}
  >
    {commonText('resourceDeletedDialogMessage')}
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
  isSubForm,
  title: titleOverride,
}: {
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

  const [showUnloadProtect, setShowUnloadProtect] = React.useState(false);

  return isDeleted ? (
    resourceDeletedDialog
  ) : (
    <BaseResourceView
      resource={resource}
      mode={mode}
      viewName={viewName}
      isSubForm={isSubForm}
    >
      {({
        isModified,
        form,
        title,
        saveButton,
        specifyNetworkBadge,
      }): JSX.Element => {
        const saveButtonElement = isSubForm
          ? undefined
          : saveButton?.({
              canAddAnother,
              onSaving: handleSaving,
              onSaved: handleSaved,
            });
        if (dialog === false) {
          const deleteButton =
            !isSubForm &&
            typeof resource === 'object' &&
            !resource.isNew() &&
            hasTablePermission(resource.specifyModel.name, 'delete') ? (
              <DeleteButton
                model={resource}
                deletionMessage={deletionMessage}
                onDeleted={handleDelete}
              />
            ) : undefined;
          const formattedChildren = (
            <>
              {form}
              {children}
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
                    {specifyNetworkBadge}
                    <span className="flex-1 -ml-4" />
                  </>
                )}
              </DataEntry.SubFormHeader>
              {formattedChildren}
            </DataEntry.SubForm>
          ) : (
            <Container.Generic className="w-fit overflow-y-auto">
              <DataEntry.Header>
                <DataEntry.Title>{titleOverride ?? title}</DataEntry.Title>
                {headerButtons?.(specifyNetworkBadge) ?? (
                  <>
                    {specifyNetworkBadge}
                    <span className="flex-1 -ml-4" />
                  </>
                )}
              </DataEntry.Header>
              {formattedChildren}
            </Container.Generic>
          );
        } else
          return (
            <Dialog
              header={titleOverride ?? title}
              icon="none"
              modal={dialog === 'modal'}
              headerButtons={
                <>
                  {headerButtons ?? (
                    <>
                      <DataEntry.Visit resource={resource} />
                      <span className="flex-1 -ml-4" />
                    </>
                  )}
                  {specifyNetworkBadge}
                </>
              }
              buttons={
                isSubForm ? undefined : (
                  <>
                    {typeof resource === 'object' &&
                    !resource.isNew() &&
                    hasTablePermission(resource.specifyModel.name, 'delete') ? (
                      <DeleteButton model={resource} onDeleted={handleDelete} />
                    ) : undefined}
                    {extraButtons}
                    {isModified ? (
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
              onClose={(): void => {
                if (isModified) setShowUnloadProtect(true);
                else handleClose();
              }}
            >
              {form}
              {children}
              {showUnloadProtect && (
                <Dialog
                  title={commonText('leavePageDialogTitle')}
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
  pushUrl,
}: {
  resource: SpecifyResource<AnySchema>;
  recordSet: SpecifyResource<RecordSet> | undefined;
  pushUrl: boolean;
}): JSX.Element | null {
  const [{ resource, recordSet }, setRecord] = React.useState({
    resource: initialResource,
    recordSet: initialRecordSet,
  });

  React.useEffect(
    () =>
      pushUrl
        ? navigation.push(
            getResourceViewUrl(
              resource.specifyModel.name,
              resource.id,
              recordSet?.id
            )
          )
        : undefined,
    [resource, recordSet, pushUrl]
  );

  const [recordSetItemIndex] = useAsyncState(
    React.useCallback(async () => {
      if (resource.isNew()) return 0;
      const recordSetInfo = resource.get('recordset_info');
      return typeof recordSetInfo === 'object'
        ? fetchCollection(
            'RecordSetItem',
            {
              recordSet: recordSetInfo.recordsetid,
              limit: 1,
            },
            { recordId__lt: resource.id }
          )
            .then(({ totalCount }) => totalCount)
            .catch(crash)
        : undefined;
    }, [resource]),
    true
  );

  return typeof recordSet === 'object' ? (
    typeof recordSetItemIndex === 'undefined' ? null : (
      <RecordSetView
        dialog={false}
        mode="edit"
        model={resource.specifyModel}
        onClose={(): void => navigation.go('/')}
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
      onDeleted={(): void => navigation.go('/')}
      onSaved={({ wasNew, newResource }): void => {
        if (typeof newResource === 'object')
          setRecord({ resource: newResource, recordSet });
        else if (wasNew) navigation.go(resource.viewUrl());
        else {
          const reloadResource = new resource.specifyModel.Resource({
            id: resource.id,
          });
          reloadResource.recordsetid = resource.recordsetid;
          reloadResource
            .fetchPromise()
            .then(async () =>
              setRecord({ resource: reloadResource, recordSet })
            );
        }
      }}
    />
  );
}
