import React from 'react';

import { Http } from '../ajax';
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
import specifyForm from '../specifyform';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { className, H2 } from './basic';
import { DeleteButton } from './deletebutton';
import { crash } from './errorboundary';
import { setTitle } from './hooks';
import { displaySpecifyNetwork, SpecifyNetworkBadge } from './lifemapper';
import { Dialog } from './modaldialog';
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

// FIXME: remove
export function ViewHeader({
  /*
   * RecordSetInfo,
   * recordSetName,
   * previousUrl,
   * nextUrl,
   * newUrl,
   */
  title,
  children,
  resource,
}: {
  /*
   * Readonly recordSetInfo: RecordSetInfo | undefined;
   * readonly recordSetName: string | undefined;
   * readonly previousUrl: string | undefined;
   * readonly nextUrl: string | undefined;
   * readonly newUrl: string | undefined;
   */
  readonly title: string;
  readonly children?: JSX.Element;
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element {
  return (
    <header className={className.formHeader}>
      <H2 className={className.formTitle}>{title}</H2>
      {children}
      {/* Typeof recordSetName === 'string' && (
        <nav
          className="flex border border-gray-500 rounded"
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
                <span>{recordSetInfo.total_count}</span>
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
      )*/}
    </header>
  );
}

export type FormType = 'form' | 'formtable';

export type ResourceViewProps<SCHEMA extends AnySchema> = {
  readonly resource: SpecifyResource<SCHEMA>;
  readonly mode: 'edit' | 'view';
  readonly type?: FormType;
  readonly viewName?: string;
  readonly canAddAnother: boolean;
  readonly deletionMessage?: string;
  readonly onChangeTitle?: (newTitle: string) => void;
  readonly onSaving?: () => void;
  readonly onSaved?: (payload: {
    readonly addAnother: boolean;
    readonly newResource: SpecifyResource<SCHEMA> | undefined;
    readonly wasNew: boolean;
    readonly reporterOnSave: boolean;
  }) => void;
  readonly onClose: () => void;
  readonly onDeleted?: () => void;
  // Readonly className?: string;
  readonly isSubView: boolean;
  readonly children: (props: {
    readonly isLoading: boolean;
    readonly isModified: boolean;
    readonly title: string;
    readonly saveButton?: JSX.Element;
    readonly deleteButton?: JSX.Element;
    readonly form: JSX.Element;
    readonly specifyNetworkBadge: JSX.Element | undefined;
  }) => JSX.Element;
};

// FIXME: review and remove comments
export function ResourceView<SCHEMA extends AnySchema>({
  resource,
  mode,
  type = 'form',
  viewName,
  canAddAnother,
  // HasHeader,
  onChangeTitle: handleChangeTitle,
  deletionMessage,
  onSaving: handleSaving,
  onClose: handleClose,
  onSaved: handleSaved,
  onDeleted: handleDeleted,
  // ClassName,
  isSubView,
  children,
}: ResourceViewProps<SCHEMA>): JSX.Element | null {
  const [state, setState] = React.useState<'loading' | 'main' | 'noDefinition'>(
    'loading'
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
    ])
      .then(([form]) => {
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
      })
      .catch((error) => {
        if (error !== Http.NOT_FOUND) throw error;
        setState('noDefinition');
      });
  }, [resource]);

  return state === 'noDefinition' ? (
    <section role="alert">
      <H2>{formsText('missingFormDefinitionPageHeader')}</H2>
      <p>{formsText('missingFormDefinitionPageContent')}</p>
    </section>
  ) : (
    children({
      isLoading: state === 'loading',
      isModified: resource.needsSaved,
      title,
      deleteButton:
        !resource.isNew() &&
        mode === 'edit' &&
        typeof handleDeleted === 'function' ? (
          <DeleteButton
            model={resource}
            deletionMessage={deletionMessage}
            onDeleted={(): void => {
              handleDeleted();
              handleClose();
            }}
          />
        ) : undefined,
      form: <div ref={containerRef} />,
      saveButton:
        mode === 'edit' &&
        form !== undefined &&
        typeof handleSaved === 'function' ? (
          <SaveButton
            model={resource}
            form={form}
            onSaving={handleSaving}
            onSaved={(payload): void => {
              const reporterOnSave = form?.getElementsByClassName(
                'specify-print-on-save'
              )[0] as HTMLInputElement | undefined;
              handleSaved({
                ...payload,
                reporterOnSave: reporterOnSave?.checked === true,
              });
              handleClose();
            }}
            canAddAnother={
              canAddAnother && !NO_ADD_ANOTHER.has(resource.specifyModel.name)
            }
          />
        ) : undefined,
      specifyNetworkBadge: displaySpecifyNetwork(resource) ? (
        <SpecifyNetworkBadge resource={resource} />
      ) : undefined,
    })
  );
  // FIXME: remove
  /*
   *Const content = (
   *<>
   *  {state === 'loading' && hasHeader ? <LoadingScreen /> : undefined}
   *  {hasHeader && typeof recordSetInfo === 'object' ? (
   *    <ViewHeader
   *      {...recordSetInfo}
   *      recordSetName={recordSet?.get('name')}
   *      title={title}
   *      resource={resource}
   *    />
   *  ) : undefined}
   *  <div ref={containerRef} />
   *  {hasSaveButton || hasDeleteButton ? (
   *    <FormFooter>
   *    </FormFooter>
   *  ) : undefined}
   *</>
   *);
   *return hasHeader ? (
   *<section className={className}>{content}</section>
   *) : (
   *content
   *);
   *}
   */
}

export const ResourceViewBackbone = createBackboneView(ResourceView);

// FIXME: update
export function ResourceViewComponent({
  resource,
  pushUrl,
  onClose: handleClose,
  onSaved: handleSaved,
}: {
  readonly resource: SpecifyResource<AnySchema>;
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
    >
      {({
        isLoading,
        isModified,
        title,
        saveButton,
        deleteButton,
        form,
      }): JSX.Element => {}}
    </ResourceView>
  );
}

const ViewResource = createBackboneView(ResourceViewComponent);

export async function showResource(
  resource: SpecifyResource<AnySchema>,
  recordSet?: SpecifyResource<RecordSet>,
  pushUrl = false
): void {
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
  const handleClose = (): void => void view.remove();
  const view =
    typeof recordSetItemIndex === 'number' && typeof recordSet === 'object'
      ? new RecordSetView({
          recordSet,
          defaultResourceIndex: recordSetItemIndex,
          onClose: handleClose,
          onSaved: ({
            reporterOnSave,
            addAnother,
            newResource,
            wasNew,
          }): void => {
            function viewSaved() {
              if (addAnother && typeof newResource === 'object')
                showResource(newResource, recordSet, true);
              else {
                const reloadResource = new resource.specifyModel.Resource({
                  id: resource.id,
                });
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
        })
      : new ViewResource({
          resource,
          pushUrl,
          onClose: handleClose,
          onSaved: ({
            reporterOnSave,
            addAnother,
            newResource,
            wasNew,
          }): void => {
            function viewSaved() {
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
