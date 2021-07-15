'use strict';

const Backbone = require('./backbone');
const formsText = require('./localization/forms').default;

module.exports = Backbone.View.extend({
  __name__: 'SaveButton',
  events: {
    click: 'click',
  },
  initialize: function ({ model }) {
    this.model = model;

    this.button = undefined;
    this.buttonsDisabled = false;
    this.model.on(
      'saverequired changing',
      () => this.setButtonDisabled(true),
      true
    );
  },
  setButtonDisabled: function (disabled) {
    this.buttonsDisabled = disabled;
    if (this.button) this.button.disabled = this.buttonsDisabled;
  },
  render: function () {
    this.el.classList.add('add-another-button');
    this.el.innerHTML = `
      <input type="button" value="${formsText('addAnother')}">
    `;
    this.button = this.el.children[0];

    // get button to match current state
    this.setButtonDisabled(this.model.isNew() || this.buttonsDisabled);

    return this;
  },
  click() {
    this.model.businessRuleMgr.pending.then(this.doSave.bind(this));
  },
  doSave: function () {
    this.trigger('addanother', { newResource: this.model.clone() });
  },
});
