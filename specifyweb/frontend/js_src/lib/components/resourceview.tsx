import React from 'react';

import { fetchCollection } from '../collection';
import type { RecordSet, Tables } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { format } from '../dataobjformatters';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import * as navigation from '../navigation';
import populateForm from '../populateform';
import reports from '../reports';
import { setCurrentView } from '../specifyapp';
import specifyform from '../specifyform';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { f } from '../wbplanviewhelper';
import { Button, className, Container, FormFooter, H2, Link } from './basic';
import { DeleteButton } from './deletebutton';
import { crash } from './errorboundary';
import { displaySpecifyNetwork, SpecifyNetworkBadge } from './lifemapper';
import { Dialog, LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { RecordSetView } from './recordselectorutils';
import { SaveButton } from './savebutton';

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
  readonly resource: SpecifyResource<SCHEMA>;
  readonly isReadOnly: boolean;
  // Curried specifyForm.buildViewByName or specifyForm.buildSubView
  readonly buildView: () => Promise<HTMLFormElement>;
  readonly canAddAnother: boolean;
  readonly onSaving?: () => void;
  readonly onSaved?: (payload: {
    readonly addAnother: boolean;
    readonly newResource: SpecifyResource<SCHEMA> | undefined;
    readonly wasNew: boolean;
    // Readonly reporterOnSave: boolean;
  }) => void;
  readonly children: (props: {
    readonly isLoading: boolean;
    readonly isModified: boolean;
    readonly title: string;
    // Delete button component has to be created manually
    readonly saveButton?: JSX.Element;
    readonly form: JSX.Element;
    readonly specifyNetworkBadge: JSX.Element | undefined;
  }) => JSX.Element;
};

