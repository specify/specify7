define([
    'jquery', 'underscore', 'backbone',
    'text!context/app.resource?name=UIFormatters!noinline'
], function($, _, Backbone, xml) {
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
        this.fields = _(this.node.find('field')).map(Field.forNode);
    }
    UIFormatter.extend = Backbone.Model.extend;
    _(UIFormatter.prototype).extend({
        value: function() {
            return _(this.fields).pluck('value').join('');
        },
        parseRegexp: function() {
            return '^' + _(this.fields).map(function(field) {
                return '(' + field.wildOrValueRegexp() + ')';
            }).join('') + '$';
        },
        parse: function(value) {
            var match = RegExp(this.parseRegexp()).exec(value);
            match && match.shift();
            return match;
        },
        needsAutoNumber: function(values) {
            return _.any(this.fields, function(field, i) {
                return field.isWild(values[i]);
            });
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
    Field.extend = Backbone.Model.extend;
    _.extend(Field.prototype, {
        canAutonumber: function() {
            return this.inc || this.byYear;
        },
        wildRegexp: function() {
            return escapeRegExp(this.value);
        },
        isWild: function(value) {
            return RegExp(this.wildRegexp()).test(value) &&
                !RegExp(this.valueRegexp()).test(value);
        },
        wildOrValueRegexp: function() {
            return this.canAutonumber() ? this.wildRegexp() + '|' + this.valueRegexp()
                : this.valueRegexp();
        }
    });
    Field.forNode = function(node) {
        return new ({
            'year': YearField,
            'numeric': NumericField,
            'alphanumeric': AlphaNumField,
            'separator': SeparatorField
        }[$(node).attr('type')])(node);
    };

    var NumericField = Field.extend({
        constructor: function(node) {
            Field.call(this, node);
            this.value = Array(this.size+1).join('#');
        },
        valueRegexp: function() {
            return '\\d{0,' + this.size + '}';
        }
    });

    var YearField = Field.extend({
        valueRegexp: function() {
            return '\\d{0,' + this.size + '}';
        }
    });

    var AlphaNumField = Field.extend({
        valueRegexp: function() {
            return '[a-zA-Z0-9]{0,' + this.size + '}';
        }
    });

    var SeparatorField = Field.extend({
        isWild: function() { return false; },
        valueRegexp: Field.prototype.wildRegexp
    });


    var CatalogNumberNumeric = UIFormatter.extend({
        constructor: function(node) {
            UIFormatter.call(this, node);
            this.fields = [new CatalogNumberNumeric.Field()];
        }
    });
    CatalogNumberNumeric.Field = NumericField.extend({
        constructor: function() {
            this.type = 'numeric';
            this.size = 9;
            this.value = Array(this.size+1).join('#');
            this.inc = true;
            this.byYear = false;
        }
    });

    function escapeRegExp(str) {
        return str.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    function getUIFormatter(name) {
        var node = uiformatters.find('[name="' + name + '"]');
        var formatter = node && new UIFormatter(node);
        if (formatter.isExternal && formatter.name === "CatalogNumberNumeric") {
           return new CatalogNumberNumeric(node);
        }
        return formatter;
    }

    return {
        getByName: getUIFormatter,
        UIFormatter: UIFormatter,
        Field: Field };
});
