import React from 'react';

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
import { ReportsView } from './reports';
import { getResourceViewUrl, resourceOn } from '../resource';
import { Button, Container, DataEntry, Form } from './basic';
import { AppTitle } from './common';
import type { FormMeta } from './contexts';
import { FormContext } from './contexts';
import { DeleteButton } from './deletebutton';
import { crash } from './errorboundary';
import { useAsyncState, useBooleanState, useId, useIsModified } from './hooks';
import { Dialog } from './modaldialog';
import { goTo, pushUrl } from './navigation';
import { usePref } from './preferenceshooks';
import { defaultFont } from './preferencesrenderers';
import { RecordSet as RecordSetView } from './recordselectorutils';
import { SaveButton } from './savebutton';
import { SpecifyForm } from './specifyform';
import { displaySpecifyNetwork, SpecifyNetworkBadge } from './specifynetwork';
import { State } from 'typesafe-reducer';

const NO_ADD_ANOTHER: Set<keyof Tables> = new Set([
  'Gift',
  'Borrow',
  'Loan',
  'ExchangeIn',
  'ExchangeOut',
  'Permit',
  'RepositoryAgreement',
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
            setFormatted('');
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

  const [tableNameInTitle] = usePref('form', 'ui', 'tableNameInTitle');
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
    title={commonText('resourceDeletedDialogTitle')}
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

  const [fontFamily] = usePref('general', 'ui', 'fontFamily');
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  React.useEffect(
    () =>
      fontFamily === defaultFont
        ? void container?.style.removeProperty('font-family')
        : container?.style.setProperty('font-family', fontFamily),
    [container, fontFamily]
  );

  const [fontSize] = usePref('general', 'ui', 'fontSize');
  React.useEffect(
    () => container?.style.setProperty('font-size', `${fontSize}%`),
    [container, fontSize]
  );
  const [state, setState] = React.useState<
    State<'Main'> | State<'Report', { readonly onDone: () => void }>
  >({ type: 'Main' });

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
                formMeta.printOnSave === true
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
              {report}
              <Container.Center
                style={{
                  fontFamily:
                    fontFamily === defaultFont ? undefined : fontFamily,
                  fontSize: `${fontSize}%`,
                }}
                className="!w-auto"
              >
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
              modal={dialog === 'modal'}
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
              onClose={(): void => {
                if (isModified) setShowUnloadProtect(true);
                else handleClose();
              }}
              forwardRef={{
                container: setContainer,
              }}
            >
              {form(children)}
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
        ? fetchCollection(
            'RecordSetItem',
            {
              recordSet: recordSet.id,
              limit: 1,
            },
            { recordId__lt: resource.id }
          )
            .then(({ totalCount }) => totalCount)
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
      onDeleted={(): void => goTo('/')}
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
