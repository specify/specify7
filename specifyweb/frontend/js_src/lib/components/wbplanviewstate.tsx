import React from 'react';
import type { State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import { ajax } from '../ajax';
import type { Tables } from '../datamodel';
import commonText from '../localization/common';
import wbText from '../localization/workbench';
import type { IR, RA } from '../types';
import type { UploadPlan } from '../uploadplanparser';
import type { WbPlanViewActions } from '../wbplanviewreducer';
import { goBack, savePlan } from '../wbplanviewutils';
import { Button, Input, Label } from './basic';
import { LoadingContext } from './contexts';
import { Dialog, dialogClassNames, LoadingScreen } from './modaldialog';
import { WbsDialog } from './toolbar/wbsdialog';
import type { Dataset, WbPlanViewProps } from './wbplanview';
import { ListOfBaseTables } from './wbplanviewcomponents';
import type { MappingLine } from './wbplanviewmapper';
import { WbPlanViewMapper } from './wbplanviewmapper';

// States

type LoadingState = State<'LoadingState'>;

type BaseTableSelectionState = State<
  'BaseTableSelectionState',
  {
    showHiddenTables: boolean;
  }
>;

export type MappingState = State<
  'MappingState',
  {
    changesMade: boolean;
    baseTableName: keyof Tables;
    lines: RA<MappingLine>;
    mustMatchPreferences: IR<boolean>;
  }
>;

type TemplateSelectionState = State<'TemplateSelectionState'>;

export type WbPlanViewStates =
  | LoadingState
  | BaseTableSelectionState
  | TemplateSelectionState
  | MappingState;

type WbPlanViewStatesWithParameters = WbPlanViewStates & {
  readonly dispatch: (action: WbPlanViewActions) => void;
  readonly props: WbPlanViewProps;
};

function TemplateSelection({
  headers,
  onClose: handleClose,
  onSelect: handleSelect,
}: {
  readonly headers: RA<string>;
  readonly onClose: () => void;
  readonly onSelect: (
    uploadPlan: UploadPlan | null,
    headers: RA<string>
  ) => void;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);

  return (
    <WbsDialog
      showTemplates={true}
      onClose={handleClose}
      onDataSetSelect={(id: number): void =>
        loading(
          ajax<Dataset>(`/api/workbench/dataset/${id}`, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { Accept: 'application/json' },
          }).then(({ data: { uploadplan, columns, visualorder } }) =>
            handleSelect(
              uploadplan,
              headers.length === 0 && Array.isArray(visualorder)
                ? visualorder.map((visualCol) => columns[visualCol])
                : headers
            )
          )
        )
      }
    />
  );
}

export const stateReducer = generateReducer<
  JSX.Element,
  WbPlanViewStatesWithParameters
>({
  LoadingState: () => <LoadingScreen />,
  BaseTableSelectionState: ({ action: state }) => (
    <Dialog
      header={wbText('selectBaseTableDialogTitle')}
      onClose={(): void => goBack(state.props.dataset.id)}
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Button.Blue
            onClick={(): void =>
              state.dispatch({
                type: 'UseTemplateAction',
                dispatch: state.dispatch,
              })
            }
          >
            {wbText('chooseExistingPlan')}
          </Button.Blue>
        </>
      }
    >
      <ListOfBaseTables
        showHiddenTables={state.showHiddenTables}
        onChange={(baseTableName: keyof Tables): void =>
          state.dispatch({
            type: 'SelectTableAction',
            baseTableName,
            headers: state.props.headers,
          })
        }
      />
      <Label.ForCheckbox>
        <Input.Checkbox
          checked={state.showHiddenTables}
          onChange={(): void =>
            state.dispatch({
              type: 'ToggleHiddenTablesAction',
            })
          }
        />
        {wbText('showAdvancedTables')}
      </Label.ForCheckbox>
    </Dialog>
  ),
  TemplateSelectionState: ({ action: state }) => (
    <TemplateSelection
      headers={state.props.headers}
      onClose={(): void =>
        state.dispatch({
          type: 'OpenBaseTableSelectionAction',
          referrer: state.type,
        })
      }
      onSelect={(uploadPlan, headers): void =>
        state.dispatch({
          type: 'OpenMappingScreenAction',
          uploadPlan,
          headers,
          changesMade: true,
        })
      }
    />
  ),
  MappingState: ({ action: state }) => {
    return (
      <WbPlanViewMapper
        readonly={state.props.readonly}
        setUnloadProtect={state.props.setUnloadProtect}
        removeUnloadProtect={state.props.removeUnloadProtect}
        changesMade={state.changesMade}
        baseTableName={state.baseTableName}
        lines={state.lines}
        mustMatchPreferences={state.mustMatchPreferences}
        dataset={state.props.dataset}
        onChangeBaseTable={(): void =>
          state.dispatch({
            type: 'OpenBaseTableSelectionAction',
          })
        }
        onReRunAutoMapper={(): void =>
          state.dispatch({
            type: 'SelectTableAction',
            headers: state.lines.map(({ headerName }) => headerName),
            baseTableName: state.baseTableName,
          })
        }
        onSave={async (lines, mustMatchPreferences): Promise<void> => {
          state.props.removeUnloadProtect();
          return savePlan({
            dataset: state.props.dataset,
            baseTableName: state.baseTableName,
            lines,
            mustMatchPreferences,
          });
        }}
      />
    );
  },
});

/** Create a new array with a new item at a given position */
export const insertItem = <T,>(array: RA<T>, index: number, item: T): RA<T> => [
  ...array.slice(0, index),
  item,
  ...array.slice(index),
];

/** Create a new array with a given item replaced */
export const replaceItem = <T,>(
  array: RA<T>,
  index: number,
  item: T
): RA<T> => [...array.slice(0, index), item, ...array.slice(index + 1)];

/** Create a new array without a given item */
export const removeItem = <T,>(array: RA<T>, index: number): RA<T> => [
  ...array.slice(0, index),
  ...array.slice(index + 1),
];

/**
 * Creates a new object with a given key replaced.
 * Unlike object decomposition, this would preserve the order of keys
 */
export const replaceKey = <T extends IR<unknown>>(
  object: T,
  targetKey: keyof T,
  newValue: T[keyof T]
): T =>
  Object.fromEntries(
    Object.entries(object).map(([key, value]) => [
      key,
      /*
       * Convert targetKey to string because Object.entries convers all keys
       * to a string
       */
      key === targetKey.toString() ? newValue : value,
    ])
  ) as T;
