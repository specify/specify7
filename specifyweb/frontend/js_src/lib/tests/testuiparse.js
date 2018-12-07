define(['underscore', 'uiparse'], function(_, uiparse) {
    "use strict";
    return function() {
        module('uiparse');

        test('isRequired', function() {
            var field = {
                type: 'java.lang.Integer',
                isRequired: true
            };
            var result = uiparse(field, '  ');
            equal(result.isValid, false);
            equal(result.reason, 'Field is required.');
        });

        test('not isRequired', function() {
            var field = {
                type: 'java.lang.Integer',
                isRequired: false
            };
            var result = uiparse(field, '  ');
            equal(result.isValid, true);
            equal(result.parsed, null);
        });

        test('required String empty', function() {
            var field = {
                type: 'java.lang.String',
                isRequired: true
            };
            var result = uiparse(field, '');
            equal(result.isValid, true);
            equal(result.parsed, '');
        });

        test('Boolean', function() {
            var field = {
                type: 'java.lang.Boolean',
                isRequired: true,
            };

            _({
                'true':  [true, true],
                'True':  [true, true],
                'TRUE':  [true, true],
                'yes':   [true, true],
                'false': [true, false],
                'no':    [true, false],
                'foo':   [false, null, 'Illegal value for Boolean: "foo".'],
                '':      [false, null, 'Field is required.']
            }).each(_.bind(checkIt, field));
        });

        test('Double', function() {
            var field = {
                type: 'java.lang.Double',
                isRequired: true
            };

            _({
                '100': [true, 100],
                '1.5': [true, 1.5],
                '-32e4': [true, -320000],
                'foo': [false, undefined, 'Not a valid number.']
            }).each(_.bind(checkIt, field));
        });

        test('Integer', function() {
            var field = {
                type: 'java.lang.Integer',
                isRequired: true,
            };

            _({
                '100': [true, 100],
                '-34': [true, -34],
                '012': [true, 12],
                '1.4': [true, 1],
                'foo': [false, undefined, "Not a valid integer."]
            }).each(_.bind(checkIt, field));
        });

        test('String', function() {
            var field = {
                type: 'java.lang.String',
                isRequired: true,
                length: 3
            };

            _({
                '': [true, ''],
                '  ': [true, '  '],
                'OK': [true, 'OK'],
                'foo': [true, 'foo'],
                '123': [true, '123'],
                'foobar': [false, undefined, 'Value cannot be longer than 3.']
            }).each(_.bind(checkIt, field));
        });

        function checkIt(expected, value) {
            var result = uiparse(this, value);
            equal(result.isValid, expected[0]);
            !_.isUndefined(expected[1]) && equal(result.parsed, expected[1]);
            !expected[0] && equal(result.reason, expected[2]);
        }
    };
});
