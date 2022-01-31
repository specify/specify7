import Backbone from './backbone';
import specifyform from './specifyform';
import type { RA } from './types';

export const UiPlugin = Backbone.View.extend({
  __name__: 'UiPlugin',
  initialize(options: {
    readonly populateForm: (...args: RA<never>) => unknown;
  }) {
    this.init = specifyform.parseSpecifyProperties(
      this.$el.data('specify-initialize')
    );
    this.populateForm = options.populateForm;
  },
});
