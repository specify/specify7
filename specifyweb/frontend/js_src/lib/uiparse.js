"use strict";

var $      = require('jquery');
var _      = require('underscore');
var moment = require('moment');
const formsText = require('./localization/forms').default;

var dateFormatStr = require('./dateformat.js');

    var parsers = {
        "java.lang.Boolean": function(field, value) {
            var result = {value: value, isValid: false};
            switch(value.toLowerCase()) {
            case 'true':
            case 'yes':
                result.parsed = true;
                result.isValid = true;
                break;
            case 'false':
            case 'no':
                result.parsed = false;
                result.isValid = true;
                break;
            default:
                result.isValid = false;
                result.reason = formsText('illegalBool')(value);
                break;
            }
            return result;
        },

        "java.lang.Byte": function(field, value) {
            var result = (parsers["java.lang.Integer"])(field, value);

            if (result.isValid && result.parsed < 0 || result > 255) {
                result.isValid = false;
                result.reason = formsText('outOfRange')(0,255);
            }
            return result;
        },

        "java.lang.Double": function(field, value) {
            var result = {
                isValid: true,
                value: value,
                parsed: parseFloat(value)
            };

            if (_(result.parsed).isNaN()) {
                result.isValid = false;
                result.reason = formsText('notNumber');
            }
            return result;
        },

        "java.lang.Float": function(field, value) {
            return (parsers["java.lang.Double"])(field, value);
        },

        "java.lang.Long": function(field, value) {
            var result = {
                isValid: true,
                value: value,
                parsed: parseInt(value, 10)
            };

            if(_(result.parsed).isNaN()) {
                result.isValid = false;
                result.reason = formsText('notInteger');
            } else if (!Number.isSafeInteger(result.parsed)) {
                result.isValid = false;
                result.reason = formsText('outOfRange')(Number.MIN_SAFE_INTEGER,Number.MAX_SAFE_INTEGER);
            }
            return result;
        },

        "java.lang.Integer": function(field, value) {
            const result = (parsers["java.lang.Long"])(field, value);

            const minInteger = -Math.pow(2,31);
            const maxInteger = Math.pow(2,31);
            if (result.isValid && result.parsed < minInteger || result.parsed >= maxInteger) {
                result.isValid = false;
                result.reason = formsText('outOfRange')(minInteger,maxInteger);
            }
            return result;
        },

        "java.lang.Short": function(field, value) {
            var result = (parsers["java.lang.Integer"])(field, value);

            const minInteger = -1<<15;
            const maxInteger = 1<<15;
            if (result.isValid && result.parsed < minInteger || maxInteger) {
                result.isValid = false;
                result.reason = formsText('outOfRange')(minInteger,maxInteger);
            }
            return result;
        },

        "java.lang.String": function(field, value) {
            var result = {
                value: value,
                parsed: value,
                isValid: true
            };

            if (field.length && field.length < result.parsed.length) {
                result.isValid = false;
                result.reason = formsText('lengthOverflow')(field.length);
            }
            return result;
        },

        "java.math.BigDecimal": function(field, value) {
            return (parsers["java.lang.Double"])(field, value);
        },

        "java.sql.Timestamp": function(field, value) {
            var parsed = ("" + value).toLowerCase() === "today" ?
                moment() :
                moment(value, dateFormatStr(), true);
            if (!parsed.isValid()) {
                return {
                    isValid: false,
                    value: value,
                    parsed: null,
                    reason: formsText('requiredFormat')(dateFormatStr()),
                };
            } else {
                return {
                    isValid: true,
                    value: value,
                    parsed: parsed.format('YYYY-MM-DD')
                };
            }
        },

        "java.util.Calendar": function(field, value) {
            return (parsers["java.sql.Timestamp"])(field, value);
        },

        "java.util.Date": function(field, value) {
            return (parsers["java.sql.Timestamp"])(field, value);
        },

        "text": function(field, value) {
            return (parsers["java.lang.String"])(field, value);
        }
    };

    var stringLike = _.bind(_.contains, _, ['java.lang.String', 'text']);

module.exports = function(field, value) {
        if (value.trim() === '' && !stringLike(field.type))
            return field.isRequired ? {
                value: value,
                isValid: false,
                reason: formsText('requiredField')
            } : {
                value: value,
                isValid: true,
                parsed: null
            };

        var parser = parsers[field.type];
        return parser ? parser(field, value) : {
            value: value,
            isValid: false,
            reason: formsText('noParser')(field.type),
        };
    };


