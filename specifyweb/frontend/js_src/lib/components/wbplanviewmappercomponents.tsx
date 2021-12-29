import React from 'react';

import wbText from '../localization/workbench';
import { getMappingLineData } from '../wbplanviewnavigator';
import type { MappingsTree } from '../wbplanviewtreehelper';
import { closeDialog, ModalDialog } from './modaldialog';
import type { IR, RA } from '../types';
import { MappingPathComponent } from './wbplanviewcomponents';
import type { MappingPath } from './wbplanviewmapper';

export type GetMappedFieldsBind = (
  // A mapping path that would be used as a filter
  mappingPathFilter: MappingPath
) => MappingsTree;

export type PathIsMappedBind = (
  // A mapping path that would be used as a filter
  mappingPathFilter: MappingPath
) => boolean;

export function MappingsControlPanel({
  showHiddenFields,
  onToggleHiddenFields: handleToggleHiddenFields,
  onAddNewHeader: handleAddNewHeader,
}: {
  readonly showHiddenFields: boolean;
  readonly onToggleHiddenFields?: () => void;
  readonly onAddNewHeader?: (newHeaderName: string) => void;
}): JSX.Element {
  const newHeaderIdRef = React.useRef(1);

  return (
    <div role="toolbar" className="wbplanview-control-panel">
      {typeof handleAddNewHeader === 'function' && (
        <button
          type="button"
          className="magic-button"
          onClick={(): void => {
            handleAddNewHeader(wbText('newHeaderName')(newHeaderIdRef.current));
            newHeaderIdRef.current += 1;
          }}
        >
          {wbText('addNewColumn')}
        </button>
      )}
      <label>
        {' '}
        <input
          type="checkbox"
          checked={showHiddenFields}
          onChange={handleToggleHiddenFields}
        />{' '}
        {wbText('revealHiddenFormFields')}
      </label>
    </div>
  );
}

export function ValidationResults(props: {
  readonly baseTableName: string;
  readonly validationResults: RA<MappingPath>;
  readonly onSave: () => void;
  readonly onDismissValidation: () => void;
  readonly getMappedFields: GetMappedFieldsBind;
  readonly onValidationResultClick: (mappingPath: MappingPath) => void;
  readonly mustMatchPreferences: IR<boolean>;
}): JSX.Element | null {
  if (props.validationResults.length === 0) return null;

  return (
    <ModalDialog
      properties={{
        title: wbText('validationFailedDialogTitle'),
        modal: false,
        width: '40vw',
        height: 'auto',
        close: props.onDismissValidation,
        buttons: [
          {
            text: wbText('continueEditing'),
            click: closeDialog,
          },
          {
            text: wbText('saveUnfinished'),
            click: props.onSave,
          },
        ],
      }}
    >
      {wbText('validationFailedDialogHeader')}
      <p>{wbText('validationFailedDialogMessage')}</p>
      <section className="validation-results">
        {props.validationResults.map((fieldPath, index) => (
          <button
            type="button"
            className="v-center wbplanview-mapping-line-elements"
            key={index}
            onClick={props.onValidationResultClick.bind(undefined, fieldPath)}
          >
            <MappingPathComponent
              mappingLineData={getMappingLineData({
                baseTableName: props.baseTableName,
                mappingPath: fieldPath,
                iterate: true,
                generateLastRelationshipData: false,
                customSelectType: 'PREVIEW_LIST',
                getMappedFields: props.getMappedFields,
                mustMatchPreferences: props.mustMatchPreferences,
              })}
            />
          </button>
        ))}
      </section>
    </ModalDialog>
  );
}

export function MappingView(props: {
  readonly baseTableName: string;
  readonly focusedLineExists: boolean;
  readonly mappingPath: MappingPath;
  readonly mapButtonIsEnabled: boolean;
  readonly readonly: boolean;
  readonly mustMatchPreferences: IR<boolean>;
  readonly handleMapButtonClick?: () => void;
  readonly handleMappingViewChange?: (payload: {
    readonly index: number;
    readonly close: boolean;
    readonly newValue: string;
    readonly isRelationship: boolean;
    readonly currentTableName: string;
    readonly newTableName: string;
    readonly isDoubleClick: boolean;
  }) => void;
  readonly getMappedFields: GetMappedFieldsBind;
  readonly showHiddenFields?: boolean;
}): JSX.Element | null {
  const mappingLineData = getMappingLineData({
    baseTableName: props.baseTableName,
    mappingPath: props.mappingPath,
    generateLastRelationshipData: true,
    iterate: true,
    customSelectType: 'OPENED_LIST',
    handleChange({ isDoubleClick, ...rest }) {
      if (isDoubleClick) props.handleMapButtonClick?.();
      else
        props.handleMappingViewChange?.({
          ...rest,
          isDoubleClick,
        });
    },
    getMappedFields: props.getMappedFields,
    showHiddenFields: props.showHiddenFields,
    mustMatchPreferences: props.mustMatchPreferences,
  });
  const mapButtonIsEnabled =
    !props.readonly &&
    props.mapButtonIsEnabled &&
    (Object.entries(
      mappingLineData[mappingLineData.length - 1]?.fieldsData
    ).find(([, { isDefault }]) => isDefault)?.[1].isEnabled ??
      false);

  return (
    <>
      <div className="v-center mapping-view" role="list">
        <MappingPathComponent mappingLineData={mappingLineData} />
      </div>
      <button
        type="button"
        className="v-center magic-button wbplanview-mapping-view-map-button"
        disabled={!mapButtonIsEnabled || !props.focusedLineExists}
        onClick={
          mapButtonIsEnabled && props.focusedLineExists
            ? props.handleMapButtonClick
            : undefined
        }
        title={wbText('mapButtonDescription')}
      >
        {wbText('map')}
        <span
          className="wbplanview-mapping-view-map-button-arrow"
          aria-hidden="true"
        >
          &#8594;
        </span>
      </button>
    </>
  );
}

export function EmptyDataSetDialog({
  lineCount,
}: {
  readonly lineCount: number;
}): JSX.Element | null {
  const [showDialog, setShowDialog] = React.useState<boolean>(lineCount === 0);

  return showDialog ? (
    <ModalDialog
      properties={{
        title: wbText('emptyDataSetDialogTitle'),
        close: (): void => setShowDialog(false),
      }}
    >
      {wbText('emptyDataSetDialogHeader')}
      <p>{wbText('emptyDataSetDialogMessage')}</p>
    </ModalDialog>
  ) : null;
}

export const defaultMappingViewHeight = 300;
export const minMappingViewHeight = 250;
