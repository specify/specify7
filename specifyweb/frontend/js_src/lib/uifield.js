"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Q        = require('q');
var Backbone = require('./backbone.js');


var dataobjformatters = require('./dataobjformatters.js');
var fieldformat       = require('./fieldformat.js');
var uiparse           = require('./uiparse.js');
var UIFieldInput      = require('./uiinputfield.js');
var saveblockers      = require('./saveblockers.js');
var ToolTipMgr        = require('./tooltipmgr.js');
var dateFormatStr     = require('./dateformat.js');

    var objformat = dataobjformatters.format;

module.exports =  Backbone.View.extend({
        __name__: "UIField",
        render: function() {
            var fieldName = this.$el.attr('name');
            if (!fieldName) {
                console.error("missing field name", this.el);
                return this;
            }
            Q(this.model.getResourceAndField(fieldName))
                .spread(this._render.bind(this))
                .done();
            return this;
        },
        _render: function(resource, field) {
            if (!field) {
                console.error('unknown field', this.$el.attr('name'), 'in', this.model, 'element:', this.$el);
                return;
            }
            if (!resource) {
                // actually this probably shouldn't be an error. it can
                // happen, for instance, in the collectors list if
                // the collector has not been defined yet.
                console.error("resource doesn't exist");
                return;
            }
            var remote = _.isNull(resource) || resource != this.model;

            var readOnly = remote || field.isRelationship || field.readOnly || this.$el.prop('readonly');

            var fieldName = this.fieldName = field.name.toLowerCase();

            var formatter = field.getUIFormatter();

            field.isRelationship && this.$el.removeClass('specify-field').addClass('specify-object-formatted');
            field.isRequired && this.$el.addClass('specify-required-field');

            var inputUI = new UIFieldInput({
                el: this.el,
                readOnly: readOnly,
                noValidation: this.model.noValidation,
                formatter: formatter,
                parser: uiparse.bind(null, field)
            }).render()
                    .on('changed', this.inputChanged, this)
                    .on('changing', this.inputChanging, this)
                    .on('addsaveblocker', this.addSaveBlocker, this)
                    .on('removesaveblocker', this.removeSaveBlocker, this);

            if (resource.isNew() && this.$el.val()) {
                console.log('setting default value', this.$el.val(), 'into', field);
                inputUI.fillIn(this.$el.val()).change();
            }

            if (resource) {
                var fillItIn = function() {
                    var format = field.isRelationship ? objformat : _.bind(fieldformat, null, field);

                    resource.rget(fieldName).pipe(format).done(function(value) {
                        inputUI.fillIn(value);
                    });
                };

                fillItIn();
                resource.on('change:' + fieldName, fillItIn);
            }

            if (readOnly) return;

            if (!this.model.noValidation) {
                this.toolTipMgr = new ToolTipMgr(this).enable();
                this.saveblockerEnhancement = new saveblockers.FieldViewEnhancer(this, fieldName);
            }

            if (this.model.isNew()) {
                var autoNumberValue = formatter && formatter.canAutonumber() && formatter.value();
                autoNumberValue && this.model.set(this.fieldName, autoNumberValue);

                inputUI.validate(true); // validate any default value and defer result
            }
        },
        inputChanged: function(value) {
            this.model.set(this.fieldName, value);
        },
        inputChanging: function() {
            this.model.trigger('changing');
        },
        addSaveBlocker: function(key, message, deferred) {
            this.model.saveBlockers.add(key + ':' + this.fieldName, this.fieldName, message, deferred);
        },
        removeSaveBlocker: function(key) {
            this.model.saveBlockers.remove(key + ':' + this.fieldName);
        }
    });

