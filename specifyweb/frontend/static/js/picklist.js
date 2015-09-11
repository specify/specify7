define([
    'jquery', 'underscore', 'specifyapi', 'schema', 'backbone', 'dataobjformatters',
    'saveblockers', 'builtinpicklists', 'tooltipmgr', 'whenall', 'q'
], function($, _, api, schema, Backbone, dataobjformatters, saveblockers, builtInPL, ToolTipMgr, whenAll, Q) {
    "use strict";

    var objformat = dataobjformatters.format;

    function buildPickListInfo(info, resource, field) {
        if (!field)
            throw "can't setup picklist for unknown field " + this.model.specifyModel.name + "." + (this.$el.attr('name'));

        _.extend(info, {
            field: field,
            resource: resource,
            remote: resource !== info.model
        });

        if (resource.specifyModel.name === 'Agent' && field.name === 'agentType') {
            info.pickListItems = builtInPL.agentType;
            info.builtIn = true;
        } else {
            info.pickListName || (info.pickListName = field.getPickList());

            if (info.pickListName == 'UserType') {
                info.pickListItems = builtInPL.userType;
                info.builtIn = true;
            } else {
                if (!info.pickListName)
                    throw "can't determine picklist for field " + resource.specifyModel.name + "." + field.name;
                info.builtIn = false;
            }
        }

        return getPickList(info);
    }

    function getPickList(info) {
        return info.builtIn ? info :
            Q(api.getPickListByName(info.pickListName))
            .then(gotPickList.bind(null, info));
    }

    function gotPickList(info, picklist) {
        info.pickList = picklist;

        info.limit = picklist.get('sizelimit');
        if (info.limit < 1) info.limit = 0;
        var plModel;
        switch (picklist.get('type')) {
        case 0: // items in picklistitems table
            return getPickListItems(info);

        case 1: // items are objects from a table
            return getItemsFromTable(info);

        case 2: // items are fields from a table
            return getItemsFromField(info);

        default:
            throw new Error('unknown picklist type');
        }
    }

    function getPickListItems(info) {
        // picklistitems is a dependent field
        return Q(info.pickList.rget('picklistitems'))
            .then(function(plItemCollection) {
                info.pickListItems = plItemCollection.toJSON();
                return info;
            });
    }

    function getItemsFromTable(info) {
        var plModel = schema.getModel(info.pickList.get('tablename'));
        var plItemCollection = new plModel.LazyCollection();
        return Q(plItemCollection.fetch({ limit: info.limit }))
            .then(function() { return formatItems(info, plItemCollection); });
    }

    function formatItems(info, plItemCollection) {
        var formatPromises = plItemCollection.map(formatItem.bind(null, info));
        return Q.all(formatPromises).then(function (items) {
            info.pickListItems = items;
            return info;
        });
    }

    function formatItem(info, item) {
        return Q(objformat(item, info.pickList.get('formatter')))
            .then(function(title) { return {value: item.url(), title: title}; });
    }

    function getItemsFromField(info) {
        var plModel = schema.getModel(info.picklist.get('tablename'));
        var plFieldName = info.picklist.get('fieldname');
        return Q(api.getRows(plModel, {
            limit: info.limit,
            fields: [plFieldName],
            distinct: true
        })).then(formatRows.bind(null, info));
    }

    function formatRows(info, rows) {
        info.pickListItems = rows.map(function(row) {
            var value = row[0] || '';
            return {value: value, title: value};
        });
        return info;
    }

    return Backbone.View.extend({
        __name__: "PickListView",
        events: {
            change: 'setValueIntoModel'
        },
        initialize: function(options) {
            var info = {
                model: this.model,
                pickListName: this.$el.data('specify-picklist')
            };

            this.infoPromise = Q(this.model.getResourceAndField(this.$el.attr('name')))
                .spread(buildPickListInfo.bind(null, info));
        },
        setValueIntoModel: function() {
            var value = this.$el.val() || null;
            if (this.info.pickListItems === builtInPL.agentType && value != null) {
                value = parseInt(value, 10);
            }
            this.model.set(this.info.field.name, value);
        },
        render: function() {
            this.infoPromise.done(this._render.bind(this));
            return this;
        },
        _render: function(info) {
            this.info = info;
            info.field.isRequired && this.$el.addClass('specify-required-field');

            if (!info.remote) {
                this.toolTipMgr = new ToolTipMgr(this).enable();
                this.saveblockerEnhancement = new saveblockers.FieldViewEnhancer(this, info.field.name);
            }
            this.setupOptions();

            info.resource.on('change:' + info.field.name.toLowerCase(), function() {
                this.$el.val(info.resource.get(info.field.name));
            }, this);
        },
        setupOptions: function() {
            var items = this.info.pickListItems;
            var value = this.info.resource.get(this.info.field.name);

            // value maybe undefined, null, a string, or a Backbone model
            // if the latter, we use the URL of the object to represent it
            if (value != null ? value.url : void 0) value = value.url();

            this.$el.append('<optgroup><option>Add value</option></optgroup>');

            if (!this.$el.hasClass('specify-required-field')) {
                // need an option for no selection
                this.$el.append('<option>');
            }

            var options = items
                    .map(function(item) { return !!item.value && $('<option>', {value: item.value}).text(item.title)[0]; })
                    .filter(function(option) { return !!option; });

            this.$el.append(options);

            // value will be undefined when creating picklist for new resource
            // so we set the model to have whatever the select element is set to
            if (_.isUndefined(value)) {
                this.setValueIntoModel();
                return;
            }

            // value is now either null or a string
            value = value || '';

            if (value && _.all(items, function(item) { return item.value.toString() !== value.toString(); })) {
                // current value is not in picklist
                this.$el.append($('<option>', { value: value }).text("" + value + " (current, invalid value)"));
            }

            if (!value && this.$el.hasClass('specify-required-field')) {
                // value is required but missing from database
                this.$el.append('<option>Invalid null selection</option>');
            }

            this.$el.val(value);

            // run business rules to make sure current value is acceptable
            this.model.businessRuleMgr.checkField(this.info.field.name);
        }
    });
});
