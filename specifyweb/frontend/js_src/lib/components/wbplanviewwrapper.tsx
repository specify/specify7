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

  const uploadPlan = props.dataset.uploadplan ? props.dataset.uploadplan : null;
  return schemaLoaded ? (
    <WBPlanView
      {...props}
      uploadPlan={uploadPlan}
      headers={props.dataset.columns}
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
  handleResize: () => void;
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
  className: 'wb-plan-view',
  initialize(self, { dataset }) {
    self.dataset = dataset;
    self.mappingIsTemplated = false;
    const header = document.getElementById('site-header');
    if (header === null) throw new Error(`Can't find site's header`);
    self.header = header;
    self.handleResize = (): void =>
      self.el.style.setProperty(
        '--menu-size',
        `${Math.ceil(self.header.clientHeight)}px`
      );
  },
  renderPre(self) {
    self.el.classList.add('wbplanview');
  },
  renderPost(self) {
    self.handleResize();
    window.addEventListener('resize', self.handleResize);
  },
  remove(self) {
    window.removeEventListener('resize', self.handleResize);
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