export function ResourceView<SCHEMA extends AnySchema>({
  resource,
  buildView,
  isReadOnly,
  canAddAnother,
  onSaving: handleSaving,
  onSaved: handleSaved,
  children,
}: ResourceViewProps<SCHEMA>): JSX.Element | null {
  const [state, setState] = React.useState<'loading' | 'main'>('loading');

  // Update title when resource changes
  const [title, setTitle] = React.useState(resource.specifyModel.label);
  React.useEffect(() => {
    function updateTitle(): void {
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
  }, [resource]);

  // Build the view
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const [form, setForm] = React.useState<HTMLFormElement | undefined>(
    undefined
  );
  React.useEffect(() => {
    if (container === null) return;
    Promise.all([buildView(), resource.fetchIfNotPopulated()] as const)
      .then(([form]) => {
        setState('main');

        form.querySelector('.specify-form-header')?.remove();

        defined(container ?? undefined).replaceChildren(form);
        populateForm(form, resource);
        setForm(form);

        const resourceLabel = resource.specifyModel.label;
        setTitle(
          resource.isNew()
            ? commonText('newResourceTitle')(resourceLabel)
            : resourceLabel
        );
        return undefined;
      })
      .catch(crash);
  }, [resource, container]);

  return children({
    isLoading: state === 'loading',
    isModified: resource.needsSaved,
    title,
    form: (
      <div
        ref={(container: HTMLElement | null): void =>
          container === null ? undefined : setContainer(container)
        }
      />
    ),
    saveButton:
      !isReadOnly &&
      typeof form === 'object' &&
      typeof handleSaved === 'function' ? (
        <SaveButton
          model={resource}
          form={form}
          onSaving={handleSaving}
          onSaved={(payload): void => {
            const reporterOnSave = form?.getElementsByClassName(
              'specify-print-on-save'
            )[0] as HTMLInputElement | undefined;
            if (reporterOnSave?.checked === true)
              reports({
                tblId: resource.specifyModel.tableId,
                recordToPrintId: resource.id,
                autoSelectSingle: true,
                done: (): void => handleSaved(payload),
              })
                .then((view) => view.render())
                .catch(crash);
            else handleSaved(payload);
          }}
          canAddAnother={
            canAddAnother && !NO_ADD_ANOTHER.has(resource.specifyModel.name)
          }
        />
      ) : undefined,
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
    onClose={(): void => {
      navigation.go('/');
    }}
  >
    {commonText('resourceDeletedDialogMessage')}
  </Dialog>
);

// FIXME: revisit all usages of all these components
export function IntegratedResourceView<SCHEMA extends AnySchema>({
  resource,
  buildView = async (): Promise<HTMLFormElement> =>
    specifyform
      .buildViewByName(resource.specifyModel.view)
      .then(([element]) => element as HTMLFormElement),
  extraButtons = <span className="flex-1 -ml-2" />,
  headerButtons = <span className="flex-1 -ml-4" />,
  canAddAnother,
  deletionMessage,
  dialog = false,
  onSaving: handleSaving,
  onSaved: handleSaved,
  onClose: handleClose,
  children,
}: {
  readonly resource: SpecifyResource<SCHEMA>;
  readonly buildView?: () => Promise<HTMLFormElement>;
  readonly headerButtons?: JSX.Element;
  readonly canAddAnother: boolean;
  readonly extraButtons?: JSX.Element | undefined;
  readonly deletionMessage?: string | undefined;
  readonly dialog: false | 'modal' | 'nonModal';
  readonly onSaving?: () => void;
  readonly onSaved: (payload: {
    readonly addAnother: boolean;
    readonly newResource: SpecifyResource<SCHEMA> | undefined;
    readonly wasNew: boolean;
  }) => void;
  readonly onClose: () => void;
  readonly children?: JSX.Element;
}): JSX.Element {
  const [isDeleted, setIsDeleted] = React.useState(false);
  const [showUnloadProtect, setShowUnloadProtect] = React.useState(false);

  return isDeleted ? (
    resourceDeletedDialog
  ) : (
    <ResourceView
      resource={resource}
      buildView={buildView}
      isReadOnly={userInformation.isReadOnly}
      canAddAnother={canAddAnother}
      onSaving={handleSaving}
      onSaved={(payload) => {
        handleSaved(payload);
        handleClose();
      }}
    >
      {({
        isLoading,
        isModified,
        form,
        title,
        saveButton,
        specifyNetworkBadge,
      }): JSX.Element =>
        dialog === false ? (
          <Container className="w-fit overflow-y-auto">
            {isLoading && <LoadingScreen />}
            <header className={className.formHeader}>
              <H2 className={className.formTitle}>{title}</H2>
              {headerButtons}
              {specifyNetworkBadge}
            </header>
            {form}
            {children}
            <FormFooter>
              {!resource.isNew() && !userInformation.isReadOnly ? (
                <DeleteButton
                  model={resource}
                  deletionMessage={deletionMessage}
                  onDeleted={(): void => {
                    handleClose();
                    setIsDeleted(true);
                  }}
                />
              ) : undefined}
              {extraButtons}
              {saveButton}
            </FormFooter>
          </Container>
        ) : (
          <Dialog
            header={title}
            modal={dialog === 'modal'}
            headerButtons={
              <>
                {!resource.isNew() && <Link.NewTab href={resource.viewUrl()} />}
                {headerButtons}
                {specifyNetworkBadge}
              </>
            }
            buttons={
              <>
                {!resource.isNew() && !userInformation.isReadOnly ? (
                  <DeleteButton
                    model={resource}
                    onDeleted={(): void => setIsDeleted(true)}
                  />
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
                {saveButton}
              </>
            }
            onClose={(): void => {
              if (isModified) setShowUnloadProtect(true);
              else handleClose();
            }}
          >
            {form}
            {children}
            {isLoading && <LoadingScreen />}
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
        )
      }
    </ResourceView>
  );
}

export const ViewResource = createBackboneView(IntegratedResourceView);

export async function showResource(
  resource: SpecifyResource<AnySchema>,
  recordSet?: SpecifyResource<RecordSet>,
  pushUrl = false
): Promise<void> {
  if (pushUrl) navigation.push(resource.viewUrl());

  const recordSetInfo = resource.get('recordset_info');
  const recordSetItemIndex =
    typeof recordSetInfo === 'object'
      ? await fetchCollection(
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
  const view =
    typeof recordSetItemIndex === 'number' && typeof recordSet === 'object'
      ? new RecordSetView({
          recordSet,
          defaultResourceIndex: recordSetItemIndex,
          onSaved: ({ addAnother, newResource, wasNew }): void => {
            if (addAnother && typeof newResource === 'object')
              showResource(newResource, recordSet, true);
            else if (wasNew) navigation.go(resource.viewUrl());
            else {
              const reloadResource = new resource.specifyModel.Resource({
                id: resource.id,
              });
              reloadResource.recordsetid = resource.recordsetid;
              reloadResource
                .fetchPromise()
                .then(async () => showResource(reloadResource, recordSet));
            }
          },
        })
      : new ViewResource({
          resource,
          onClose: f.void,
          canAddAnother: true,
          dialog: false,
          onSaved: ({ addAnother, newResource, wasNew }): void => {
            if (addAnother && typeof newResource === 'object')
              showResource(newResource, recordSet, true);
            else if (wasNew) navigation.go(resource.viewUrl());
            else {
              const reloadResource = new resource.specifyModel.Resource({
                id: resource.id,
              });
              reloadResource.recordsetid = resource.recordsetid;
              reloadResource
                .fetchPromise()
                .then(async () => showResource(reloadResource, recordSet));
            }
          },
        });
  setCurrentView(view);
}
