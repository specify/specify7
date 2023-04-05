import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { wbPlanText } from '../../localization/wbPlan';
import type { IR, RA, RR } from '../../utils/types';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { strictGetModel } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { userPreferences } from '../Preferences/userPreferences';
import { ButtonWithConfirmation } from './Components';
import type {
  HtmlGeneratorFieldData,
  MappingElementProps,
} from './LineComponents';
import { MappingPathComponent } from './LineComponents';
import type { MappingPath } from './Mapper';
import { getMappingLineData } from './navigator';
import type { ColumnOptions, MatchBehaviors } from './uploadPlanParser';

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
    <div className="flex items-center gap-2 print:hidden" role="toolbar">
      {typeof handleAddNewHeader === 'function' && (
        <Button.Small
          onClick={(): void => {
            handleAddNewHeader(
              wbPlanText.newHeaderName({ index: newHeaderIdRef.current })
            );
            newHeaderIdRef.current += 1;
          }}
        >
          {wbPlanText.addNewColumn()}
        </Button.Small>
      )}
      <Label.Inline>
        <Input.Checkbox
          checked={showHiddenFields}
          onChange={handleToggleHiddenFields}
        />
        {wbPlanText.revealHiddenFormFields()}
      </Label.Inline>
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
      buttons={
        <>
          <Button.Blue onClick={props.onDismissValidation}>
            {wbPlanText.continueEditing()}
          </Button.Blue>
          <Button.Orange onClick={props.onSave}>
            {wbPlanText.saveUnfinished()}
          </Button.Orange>
        </>
      }
      header={wbPlanText.validationFailed()}
      modal={false}
      onClose={props.onDismissValidation}
    >
      <p>{wbPlanText.validationFailedDescription()}</p>
      <section className="flex flex-col gap-2">
        {props.validationResults.map((fieldPath, index) => (
          <Button.Small
            className={`
              flex-wrap !justify-start border-x-0
              border-b-0 bg-transparent hover:bg-gray-300 hover:dark:bg-neutral-700
            `}
            key={index}
            onClick={(): void => props.onValidationResultClick(fieldPath)}
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
          </Button.Small>
        ))}
      </section>
    </Dialog>
  );
}

const defaultValue = 300;

export function MappingView({
  mappingElementProps,
  children,
}: {
  readonly mappingElementProps: RA<MappingElementProps>;
  readonly children: JSX.Element | undefined;
}): JSX.Element | null {
  // `resize` event listener for the mapping view
  const [mappingViewHeight = defaultValue, setMappingViewHeight] =
    useCachedState('wbPlanViewUi', 'mappingViewHeight');
  const initialHeight = React.useRef(mappingViewHeight);
  const [mappingView, setMappingView] = React.useState<HTMLElement | null>(
    null
  );
  React.useEffect(() => {
    if (globalThis.ResizeObserver === undefined || mappingView === null)
      return undefined;

    const resizeObserver = new globalThis.ResizeObserver(() =>
      mappingView.offsetHeight > 0
        ? setMappingViewHeight(mappingView.offsetHeight)
        : undefined
    );

    resizeObserver.observe(mappingView);

    return (): void => resizeObserver.disconnect();
  }, [mappingView, setMappingViewHeight]);

  return (
    <section
      aria-label={wbPlanText.mappingEditor()}
      className={`
        h-[var(--mapping-view-height)] max-h-[50vh]
        min-h-[theme(spacing.40)] resize-y overflow-x-auto
      `}
      ref={setMappingView}
      style={
        {
          '--mapping-view-height': `${initialHeight.current}px`,
        } as React.CSSProperties
      }
    >
      <div className="flex h-full w-max gap-8">
        <div className="flex gap-1" role="list">
          <MappingPathComponent mappingLineData={mappingElementProps} />
        </div>
        {children}
      </div>
    </section>
  );
}

