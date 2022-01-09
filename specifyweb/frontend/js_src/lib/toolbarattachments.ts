import { systemAvailable } from './attachments';
import Backbone from './backbone';
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
  icon: '/static/img/attachment_icon.png',
  enabled: systemAvailable,
  view: () => new View(),
};

export default menuItem;
