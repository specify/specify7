"use strict";

var $ = require('jquery');
var _ = require('underscore');
var Q = require('q');

var Base   = require('./basepicklist.js');
var schema = require('./schema.js');


module.exports = Base.extend({
        __name__: "PickListCBXView",
        events: {
            autocompleteselect: 'selected',
            autocompletechange: 'changed',
            'click .combobox-toggle': 'showAll',
            'mousedown .combobox-toggle': 'checkOpen'
        },
        render: function() {
            var control = this.$el;
            var wrapper = $('<span class="combobox-wrapper">');
            this.input = $('<input type="text">')
                .appendTo(wrapper)
                .addClass(control.attr('class'))
                .attr('disabled', control.attr('disabled'));

            if (!control.attr('disabled')) {
                $('<a class="combobox-toggle ui-corner-right">')
                    .attr( "tabIndex", -1 )
                    .attr( "title", "Show All Items" )
                    .appendTo( wrapper )
                    .button({
                        icons: {
                            primary: "ui-icon-triangle-1-s"
                        },
                        text: false
                    })
                    .removeClass( "ui-corner-all" );
            }

            control.replaceWith(wrapper);
            this.setElement(wrapper);
            Base.prototype.render.apply(this, arguments);
            return this;
        },
        _render: function(info) {
            this.input.autocomplete({
                    delay: 0,
                    minLength: 0,
                    source: this.source.bind(this)
            });
            if (this.info.field.length != null) {
                this.input.attr('maxlength', this.info.field.length);
            }

            this.resetValue();
        },
        getCurrentValue: function() {
            var value = this.info.resource.get(this.info.field.name);
            var item = _.find(this.info.pickListItems, function(item) { return item.value === value; });
            return item ? item.title : value;
        },
        source: function(request, response) {
            var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i");
            var options = this.info.pickListItems.map(function(item) {
                return (item.value != null && matcher.test(item.title)) &&
                    {
                        label: item.title,
                        value: item.title,
                        item: item
                    };
            }).filter(function(option) { return !!option; });
            response(options);
        },
        showAll: function() {
            this.input.focus();
            this.wasOpen || this.input.autocomplete("search", "");
        },
        checkOpen: function() {
            this.wasOpen = this.input.autocomplete('widget').is(':visible');
        },
        selected: function(event, ui) {
            var value = ui.item.item.value;
            this.model.set(this.info.field.name, value);
        },
        changed: function(event, ui) {
            if (ui.item) { return; }

            if (!this.input.hasClass('specify-required-field') && this.input.val() === '') {
                this.model.set(this.info.field.name, null);
                return;
            }

            this.addValue(this.input.val());
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
                throw new Error("adding item to wrong type of picklist");

            var resetValue = this.resetValue.bind(this);
            var doAddValue = this.doAddValue.bind(this, value);

            var d = $('<div>Add value, <span class="pl-value"></span>, ' +
                      'to the pick list named ' + '<span class="pl-name"></span>?' +
                      '</div>')
                    .dialog({
                        title: "Add to pick list",
                        modal: true,
                        close: function() { $(this).remove(); },
                        buttons: [
                            { text: 'Add', click: function() { $(this).dialog('close'); doAddValue(); } },
                            { text: 'Cancel', click: function() { $(this).dialog('close'); resetValue(); } }
                        ]
                    });
            d.find('.pl-value').text(value);
            d.find('.pl-name').text(this.info.pickList.get('name'));
        },
        doAddValue: function(value) {
            var info = this.info;
            var model = this.model;

            Q(info.pickList.rget('picklistitems'))
                .then(function(plItems) {
                    var item = new schema.models.PickListItem.Resource();
                    item.set({ title: value, value: value });
                    plItems.add(item);
                    return Q(info.pickList.save());
                })
                .then(function() {
                    info.pickListItems.push({ title: value, value: value });
                    model.set(info.field.name, value);
                });
        }
    });
