define([
    'jquery', 'underscore', 'specifyapi', 'schema', 'backbone', 'dataobjformatters',
    'saveblockers', 'builtinpicklists', 'tooltipmgr', 'q'
], function($, _, api, schema, Backbone, dataobjformatters, saveblockers, builtInPL, ToolTipMgr, Q) {
    "use strict";

    var objformat = dataobjformatters.format;

    function buildPickListInfo(info, resource, field) {
        _.extend(info, {
            resource: resource,
            remote: resource !== info.model
        });

        if (resource.specifyModel.name === 'Agent' && field.name === 'agentType') {
            info.pickListItems = builtInPL.agentType;
            info.builtIn = true;
        } else if (resource.specifyModel.name === 'PickList' && info.fieldName === 'typesCBX') {
            field = resource.specifyModel.getField('type');
            info.pickListItems = builtInPL.typesCBX;
            info.builtIn = true;
        } else {
            if (!field)
                throw "can't setup picklist for unknown field " + info.model.specifyModel.name + "." + info.fieldName;

            info.pickListName || (info.pickListName = field.getPickList());

            if (info.pickListName === 'UserType') {
                info.pickListItems = builtInPL.userType;
                info.builtIn = true;
            } else {
                if (!info.pickListName)
                    throw "can't determine picklist for field " + resource.specifyModel.name + "." + field.name;
                info.builtIn = false;
            }
        }

        info.field = field;
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
        var plModel = schema.getModel(info.pickList.get('tablename'));
        var plFieldName = info.pickList.get('fieldname');
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
            autocompleteselect: 'selected',
            autocompletechange: 'changed'
        },
        initialize: function() {
            var info = {
                model: this.model,
                fieldName: this.$el.attr('name'),
                pickListName: this.$el.data('specify-picklist')
            };

            this.infoPromise = Q(this.model.getResourceAndField(info.fieldName))
                .spread(buildPickListInfo.bind(null, info));
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

            info.resource.on('change:' + info.field.name.toLowerCase(), this.resetValue, this);

            var control = this.$el;
            var input = $('<input type="text">')
                    .addClass(control.attr('class'))
                    .attr('disabled', control.attr('disabled'));

            control.replaceWith(input);
            this.setElement(input);
            input.autocomplete({
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
