define(['underscore', 'latlongutils'], function(_, latlongutils) {
    return function() {
        module('latlongutils.parseLatLong');

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
        }, function(value, key) {
            test(key, function() { deepEqual(latlongutils.parseLatLong(key), value); });
        });
    };
});