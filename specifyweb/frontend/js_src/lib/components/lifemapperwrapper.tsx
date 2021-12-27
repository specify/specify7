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
      resourceView.header &&
      !resourceView.model.isNew() &&
      ['Taxon', 'CollectionObject'].includes(
        resourceView.model.specifyModel.name
      )
    )
      render((element) => element.appendTo(resourceView.header));
  });
}
