import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { reportsText } from '../../localization/report';
import { resourcesText } from '../../localization/resources';
import { schemaText } from '../../localization/schema';
import { f } from '../../utils/functools';
import { H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { toTable } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { GenerateLabel } from '../FormCommands';
import { InFormEditorContext } from '../FormEditor/Context';
import { PrintOnSave } from '../FormFields/Checkbox';
import type { ViewDescription } from '../FormParse';
import { SubViewContext } from '../Forms/SubView';
import { isTreeResource } from '../InitialContext/treeRanks';
import { interactionTables } from '../Interactions/config';
import { recordMergingTableSpec } from '../Merging/definitions';
import { Dialog } from '../Molecules/Dialog';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import {
  ProtectedAction,
  ProtectedTool,
} from '../Permissions/PermissionDenied';
import { UnloadProtectsContext } from '../Router/UnloadProtect';
import { AutoNumbering } from './AutoNumbering';
import { CarryForwardConfig } from './CarryForward';
import { AddButtonConfig, CloneConfig } from './Clone';
import { Definition } from './Definition';
import { EditHistory } from './EditHistory';
import { MergeRecord } from './MergeRecord';
import { PickListUsages } from './PickListUsages';
import { QueryTreeUsages } from './QueryTreeUsages';
import { ReadOnlyMode } from './ReadOnlyMode';
import { ShareRecord } from './ShareRecord';
import { SubViewMeta } from './SubViewMeta';

/**
 * Form preferences host context aware user preferences and other meta-actions.
 * List of available features: https://github.com/specify/specify7/issues/1330
 */
export function FormMeta({
  resource,
  className,
  viewDescription,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly className?: string;
  readonly viewDescription: ViewDescription | undefined;
}): JSX.Element | null {
  const [isOpen, _, handleClose, handleToggle] = useBooleanState();
  const [isReadOnly = false] = useCachedState('forms', 'readOnlyMode');
  const subView = React.useContext(SubViewContext);
  const isInFormEditor = React.useContext(InFormEditorContext);
  return isInFormEditor && typeof viewDescription === 'object' ? (
    <FormEditorLink viewDescription={viewDescription} />
  ) : typeof resource === 'object' ? (
    <>
      <Button.Small
        aria-label={formsText.formMeta()}
        className={className}
        title={formsText.formMeta()}
        onClick={handleToggle}
      >
        {icons.cog}
        {subView === undefined && isReadOnly
          ? schemaText.readOnly()
          : undefined}
      </Button.Small>
      {isOpen && typeof resource === 'object' ? (
        <MetaDialog
          resource={resource}
          viewDescription={viewDescription}
          onClose={handleClose}
        />
      ) : undefined}
    </>
  ) : null;
}

function FormEditorLink({
  viewDescription,
}: {
  readonly viewDescription: ViewDescription;
}): JSX.Element | null {
  const needsSaving =
    (React.useContext(UnloadProtectsContext)?.length ?? 0) > 0;
  const [showAlert, handleShowAlert, handleHideAlert] = useBooleanState();
  return typeof viewDescription.viewSetId === 'number' ? (
    <>
      <Link.Small
        aria-label={commonText.edit()}
        href={`/specify/resources/view-set/${viewDescription.viewSetId}/${viewDescription.table.name}/${viewDescription.name}/`}
        title={commonText.edit()}
        onClick={(event): void => {
          if (!needsSaving) return;
          event.preventDefault();
          handleShowAlert();
        }}
      >
        {icons.pencil}
      </Link.Small>
      {showAlert && (
        <Dialog
          buttons={commonText.close()}
          header={resourcesText.saveFormFirst()}
          onClose={handleHideAlert}
        >
          {resourcesText.saveFormFirstDescription()}
        </Dialog>
      )}
    </>
  ) : null;
}

function MetaDialog({
  resource,
  viewDescription,
  onClose: handleClose,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly viewDescription: ViewDescription | undefined;
  readonly onClose: () => void;
}): JSX.Element {
  const subView = React.useContext(SubViewContext);
  return (
    <Dialog
      buttons={commonText.close()}
      header={resource.specifyTable.label}
      modal={false}
      onClose={handleClose}
    >
      <Section
        buttons={
          <Definition
            table={resource.specifyTable}
            viewDescription={viewDescription}
          />
        }
        header={formsText.formConfiguration()}
      >
        {subView === undefined && (
          <>
            <CloneConfig table={resource.specifyTable} />
            <CarryForwardConfig
              parentTable={undefined}
              table={resource.specifyTable}
              type="button"
            />
            <AddButtonConfig table={resource.specifyTable} />
          </>
        )}
      </Section>
      <Section
        buttons={
          <>
            <AutoNumbering resource={resource} />
            {subView === undefined && !resource.isNew() ? (
              <ReadOnlyMode />
            ) : undefined}
            <GenerateLabel
              id={undefined}
              label={
                interactionTables.has(resource.specifyTable.name)
                  ? reportsText.generateReport()
                  : reportsText.generateLabel()
              }
              resource={resource}
            />
          </>
        }
        header={formsText.formState()}
      >
        {subView === undefined && (
          <PrintOnSave
            defaultValue={false}
            field={undefined}
            id={undefined}
            name={undefined}
            table={resource.specifyTable}
            text={
              interactionTables.has(resource.specifyTable.name)
                ? reportsText.generateReportOnSave()
                : reportsText.generateLabelOnSave()
            }
          />
        )}
      </Section>
      {subView !== undefined && (
        <Section header={formsText.subviewConfiguration()}>
          <SubViewMeta subView={subView} table={resource.specifyTable} />
        </Section>
      )}
      <Section
        buttons={
          <>
            <ProtectedTool action="read" tool="auditLog">
              <ProtectedAction action="execute" resource="/querybuilder/query">
                <EditHistory resource={resource} />
              </ProtectedAction>
            </ProtectedTool>
            {isTreeResource(resource) && !resource.isNew() ? (
              <QueryTreeUsages resource={resource} />
            ) : null}
            <ProtectedTool action="read" tool="pickLists">
              <ProtectedAction action="execute" resource="/querybuilder/query">
                {f.maybe(toTable(resource, 'PickList'), (pickList) => (
                  <PickListUsages pickList={pickList} />
                ))}
              </ProtectedAction>
            </ProtectedTool>
            {resource.specifyTable.name in recordMergingTableSpec &&
            hasPermission('/record/merge', 'update') &&
            hasPermission('/record/merge', 'delete') &&
            hasTablePermission(resource.specifyTable.name, 'update') ? (
              <MergeRecord resource={resource} />
            ) : undefined}
          </>
        }
        header={formsText.recordInformation()}
      >
        {!resource.isNew() && <ShareRecord resource={resource} />}
      </Section>
    </Dialog>
  );
}

function Section({
  header,
  buttons,
  children,
}: {
  readonly header: string;
  readonly buttons?: JSX.Element;
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-2 pb-2">
      <H3>{header}</H3>
      {typeof buttons === 'object' && (
        <div className="flex max-w-[theme(spacing.96)] flex-wrap gap-2">
          {buttons}
        </div>
      )}
      {children}
    </div>
  );
}
