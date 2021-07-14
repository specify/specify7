import $ from 'jquery';

import remotePrefs from '../remoteprefs';
import ResourceView from '../resourceview';
import { Lifemapper } from './lifemapper';
import createBackboneView from './reactbackboneextend';

interface Props {
  model: any;
}

export interface ComponentProps extends Props {
  readonly guid: string;
}

const View = createBackboneView<Props, Props, ComponentProps>({
  moduleName: 'Lifemapper',
  className: 'lifemapper-info',
  initialize(self, { model }) {
    self.model = model;
  },
  renderPre(self) {
    self.el.style.display = '';
  },
  remove(self) {
    self.el.style.display = 'none';
  },
  silentErrors: true,
  Component: Lifemapper,
  getComponentProps: (self) => ({
    model: self.model,
    guid: self.model.get('guid'),
  }),
});

export default function register(): void {
  ResourceView.on('rendered', (resourceView: any) => {
    if (
      resourceView.model.specifyModel.name === 'CollectionObject' &&
      // @ts-expect-error
      remotePrefs['s2n.badges.disable'] !== 'true'
    )
      // @ts-expect-error
      new View({
        model: resourceView.model,
        el: $(
          '<span class="lifemapper-info" style="display:none;"></span>'
        ).appendTo(resourceView.header),
      }).render();
  });
}
