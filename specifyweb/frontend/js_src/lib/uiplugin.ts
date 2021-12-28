import Backbone from './backbone';
import specifyform from './specifyform';

export default Backbone.View.extend({
  __name__: 'UIPlugin',
  initialize: function (options) {
    this.init = specifyform.parseSpecifyProperties(
      this.$el.data('specify-initialize')
    );
    this.populateForm = options.populateForm;
  },
});
