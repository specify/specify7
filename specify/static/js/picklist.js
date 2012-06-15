define([
    'jquery', 'underscore', 'schemalocalization', 'specifyapi', 'backbone', 'schema'
], function($, _, schemalocalization, api, Backbone, schema) {
    "use strict";

    var agentTypePicklist = [{value: 0, title: 'Organization'},
                             {value: 1, title: 'Person'},
                             {value: 2, title: 'Other'},
                             {value: 3, title: 'Group'}];

    return Backbone.View.extend({
        events: {
            'change': 'change'
        },
        render: function() {
            var self = this;
            var specifyModel = self.model.specifyModel;
            var field = specifyModel.getField(self.$el.attr('name'));
            if (!field) { return self; }

            // look at data-specify-picklist on element

            var isAgentType = (specifyModel === schema.getModel('Agent')
                               && field === specifyModel.getField('agentType'));

            var pickListName = schemalocalization.getPickListForField(field.name, specifyModel.name);
            if (!pickListName && !isAgentType) { return self; }

            var buildPicklist = function(picklistitems, value) {
                value = (value instanceof api.Resource) ? value.url() : value;
                var items = {};
                if (!self.$el.hasClass('required')) {
                    $('<option>').appendTo(self.el);
                }
                _(picklistitems).each(function(item) {
                    $('<option>').text(item.title).attr('value', item.value).appendTo(self.el);
                });
                if (_(value).isUndefined()) return;
                var valueNotInItems = (value !== '') && _.all(picklistitems, function(item) { return item.value !== value; });
                var valueIsRequiredButMissing = self.$el.is('.specify-required-field') && value === '';
                if (valueNotInItems || valueIsRequiredButMissing) {
                    $('<option>').appendTo(self.el).attr('value', value).text(value + " (current value not in picklist)");
                }
                self.$el.val(value);
            };

            var getPickList = isAgentType ? agentTypePicklist :
                api.getPickListByName(pickListName).pipe(function(picklist) {
                    if (picklist.get('tablename')) {
                        var picklistCol = new (api.Collection.forModel(picklist.get('tablename')))();
                        return picklistCol.fetch().pipe(function () {
                            return picklistCol.map(function (item) {
                                return {value: item.get('resource_uri'), title: item.get('name')};
                            });
                        });
                    } else return picklist.get('picklistitems');
                });

            var getValue = self.model.rget(field.name);
            $.when(getPickList, getValue).done(buildPicklist);
            return self;
        },
        change: function() {
            this.model.set(this.$el.attr('name'), this.$el.val());
        }
    });
});
