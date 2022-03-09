import React from 'react';

import type { CollectionObject, RecordSet, Tables, Taxon } from '../datamodel';
import type { AnySchema, RecordSetInfo } from '../datamodelutils';
import { format } from '../dataobjformatters';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import * as navigation from '../navigation';
import populateForm from '../populateform';
import { getBoolPref } from '../remoteprefs';
import reports from '../reports';
import { makeResourceViewUrl } from '../specifyapi';
import { setCurrentView } from '../specifyapp';
import specifyForm from '../specifyform';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { Button, className, FormFooter, H2 } from './basic';
import { DeleteButton } from './deletebutton';
import { crash, ErrorBoundary } from './errorboundary';
import { setTitle, useAsyncState } from './hooks';
import { SpecifyNetworkBadge } from './lifemapper';
import { Dialog, LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { parseResourceUrl } from './resource';
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

function ViewHeader({
  recordSetInfo,
  recordSetName,
  previousUrl,
  nextUrl,
  newUrl,
  title,
  resource,
}: {
  readonly recordSetInfo: RecordSetInfo | undefined;
  readonly recordSetName: string | undefined;
  readonly previousUrl: string | undefined;
  readonly nextUrl: string | undefined;
  readonly newUrl: string | undefined;
  readonly title: string;
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element {
  return (
    <header className={className.formHeader}>
      <H2 className={className.formTitle}>{title}</H2>
      {typeof recordSetName === 'string' && (
        <nav
          className="recordset-header flex border border-gray-500 rounded"
          title={formsText('recordSetAreaDescription')(recordSetName)}
          aria-label={formsText('recordSetAreaDescription')(recordSetName)}
        >
          {typeof recordSetInfo === 'object' ? (
            <>
              {typeof previousUrl === 'string' ? (
                <a
                  className="intercept-navigation link pl-2 pr-3 py-0.5"
                  href={previousUrl}
                  rel="prev"
                  title={formsText('previousRecord')}
                  aria-label={formsText('previousRecord')}
                >
                  &lt;
                </a>
              ) : (
                <span
                  className="pl-2 pr-3 py-0.5 text-gray-400 dark:text-gray-500"
                  aria-hidden="true"
                >
                  &lt;
                </span>
              )}
              <label className="sr-only">
                {formsText('currentPositionInTheRecordSet')}
                <meter
                  min="0"
                  value={recordSetInfo.index + 1}
                  max={recordSetInfo.total_count}
                >
                  {formsText('aOutOfB')(
                    recordSetInfo.index + 1,
                    recordSetInfo.total_count
                  )}
                </meter>
              </label>
              <span
                className="grid grid-cols-[1fr_auto_1fr] py-0.5"
                aria-hidden="true"
              >
                <span className="text-center">{recordSetInfo.index + 1}</span>
                <span className="recordset-navigation-total">
                  {recordSetInfo.total_count}
                </span>
              </span>

              {typeof nextUrl === 'string' ? (
                <a
                  className="intercept-navigation link pl-3 pr-2 py-0.5"
                  href={nextUrl}
                  rel="next"
                  title={formsText('nextRecord')}
                  aria-label={formsText('nextRecord')}
                >
                  &gt;
                </a>
              ) : (
                <span
                  className="pl-3 pr-2 py-0.5 text-gray-400 dark:text-gray-500"
                  aria-hidden="true"
                >
                  &gt;
                </span>
              )}
              {typeof newUrl === 'string' && (
                <a
                  href={newUrl}
                  className="intercept-navigation px-2 py-0.5 recordset-new"
                  title={formsText('createRecordButtonDescription')}
                  aria-label={formsText('createRecordButtonDescription')}
                >
                  +
                </a>
              )}
            </>
          ) : (
            <span className="px-1 py-0.5">
              {formsText('addingToRecordSet')}
            </span>
          )}
        </nav>
      )}
      {!getBoolPref('s2n.badges.disable', false) &&
      !resource.isNew() &&
      ['Taxon', 'CollectionObject'].includes(resource.specifyModel.name) ? (
        <span className="flex justify-end flex-1">
          <ErrorBoundary silentErrors={true}>
            <SpecifyNetworkBadge
              resource={
                resource as
                  | SpecifyResource<CollectionObject>
                  | SpecifyResource<Taxon>
              }
            />
          </ErrorBoundary>
        </span>
      ) : undefined}
    </header>
  );
}

export type FormType = 'form' | 'formtable';

export function ResourceView({
  resource,
  recordSet,
  mode,
  type = 'form',
  viewName,
  canAddAnother,
  hasHeader,
  onChangeTitle: handleChangeTitle,
  extraButton,
  deletionMessage,
  hasButtons = true,
  onSaving: handleSaving,
  onClose: handleClose,
  onSaved: handleSaved,
  onDeleted: handleDeleted,
  className,
  isSubView,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly recordSet?: SpecifyResource<RecordSet>;
  readonly mode: 'edit' | 'view';
  readonly type?: FormType;
  readonly viewName?: string;
  readonly canAddAnother: boolean;
  readonly hasHeader: boolean;
  // TODO: remove this once RecordSetsDialog is converted to React
  readonly extraButton?: {
    readonly label: string;
    readonly onClick: () => void;
  };
  readonly deletionMessage?: string;
  readonly onChangeTitle?: (newTitle: string) => void;
  readonly hasButtons?: boolean;
  readonly onSaving?: () => void;
  readonly onSaved?: (payload: {
    readonly addAnother: boolean;
    readonly newResource: SpecifyResource<AnySchema> | undefined;
    readonly wasNew: boolean;
    readonly reporterOnSave: boolean;
  }) => void;
  readonly onClose: () => void;
  readonly onDeleted?: (nextResource: string | undefined) => void;
  readonly className?: string;
  readonly isSubView: boolean;
}): JSX.Element | null {
  const [state, setState] = React.useState<'loading' | 'main' | 'noDefinition'>(
    'loading'
  );

  // Fetch record set info
  const [recordSetInfo] = useAsyncState(
    React.useCallback(() => {
      const info = resource.get('recordset_info');
      if (typeof info === 'undefined') return undefined;
      return {
        recordSetInfo: info,
        previousUrl:
          typeof info.previous === 'string'
            ? makeResourceViewUrl(
                ...defined(parseResourceUrl(info.previous)),
                info.recordsetid
              )
            : undefined,
        nextUrl:
          typeof info.next === 'string'
            ? makeResourceViewUrl(
                ...defined(parseResourceUrl(info.next)),
                info.recordsetid
              )
            : undefined,
        newUrl: makeResourceViewUrl(
          resource.specifyModel.name,
          'new',
          info.recordsetid
        ),
      };
    }, [resource])
  );

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
          handleChangeTitle?.(title);
          setTitle(title);
          return undefined;
        })
        .catch(crash);
    }

    resource.on('change', updateTitle);
    updateTitle();
  }, [resource]);

  // Build the view
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [form, setForm] = React.useState<HTMLFormElement | undefined>(
    undefined
  );
  React.useEffect(() => {
    if (containerRef.current === null) return;
    Promise.all([
      specifyForm.buildViewByName(
        viewName ?? resource.specifyModel.view,
        type,
        mode,
        isSubView
      ),
      resource.fetchIfNotPopulated(),
    ]).then(
      ([form]) => {
        setState('main');

        form.find('.specify-form-header:first').remove();

        populateForm(form, resource);
        const formElement = form[0] as HTMLFormElement;
        defined(containerRef.current ?? undefined).replaceChildren(formElement);
        setForm(formElement);

        const resourceLabel = resource.specifyModel.label;
        setTitle(
          resource.isNew()
            ? commonText('newResourceTitle')(resourceLabel)
            : resourceLabel
        );
        return undefined;
      },
      (error) => {
        if (error.status !== 404) return;
        error.errorHandled = true;
        setState('noDefinition');
      }
    );
  }, [resource]);

  if (state === 'noDefinition')
    return (
      <section role="alert">
        <H2>{formsText('missingFormDefinitionPageHeader')}</H2>
        <p>{formsText('missingFormDefinitionPageContent')}</p>
      </section>
    );
  else {
    const content = (
      <>
        {state === 'loading' && hasHeader ? <LoadingScreen /> : undefined}
        {hasHeader && typeof recordSetInfo === 'object' ? (
          <ViewHeader
            {...recordSetInfo}
            recordSetName={recordSet?.get('name')}
            title={title}
            resource={resource}
          />
        ) : undefined}
        <div ref={containerRef} />
        {hasButtons && (
          <FormFooter>
            {!resource.isNew() && mode === 'edit' ? (
              <DeleteButton
                model={resource}
                deletionMessage={deletionMessage}
                onDeleted={(): void => {
                  handleDeleted?.(
                    recordSetInfo?.nextUrl ?? recordSetInfo?.previousUrl
                  );
                  handleClose();
                }}
              />
            ) : undefined}
            {typeof extraButton === 'object' && (
              <Button.Gray onClick={extraButton.onClick}>
                {extraButton.label}
              </Button.Gray>
            )}
            {mode === 'edit' && form !== undefined ? (
              <SaveButton
                model={resource}
                form={form}
                onSaving={handleSaving}
                onSaved={(payload): void => {
                  const reporterOnSave = form?.getElementsByClassName(
                    'specify-print-on-save'
                  )[0] as HTMLInputElement | undefined;
                  handleSaved?.({
                    ...payload,
                    reporterOnSave: reporterOnSave?.checked === true,
                  });
                  handleClose();
                }}
                canAddAnother={
                  canAddAnother &&
                  !NO_ADD_ANOTHER.has(resource.specifyModel.name)
                }
              />
            ) : undefined}
          </FormFooter>
        )}
      </>
    );
    return hasHeader ? (
      <section className={className}>{content}</section>
    ) : (
      content
    );
  }
}

