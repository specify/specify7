import React from 'react';

import type { Tables } from '../datamodel';
import { commonText } from '../localization/common';
import { wbText } from '../localization/workbench';
import { getModel } from '../schema';
import type { IR, RA, RR } from '../types';
import { defined } from '../types';
import type { ColumnOptions, MatchBehaviors } from '../uploadplanparser';
import { getMappingLineData } from '../wbplanviewnavigator';
import { Button, Input, Label, Textarea, Ul } from './basic';
import { TableIcon } from './common';
import { useBooleanState, useId } from './hooks';
import { Dialog, dialogClassNames } from './modaldialog';
import { usePref } from './preferenceshooks';
import { useCachedState } from './statecache';
import type {
  HtmlGeneratorFieldData,
  MappingElementProps,
} from './wbplanviewcomponents';
import {
  ButtonWithConfirmation,
  MappingPathComponent,
} from './wbplanviewcomponents';
import type { MappingPath } from './wbplanviewmapper';

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
    <div role="toolbar" className="gap-x-2 print:hidden flex items-center">
      {typeof handleAddNewHeader === 'function' && (
        <Button.Simple
          onClick={(): void => {
            handleAddNewHeader(wbText('newHeaderName')(newHeaderIdRef.current));
            newHeaderIdRef.current += 1;
          }}
        >
          {wbText('addNewColumn')}
        </Button.Simple>
      )}
      <Label.ForCheckbox>
        <Input.Checkbox
          checked={showHiddenFields}
          onChange={handleToggleHiddenFields}
        />
        {wbText('revealHiddenFormFields')}
      </Label.ForCheckbox>
    </div>
  );
}

export function ValidationResults(props: {
  readonly baseTableName: keyof Tables;
  readonly validationResults: RA<MappingPath>;
  readonly onSave: () => void;
  readonly onDismissValidation: () => void;
  readonly getMappedFields: (mappingPath: MappingPath) => RA<string>;
  readonly onValidationResultClick: (mappingPath: MappingPath) => void;
  readonly mustMatchPreferences: IR<boolean>;
}): JSX.Element | null {
  if (props.validationResults.length === 0) return null;

  return (
    <Dialog
      title={wbText('validationFailedDialogTitle')}
      header={wbText('validationFailedDialogHeader')}
      modal={false}
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      onClose={props.onDismissValidation}
      buttons={
        <>
          <Button.Blue onClick={props.onDismissValidation}>
            {wbText('continueEditing')}
          </Button.Blue>
          <Button.Orange onClick={props.onSave}>
            {wbText('saveUnfinished')}
          </Button.Orange>
        </>
      }
    >
      <p>{wbText('validationFailedDialogMessage')}</p>
      <section className="gap-x-2 flex flex-col">
        {props.validationResults.map((fieldPath, index) => (
          <Button.Simple
            className={`hover:bg-gray-300 hover:dark:bg-neutral-700 border-x-0
              bg-transparent border-b-0 rounded-none flex-wrap`}
            key={index}
            onClick={props.onValidationResultClick.bind(undefined, fieldPath)}
          >
            <MappingPathComponent
              mappingLineData={getMappingLineData({
                baseTableName: props.baseTableName,
                mappingPath: fieldPath,
                getMappedFields: props.getMappedFields,
                mustMatchPreferences: props.mustMatchPreferences,
                generateFieldData: 'selectedOnly',
              }).map((data) => ({
                ...data,
                isOpen: true,
                customSelectType: 'PREVIEW_LIST',
              }))}
            />
          </Button.Simple>
        ))}
      </section>
    </Dialog>
  );
}

const defaultValue = 300;

export function MappingView(props: {
  readonly mappingElementProps: RA<MappingElementProps>;
  readonly mapButton: JSX.Element;
}): JSX.Element | null {
  // `resize` event listener for the mapping view
  const [mappingViewHeight = defaultValue, setMappingViewHeight] =
    useCachedState({
      bucketName: 'wbPlanViewUi',
      cacheName: 'mappingViewHeight',
      defaultValue,
      bucketType: 'localStorage',
      staleWhileRefresh: false,
    });
  const mappingViewParentRef = React.useCallback<
    (mappingViewParent: HTMLElement | null) => void
  >(
    (mappingViewParent) => {
      if (typeof ResizeObserver === 'undefined' || mappingViewParent === null)
        return undefined;

      const resizeObserver = new ResizeObserver(() =>
        mappingViewParent.offsetHeight > 0
          ? setMappingViewHeight(mappingViewParent.offsetHeight)
          : undefined
      );

      resizeObserver.observe(mappingViewParent);

      return (): void => resizeObserver.disconnect();
    },
    [setMappingViewHeight]
  );

  return (
    <section
      className={`overflow-x-auto resize-y
        max-h-[50vh] min-h-[theme(spacing.40)] h-[var(--mapping-view-height)]`}
      style={
        {
          '--mapping-view-height': `${mappingViewHeight ?? ''}px`,
        } as React.CSSProperties
      }
      aria-label={wbText('mappingEditor')}
      ref={mappingViewParentRef}
    >
      <div className="gap-x-8 w-max flex h-full">
        <div className="gap-x-1 flex" role="list">
          <MappingPathComponent mappingLineData={props.mappingElementProps} />
        </div>
        {props.mapButton}
      </div>
    </section>
  );
}

