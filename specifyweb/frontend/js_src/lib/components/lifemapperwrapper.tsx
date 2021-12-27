import $ from 'jquery';

import type { SpecifyResource } from '../legacytypes';
import remotePrefs from '../remoteprefs';
import ResourceView from '../resourceview';
import { SpecifyNetworkBadge } from './lifemapper';
import createBackboneView from './reactbackboneextend';
import type { SpecifyResource } from './wbplanview';

const Badges = createBackboneView(SpecifyNetworkBadge, {
  className: 'flex-1 flex justify-end',
  silentErrors: true,
  getComponentProps: (self) => ({
    model: self.options.model,
    guid: self.options.model.get('guid'),
  }),
});

export default function register(): void {
  ResourceView.on('rendered', (resourceView: any) => {
    const render = (attach: (element: JQuery) => JQuery) =>
      new Badges({
        model: resourceView.model,
        el: attach($('<span>')),
      }).render();
    if (
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