export const ResourceViewBackbone = createBackboneView(ResourceView);

export function ResourceViewComponent({
  resource,
  recordSet,
  pushUrl,
  onClose: handleClose,
  onSaved: handleSaved,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly recordSet?: SpecifyResource<RecordSet>;
  readonly pushUrl: boolean;
  readonly onClose: () => void;
  readonly onSaved: (payload: {
    readonly addAnother: boolean;
    readonly newResource: SpecifyResource<AnySchema> | undefined;
    readonly wasNew: boolean;
    readonly reporterOnSave: boolean;
  }) => void;
}): JSX.Element {
  React.useEffect(() => {
    if (pushUrl) navigation.push(resource.viewUrl());
  }, [pushUrl, resource]);

  const [isDeleted, setIsDeleted] = React.useState(false);
  return isDeleted ? (
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
  ) : (
    <ResourceView
      className={`${className.container} w-fit overflow-y-auto`}
      resource={resource}
      recordSet={recordSet}
      mode={userInformation.isReadOnly ? 'view' : 'edit'}
      canAddAnother={true}
      hasHeader={true}
      onChangeTitle={setTitle}
      onSaved={handleSaved}
      onDeleted={(nextResource) =>
        typeof nextResource === 'string'
          ? navigation.go(nextResource)
          : setIsDeleted(true)
      }
      onClose={handleClose}
      isSubView={false}
    />
  );
}

