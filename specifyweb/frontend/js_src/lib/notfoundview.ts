import Backbone from './backbone';
import commonText from './localization/common';

export default Backbone.View.extend({
  __name__: 'NotFoundView',
  title: commonText('pageNotFound'),
  render: function () {
    this.$el.empty();
    this.el.setAttribute('role', 'alert');
    this.$el.append(`<h3>${commonText('pageNotFound')}</h3`);
  },
});
