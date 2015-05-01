define([
    'jquery', 'underscore', 'specifyapi', 'schema', 'backbone', 'dataobjformatters',
    'saveblockers', 'builtinpicklists', 'tooltipmgr', 'whenall', 'help'
], function($, _, api, schema, Backbone, dataobjformatters,
            saveblockers, builtInPL, ToolTipMgr, whenAll, help) {
    "use strict";

    var objformat = dataobjformatters.format;
    return Backbone.View.extend({
        __name__: "PickListView",
        events: {
            change: 'setValueIntoModel'
        },
        initialize: function(options) {
            this.initializing = this.model.getResourceAndField(this.$el.attr('name')).done(this._gotField.bind(this));
        },
        _gotField: function(resource, field) {
            if (!field) {
                console.log("can't setup picklist for unknown field " + this.model.specifyModel.name + "." + (this.$el.attr('name')));
                return;
            }
            this.isAgentType = resource.specifyModel.name === 'Agent' && field.name === 'agentType';
            this.pickListName = this.$el.data('specify-picklist') || field.getPickList();

            if (!this.pickListName && !this.isAgentType) {
                console.log("can't determine picklist for field " + resource.specifyModel.name + "." + field.name);
                return;
            }
            this.remote = resource !== this.model;
            this.resource = resource;
            this.field = field;
            this.initialized = true;
        },
        setValueIntoModel: function() {
            var value = this.$el.val() || null;
            if (this.isAgentType && (value != null)) value = parseInt(value, 10);
            this.model.set(this.field.name, value);
        },
        setupOptions: function(items, value) {
            // value maybe undefined, null, a string, or a Backbone model
            // if the latter, we use the URL of the object to represent it
            if (value != null ? value.url : void 0) value = value.url();

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
            this.model.businessRuleMgr.checkField(this.field.name);
        },
        getPickListItems: function() {
            if (this.isAgentType) return $.when(builtInPL.agentType);
            if (this.pickListName == 'UserType') return $.when(builtInPL.userType);

            return api.getPickListByName(this.pickListName).pipe(function(picklist) {
                var limit = picklist.get('sizelimit');
                if (limit < 1) limit = 0;
                var plModel;
                switch (picklist.get('type')) {
                case 0: // items in picklistitems table
                    return picklist.rget('picklistitems').pipe(function(plItemCollection) {
                        return plItemCollection.isComplete ? plItemCollection.toJSON() :
                            plItemCollection.fetch({limit: limit}).pipe(function() {return plItemCollection.toJSON();});
                    });
                case 1: // items are objects from a table
                    plModel = schema.getModel(picklist.get('tablename'));
                    var plItemCollection = new plModel.LazyCollection();
                    return plItemCollection.fetch({ limit: limit }).pipe(function() {
                        return whenAll(plItemCollection.map(function(item) {
                            return objformat(item, picklist.get('formatter')).pipe(function(title) {
                                return {value: item.url(), title: title};
                            });
                        }));
                    });
                case 2: // items are fields from a table
                    plModel = schema.getModel(picklist.get('tablename'));
                    var plFieldName = picklist.get('fieldname');
                    return api.getRows(plModel, {
                        limit: limit,
                        fields: [plFieldName],
                        distinct: true
                    }).pipe(function(rows) {
                        return _.map(rows, function(row) {
                            var value = row[0] || '';
                            return {value: value, title: value};
                        });
                    });
                default:
                    throw new Error('unknown picklist type');
                }
            });
        },
        render: function() {
            this.initializing.then(this._render.bind(this));
            return this;
        },
        _render: function() {
            if (!this.initialized) {
                console.error('not initialized');
                return;
            }
            if (this.rendered) throw new Exception('already rendered');
            this.rendered = true;
            this.getPickListItems().done(this.gotItems.bind(this));
            if (!this.remote) {
                this.toolTipMgr = new ToolTipMgr(this).enable();
                this.saveblockerEnhancement = new saveblockers.FieldViewEnhancer(this, this.field.name);
            }
            help.makeTarget({
                template: "picklist.html",
                target: this.el,
                data: {
                }
            });
        },
        gotItems: function(items) {
            this.setupOptions(items, this.resource.get(this.field.name));
            this.resource.on('change:' + this.field.name.toLowerCase(), function() {
                this.$el.val(this.resource.get(this.field.name));
            }, this);
        }
    });
});
