define(['underscore', 'latlongutils'], function(_, latlongutils) {
    return function() {
        module('latlongutils.parse');
        var parse = latlongutils.parse;

        _.each({
            '34.123 N': [34.123, latlongutils.Lat],
            '36:07 N': [36, 7, latlongutils.Lat],
            '39:51:41 N': [39, 51, 41, latlongutils.Lat],
            '00.07152778 N': [0.07152778, latlongutils.Lat],
            '17:22.88 N': [17, 22.88, latlongutils.Lat],
            '39:51:41.02 N': [39, 51, 41.02, latlongutils.Lat],
            '-39:51:41': [-39, 51, 41, latlongutils.Coord],
            '39:51:41 s': [-39, 51, 41, latlongutils.Lat],
            '39:51.41 w': [-39, 51.41, latlongutils.Long],
            '.34': [0.34, latlongutils.Coord],
            '-.34': [-0.34, latlongutils.Coord],
            '17:22.88 E': [17, 22.88, latlongutils.Long],
            '28° N': [28, latlongutils.Lat],
            '28° 19\' N': [28, 19, latlongutils.Lat],
            '28° 19\' 0.121" N': [28, 19, 0.121, latlongutils.Lat],
            '115° 34\' 59.872" W': [-115, 34, 59.872, latlongutils.Long],
            '': null,
            ' ': null,
            'foobar': null,
            '180:00:01': null,
            '-90:05 S': null
        }, function(value, key) {
            var type = value && value.pop();
            test(key + ' is ' + (type && type.name), function() {
                var result = latlongutils.parse(key);
                if (_.isNull(value)) {
                    equal(result, null);
                    return;
                }
                ok(result instanceof type);
                deepEqual(result._components, value);
            });
        });

        module('latlongutils.toDegs');

        _.each({
            '28° 19\' 0.121" N': [28.3167002778],
            '115° 34\' 59.872" W': [-115.5832977778],
        }, function(value, key) {
            test(key, function() {
                var result = latlongutils.parse(key).toDegs()._components;
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
                var coord = new latlongutils.Coord(parseFloat(key));
                var result = coord.toDegsMinsSecs()._components;
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
                var coord = new latlongutils.Coord(parseFloat(key));
                var result = coord.toDegsMins()._components;
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
                var coord = new latlongutils.Coord();
                coord._components = value;
                equal(coord.format(), key);
            });
        });

        _.each({
            '28° 30\' 36" N': new latlongutils.Lat(28.51),
            '115° 30\' 36" W': new latlongutils.Long(-115.51),
            '28° 30\' 36" S': new latlongutils.Lat(-28.51),
            '115° 30\' 36" E': new latlongutils.Long(115.51),
            '28° 30\' 36"': new latlongutils.Coord(28.51),
            '-115° 30\' 36"': new latlongutils.Coord(-115.51),
        }, function(value, key) {
            test(key, function() {
                equal(value.toDegsMinsSecs().format(), key);
            });
        });

        module('latlongutil.*.parse');
        _.each({
            '34.123 N': [34.123, 'Lat'],
            '36:07 N': [36, 7, 'Lat'],
            '39:51:41 N': [39, 51, 41, 'Lat'],
            '00.07152778 N': [0.07152778, 'Lat'],
            '17:22.88 N': [17, 22.88, 'Lat'],
            '39:51:41.02 N': [39, 51, 41.02, 'Lat'],
            '-39:51:41': [-39, 51, 41, 'Coord'],
            '39:51:41 s': [-39, 51, 41, 'Lat'],
            '39:51.41 w': [-39, 51.41, 'Long'],
            '.34': [0.34, 'Coord'],
            '-.34': [-0.34, 'Coord'],
            '17:22.88 E': [17, 22.88, 'Long'],
            '28° N': [28, 'Lat'],
            '28° 19\' N': [28, 19, 'Lat'],
            '28° 19\' 0.121" N': [28, 19, 0.121, 'Lat'],
            '115° 34\' 59.872" W': [-115, 34, 59.872, 'Long'],
            '': null,
            ' ': null,
            'foobar': null,
        }, function(value, key) {
            var giventype = value && value.pop();
            _(['Coord', 'Lat', 'Long']).each(function(type) {
                test(key + ' as ' + type, function() {
                    var result = latlongutils[type].parse(key);
                    if (_.isNull(value)) {
                        equal(result, null);
                    } else if (type === 'Coord' ||
                               giventype === 'Coord' ||
                               giventype === type) {
                        deepEqual(result._components, value);
                    } else {
                        equal(result, null);
                    }
                });
            });
        });

        _.each({
            '124:34:23 N': null,
            '124:34:23': 'Long',
            '200:34': null,
            '15:75': null,
            '-124:34:23 N': null,
            '-124:34:23': 'Long',
            '-200.34': null,
            '-15:75': null,
            '90.01 N': null,
            '90.1': 'Long',
            '90:01 N': null,
            '90:00:01': 'Long'
        }, function(value, key) {
            _([null, 'Coord', 'Lat', 'Long']).each(function(type) {
                test(key + ' as ' + type, function() {
                    var result = type ? latlongutils[type].parse(key) : latlongutils.parse(key);
                    if (_.isNull(value) || type === 'Lat') {
                        equal(result, null);
                        return;
                    }
                    ok(result instanceof latlongutils[value]);
                });
            });
        });
    };
});