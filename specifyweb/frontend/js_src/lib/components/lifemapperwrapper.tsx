import $ from 'jquery';

import remotePrefs from '../remoteprefs';
import ResourceView from '../resourceview';
import { Lifemapper, SpecifyNetworkBadge } from './lifemapper';
import createBackboneView from './reactbackboneextend';

export interface Props {
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

const TaxonBadges = createBackboneView<Props, Props, Props>({
  moduleName: 'Lifemapper',
  className: 'lifemapper-info',
  initialize(self, { model }) {
    self.model = model;
  },
  beforeRender(self) {
    self.el.setAttribute('aria-live', 'polite');
  },
  silentErrors: true,
  Component: Lifemapper,
  getComponentProps: (self) => ({
    model: self.model,
  }),
});

export default function register(): void {
  ResourceView.on('rendered', (resourceView: any) => {
    const render = (
      View: any,
      attach: (element: JQuery<HTMLElement>) => JQuery<HTMLElement>
    ) =>
      new View({
        model: resourceView.model,
        el: attach($('<span class="lifemapper-info"></span>')),
      }).render();
    if (
      // @ts-expect-error
      remotePrefs['s2n.badges.disable'] !== 'true' &&
      !resourceView.model.isNew()
    )
      if (resourceView.model.specifyModel.name === 'Taxon') {
        if (resourceView.header)
          render(TaxonBadges, (el) => el.appendTo(resourceView.header));
        else
          setTimeout(
            () =>
              render(TaxonBadges, (container) =>
                container.insertBefore(
                  resourceView.el
                    .closest('.ui-dialog')
                    .getElementsByClassName('ui-dialog-title')[0]
                )
              ),
            0
          );
      } else if (resourceView.model.specifyModel.name === 'CollectionObject')
        render(CollectionObjectBadges, (container) =>
          container.appendTo(resourceView.header)
        );
  });
}
