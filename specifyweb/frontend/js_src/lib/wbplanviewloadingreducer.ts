import navigation from './navigation';
import schema from './schema';
import { generateDispatch } from './statemanagement';
import { SpecifyResource } from './components/wbplanview';
import { State } from './statemanagement';
import {
  UploadPlan,
  uploadPlanStringToObject,
} from './uploadplantomappingstree';
import { WBPlanViewActions } from './wbplanviewreducer';

interface LoadingStateBase<T extends string> extends State<T> {
  dispatchAction?: (action: WBPlanViewActions) => void,
}

type LoadTemplateSelectionState =
  LoadingStateBase<'LoadTemplateSelectionState'>

interface NavigateBackState extends State<'NavigateBackState'> {
  readonly wb: SpecifyResource,
}

export type LoadingStates =
  LoadTemplateSelectionState
  | NavigateBackState;

export const loadingStateDispatch = generateDispatch<LoadingStates>({
  'LoadTemplateSelectionState': state => {

    if (typeof state.dispatchAction !== 'function')
      throw new Error('Dispatch function was not provided');

    const wbs = new (
      schema as any
    ).models.Workbench.LazyCollection({
      filters: {orderby: 'name', ownerpermissionlevel: 1},
    });
    wbs.fetch({limit: 5000}).done(() =>
      Promise.all(
        wbs.models.map((wb: any) =>
          wb.rget('workbenchtemplate'),
        ),
      ).then((workbenchTemplates: any) =>
        state.dispatchAction!({
          type: 'TemplatesLoadedAction',
          templates: workbenchTemplates.map((wbt: any) => [
            uploadPlanStringToObject(
              wbt.get('remarks') as string,
            ),
            wbt.get('name') as string,
          ]).filter(([uploadPlan]: [UploadPlan | null]) =>
            uploadPlan != null,
          ).map(([
            uploadPlan,
            datasetName,
          ]: [UploadPlan, string]) => (
            {
              datasetName,
              uploadPlan,
            }
          )),
        }),
      ).catch(error => {
        throw error;
      }),
    );
  },
  'NavigateBackState': state =>  // need to make the `Loading`
    // dialog
    // appear before the `Leave Page?` dialog
    setTimeout(() =>
      navigation.go(`/workbench/${state.wb.id}/`), 10,
    ),
});