export function EmptyDataSetDialog({
  lineCount,
}: {
  readonly lineCount: number;
}): JSX.Element | null {
  const [dialogEnabled] = usePref(
    'workBench',
    'wbPlanView',
    'showNewDataSetWarning'
  );
  const [showDialog, _, handleClose] = useBooleanState(
    dialogEnabled && lineCount === 0
  );

  return (
    <Dialog
      isOpen={showDialog}
      title={wbText('emptyDataSetDialogTitle')}
      header={wbText('emptyDataSetDialogHeader')}
      onClose={handleClose}
      buttons={commonText('close')}
    >
      {wbText('emptyDataSetDialogMessage')}
    </Dialog>
  );
}

export function mappingOptionsMenu({
  id,
  columnOptions,
  isReadOnly,
  onChangeMatchBehaviour: handleChangeMatchBehaviour,
  onToggleAllowNulls: handleToggleAllowNulls,
  onChangeDefaultValue: handleChangeDefaultValue,
}: {
  readonly id: (suffix: string) => string;
  readonly isReadOnly: boolean;
  readonly columnOptions: ColumnOptions;
  readonly onChangeMatchBehaviour: (matchBehavior: MatchBehaviors) => void;
  readonly onToggleAllowNulls: (allowNull: boolean) => void;
  readonly onChangeDefaultValue: (defaultValue: string | null) => void;
}): IR<HtmlGeneratorFieldData> {
  return {
    matchBehavior: {
      optionLabel: (
        <>
          {wbText('matchBehavior')}
          <Ul>
            {Object.entries({
              ignoreWhenBlank: {
                title: wbText('ignoreWhenBlank'),
                description: wbText('ignoreWhenBlankDescription'),
              },
              ignoreAlways: {
                title: wbText('ignoreAlways'),
                description: wbText('ignoreAlwaysDescription'),
              },
              ignoreNever: {
                title: wbText('ignoreNever'),
                description: wbText('ignoreNeverDescription'),
              },
            }).map(([id, { title, description }]) => (
              <li key={id}>
                <Label.ForCheckbox title={description}>
                  <Input.Radio
                    name="match-behavior"
                    value={id}
                    checked={columnOptions.matchBehavior === id}
                    isReadOnly={isReadOnly}
                    onChange={({ target }): void =>
                      handleChangeMatchBehaviour(target.value as MatchBehaviors)
                    }
                  />
                  {` ${title}`}
                </Label.ForCheckbox>
              </li>
            ))}
          </Ul>
        </>
      ),
    },
    nullAllowed: {
      optionLabel: (
        <Label.ForCheckbox>
          <Input.Checkbox
            checked={columnOptions.nullAllowed}
            disabled={isReadOnly}
            onValueChange={isReadOnly ? undefined : handleToggleAllowNulls}
          />{' '}
          {wbText('allowNullValues')}
        </Label.ForCheckbox>
      ),
    },
    default: {
      optionLabel: (
        <>
          <Label.ForCheckbox>
            <Input.Checkbox
              checked={columnOptions.default !== null}
              disabled={isReadOnly}
              onChange={
                isReadOnly
                  ? undefined
                  : (): void =>
                      handleChangeDefaultValue(
                        columnOptions.default === null ? '' : null
                      )
              }
            />{' '}
            <span id={id('default-value')}>{wbText('useDefaultValue')}</span>
            {columnOptions.default !== null && ':'}
          </Label.ForCheckbox>
          {typeof columnOptions.default === 'string' && (
            <>
              <br />
              <Textarea
                value={columnOptions.default || ''}
                title={wbText('defaultValue')}
                aria-labelledby={id('default-value')}
                onValueChange={
                  isReadOnly ? undefined : handleChangeDefaultValue
                }
                disabled={isReadOnly}
              />
            </>
          )}
        </>
      ),
      title: wbText('useDefaultValueDescription'),
    },
  };
}

