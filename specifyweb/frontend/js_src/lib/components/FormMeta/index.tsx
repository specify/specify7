import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { reportsText } from '../../localization/report';
import { schemaText } from '../../localization/schema';
import { f } from '../../utils/functools';
import { H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { toTable } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { GenerateLabel } from '../FormCommands';
import { PrintOnSave } from '../FormFields/Checkbox';
import type { ViewDescription } from '../FormParse';
import { SubViewContext } from '../Forms/SubView';
import { isTreeResource } from '../InitialContext/treeRanks';
import { interactionTables } from '../Interactions/InteractionsDialog';
import { Dialog } from '../Molecules/Dialog';
import {
  ProtectedAction,
  ProtectedTool,
} from '../Permissions/PermissionDenied';
import { AutoNumbering } from './AutoNumbering';
import { CarryForwardConfig } from './CarryForward';
import { AddButtonConfig, CloneConfig } from './Clone';
import { Definition } from './Definition';
import { EditHistory } from './EditHistory';
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
  return typeof resource === 'object' ? (
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
      header={resource.specifyModel.label}
      modal={false}
      onClose={handleClose}
    >
      <Section
        buttons={
          <Definition
            model={resource.specifyModel}
            viewDescription={viewDescription}
          />
        }
        header={formsText.formConfiguration()}
      >
        {subView === undefined && (
          <>
            <CloneConfig model={resource.specifyModel} />
            <CarryForwardConfig
              model={resource.specifyModel}
              parentModel={undefined}
              type="button"
            />
            <AddButtonConfig model={resource.specifyModel} />
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
                interactionTables.has(resource.specifyModel.name)
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
            model={resource.specifyModel}
            name={undefined}
            text={
              interactionTables.has(resource.specifyModel.name)
                ? reportsText.generateReportOnSave()
                : reportsText.generateLabelOnSave()
            }
          />
        )}
      </Section>
      {subView !== undefined && (
        <Section header={formsText.subviewConfiguration()}>
          <SubViewMeta model={resource.specifyModel} subView={subView} />
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
            {isTreeResource(resource) && (
              <QueryTreeUsages resource={resource} />
            )}
            <ProtectedTool action="read" tool="pickLists">
              <ProtectedAction action="execute" resource="/querybuilder/query">
                {f.maybe(toTable(resource, 'PickList'), (pickList) => (
                  <PickListUsages pickList={pickList} />
                ))}
              </ProtectedAction>
            </ProtectedTool>
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
