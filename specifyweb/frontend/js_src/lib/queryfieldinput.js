"use strict";

import _ from 'underscore';
import Backbone from './backbone';


import fieldformat from './fieldformat';
import uiparse, {addValidationAttributes, resolveParser} from './uiparse';
import SaveBlockers from './saveblockers';
import queryText from './localization/query';
import commonText from './localization/common';
import {formatList} from "./components/internationalization";

var FieldInputUI = Backbone.View.extend({
        __name__: "FieldInputUI",
        opName: 'NA',
        format: false,
        input: `<input
            type="text"
            title="${commonText('searchQuery')}"
            aria-label="${commonText('searchQuery')}"
        >`,
        initialize: function(options) {
            const isDatePart = typeof options.datePart !== 'undefined';
            this.inputFormatter = (isDatePart || options.isTreeField) ? null :
                options.field.getUIFormatter();
            this.outputFormatter = (isDatePart || options.isTreeField) ? null :
                function(value) { return fieldformat(options.field, value); };
            this.field = options.isTreeField
              ? {type: 'java.lang.String'}
              : {
                ...options.field,
                datePart: options.datePart,
              };
            this.values = [];
            this.destructors = [];

            // A dummy model to keep track of invalid values;
            this.model = new Backbone.Model();
            this.model.saveBlockers = new SaveBlockers(this.model);
        },
        getValue: function() {
            return this.values[0];
        },
        setValue: function(value) {
            this.updateValues([value]);
        },
        updateValues: function(values) {
            this.values = this.format && this.outputFormatter ? _.map(values, this.outputFormatter) : values;
            this.renderValues();
        },
        renderValues: function() {
            this.inputs.forEach((input, index)=>{
                input.value = this.values[index];
            });
        },
        render: function() {
            this.el.innerHTML = `<button class="field-operation link">
                ${this.opName}
            </button>
            ${this.input}`;
            this.inputs = Array.from(this.el.getElementsByTagName('input'));
            this.inputs.forEach((input,index)=>this.addUIFieldInput(input, index));
            return this;
        },
        addUIFieldInput: function(el, i) {

            this.parser = resolveParser(
                this.field,
                  this.inputFormatter ?? undefined
            );
            this.parser = this.parserMutator?.(this.parser) ?? this.parser;
            addValidationAttributes(el, this.field, this.parser);

            const parser = uiparse.bind(undefined, this.field, this.parser, el);
            this.handleChange = ()=>{
                const results = this.listInput
                  ? el.value.split(',').map(parser)
                  : [parser(el.value)];
                this.inputChanged(i,results)
            };
            el.addEventListener('change', this.handleChange);
            this.destructors.push(() =>
                el.removeEventListener('change', this.handleChange)
            );

            this.model.saveBlockers?.linkInput(el, this.cid + '-' + i);
            this.destructors.push(()=>this.model.saveBlockers?.unlinkInput(el));
        },
        remove() {
            this.destructors.forEach(destructor=>destructor());
            Backbone.View.prototype.remove.call(this);
        },
        inputChanged(idx, results) {
            console.log('parse result:', results);

            const invalidResults = results.filter(({isValid})=>!isValid);
            const fieldName = `${this.cid}-${idx}`;
            const key = `parseError:${fieldName}`;

            this.model.saveBlockers.remove(key);
            invalidResults.forEach((result)=>
                this.model.saveBlockers.add(key, fieldName, result.reason)
            );

            if(invalidResults.length === 0){
                this.afterValidChange(idx, results);
                this.trigger('changed', this, this.getValue());
            }
        },
        afterValidChange(idx, results){
            this.values[idx] = results[0].parsed;
        }
    });

    var Between = {
        opName: 'Between', negation: 'Not Between', types: ['strings', 'dates', 'numbers', 'catnos'],
        input: `<input
            type="text"
            autocomplete="on"
            title="${queryText('startValue')}"
            aria-label="${queryText('startValue')}"
        > and <input
            type="text"
            autocomplete="on"
            title="${queryText('endValue')}"
            aria-label="${queryText('endValue')}"
        >`, format: true,
        getValue: function() {
            return this.values.join(',');
        },
        setValue: function(value) {
            this.updateValues(value.split(','));
        }
    };

    var In = {
        events: {
            'keydown input': 'keydown'
        },
        opName: 'In', negation: 'Not In', types: ['strings', 'numbers', 'catnos'], listInput: true,
        input: `<label>
            <span class="in-values">${queryText('addValuesHint')}</span>
            <input type="text" autocomplete="on">
        </label>`, format: true,
        getValue: function() {
            return this.values.join(',');
        },
        setValue: function(value) {
            this.updateValues(value.split(','));
        },
        parserMutator(parser){
            if(typeof parser?.pattern === 'object'){
                // If a pattern is set, modify it to allow for comma separators
                const pattern = parser.pattern.toString().replaceAll(/^\/\^\(?|\)?\$\/$/g,'');
                // Pattern with whitespace
                const escaped = `\\s*(?:${pattern})\\s*`;
                return {
                    ...parser,
                    pattern: RegExp(
                      `|${escaped}(?:,${escaped})*`
                    )
                }
            }
            else return parser;
        },
        afterValidChange: function(idx, results) {
            this.$('input').val('');
            this.values = Array.from(new Set([
                ...this.values,
                ...results
                    .filter(result=>result.parsed !== null)
                    .map(result=>
                        this.outputFormatter?.(result.parsed) ?? result.parsed
                    )
            ]));
            this.updateValues(this.values);
        },
        renderValues: function() {
            var text = this.values.length ? formatList(this.values) : queryText('addValuesHint');
            this.$('.in-values').text(text);
        },
        keydown: function(event) {
            if (event.keyCode != 8 || this.$('input').val() != "" || this.values.length == 0) return;
            event.preventDefault();
            this.inputs[0].value = this.values.pop();
            this.handleChange();
            this.updateValues(this.values);
        }
    };

