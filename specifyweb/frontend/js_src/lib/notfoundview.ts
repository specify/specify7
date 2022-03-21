import Backbone from './backbone';
import commonText from './localization/common';

export const NotFoundView = Backbone.View.extend({
  __name__: 'NotFoundView',
  title: commonText('pageNotFound'),
  render() {
    this.el.setAttribute('role', 'alert');
    this.el.setAttribute('class', 'p-2');
    this.el.innerHTML = `<h2>${commonText('pageNotFound')}</h2>`;
  },
});
