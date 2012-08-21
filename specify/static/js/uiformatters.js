define([
    'jquery', 'underscore',
    'text!resources/backstop/uiformatters.xml'
], function($, _, xml) {
    "use strict";
    var uiformatters =  $($.parseXML(xml));

    function UIFormatter(node) {
        this.node = $(node);
        this.system = this.node.attr('system') === 'true';
        this.name = this.node.attr('name');
        this.modelName = this.node.attr('class').split('.').pop();
        this.fieldName = this.node.attr('fieldname');
        this.isExternal = this.node.find('external').length > 0;
        if (this.isExternal) return;
        this.fields = _(this.node.find('field')).map(function(node) { return new Field(node); });
    }

    _(UIFormatter.prototype).extend({
        value: function() {
            return _(this.fields).pluck('value').join('');
        },
        regExp: function() {
            return '^' + _(this.fields).invoke('regExp').join('') + '$';
        },
        validate: function(str) {
            return RegExp(this.regExp()).test(str) && str;
        }
    });

    function Field(node) {
        this.node = $(node);
        this.type = this.node.attr('type');
        this.size = parseInt(this.node.attr('size'), 10);
        this.value = this.type === 'numeric' ? Array(this.size+1).join('#') : this.node.attr('value');
        this.inc = this.node.attr('inc') === 'true';
        this.byYear = this.node.attr('byyear') === 'true';
    }

    _(Field.prototype).extend({
        regExp: function() {
            switch (this.type) {
            case 'year':
            case 'numeric':
                return '\\d{0,' + this.size + '}';
                break;
            case 'alphanumeric':
                return '[a-zA-Z0-9]{0,' + this.size + '}';
                break;
            case 'separator':
                return escapeRegExp(this.value);
                break;
            default:
                throw new Error('unhandled uiformatter field type: ' + this.type);
            }
        }
    });

    var catalogNumberNumeric = {
        value: function() { return '#########'; },
        regExp: function() { return '^\\d{0,9}$'; },
        validate: function(str) {
            return RegExp(this.regExp()).test(str) && (Array(10-str.length).join('0') + str);
        }
    };

    function escapeRegExp(str) {
        return str.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    function getUIFormatter(name) {
        var node = uiformatters.find('[name="' + name + '"]');
        var formatter = node && new UIFormatter(node);
        if (formatter.isExternal && formatter.name === "CatalogNumberNumeric") {
            _(formatter).extend(catalogNumberNumeric);
        }
        return formatter;
    }

    return getUIFormatter;
});