define([
    'jquery', 'underscore', 'specifyapi', 'schema', 'backbone', 'dataobjformatters',
    'saveblockers', 'agenttypepicklist', 'tooltipmgr', 'whenall'
], function($, _, api, schema, Backbone, dataobjformatters, saveblockers, agentTypesPL, ToolTipMgr, whenAll) {
    "use strict";

    var objformat = dataobjformatters.format;
    return Backbone.View.extend({
        __name__: "PickListView",
        events: {
            change: 'setValueIntoModel'
        },
        initialize: function(options) {
            var _this = this;
            return this.initializing = this.model.getResourceAndField(this.$el.attr('name')).done(function(resource, field) {
                if (!field) {
                    console.log("can't setup picklist for unknown field " + _this.model.specifyModel.name + "." + (_this.$el.attr('name')));
                    return;
                }
                _this.isAgentType = resource.specifyModel.name === 'Agent' && field.name === 'agentType';
                _this.pickListName = field.getPickList();

                // TODO: should check for picklist attribute on element

                if (!_this.pickListName && !_this.isAgentType) {
                    console.log("can't determine picklist for field " + resource.specifyModel.name + "." + field.name);
                    return;
                }
                _this.remote = resource !== _this.model;
                _this.resource = resource;
                _this.field = field;
                _this.initialized = true;
            });
        },
        setValueIntoModel: function() {
            var value = this.$el.val() || null;
            if (this.isAgentType && (value != null)) value = parseInt(value, 10);
            this.model.set(this.field.name, value);
        },
        setupOptions: function(items, value) {
            var _this = this;
            // value maybe undefined, null, a string, or a Backbone model
            // if the latter, we use the URL of the object to represent it
            if (value != null ? value.url : void 0) value = value.url();

            if (!this.$el.hasClass('specify-required-field')) {
                // need an option for no selection
                this.$el.append('<option>');
            }

            _(items).each(function(item) {
                if (item.value) {
                    _this.$el.append($('<option>', {value: item.value}).text(item.title));
                }
            });

            // value will be undefined when creating picklist for new resource
            // so we set the model to have whatever the select element is set to
            if (_.isUndefined(value)) {
                this.setValueIntoModel();
                return;
            }

            // value is now either null or a string
            value = value || '';

            if (value && _.all(items, function(item) { return item.value !== value; })) {
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
            if (this.isAgentType) return $.when(agentTypesPL);

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
                            return {value: row[0], title: row[0]};
                        });
                    });
                default:
                    throw new Error('unknown picklist type');
                }
            });
        },
        render: function() {
            var _this = this;
            this.initializing.then(function() {
                if (!_this.initialized) {
                    console.error('not initialized');
                }
                if (_this.rendered) throw new Exception('already rendered');
                _this.rendered = true;
                _this.getPickListItems().done(function(items) {
                    _this.setupOptions(items, _this.resource.get(_this.field.name));
                    _this.resource.on('change:' + _this.field.name.toLowerCase(), function() {
                        _this.$el.val(_this.resource.get(_this.field.name));
                    });
                });
                if (!_this.remote) {
                    _this.toolTipMgr = new ToolTipMgr(_this).enable();
                    _this.saveblockerEnhancement = new saveblockers.FieldViewEnhancer(_this, _this.field.name);
                }
            });
            return this;
        }
    });
});
