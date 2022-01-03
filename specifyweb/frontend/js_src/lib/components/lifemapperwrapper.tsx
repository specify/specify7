import $ from 'jquery';

import { getBoolPref } from '../remoteprefs';
import ResourceView from '../resourceview';
import { SpecifyNetworkBadge } from './lifemapper';
import createBackboneView from './reactbackboneextend';

const View = createBackboneView(SpecifyNetworkBadge, {
  silentErrors: true,
});

export default function register(): void {
  ResourceView.on('rendered', (resourceView: any) => {
    if (
      !getBoolPref('s2n.badges.disable', false) &&
      resourceView.header &&
      !resourceView.model.isNew() &&
      ['Taxon', 'CollectionObject'].includes(
        resourceView.model.specifyModel.name
      )
    )
      new View({
        model: resourceView.model,
        el: $('<span>', { class: 'flex-1 flex justify-end' }).appendTo(
          resourceView.header
        )[0],
      }).render();
  });
}
