import icons from './components/icons';
import type { MenuItem } from './components/main';
import InteractionsDialog from './interactionsdialog';
import type { SpecifyResource } from './legacytypes';
import commonText from './localization/common';
import * as navigation from './navigation';
import { AnySchema } from './datamodelutils';

const menuItem: MenuItem = {
  task: 'interactions',
  title: commonText('interactions'),
  icon: icons.chat,
  view: (props) =>
    new InteractionsDialog(props)
      .render()
      .on('selected', function (model: SpecifyResource<AnySchema>) {
        navigation.go(new model.Resource().viewUrl());
      }),
};

export default menuItem;
