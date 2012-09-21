define([
    'jquery', 'underscore', 'backbone',
    'text!context/app.resource?name=UIFormatters!noinline'
], function($, _, Backbone, xml) {
    "use strict";
    var uiformatters =  $($.parseXML(xml));

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
            'year': YearField,
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

    var NumericField = Field.extend({
        constructor: function(options) {
            options.value = Array(options.size+1).join('#');
            Field.call(this, options);
        },
        valueRegexp: function() {
            return '\\d{' + this.size + '}';
        }
    });

    var YearField = Field.extend({
        valueRegexp: function() {
            return '\\d{' + this.size + '}';
        }
    });

    var AlphaNumField = Field.extend({
        valueRegexp: function() {
            return '[a-zA-Z0-9]{' + this.size + '}';
        }
    });

    var SeparatorField = Field.extend({
        isWild: function() { return false; },
        valueRegexp: Field.prototype.wildRegexp
    });

    var CatalogNumberNumeric = UIFormatter.extend({
        constructor: function() {
            UIFormatter.call(this,  [
                new CatalogNumberNumeric.Field({ size: 9, inc: true })
            ]);
        }
    }, {
        Field: NumericField.extend({
            valueRegexp: function() {
                return '\\d{0,' + this.size + '}';
            },
            canonicalize: function(value) {
                return Array(this.size - value.length + 1).join('0') + value;
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

    return {
        getByName: getUIFormatter,
        UIFormatter: UIFormatter,
        Field: Field
    };
});
