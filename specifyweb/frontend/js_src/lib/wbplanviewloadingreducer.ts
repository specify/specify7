import type { SpecifyResource } from './components/wbplanview';
import navigation from './navigation';
import type { State } from 'typesafe-reducer';
import { generateDispatch } from 'typesafe-reducer';

/*
 *Import type { WBPlanViewActions } from './wbplanviewreducer';
 *
 *interface LoadingStateBase<T extends string> extends State<T> {
 *dispatchAction?: (action: WBPlanViewActions) => void;
 *}
 */

interface NavigateBackState extends State<'NavigateBackState'> {
  readonly wb: SpecifyResource;
}

export type LoadingStates = NavigateBackState;

export const loadingStateDispatch = generateDispatch<LoadingStates>({
  NavigateBackState: (state): void =>
    /*
     * Need to make the `Loading` dialog
     * appear before the `Leave Page?` dialog
     */
    void setTimeout(() => navigation.go(`/workbench/${state.wb.id}/`), 10),
});
