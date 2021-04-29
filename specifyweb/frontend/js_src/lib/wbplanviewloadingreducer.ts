import type { DatasetBrief } from './components/wbplanview';
import type { SpecifyResource } from './components/wbplanview';
import navigation from './navigation';
import type { State } from './statemanagement';
import { generateDispatch } from './statemanagement';
import type { WBPlanViewActions } from './wbplanviewreducer';

interface LoadingStateBase<T extends string> extends State<T> {
  dispatchAction?: (action: WBPlanViewActions) => void;
}

type LoadTemplateSelectionState = LoadingStateBase<'LoadTemplateSelectionState'>;

interface NavigateBackState extends State<'NavigateBackState'> {
  readonly wb: SpecifyResource;
}

export type LoadingStates = LoadTemplateSelectionState | NavigateBackState;

export const loadingStateDispatch = generateDispatch<LoadingStates>({
  LoadTemplateSelectionState: (state) => {
    if (typeof state.dispatchAction !== 'function')
      throw new Error('Dispatch function was not provided');

    fetch('/api/workbench/dataset/')
      .then(async (response) => response.json())
      .then((datasets) =>
        state.dispatchAction!({
          type: 'TemplatesLoadedAction',
          templates: datasets as DatasetBrief[],
        })
      )
      .catch((error) => {
        throw error;
      });
  },
  NavigateBackState: (state): void =>
    /*
     * Need to make the `Loading` dialog
     * appear before the `Leave Page?` dialog
     */
    void setTimeout(() => navigation.go(`/workbench/${state.wb.id}/`), 10),
});
