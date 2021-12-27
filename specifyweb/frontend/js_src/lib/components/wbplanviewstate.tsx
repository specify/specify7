import React from 'react';
import type { State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';
import _ from 'underscore';

import * as cache from '../cache';
import commonText from '../localization/common';
import wbText from '../localization/workbench';
import type { RA } from '../types';
import type { MatchBehaviors } from '../uploadplantomappingstree';
import type { LoadingStates } from '../wbplanviewloadingreducer';
import { loadingStateDispatch } from '../wbplanviewloadingreducer';
import dataModelStorage from '../wbplanviewmodel';
import type {
  OpenMappingScreenAction,
  WbPlanViewActions,
} from '../wbplanviewreducer';
import type { RefActions, RefStates } from '../wbplanviewrefreducer';
import { getRefMappingState } from '../wbplanviewrefreducer';
import { goBack, mappingPathIsComplete } from '../wbplanviewutils';
import { TableIcon } from './common';
import { closeDialog, LoadingScreen, ModalDialog } from './modaldialog';
import { WbsDialog } from './toolbar/wbsdialog';
import type { WbPlanViewProps } from './wbplanview';
import {
  ButtonWithConfirmation,
  ListOfBaseTables,
  ValidationButton,
} from './wbplanviewcomponents';
import { Layout } from './wbplanviewheader';
import type {
  AutoMapperSuggestion,
  MappingPath,
  WbPlanViewMapperBaseProps,
} from './wbplanviewmapper';
import WbPlanViewMapper from './wbplanviewmapper';
import {
  defaultMappingViewHeight,
  EmptyDataSetDialog,
} from './wbplanviewmappercomponents';

// States

export type LoadingState = State<
  'LoadingState',
  {
    loadingState?: LoadingStates;
    dispatchAction?: WbPlanViewActions;
  }
>;

type BaseTableSelectionState = State<
  'BaseTableSelectionState',
  {
    showHiddenTables: boolean;
  }
>;

type TemplateSelectionState = State<'TemplateSelectionState'>;

export type MappingState = State<
  'MappingState',
  WbPlanViewMapperBaseProps & {
    autoMapperSuggestionsPromise?: Promise<RA<AutoMapperSuggestion>>;
    changesMade: boolean;
    mappingsAreValidated: boolean;
    displayMatchingOptionsDialog: boolean;
  }
>;

export type WbPlanViewStates =
  | BaseTableSelectionState
  | LoadingState
  | TemplateSelectionState
  | MappingState;

type WbPlanViewStatesWithParameters = WbPlanViewStates & {
  readonly dispatch: (action: WbPlanViewActions) => void;
  readonly props: WbPlanViewProps;
  readonly refObject: React.MutableRefObject<RefStates>;
  readonly refObjectDispatch: (action: RefActions) => void;
  readonly id: (suffix: string) => string;
};

export const getInitialWbPlanViewState = (
  props: OpenMappingScreenAction
): WbPlanViewStates => ({
  type: 'LoadingState',
  dispatchAction: props.uploadPlan
    ? {
        ...props,
        type: 'OpenMappingScreenAction',
      }
    : {
        type: 'OpenBaseTableSelectionAction',
      },
});

export const getDefaultMappingState = (): MappingState => ({
  type: 'MappingState',
  showHiddenFields: cache.get('wbPlanViewUi', 'showHiddenFields', {
    defaultValue: false,
  }),
  showMappingView: cache.get('wbPlanViewUi', 'showMappingView', {
    defaultValue: true,
  }),
  baseTableName: '',
  newHeaderId: 1,
  mappingView: ['0'],
  mappingsAreValidated: false,
  validationResults: [],
  lines: [],
  focusedLine: 0,
  changesMade: false,
  displayMatchingOptionsDialog: false,
  mustMatchPreferences: {},
});

const MAPPING_VIEW_RESIZE_THROTTLE = 150;

export const stateReducer = generateReducer<
  JSX.Element,
  WbPlanViewStatesWithParameters
>({
  LoadingState: ({ action: state }) => {
    if (typeof state.loadingState !== 'undefined')
      Promise.resolve('')
        .then(() => loadingStateDispatch(state.loadingState!))
        .catch((error) => {
          throw error;
        });
    if (typeof state.dispatchAction !== 'undefined')
      state.dispatch(state.dispatchAction);
    return <LoadingScreen />;
  },
  BaseTableSelectionState: ({ action: state }) => (
    <ModalDialog
      properties={{
        title: wbText('selectBaseTableDialogTitle'),
        height: 400,
        close: (): void => goBack(state.props.dataset.id),
        buttons: [
          {
            text: wbText('chooseExistingPlan'),
            click: (): void =>
              state.dispatch({
                type: 'UseTemplateAction',
                dispatch: state.dispatch,
              }),
          },
          {
            text: commonText('cancel'),
            click: closeDialog,
          },
        ],
      }}
    >
      <div className="wbplanview-base-table-selection">
        <ListOfBaseTables
          listOfTables={dataModelStorage.listOfBaseTables}
          showHiddenTables={state.showHiddenTables}
          handleChange={(baseTableName: string): void =>
            state.dispatch({
              type: 'SelectTableAction',
              baseTableName,
              headers: state.props.headers,
            })
          }
        />
        <label>
          <input
            type="checkbox"
            checked={state.showHiddenTables}
            onChange={(): void =>
              state.dispatch({
                type: 'ToggleHiddenTablesAction',
              })
            }
          />{' '}
          {wbText('showAdvancedTables')}
        </label>
      </div>
    </ModalDialog>
  ),
  TemplateSelectionState: ({ action: state }) => (
    <WbsDialog
      showTemplates={true}
      onClose={(): void =>
        state.dispatch({
          type: 'OpenBaseTableSelectionAction',
          referrer: state.type,
        })
      }
      onDataSetSelect={(id: number): void =>
        state.refObjectDispatch({
          type: 'RefTemplateSelectedAction',
          id,
        })
      }
    />
  ),
  MappingState: ({ action: state }) => {
    const refObject = getRefMappingState(state.refObject, state);

    if (typeof refObject.current.mappingViewHeight === 'undefined')
      refObject.current.mappingViewHeight = cache.get(
        'wbPlanViewUi',
        'mappingViewHeight',
        {
          defaultValue: defaultMappingViewHeight,
        }
      );

    const handleSave = (ignoreValidation: boolean): void => {
      state.dispatch({
        type: 'ClearValidationResultsAction',
      });
      state.dispatch({
        type: 'SavePlanAction',
        dataset: state.props.dataset,
        removeUnloadProtect: state.props.removeUnloadProtect,
        setUnloadProtect: state.props.setUnloadProtect,
        ignoreValidation,
      });
    };
    const handleClose = (): void =>
      state.dispatch({
        type: 'CloseSelectElementAction',
      });
    const handleMappingOptionsDialogClose = (): void =>
      state.dispatch({
        type: 'CloseMatchingLogicDialogAction',
      });

    return (
      <Layout
        stateName={state.type}
        readonly={state.props.readonly}
        title={
          <>
            <span title={wbText('dataSetName')}>
              {state.props.dataset.name}
            </span>
            <span title={wbText('baseTable')}>
              {` (${dataModelStorage.tables[state.baseTableName].label})`}
            </span>
          </>
        }
        stateType={state.type}
        buttonsLeft={
          state.props.readonly ? (
            <span
              className="v-center wbplanview-readonly-badge"
              title={wbText('dataSetUploadedDescription')}
            >
              {wbText('dataSetUploaded')}
            </span>
          ) : (
            <>
              <ButtonWithConfirmation
                dialogTitle={wbText('goToBaseTableDialogTitle')}
                dialogContent={
                  <>
                    {wbText('goToBaseTableDialogHeader')}
                    {wbText('goToBaseTableDialogMessage')}
                  </>
                }
                buttons={(confirm, cancel) => [
                  {
                    text: commonText('cancel'),
                    click: cancel,
                  },
                  {
                    text: wbText('changeBaseTable'),
                    click: confirm,
                  },
                ]}
                onConfirm={(): void =>
                  state.dispatch({
                    type: 'OpenBaseTableSelectionAction',
                  })
                }
              >
                {wbText('baseTable')}
              </ButtonWithConfirmation>
              <button
                aria-haspopup="dialog"
                className="magic-button"
                type="button"
                onClick={(): void =>
                  state.dispatch({
                    type: 'ResetMappingsAction',
                  })
                }
              >
                {wbText('clearMappings')}
              </button>
              <ButtonWithConfirmation
                dialogTitle={wbText('reRunAutoMapperDialogTitle')}
                dialogContent={
                  <>
                    {wbText('reRunAutoMapperDialogHeader')}
                    {wbText('reRunAutoMapperDialogMessage')}
                  </>
                }
                buttons={(confirm, cancel) => [
                  {
                    text: commonText('cancel'),
                    click: cancel,
                  },
                  {
                    text: wbText('reRunAutoMapper'),
                    click: confirm,
                  },
                ]}
                showConfirmation={(): boolean =>
                  state.lines.some(({ mappingPath }) =>
                    mappingPathIsComplete(mappingPath)
                  )
                }
                onConfirm={(): void =>
                  state.dispatch({
                    type: 'SelectTableAction',
                    headers: state.lines.map(({ headerName }) => headerName),
                    baseTableName: state.baseTableName,
                  })
                }
              >
                {wbText('autoMapper')}
              </ButtonWithConfirmation>
            </>
          )
        }
        buttonsRight={
          <>
            <button
              type="button"
              className={`magic-button ${
                state.showMappingView ? '' : 'active'
              }`}
              onClick={(): void =>
                state.dispatch({
                  type: 'ToggleMappingViewAction',
                  isVisible: !state.showMappingView,
                })
              }
              aria-pressed={!state.showMappingView}
            >
              {state.showMappingView
                ? wbText('hideMappingEditor')
                : wbText('showMappingEditor')}
            </button>
            <button
              type="button"
              className="magic-button"
              aria-haspopup="dialog"
              onClick={(): void =>
                state.dispatch({
                  type: 'OpenMatchingLogicDialogAction',
                })
              }
            >
              {wbText('mustMatch')}
            </button>
            {!state.props.readonly && (
              <ValidationButton
                canValidate={state.lines.some(({ mappingPath }) =>
                  mappingPathIsComplete(mappingPath)
                )}
                isValidated={state.mappingsAreValidated}
                onClick={(): void =>
                  state.dispatch({
                    type: 'ValidationAction',
                  })
                }
              />
            )}
            <button
              type="button"
              aria-haspopup="dialog"
              className="magic-button"
              onClick={(): void => {
                state.dispatch({
                  type: 'ClearValidationResultsAction',
                });
                goBack(state.props.dataset.id);
              }}
            >
              {state.props.readonly
                ? wbText('dataEditor')
                : commonText('cancel')}
            </button>
            {!state.props.readonly && (
              <button
                type="button"
                className="magic-button"
                disabled={!state.changesMade}
                onClick={(): void => handleSave(false)}
              >
                {commonText('save')}
              </button>
            )}
          </>
        }
        handleClick={handleClose}
      >
        <WbPlanViewMapper
          showHiddenFields={state.showHiddenFields}
          showMappingView={state.showMappingView}
          baseTableName={state.baseTableName}
          newHeaderId={state.newHeaderId}
          lines={state.lines}
          mappingView={state.mappingView}
          validationResults={state.validationResults}
          openSelectElement={state.openSelectElement}
          autoMapperSuggestions={state.autoMapperSuggestions}
          focusedLine={state.focusedLine}
          refObject={refObject}
          readonly={state.props.readonly}
          mustMatchPreferences={state.mustMatchPreferences}
          handleSave={(): void => handleSave(true)}
          handleToggleHiddenFields={(): void =>
            state.dispatch({ type: 'ToggleHiddenFieldsAction' })
          }
          handleFocus={(line: number): void =>
            state.dispatch({
              type: 'FocusLineAction',
              line,
            })
          }
          handleMappingViewMap={(): void =>
            state.dispatch({ type: 'MappingViewMapAction' })
          }
          handleAddNewHeader={(): void =>
            state.dispatch({ type: 'AddNewHeaderAction' })
          }
          handleOpen={(line: number, index: number): void =>
            state.dispatch({
              type: 'OpenSelectElementAction',
              line,
              index,
            })
          }
          handleClose={handleClose}
          handleChange={(payload: {
            readonly line: 'mappingView' | number;
            readonly index: number;
            readonly close: boolean;
            readonly newValue: string;
            readonly isRelationship: boolean;
            readonly currentTableName: string;
            readonly newTableName: string;
          }): void =>
            state.dispatch({
              type: 'ChangeSelectElementValueAction',
              ...payload,
            })
          }
          handleClearMapping={(line: number): void =>
            state.dispatch({
              type: 'ClearMappingLineAction',
              line,
            })
          }
          handleAutoMapperSuggestionSelection={(suggestion: string): void =>
            state.dispatch({
              type: 'AutoMapperSuggestionSelectedAction',
              suggestion,
            })
          }
          handleValidationResultClick={(mappingPath: MappingPath): void =>
            state.dispatch({
              type: 'ValidationResultClickAction',
              mappingPath,
            })
          }
          handleDismissValidation={(): void =>
            state.dispatch({
              type: 'ClearValidationResultsAction',
            })
          }
          handleMappingViewResize={_.throttle(
            (height): void =>
              state.refObjectDispatch({
                type: 'RefMappingViewResizeAction',
                height,
              }),
            MAPPING_VIEW_RESIZE_THROTTLE
          )}
          handleAutoScrollStatusChange={(autoScrollType, status): void =>
            state.refObjectDispatch({
              type: 'RefAutoScrollStatusChangeAction',
              autoScrollType,
              status,
            })
          }
          handleChangeMatchBehaviorAction={(
            line: number,
            matchBehavior: MatchBehaviors
          ): void =>
            state.dispatch({
              type: 'ChangeMatchBehaviorAction',
              line,
              matchBehavior,
            })
          }
          handleToggleAllowNullsAction={(
            line: number,
            allowNull: boolean
          ): void =>
            state.dispatch({
              type: 'ToggleAllowNullsAction',
              line,
              allowNull,
            })
          }
          handleChangeDefaultValue={(
            line: number,
            defaultValue: string | null
          ): void =>
            state.dispatch({
              type: 'ChangeDefaultValue',
              line,
              defaultValue,
            })
          }
        />
        <EmptyDataSetDialog lineCount={state.lines.length} />
        {state.displayMatchingOptionsDialog && (
          <ModalDialog
            properties={{
              title: wbText('matchingLogicDialogTitle'),
              close: handleMappingOptionsDialogClose,
              width: 350,
              buttons: [
                {
                  text:
                    Object.keys(state.mustMatchPreferences).length === 0
                      ? commonText('close')
                      : commonText('apply'),
                  click: closeDialog,
                },
              ],
            }}
          >
            {Object.keys(state.mustMatchPreferences).length === 0 ? (
              wbText('matchingLogicUnavailableDialogMessage')
            ) : (
              <>
                <p id={state.id('must-match-description')}>
                  {wbText('matchingLogicDialogMessage')}
                </p>
                <table
                  className="grid-table matching-logic-dialog"
                  aria-describedby={state.id('must-match-description')}
                >
                  <thead>
                    <tr>
                      <th scope="col">{commonText('tableName')}</th>
                      <th scope="col">{wbText('mustMatch')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(state.mustMatchPreferences).map(
                      ([tableName, mustMatch]) => (
                        <tr key={tableName}>
                          <td className="v-center">
                            <label
                              htmlFor={state.id(`must-match-${tableName}`)}
                              className="v-center"
                              style={{ columnGap: 'var(--quarter-size)' }}
                            >
                              <TableIcon
                                tableName={tableName}
                                tableLabel={false}
                              />
                              {dataModelStorage.tables[tableName].label}
                            </label>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={mustMatch}
                              id={state.id(`must-match-${tableName}`)}
                              {...(state.props.readonly
                                ? {
                                    disabled: true,
                                  }
                                : {
                                    onChange: (): void =>
                                      state.dispatch({
                                        type: 'MustMatchPrefChangeAction',
                                        tableName,
                                        mustMatch: !mustMatch,
                                      }),
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
          </ModalDialog>
        )}
      </Layout>
    );
  },
});
