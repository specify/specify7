define(['underscore', 'latlongutils'], function(_, latlongutils) {
    return function() {
        module('latlongutils.parse');

        _.each({
            '34.123 N': [34.123],
            '36:07 N': [36, 7],
            '39:51:41 N': [39, 51, 41],
            '00.07152778 N': [0.07152778],
            '17:22.88 N': [17, 22.88],
            '39:51:41.02 N': [39, 51, 41.02],
            '-39:51:41': [-39, 51, 41],
            '39:51:41 s': [-39, 51, 41],
            '39:51.41 w': [-39, 51.41],
            '.34': [0.34],
            '-.34': [-0.34],
            '17:22.88 E': [17, 22.88],
            '28° N': [28],
            '28° 19\' N': [28, 19],
            '28° 19\' 0.121" N': [28, 19, 0.121],
            '115° 34\' 59.872" W': [-115, 34, 59.872],
            '': null,
            ' ': null,
            'foobar': null,
        }, function(value, key) {
            test(key, function() { deepEqual(latlongutils.parse(key), value); });
        });

        module('latlongutils.toDegs');

        _.each({
            '28° 19\' 0.121" N': [28.3167002778],
            '115° 34\' 59.872" W': [-115.5832977778],
        }, function(value, key) {
            test(key, function() {
                var result = latlongutils.toDegs(latlongutils.parse(key));
                equal(result.length, value.length);
                equal(Math.round(result.pop() * 1e9), Math.round(value.pop() * 1e9));
            });
        });

        module('latlongutils.toDegsMinsSecs');

        _.each({
            '28.3167002778': [28, 19, 0.121],
            '-115.5832977778': [-115, 34, 59.872],
            '28': [28, 0, 0],
            '-115.5': [-115, 30, 0],
            '-115.51': [-115, 30, 36],
        }, function(value, key) {
            test(key, function() {
                var result = latlongutils.toDegsMinsSecs([parseFloat(key)]);
                equal(result.length, value.length);
                while(result.length) {
                    equal(Math.round(result.pop() * 1e3), Math.round(value.pop() * 1e3));
                }
            });
        });

        module('latlongutils.toDegsMins');

        _.each({
            '28.5': [28, 30],
            '-115.25': [-115, 15],
        }, function(value, key) {
            test(key, function() {
                var result = latlongutils.toDegsMins([parseFloat(key)]);
                equal(result.length, value.length);
                while(result.length) {
                    equal(Math.round(result.pop() * 1e3), Math.round(value.pop() * 1e3));
                }
            });
        });

        module('latlongutils.format');

        _.each({
            '28° 19\' 0.121"': [28, 19, 0.121],
            '-115° 34\' 59.872"': [-115, 34, 59.872],
            '28° 19\'': [28, 19],
            '-115° 34.44\'': [-115, 34.44],
        }, function(value, key) {
            test(key, function() {
                equal(latlongutils.format(value), key);
            });
        });
    };
});