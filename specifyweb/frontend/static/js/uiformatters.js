"use strict";

var $              = require('jquery');
var _              = require('underscore');
var Backbone       = require('./backbone.js');
var initialContext = require('./initialcontext.js');


    var uiformatters;
    initialContext.load('app.resource?name=UIFormatters', data => uiformatters = $(data));

    function UIFormatter(fields) {
        this.fields = fields;
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
        canAutonumber: function() {
            return _.any(_.invoke(this.fields, 'canAutonumber'));
        },
        needsAutoNumber: function(values) {
            return _.any(this.fields, function(field, i) {
                return field.isWild(values[i]);
            });
        },
        canonicalize: function(values) {
            return _.map(this.fields, function(field, i) {
                    return field.canonicalize(values[i]);
            }).join('');
        }
    });

    function Field(options) {
        this.size = options.size;
        this.value = options.value;
        this.inc = options.inc;
        this.byYear = options.byYear;
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
        },
        canonicalize: _.identity
    });
    Field.forNode = function(node) {
        node = $(node);
        return new ({
            'constant': ConstantField,
            'year': YearField,
            'alpha': AlphaField,
            'numeric': NumericField,
            'alphanumeric': AlphaNumField,
            'separator': SeparatorField
        }[node.attr('type')])({
            size: parseInt(node.attr('size'), 10),
            value: node.attr('value'),
            inc: node.attr('inc') === 'true',
            byYear: node.attr('byyear') === 'true'
        });
    };

    var ConstantField = Field.extend({
        __name__: "ConstantField",
        isWild: function() { return false; },
        valueRegexp: Field.prototype.wildRegexp
    });

    var AlphaField = Field.extend({
        __name__: "AlphaField",
        valueRegexp: function() {
            return '[a-zA-Z]{' + this.size + '}';
        }
    });

    var NumericField = Field.extend({
        __name__: "NumericField",
        constructor: function(options) {
            options.value = Array(options.size+1).join('#');
            Field.call(this, options);
        },
        valueRegexp: function() {
            return '\\d{' + this.size + '}';
        }
    });

    var YearField = Field.extend({
        __name__: "YearField",
        valueRegexp: function() {
            return '\\d{' + this.size + '}';
        }
    });

    var AlphaNumField = Field.extend({
        __name__: "AlphaNumField",
        valueRegexp: function() {
            return '[a-zA-Z0-9]{' + this.size + '}';
        }
    });

    var SeparatorField = ConstantField.extend({
        __name__: "SeparatorField"
    });

    var CatalogNumberNumeric = UIFormatter.extend({
        __name__: "CatalogNumberNumeric",
        constructor: function() {
            UIFormatter.call(this,  [
                new CatalogNumberNumeric.Field({ size: 9, inc: true })
            ]);
        }
    }, {
        Field: NumericField.extend({
            __name__: "CatalogNumberNumericField",
            valueRegexp: function() {
                return '\\d{0,' + this.size + '}';
            },
            canonicalize: function(value) {
                return value === "" ? "" : Array(this.size - value.length + 1).join('0') + value;
            }
        }
    )});


    function escapeRegExp(str) {
        return str.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    function getUIFormatter(name) {
        var node = $(uiformatters.find('[name="' + name + '"]'));
        if (!node) return null;
        var external = node.find('external');
        if (external.length) {
            switch ($(external).text().split('.').pop()) {
            case 'CatalogNumberUIFieldFormatter':
                return new CatalogNumberNumeric();
            default:
                return null;
            }
        } else {
            return new UIFormatter(
                _(node.find('field')).map(Field.forNode));
        }
    }

module.exports = {
        getByName: getUIFormatter,
        UIFormatter: UIFormatter,
        Field: Field
    };

