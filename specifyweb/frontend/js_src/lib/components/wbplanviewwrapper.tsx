import React from 'react';

import navigation from '../navigation';
import dataModelStorage from '../wbplanviewmodel';
import fetchDataModel from '../wbplanviewmodelfetcher';
import { LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type {
  PublicWBPlanViewProps,
  WBPlanViewWrapperProps,
} from './wbplanview';
import { WBPlanView } from './wbplanview';

const schemaFetchedPromise = fetchDataModel();

function WBPlanViewWrapper(props: WBPlanViewWrapperProps): JSX.Element {
  const [schemaLoaded, setSchemaLoaded] = React.useState<boolean>(
    typeof dataModelStorage.tables !== 'undefined'
  );

  React.useEffect(() => {
    if (schemaLoaded) return;

    schemaFetchedPromise
      .then(() => setSchemaLoaded(true))
      .catch((error) => {
        throw error;
      });
  }, [schemaLoaded]);

  const headers =
    props.dataset.visualorder === null
      ? props.dataset.columns
      : props.dataset.visualorder.map(
          (physicalCol) => props.dataset.columns[physicalCol]
        );
  const uploadPlan = props.dataset.uploadplan ? props.dataset.uploadplan : null;
  return schemaLoaded ? (
    <WBPlanView
      {...props}
      uploadPlan={uploadPlan}
      headers={headers}
      readonly={props.dataset.uploadresult?.success ?? false}
    />
  ) : (
    <LoadingScreen />
  );
}

interface WBPlanViewBackboneProps
  extends WBPlanViewWrapperProps,
    PublicWBPlanViewProps {
  header: HTMLElement;
}

const setUnloadProtect = (self: WBPlanViewBackboneProps): void =>
  navigation.addUnloadProtect(self, 'This mapping has not been saved.');

const removeUnloadProtect = (self: WBPlanViewBackboneProps): void =>
  navigation.removeUnloadProtect(self);

export default createBackboneView<
  PublicWBPlanViewProps,
  WBPlanViewBackboneProps,
  WBPlanViewWrapperProps
>({
  moduleName: 'WBPlanView',
  title: (self) => self.dataset.name,
  className: 'wb-plan-view content-no-shadow',
  initialize(self, { dataset }) {
    self.dataset = dataset;
    self.mappingIsTemplated = false;
  },
  renderPre(self) {
    self.el.classList.add('wbplanview');
  },
  remove(self) {
    removeUnloadProtect(self);
  },
  Component: WBPlanViewWrapper,
  getComponentProps: (self) => ({
    dataset: self.dataset,
    removeUnloadProtect: removeUnloadProtect.bind(null, self),
    setUnloadProtect: setUnloadProtect.bind(null, self),
    mappingIsTemplated: self.mappingIsTemplated,
  }),
});