export function EmptyDataSetDialog({
  lineCount,
}: {
  readonly lineCount: number;
}): JSX.Element | null {
  const [dialogEnabled] = userPreferences.use(
    'workBench',
    'wbPlanView',
    'showNewDataSetWarning'
  );
  const [showDialog, _, handleClose] = useBooleanState(
    dialogEnabled && lineCount === 0
  );

  return (
    <Dialog
      buttons={commonText.close()}
      header={wbPlanText.emptyDataSet()}
      isOpen={showDialog}
      onClose={handleClose}
    >
      {wbPlanText.emptyDataSetDescription()}
      <br />
      <br />
      {wbPlanText.emptyDataSetSecondDescription()}
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
          {wbPlanText.matchBehavior()}
          <Ul>
            {Object.entries({
              ignoreWhenBlank: {
                title: wbPlanText.ignoreWhenBlank(),
                description: wbPlanText.ignoreWhenBlankDescription(),
              },
              ignoreAlways: {
                title: wbPlanText.ignoreAlways(),
                description: wbPlanText.ignoreAlwaysDescription(),
              },
              ignoreNever: {
                title: wbPlanText.ignoreNever(),
                description: wbPlanText.ignoreNeverDescription(),
              },
            }).map(([id, { title, description }]) => (
              <li key={id}>
                <Label.Inline title={description}>
                  <Input.Radio
                    checked={columnOptions.matchBehavior === id}
                    isReadOnly={isReadOnly}
                    name="match-behavior"
                    value={id}
                    onChange={(): void => handleChangeMatchBehaviour(id)}
                  />
                  {` ${title}`}
                </Label.Inline>
              </li>
            ))}
          </Ul>
        </>
      ),
    },
    nullAllowed: {
      optionLabel: (
        <Label.Inline>
          <Input.Checkbox
            checked={columnOptions.nullAllowed}
            disabled={isReadOnly}
            onValueChange={handleToggleAllowNulls}
          />{' '}
          {wbPlanText.allowNullValues()}
        </Label.Inline>
      ),
    },
    default: {
      optionLabel: (
        <>
          <Label.Inline>
            <Input.Checkbox
              checked={columnOptions.default !== null}
              disabled={isReadOnly}
              onChange={(): void =>
                handleChangeDefaultValue(
                  columnOptions.default === null ? '' : null
                )
              }
            />{' '}
            <span id={id('default-value')}>{wbPlanText.useDefaultValue()}</span>
            {columnOptions.default !== null && ':'}
          </Label.Inline>
          {typeof columnOptions.default === 'string' && (
            <>
              <br />
              <AutoGrowTextArea
                aria-labelledby={id('default-value')}
                disabled={isReadOnly}
                title={wbPlanText.defaultValue()}
                value={columnOptions.default || ''}
                onValueChange={handleChangeDefaultValue}
              />
            </>
          )}
        </>
      ),
      title: wbPlanText.defaultValueDescription(),
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
      dialogButtons={(confirm) => (
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Button.Orange onClick={confirm}>
            {schemaText.changeBaseTable()}
          </Button.Orange>
        </>
      )}
      dialogHeader={wbPlanText.goToBaseTable()}
      dialogMessage={wbPlanText.goToBaseTableDescription()}
      onConfirm={handleClick}
    >
      {wbPlanText.baseTable()}
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
      dialogButtons={(confirm) => (
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Button.Orange onClick={confirm}>
            {wbPlanText.reRunAutoMapper()}
          </Button.Orange>
        </>
      )}
      dialogHeader={wbPlanText.reRunAutoMapperConfirmation()}
      dialogMessage={wbPlanText.reRunAutoMapperConfirmationDescription()}
      showConfirmation={showConfirmation}
      onConfirm={handleClick}
    >
      {wbPlanText.autoMapper()}
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
    <Button.Small aria-pressed={!showMappingView} onClick={handleClick}>
      {showMappingView
        ? wbPlanText.hideFieldMapper()
        : wbPlanText.showFieldMapper()}
    </Button.Small>
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
      <Button.Small
        aria-haspopup="dialog"
        onClick={(): void => setLocalPreferences(getMustMatchPreferences())}
      >
        {wbPlanText.mustMatch()}
      </Button.Small>
      {typeof localPreferences === 'object' && (
        <Dialog
          buttons={
            <Button.Blue onClick={handleDialogClose}>
              {Object.keys(localPreferences).length === 0
                ? commonText.close()
                : commonText.apply()}
            </Button.Blue>
          }
          className={{
            container: dialogClassNames.narrowContainer,
          }}
          header={wbPlanText.changeMatchingLogic()}
          onClose={handleDialogClose}
        >
          {Object.keys(localPreferences).length === 0 ? (
            wbPlanText.matchingLogicUnavailable()
          ) : (
            <>
              <p id={id('description')}>
                {wbPlanText.matchingLogicDescription()}
              </p>
              <table
                aria-describedby={id('description')}
                className="grid-table grid-cols-[auto_auto] gap-2"
              >
                <thead>
                  <tr>
                    <th className="justify-center" scope="col">
                      {schemaText.tableName()}
                    </th>
                    <th className="justify-center" scope="col">
                      {wbPlanText.mustMatch()}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(localPreferences).map(
                    ([tableName, mustMatch]) => (
                      <tr key={tableName}>
                        <td>
                          <label
                            className="contents"
                            htmlFor={id(`table-${tableName}`)}
                          >
                            <TableIcon label={false} name={tableName} />
                            {strictGetModel(tableName).label}
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
