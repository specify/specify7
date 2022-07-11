import _ from 'underscore';

import QUnit from 'qunit';
import * as latlongutils from '../latlongutils';

const assert = QUnit.assert;

export function testLatLongUtils() {
    QUnit.module('latlongutils.parse');
    var parse = latlongutils.Coord.parse;

    _.each({
        '34.123 N': [1, 34.123, latlongutils.Lat],
        '36:07 N': [1, 36, 7, latlongutils.Lat],
        '39:51:41 N': [1, 39, 51, 41, latlongutils.Lat],
        '00.07152778 N': [1, 0.07152778, latlongutils.Lat],
        '17:22.88 N': [1, 17, 22.88, latlongutils.Lat],
        '39:51:41.02 N': [1, 39, 51, 41.02, latlongutils.Lat],
        '-39:51:41': [-1, 39, 51, 41, latlongutils.Coord],
        '39:51:41 s': [-1, 39, 51, 41, latlongutils.Lat],
        '39:51.41 w': [-1, 39, 51.41, latlongutils.Long],
        '.34': [1, 0.34, latlongutils.Coord],
        '-.34': [-1, 0.34, latlongutils.Coord],
        '17:22.88 E': [1, 17, 22.88, latlongutils.Long],
        '28° N': [1, 28, latlongutils.Lat],
        '28° 19\' N': [1, 28, 19, latlongutils.Lat],
        '28° 19\' 0.121" N': [1, 28, 19, 0.121, latlongutils.Lat],
        '115° 34\' 59.872" W': [-1, 115, 34, 59.872, latlongutils.Long],
        '1 01 S': [-1, 1, 1, latlongutils.Lat],
        '1 01 W': [-1, 1, 1, latlongutils.Long],
        '0 01 S': [-1, 0, 1, latlongutils.Lat],
        '0 01 W': [-1, 0, 1, latlongutils.Long],
        '0': [1, 0, latlongutils.Coord],
        '0 58 0': [1,0,58,0, latlongutils.Coord],
        '-0 58 0': [-1,0,58,0, latlongutils.Coord],
        '': undefined,
        ' ': undefined,
        'foobar': undefined,
        '180:00:01': undefined,
        '-90:05 S': undefined
    }, function(value, key) {
        var type = value && value.pop();
        QUnit.test(key + ' is ' + (type && type.name), function() {
            var result = parse(key);
            if (value === undefined) {
                assert.equal(result, undefined);
                return;
            }
            assert.notEqual(result, undefined);
            assert.ok(result instanceof type);
            assert.deepEqual([result.sign, ...result.components], value);
        });
    });

    QUnit.module('latlongutils.toDegs');

    _.each({
        '28° 19\' 0.121" N': [1, 28.3167002778],
        '115° 34\' 59.872" W': [-1, 115.5832977778],
        '0': [1, 0],
    }, function(value, key) {
        QUnit.test(key, function() {
            var result = parse(key).toDegs();
            assert.equal(result.components.length, value.length - 1);
            assert.equal(result.sign, value[0]);
            assert.equal(Math.round(result.components.pop() * 1e9), Math.round(value.pop() * 1e9));
        });
    });

    QUnit.module('latlongutils.toDegsMinsSecs');

    _.each({
        '28.3167002778': [1, 28, 19, 0.121],
        '-115.5832977778': [-1, 115, 34, 59.872],
        '28': [1, 28, 0, 0],
        '-115.5': [-1, 115, 30, 0],
        '-115.51': [-1, 115, 30, 36],
    }, function(value, key) {
        QUnit.test(key, function() {
            var coord = new latlongutils.Coord(parseFloat(key));
            var result = coord.toDegsMinsSecs();
            assert.equal(result.components.length, value.length - 1);
            assert.equal(result.sign, value[0]);
            while(result.length) {
                assert.equal(Math.round(result.pop() * 1e3), Math.round(value.pop() * 1e3));
            }
        });
    });

    QUnit.module('latlongutils.toDegsMins');

    _.each({
        '28.5': [1, 28, 30],
        '-115.25': [-1, 115, 15],
    }, function(value, key) {
        QUnit.test(key, function() {
            var coord = new latlongutils.Coord(parseFloat(key));
            var result = coord.toDegsMins();
            assert.equal(result.components.length, value.length - 1);
            assert.equal(result.sign, value[0]);
            while(result.length) {
                assert.equal(Math.round(result.pop() * 1e3), Math.round(value.pop() * 1e3));
            }
        });
    });

    QUnit.module('latlongutils.format');

    _.each({
        '28° 19\' 0.121"': [1, 28, 19, 0.121],
        '-115° 34\' 59.872"': [-1, 115, 34, 59.872],
        '28° 19\'': [1, 28, 19],
        '-115° 34.44\'': [-1, 115, 34.44],
        '-1° 1\'': [-1, 1, 1],
        '-0° 1\'': [-1, 0, 1],
    }, function(value, key) {
        QUnit.test(key, function() {
            var coord = new latlongutils.Coord();
            coord.sign = value.shift();
            coord.components = value;
            assert.equal(coord.format(), key);
        });
    });

    _.each({
        '28° 30\' 36" N': new latlongutils.Lat(28.51),
        '115° 30\' 36" W': new latlongutils.Long(-115.51),
        '0° 30\' 36" W': new latlongutils.Long(-0.51),
        '28° 30\' 36" S': new latlongutils.Lat(-28.51),
        '0° 30\' 36" S': new latlongutils.Lat(-0.51),
        '115° 30\' 36" E': new latlongutils.Long(115.51),
        '28° 30\' 36"': new latlongutils.Coord(28.51),
        '-115° 30\' 36"': new latlongutils.Coord(-115.51),
        '-0° 30\' 36"': new latlongutils.Coord(-0.51),
    }, function(value, key) {
        QUnit.test(key, function() {
            assert.equal(value.toDegsMinsSecs().format(), key);
        });
    });

    QUnit.module('latlongutil.*.parse');
    _.each({
        '34.123 N': [1, 34.123, 'Lat'],
        '36:07 N': [1, 36, 7, 'Lat'],
        '39:51:41 N': [1, 39, 51, 41, 'Lat'],
        '00.07152778 N': [1, 0.07152778, 'Lat'],
        '17:22.88 N': [1, 17, 22.88, 'Lat'],
        '39:51:41.02 N': [1, 39, 51, 41.02, 'Lat'],
        '-39:51:41': [-1, 39, 51, 41, 'Coord'],
        '39:51:41 s': [-1, 39, 51, 41, 'Lat'],
        '39:51.41 w': [-1, 39, 51.41, 'Long'],
        '.34': [1, 0.34, 'Coord'],
        '-.34': [-1, 0.34, 'Coord'],
        '17:22.88 E': [1, 17, 22.88, 'Long'],
        '28° N': [1, 28, 'Lat'],
        '28° 19\' N': [1, 28, 19, 'Lat'],
        '28° 19\' 0.121" N': [1, 28, 19, 0.121, 'Lat'],
        '  28° 19\' 0.121" N  ': [1, 28, 19, 0.121, 'Lat'],
        '115° 34\' 59.872" W': [-1, 115, 34, 59.872, 'Long'],
        '': undefined,
        ' ': undefined,
        'foobar': undefined,
    }, function(value, key) {
        var giventype = value && value.pop();
        _(['Coord', 'Lat', 'Long']).each(function(type) {
            QUnit.test(key + ' as ' + type, function() {
                var result = latlongutils[type].parse(key);
                if (value === undefined) {
                    assert.equal(result, undefined);
                } else if (type === 'Coord' ||
                           giventype === 'Coord' ||
                           giventype === type) {
                    assert.deepEqual([result.sign, ...result.components], value);
                } else {
                    assert.equal(result, undefined);
                }
            });
        });
    });

    _.each({
        '124:34:23 N': undefined,
        '124:34:23': 'Long',
        '200:34': undefined,
        '15:75': undefined,
        '-124:34:23 N': undefined,
        '-124:34:23': 'Long',
        '-200.34': undefined,
        '-15:75': undefined,
        '90.01 N': undefined,
        '90.1': 'Long',
        '90:01 N': undefined,
        '90:00:01': 'Long'
    }, function(value, key) {
        _([undefined, 'Coord', 'Lat', 'Long']).each(function(type) {
            QUnit.test(key + ' as ' + type, function() {
                var result = type ? latlongutils[type].parse(key) : parse(key);
                if (value === undefined || type === 'Lat') {
                    assert.equal(result, undefined);
                    return;
                }
                assert.ok(result instanceof latlongutils[value]);
            });
        });
    });
};
