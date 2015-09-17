define(['jquery', 'underscore', 'q', 'basepicklist', 'schema'], function($, _, Q, Base, schema) {
    "use strict";

    return Base.extend({
        __name__: "PickListCBXView",
        events: {
            autocompleteselect: 'selected',
            autocompletechange: 'changed'
        },
        render: function() {
            var control = this.$el;
            var input = $('<input type="text">')
                    .addClass(control.attr('class'))
                    .attr('disabled', control.attr('disabled'));

            control.replaceWith(input);
            this.setElement(input);
            Base.prototype.render.apply(this, arguments);
            return this;
        },
        _render: function(info) {
            this.$el.autocomplete({
                    delay: 0,
                    minLength: 0,
                    source: this.source.bind(this)
            });

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
        selected: function(event, ui) {
            var value = ui.item.item.value;
            this.model.set(this.info.field.name, value);
        },
        changed: function(event, ui) {
            if (ui.item) { return; }

            if (!this.$el.hasClass('specify-required-field') && this.$el.val() === '') {
                this.model.set(this.info.field.name, null);
                return;
            }

            if (this.info.builtIn || this.info.pickList.get('readonly')) {
                this.resetValue();
            } else {
                this.addValue(this.$el.val());
            }
        },
        resetValue: function() {
            this.$el.val(this.getCurrentValue());
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
});
