import type { MenuItem } from './components/main';
import type { SpecifyResource } from './components/wbplanview';
import InteractionsDialog from './interactionsdialog';
import commonText from './localization/common';
import navigation from './navigation';

const menuItem: MenuItem = {
  task: 'interactions',
  title: commonText('interactions'),
  icon: '/static/img/interactions.png',
  view: (props) =>
    new InteractionsDialog(props)
      .render()
      .on('selected', function (model: SpecifyResource) {
        navigation.go(new model.Resource().viewUrl());
      }),
};

export default menuItem;