var Contains = {
    opName: 'Contains',
    negation: "Doesn't Contain",
    types: ['strings', 'catnos'],
    addUIFieldInput: function(el, i) {
        const handleChange = ()=>{
                const parser = uiparse.bind(undefined, {type: 'java.lang.String'}, el);
                const results = this.listInput
                  ? el.value.split(',').map(parser)
                  : [parser(el.value)];
                this.inputChanged(i,results)
            };
        el.addEventListener('change', handleChange);
        this.destructors.push(() =>
            el.removeEventListener('change', handleChange)
        );
    }
};

var Like = {
    opName: 'Like',
    negation: 'Not Like',
    types: ['strings', 'catnos'],
    addUIFieldInput: function(el, i) {
         const handleChange = ()=>{
                const parser = uiparse.bind(undefined, {type: 'java.lang.String'}, el);
                const results = this.listInput
                  ? el.value.split(',').map(parser)
                  : [parser(el.value)];
                this.inputChanged(i,results)
            };
        el.addEventListener('change', handleChange);
        this.destructors.push(() =>
            el.removeEventListener('change', handleChange)
        );
    }
};

    var opInfo = [
        Like,
        {opName: '=', negation: '≠', types: ['strings', 'numbers', 'dates', 'catnos'], format: true},
        {opName: '>', negation: '≯', types: ['numbers', 'dates', 'catnos'], format: true},
        {opName: '<', negation: '≮', types: ['numbers', 'dates', 'catnos'], format: true},
        {opName: '≥', negation: '≱', types: ['numbers', 'catnos'], format: true},
        {opName: '≤', negation: '≰', types: ['numbers', 'catnos'], format: true},
        {opName: 'True', negation: 'Not True', types: ['bools'], input: null},
        {opName: 'False', negation: 'Not False', types: ['bools'], input: null},
        {opName: 'Does not matter', types: ['bools'], input: null},
        Between,
        In,
        Contains,
        {opName: 'Empty', negation: 'Not Empty', types: ['strings', 'bools', 'dates', 'numbers', 'catnos'], input: null},
        {opName: 'True or Null', negation: 'False', types: ['bools'], input: null},
        {opName: 'False or Null', negation: 'True', types: ['bools'], input: null}
    ];

export default _.map(opInfo, function(extras, i) {
        var options = _.extend({ __name__: "OpFieldInputUI", index: i }, extras);
        return FieldInputUI.extend(options);
    });