export function ChangeBaseTable({
  onClick: handleClick,
}: {
  readonly onClick: () => void;
}): JSX.Element {
  return (
    <ButtonWithConfirmation
      dialogTitle={wbText('goToBaseTableDialogTitle')}
      dialogHeader={wbText('goToBaseTableDialogHeader')}
      dialogMessage={wbText('goToBaseTableDialogMessage')}
      dialogButtons={(confirm) => (
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Button.Orange onClick={confirm}>
            {commonText('changeBaseTable')}
          </Button.Orange>
        </>
      )}
      onConfirm={handleClick}
    >
      {wbText('baseTable')}
    </ButtonWithConfirmation>
  );
}

export function ReRunAutoMapper({
  onClick: handleClick,
  showConfirmation,
}: {
  readonly onClick: () => void;
  readonly showConfirmation: () => boolean;
}): JSX.Element {
  return (
    <ButtonWithConfirmation
      dialogTitle={wbText('reRunAutoMapperDialogTitle')}
      dialogHeader={wbText('reRunAutoMapperDialogHeader')}
      dialogMessage={wbText('reRunAutoMapperDialogMessage')}
      dialogButtons={(confirm) => (
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Button.Orange onClick={confirm}>
            {wbText('reRunAutoMapper')}
          </Button.Orange>
        </>
      )}
      showConfirmation={showConfirmation}
      onConfirm={handleClick}
    >
      {wbText('autoMapper')}
    </ButtonWithConfirmation>
  );
}

export function ToggleMappingPath({
  showMappingView,
  onClick: handleClick,
}: {
  readonly showMappingView: boolean;
  readonly onClick: () => void;
}): JSX.Element {
  return (
    <Button.Simple
      className={showMappingView ? '' : 'active'}
      onClick={handleClick}
      aria-pressed={!showMappingView}
    >
      {showMappingView
        ? wbText('hideMappingEditor')
        : wbText('showMappingEditor')}
    </Button.Simple>
  );
}

export function MustMatch({
  isReadOnly,
  /**
   * Recalculating tables available for MustMatch is expensive, so we only
   * do it when opening the dialog
   */
  getMustMatchPreferences,
  onChange: handleChange,
  onClose: handleClose,
}: {
  readonly isReadOnly: boolean;
  readonly getMustMatchPreferences: () => IR<boolean>;
  readonly onChange: (mustMatchPreferences: IR<boolean>) => void;
  readonly onClose: () => void;
}): JSX.Element {
  const id = useId('wbplanview-must-match');
  const [localPreferences, setLocalPreferences] = React.useState<
    RR<keyof Tables, boolean> | undefined
  >(undefined);

  const handleDialogClose = (): void => {
    setLocalPreferences(undefined);
    handleClose();
  };

  return (
    <>
      <Button.Simple
        aria-haspopup="dialog"
        onClick={(): void => setLocalPreferences(getMustMatchPreferences())}
      >
        {wbText('mustMatch')}
      </Button.Simple>
      {typeof localPreferences === 'object' && (
        <Dialog
          header={wbText('matchingLogicDialogTitle')}
          onClose={handleDialogClose}
          className={{
            container: dialogClassNames.narrowContainer,
          }}
          buttons={
            <Button.Blue onClick={handleDialogClose}>
              {Object.keys(localPreferences).length === 0
                ? commonText('close')
                : commonText('apply')}
            </Button.Blue>
          }
        >
          {Object.keys(localPreferences).length === 0 ? (
            wbText('matchingLogicUnavailableDialogMessage')
          ) : (
            <>
              <p id={id('description')}>
                {wbText('matchingLogicDialogMessage')}
              </p>
              <table
                className="grid-table grid-cols-[auto_auto] gap-2"
                aria-describedby={id('description')}
              >
                <thead>
                  <tr>
                    <th scope="col" className="justify-center">
                      {commonText('tableName')}
                    </th>
                    <th scope="col" className="justify-center">
                      {wbText('mustMatch')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(localPreferences).map(
                    ([tableName, mustMatch]) => (
                      <tr key={tableName}>
                        <td>
                          <label
                            htmlFor={id(`table-${tableName}`)}
                            className="contents"
                          >
                            <TableIcon name={tableName} tableLabel={false} />
                            {defined(getModel(tableName)).label}
                          </label>
                        </td>
                        <td className="justify-center">
                          <Input.Checkbox
                            checked={mustMatch}
                            id={id(`table-${tableName}`)}
                            {...(isReadOnly
                              ? {
                                  disabled: true,
                                }
                              : {
                                  onChange: (): void => {
                                    const newPreferences = {
                                      ...localPreferences,
                                      [tableName]: !mustMatch,
                                    };
                                    handleChange(newPreferences);
                                    setLocalPreferences(newPreferences);
                                  },
                                })}
                          />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </>
          )}
        </Dialog>
      )}
    </>
  );
}