const ViewResource = createBackboneView(ResourceViewComponent);

export function showResource(
  resource: SpecifyResource<AnySchema>,
  recordSet?: SpecifyResource<RecordSet>,
  pushUrl = false
): void {
  const handleClose = (): void => void view.remove();
  const view = new ViewResource({
    resource,
    recordSet,
    pushUrl,
    onClose: handleClose,
    onSaved: ({ reporterOnSave, addAnother, newResource, wasNew }): void => {
      function viewSaved() {
        if (addAnother && typeof newResource === 'object')
          showResource(newResource, recordSet, true);
        else if (wasNew) navigation.go(resource.viewUrl());
        else {
          const reloadResource = new resource.specifyModel.Resource({
            id: resource.id,
          });
          // @ts-expect-error Non-standard property
          reloadResource.recordsetid = resource.recordsetid;
          reloadResource
            .fetchPromise()
            .then(() => showResource(reloadResource, recordSet));
        }
      }

      if (reporterOnSave) {
        console.log('generating label or invoice');
        reports({
          tblId: resource.specifyModel.tableId,
          recordToPrintId: resource.id,
          autoSelectSingle: true,
          done: viewSaved,
        })
          .then((view) => view.render())
          .catch(crash);
      } else viewSaved();
    },
  });
  setCurrentView(view);
}
