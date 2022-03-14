import Backbone from './backbone';
import { parseSpecifyProperties } from './parsespecifyproperties';
import type { RA } from './types';

export const UiPlugin = Backbone.View.extend({
  __name__: 'UiPlugin',
  initialize(options: {
    readonly populateForm: (...args: RA<never>) => unknown;
  }) {
    this.init = parseSpecifyProperties(this.$el.data('specify-initialize'));
    this.populateForm = options.populateForm;
  },
});
