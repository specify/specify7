'use strict';

var $ = require('jquery');
var _ = require('underscore');
var Q = require('q');

var Base = require('./basepicklist.js');
var schema = require('./schema.js');
const {addValidationAttributes, resolveParser} = require('./uiparse.ts');
const formsText = require('./localization/forms').default;
const commonText = require('./localization/common').default;

let index = 0;

module.exports = Base.extend({
  __name__: 'PickListCBXView',
  events: {
    'change': 'handleChange',
  },
  render: function() {
    const wrapper = $('<span class="combobox-wrapper">');

    const listId = 'datalist-${index}';
    index+=1;

    this.input = $(`<input
      type="text"
      id="${this.el.id}"
      list="${listId}"
      class="${this.$el.attr('class')}"
      ${this.$el.attr('disabled') ? 'disabled tabIndex="-1"' : ''}
      ${this.$el.attr('required') ? 'required' : ''}
    >`).appendTo(wrapper);

    this.dataList = $(`<datalist id="${listId}"></datalist>`).appendTo(wrapper);

    this.$el.replaceWith(wrapper);
    this.setElement(wrapper);
    Base.prototype.render.apply(this, arguments);
    return this;
  },
  _render: function() {
    const parser = resolveParser(this.info.field);
    addValidationAttributes(
        this.input[0],
        this.info.field,
        parser,
    );

    this.dataList[0].innerHTML = this.source().map((label) =>
      `<option value="${label}">`,
    ).join('');

    this.resetValue();
  },
  getCurrentValue: function() {
    const value = this.info.resource.get(this.info.field.name);
    return this.info.pickListItems.find(item =>
      item.value === value,
    )?.title || value;
  },
  source: function() {
    const labels = this.info.pickListItems.filter(item => item.value != null).map(item => item.title);
    if (labels.length !== new Set(labels).size)
      console.error(
        'Duplicate picklist entries found',
        this.info,
      );
    return labels;
  },
  handleChange: function() {
    const value = this.info.pickListItems.find(({title}) =>
      title === this.input.val(),
    )?.value;
    if(this.input.val() === ''){
      if(!this.input[0].required)
        this.model.set(this.info.field.name, null);
    }
    else if (typeof value === 'undefined')
      this.addValue(this.input.val());
    else
      this.model.set(this.info.field.name, value);
  },
  resetValue: function() {
    this.input.val(this.getCurrentValue());
  },
  addValue: function(value) {
    if (this.info.pickList.get('type') === 2) {
      this.model.set(this.info.field.name, value);
      return;
    }
    if (this.info.pickList.get('type') !== 0)
      throw new Error('adding item to wrong type of picklist');

    const dialog = $(`<div>
      ${formsText('addToPickListConfirmationDialogHeader')}
      <p>
        ${formsText('addToPickListConfirmationDialogMessage')(
      value,
      this.info.pickList.get('name'),
    )}
      </p>
    </div>`).dialog({
      title: formsText('addToPickListConfirmationDialogTitle'),
      modal: true,
      close: function() {
        $(this).remove();
      },
      buttons: [
        {
          text: commonText('add'),
          click: () => {
            dialog.dialog('close');
            this.doAddValue(value);
          },
        },
        {
          text: commonText('cancel'),
          click: () => {
            dialog.dialog('close');
            this.resetValue();
          },
        },
      ],
    });
  },
  doAddValue: function(value) {

    Q(this.info.pickList.rget('picklistitems')).then((plItems) => {
      var item = new schema.models.PickListItem.Resource();
      item.set({title: value, value: value});
      plItems.add(item);
      return Q(this.info.pickList.save());
    }).then(() => {
      this.info.pickListItems.push({title: value, value: value});
      this.model.set(this.info.field.name, value);
      this._render();
    });
  },
});
