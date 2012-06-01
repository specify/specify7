define([
    'jquery', 'underscore',
    'text!/static/resources/uiformatters.xml'
], function($, _, xml) {
    "use strict";
    var uiformatters;

    _($.parseXML(xml).find('format')).each(function(node) {
        var formatter = new UIFormatter(node);
        uiformatters[formatter.name] = formatter;
    });

    function UIFormatter(node) {
        this.node = $(node);
        this.system = this.node.attr('system') === 'true';
        this.name = this.node.attr('name');
        this.modelName = this.node.attr('class').split('.').pop();
        this.fieldName = this.node.attr('fieldname');

        this.fields = _.(node.find('field')).map(function(node) { return new Field(node); });
    }

    _(UIFormatter.prototype).extend({
        value: function() {
            return _(this.fields).pluck('value').join('');
        },
        regExp: function() {
            return _(this.fields).invoke('regExp').join('');
        },
        validate: function(str) {
            return RegExp(this.regExp()).test(str);
        }
    });

    function Field(node) {
        this.node = $(node);
        this.type = this.node.attr('type');
        this.size = parseInt(this.node.attr('size'), 10);
        this.value = this.node.attr('value');
        this.inc = this.node.attr('inc') === 'true';
        this.byYear = this.node.attr('byyear') === 'true';
    }

    _(Field.prototype).extend({
        regExp: function() {
            switch (this.type) {
            case 'year':
            case 'numeric':
                return '\d{' + this.size + '}';
                break;
            case 'alphanumeric':
                return '[a-zA-Z0-9]{' + this.size + '}';
                break;
            case 'separator':
                return escapeRegExp(this.value);
                break;
            default:
                throw new Error('unhandled uiformatter field type: ' + this.type);
            }
        }
    });

    function escapeRegExp(str) {
        return str.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    return uiformatters;
});