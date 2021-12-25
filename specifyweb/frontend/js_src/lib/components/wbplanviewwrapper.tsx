import React from 'react';

import wbText from '../localization/workbench';
import navigation from '../navigation';
import dataModelStorage from '../wbplanviewmodel';
import { dataModelPromise } from '../wbplanviewmodelfetcher';
import { LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type {
  PublicWbPlanViewProps,
  WbPlanViewWrapperProps,
} from './wbplanview';
import { WbPlanView } from './wbplanview';

function WbPlanViewWrapper(props: WbPlanViewWrapperProps): JSX.Element {
  const [schemaLoaded, setSchemaLoaded] = React.useState<boolean>(
    typeof dataModelStorage.tables !== 'undefined'
  );

  React.useEffect(() => {
    if (schemaLoaded) return;

    dataModelPromise
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
    <WbPlanView
      {...props}
      uploadPlan={uploadPlan}
      headers={headers}
      readonly={props.dataset.uploadresult?.success ?? false}
    />
  ) : (
    <LoadingScreen />
  );
}

interface WbPlanViewBackboneProps
  extends WbPlanViewWrapperProps,
    PublicWbPlanViewProps {
  header: HTMLElement;
}

const setUnloadProtect = (self: WbPlanViewBackboneProps): void =>
  navigation.addUnloadProtect(self, wbText('unloadProtectMessage'));

const removeUnloadProtect = (self: WbPlanViewBackboneProps): void =>
  navigation.removeUnloadProtect(self);

export default createBackboneView<
  PublicWbPlanViewProps,
  WbPlanViewBackboneProps,
  WbPlanViewWrapperProps
>({
  moduleName: 'WbPlanView',
  title: (self) => self.dataset.name,
  className: 'wbplanview content-no-shadow',
  initialize(self, { dataset }) {
    self.dataset = dataset;
  },
  remove(self) {
    removeUnloadProtect(self);
  },
  component: WbPlanViewWrapper,
  getComponentProps: (self) => ({
    dataset: self.dataset,
    removeUnloadProtect: (): void => removeUnloadProtect(self),
    setUnloadProtect: (): void => setUnloadProtect(self),
  }),
});
