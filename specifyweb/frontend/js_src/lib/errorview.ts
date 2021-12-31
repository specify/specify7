import Backbone from './backbone';
import commonText from './localization/common';
import { clearUnloadProtect } from './navigation';

export const ErrorView = Backbone.View.extend({
  __name__: 'ErrorView',
  render() {
    this.el.innerHTML = `
      <h3>${this.options.header}</h3>
      <p>${this.options.message}</p>
    `;
  },
});

export const UnhandledErrorView = Backbone.View.extend({
  __name__: 'UnhandledErrorView',
  title: commonText('backEndErrorDialogTitle'),
  render() {
    this.el.innerHTML = `
      ${commonText('backEndErrorDialogHeader')} 
      <p>${commonText('backEndErrorDialogMessage')}</p>
      <textarea
        readonly
        style="
          width: 100%;
          min-height: 600px;
        "
      >${this.options.response}</textarea>
    `;
    this.$el.dialog({
      modal: true,
      width: '800',
      dialogClass: 'ui-dialog-no-close',
      buttons: [
        {
          text: commonText('close'),
          click() {
            window.location.href = '/';
          },
        },
      ],
    });
    clearUnloadProtect();
  },
});
