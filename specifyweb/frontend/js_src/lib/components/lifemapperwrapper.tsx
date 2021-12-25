import $ from 'jquery';

import remotePrefs from '../remoteprefs';
import ResourceView from '../resourceview';
import { Lifemapper, SpecifyNetworkBadge } from './lifemapper';
import createBackboneView from './reactbackboneextend';

export type Props = {
  readonly model: any;
};

export type ComponentProps = Props & {
  readonly guid: string;
};

const CollectionObjectBadges = createBackboneView<Props, ComponentProps>({
  moduleName: 'Lifemapper',
  className: 'lifemapper-info',
  silentErrors: true,
  component: SpecifyNetworkBadge,
  getComponentProps: (self) => ({
    model: self.options.model,
    guid: self.options.model.get('guid'),
  }),
});

const TaxonBadges = createBackboneView<Props>({
  moduleName: 'Lifemapper',
  className: 'lifemapper-info',
  silentErrors: true,
  component: Lifemapper,
});

export default function register(): void {
  ResourceView.on('rendered', (resourceView: any) => {
    const render = (View: any, attach: (element: JQuery) => JQuery) =>
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
          render(TaxonBadges, (element) =>
            element.appendTo(resourceView.header)
          );
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
