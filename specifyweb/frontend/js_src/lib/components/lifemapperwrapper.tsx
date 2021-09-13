import $ from 'jquery';

import remotePrefs from '../remoteprefs';
import ResourceView from '../resourceview';
import { Lifemapper, SpecifyNetworkBadge } from './lifemapper';
import createBackboneView from './reactbackboneextend';

interface Props {
  model: any;
}

export interface ComponentProps extends Props {
  readonly guid: string;
}

const CollectionObjectBadges = createBackboneView<Props, Props, ComponentProps>(
  {
    moduleName: 'Lifemapper',
    className: 'lifemapper-info',
    initialize(self, { model }) {
      self.model = model;
    },
    silentErrors: true,
    Component: SpecifyNetworkBadge,
    getComponentProps: (self) => ({
      model: self.model,
      guid: self.model.get('guid'),
    }),
  }
);

const TaxonBadges = createBackboneView<Props, Props, ComponentProps>({
  moduleName: 'Lifemapper',
  className: 'lifemapper-info',
  initialize(self, { model }) {
    self.model = model;
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
      ['CollectionObject', 'Taxon'].includes(
        resourceView.model.specifyModel.name
      ) &&
      // @ts-expect-error
      remotePrefs['s2n.badges.disable'] !== 'true'
    )
      // @ts-expect-error
      new (resourceView.model.specifyModel.name === 'Taxon'
        ? TaxonBadges
        : CollectionObjectBadges)({
        model: resourceView.model,
        el: $('<span class="lifemapper-info"></span>').appendTo(
          resourceView.header
        ),
      }).render();
  });
}
