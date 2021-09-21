import $ from 'jquery';

import remotePrefs from '../remoteprefs';
import ResourceView from '../resourceview';
import { SpecifyNetworkBadge } from './lifemapper';
import createBackboneView from './reactbackboneextend';
import type { SpecifyResource } from './wbplanview';

export interface Props {
  model: SpecifyResource;
}

export interface ComponentProps extends Props {
  readonly guid: string;
}

const Badges = createBackboneView<Props, Props, ComponentProps>({
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
});

export default function register(): void {
  ResourceView.on('rendered', (resourceView: any) => {
    const render = (attach: (element: JQuery) => JQuery) =>
      // @ts-expect-error
      new Badges({
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
          render((element) => element.appendTo(resourceView.header));
        else
          setTimeout(
            () =>
              render((container) =>
                container.insertBefore(
                  resourceView.el
                    .closest('.ui-dialog')
                    .getElementsByClassName('ui-dialog-title')[0]
                )
              ),
            0
          );
      } else if (resourceView.model.specifyModel.name === 'CollectionObject')
        render((container) => container.appendTo(resourceView.header));
  });
}
