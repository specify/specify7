import { systemAvailable } from './attachments';
import Backbone from './backbone';
import icons from './components/icons';
import type { MenuItem } from './components/main';
import commonText from './localization/common';
import * as navigation from './navigation';

const View = Backbone.View.extend({
  __name__: 'ToolbarAttachments',
  render() {
    navigation.go('attachments/');
  },
});

const menuItem: MenuItem = {
  task: 'attachments',
  title: commonText('attachments'),
  icon: icons.link,
  enabled: systemAvailable,
  view: () => new View(),
};

export default menuItem;
