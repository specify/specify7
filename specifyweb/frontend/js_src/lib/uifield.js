"use strict";

var _        = require('underscore');
var Q        = require('q');
var Backbone = require('./backbone.js');


var dataobjformatters = require('./dataobjformatters.js');
var fieldformat       = require('./fieldformat.js');
var { default: uiparse, addValidationAttributes, resolveParser} = require('./uiparse.ts');
const formsText = require('./localization/forms').default;

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
            this.destructors = [];
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

            var readOnly = !this.$el.hasClass('for-search-form') &&
                    (remote || field.isRelationship || field.readOnly || this.$el.prop('readonly'));

            var fieldName = this.fieldName = field.name.toLowerCase();

            var formatter = field.getUIFormatter();

            field.isRelationship && this.$el.removeClass('specify-field').addClass('specify-object-formatted');

            const parser = resolveParser(field, formatter ?? undefined);

            if(field.readOnly){
              this.el.readonly = true;
              this.el.tabIndex = -1;
            }
            else
                addValidationAttributes(
                    this.el,
                    field,
                    parser,
                );

            if(!readOnly){
              const changing = ()=>this.model.trigger('changing');
              this.el.addEventListener('input', changing);
              this.destructors.push(()=>
                this.el.removeEventListener('input', changing)
              );
            }

            const parserFunction = this.model.noValidation
                ? (value)=>({ isValid: true, value, parsed: value })
                : uiparse.bind(null, field, parser);

            const handleChange = ()=>this.inputChanged(parserFunction(this.el.value));
            this.el.addEventListener('change', handleChange);
            this.destructors.push(() =>
                this.el.removeEventListener('change', handleChange)
            );

            if (resource) {
                const fillItIn = ()=>{
                    const format = field.isRelationship ? objformat : _.bind(fieldformat, null, field);

                    resource.rget(fieldName).pipe(format).done((value)=>{
                        this.el.value = value ?? '';
                    });
                };

                fillItIn();
                resource.on('change:' + fieldName, fillItIn);
            }

            if (readOnly) return;

            if (!this.model.noValidation){
                this.model.saveBlockers?.linkInput(this.el, fieldName);
                this.destructors.push(()=>
                  this.model.saveBlockers?.unlinkInput(this.el, fieldName)
                );
            }

            if (this.model.isNew() && formatter && formatter.canAutonumber()) {
                const autoNumberValue = formatter.value();
                autoNumberValue && this.model.set(this.fieldName, autoNumberValue);
            }
            handleChange();

        },
        remove() {
            this.destructors.forEach(destructor=>destructor());
            Backbone.View.prototype.remove.call(this);
        },
        inputChanged: function(result) {
            console.log('parse result:', result);
            const key = `parseError:${this.fieldName}`;
            if(result.isValid){
              this.model.saveBlockers.remove(key);
              this.model.set(this.fieldName, result.parsed);
            }
            else
              this.model.saveBlockers.add(key, this.fieldName, result.reason);
        },
    });

