import Backbone from './backbone';
import specifyForm from './specifyform';

export default Backbone.View.extend({
  __name__: 'SpinnerFieldUI',
  events: {
    change: 'change',
  },
  render() {
    const { min = '', max = '' } = specifyForm.parseSpecifyProperties(
      this.$el.data('specify-initialize')
    ) as { readonly min?: number; readonly max?: number };

    this.el.min = min;
    this.el.max = max;

    this.model.on(`change: ${this.el.name.toLowerCase()}`, this.fillIn, this);
    this.fillIn();

    /*
     * Disable text-align: right in non chromium browsers
     * as they don't support spinner's arrow customization
     */
    if (navigator.userAgent.includes('chrome')) this.el.classList.add('chrome');

    return this;
  },
  fillIn() {
    this.el.value = this.model.get(this.el.name);
  },
  change() {
    const value = this.el.value && Number.parseInt(this.el.value);
    this.model.set(this.el.name, value);
  },
});
