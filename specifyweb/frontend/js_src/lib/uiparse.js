"use strict";

var $      = require('jquery');
var _      = require('underscore');
var moment = require('moment');

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
                result.reason = 'Illegal value for Boolean: "' + value + '".';
                break;
            }
            return result;
        },

        "java.lang.Byte": function(field, value) {
            var result = (parsers["java.lang.Integer"])(field, value);

            if (result.isValid && result.parsed < 0 || result > 255) {
                result.isValid = false;
                result.reason = "Value must be between 0 and 255";
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
                result.reason = "Not a valid number.";
            }
            return result;
        },

        "java.lang.Float": function(field, value) {
            return (parsers["java.lang.Double"])(field, value);
        },

        "java.lang.Integer": function(field, value) {
            var result = {
                isValid: true,
                value: value,
                parsed: parseInt(value, 10)
            };

            if(_(result.parsed).isNaN()) {
                result.isValid = false;
                result.reason = "Not a valid integer.";
            }
            return result;
        },

        "java.lang.Long": function(field, value) {
            return (parsers["java.lang.Integer"])(field, value);
        },

        "java.lang.Short": function(field, value) {
            var result = (parsers["java.lang.Integer"])(field, value);

            if (result.isValid && result.parsed < -1<<15 || result.parsed >= 1<<15) {
                result.isValid = false;
                result.reason = "Value must be between " + (-1<<15) + " and " + (1<<15 - 1) + ".";
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
                result.reason = "Value cannot be longer than " + field.length + ".";
            }
            return result;
        },

        "java.math.BigDecimal": function(field, value) {
            return (parsers["java.lang.Double"])(field, value);
        },

        "java.sql.Timestamp": function(field, value) {
            var parsed = moment(value, dateFormatStr, true);
            if (!parsed.isValid()) {
                return {
                    isValid: false,
                    value: value,
                    parsed: null,
                    reason: "Required Format: " + dateFormatStr
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
                reason: "Field is required."
            } : {
                value: value,
                isValid: true,
                parsed: null
            };

        var parser = parsers[field.type];
        return parser ? parser(field, value) : {
            value: value,
            isValid: false,
            reason: "No parser for type " + field.type
        };
    };


