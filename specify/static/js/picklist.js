define([
    'jquery', 'underscore', 'schemalocalization', 'specifyapi', 'backbone', 'schema',
    'cs!businessrulesviewmixin', 'cs!agenttypepicklist'
], function($, _, schemalocalization, api, Backbone, schema,
            businessrulesviewmixin, agentTypePicklist) {
    "use strict";

    var Picklist = Backbone.View.extend({
        events: {
            'change': 'change'
        },
        render: function() {
            var self = this;
            var specifyModel = self.model.specifyModel;
            var field = specifyModel.getField(self.$el.attr('name'));
            if (!field) { return self; }

            // look at data-specify-picklist on element

            var isAgentType = (specifyModel.name === 'Agent' && field.name === 'agentType');

            var pickListName = schemalocalization.getPickListForField(field.name, specifyModel.name);
            if (!pickListName && !isAgentType) { return self; }

            var buildPicklist = function(picklistitems, value) {
                value = value && !_.isUndefined(value.url) ? value.url() : value;
                var items = {};
                if (!self.$el.hasClass('specify-required-field')) {
                    $('<option>').appendTo(self.el);
                }
                _(picklistitems).each(function(item) {
                    $('<option>').text(item.title).attr('value', item.value).appendTo(self.el);
                });
                if (_(value).isUndefined()) return self.change();
                var valueNotInItems = (value !== '') && _.all(picklistitems, function(item) { return item.value !== value; });
                var valueIsRequiredButMissing = self.$el.is('.specify-required-field') && value === '';
                if (valueNotInItems || valueIsRequiredButMissing) {
                    $('<option>').appendTo(self.el).attr('value', value).text(value + " (current value not in picklist)");
                }
                self.$el.val(value);
                self.model.businessRuleMgr.checkField(field.name);
            };

            var getPickList = isAgentType ? agentTypePicklist :
                api.getPickListByName(pickListName).pipe(function(picklist) {
                    var tablename = picklist.get('tablename');
                    var model = tablename && schema.getModel(tablename);
                    if (model) {
                        var picklistCol = new (api.Collection.forModel(model))();
                        picklistCol.queryParams.limit = 0;
                        return picklistCol.fetch().pipe(function () {
                            return picklistCol.map(function (item) {
                                return {value: item.get('resource_uri'), title: item.get('name')};
                            });
                        });
                    } else return picklist.get('picklistitems');
                });

            var getValue = self.model.rget(field.name);
            $.when(getPickList, getValue).done(buildPicklist);
            self.enableBusinessRulesMixin(field.name);
            return self;
        },
        change: function() {
            this.model.set(this.$el.attr('name'), this.$el.val());
        }
    });

    _.extend(Picklist.prototype, businessrulesviewmixin);
    return Picklist;
});
