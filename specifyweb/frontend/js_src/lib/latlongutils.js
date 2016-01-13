"use strict";


var _ = require('underscore');

    function Coord(flt) {
        flt = flt || 0.0;
        this._components = [flt];
    }
    _.extend(Coord.prototype, {
        isValid: function() {
            for(var i = 0; i < this._components.length; i++) {
                var x = this._components[i];
                if (i === 0 && Math.abs(x) > 180) return false;
                if (i > 0 && Math.abs(x) >= 60) return false;
            }
            var decDegs = this.toDegs();
            if (Math.abs(decDegs._components[0]) > 180) return false;
            return true;
        },
        format: function() {
            return format(this._components);
        },
        _adjustTerms: function(n) {
            var result = Object.create(this);
            result._components = adjustTerms(this._components, n);
            return result;
        },
        asLat: function() {
            var result = _.extend(new Lat(), {_components: _.clone(this._components)});
            return result.isValid() ? result : null;
        },
        asLong: function() {
            var result = _.extend(new Long(), {_components: _.clone(this._components)});
            return result.isValid() ? result : null;
        },
        asFloat: function() {
            return this.toDegs()._components[0];
        },
        soCalledUnit: function() {
            // this is the "originalLatLongUnit" value for Specify 6
            switch (this._components.length) {
            case 1:             // Degrees only.
                return 0;
            case 2:             // Degrees and minutes.
                return 2;
            case 3:             // Degrees, minutes and seconds.
                return 1;
            default:
                return null;
            }
        }
    });
    _(['toDegs', 'toDegsMins', 'toDegsMinsSecs']).each(function(f, i) {
        Coord.prototype[f] = function () { return this._adjustTerms(i+1); };
    });
    Coord.parse = function(str) {
        var result = parse(str);
        return result && result.isValid() ? result : null;
    };

    function Lat(flt) { Coord.call(this, flt); }
    Lat.prototype = _.extend(new Coord(), {
        isValid: function() {
            var decDegs = this.toDegs();
            if (Math.abs(decDegs._components[0]) > 90) return false;
            return Coord.prototype.isValid.call(this);
        },
        format: function() {
            var comps = _.clone(this._components);
            var dir = comps[0] < 0 ? 'S' : 'N';
            comps[0] = Math.abs(comps[0]);
            return [format(comps), dir].join(' ');
        },
        asLong: function() { return null; }
    });
    Lat.parse = function(str) {
        var result = Coord.parse(str);
        return result && result.asLat();
    };

    function Long(flt) { Coord.call(this, flt); }
    Long.prototype = _.extend(new Coord(), {
        format: function () {
            var comps = _.clone(this._components);
            var dir = comps[0] < 0 ? 'W' : 'E';
            comps[0] = Math.abs(comps[0]);
            return [format(comps), dir].join(' ');
        },
        asLat: function() { return null; }
    });
    Long.parse = function(str) {
        var result = Coord.parse(str);
        return result && result.asLong();
    };

    function adjustTerms(x, n) {
        if (n < 1) throw new RangeError();
        x = _.clone(x); // leave source unchanged
        var sign = x[0] / Math.abs(x[0]);
        x[0] *= sign; // work with the abs value
        var t; // temp
        while (x.length < n) {
            t = x.pop();
            x.push(Math.floor(t));
            x.push(60 * (t - Math.floor(t)));
        }
        while (x.length > n)
            x[x.length - 2] += x.pop() / 60;
        x[0] *= sign; // put the sign back
        // try and truncate some rounding errors
        x.push(Math.round(x.pop() * 1e9)/1e9);
        return x;
    }

    function format(ll) {
        var signs = _(['° ', "' ", '" ']).first(ll.length);
        return _(ll).chain().zip(signs).flatten().value().join('').trim();
    }

    function makeLatLong(comps, dir) {
        if (_.any(comps, _.isNaN)) return null;
        var result;
        switch (dir.toLowerCase()) {
        case 's':
            comps[0] *= -1;
        case 'n':
            result = new Lat();
            break;
        case 'w':
            comps[0] *= -1;
        case 'e':
            result = new Long();
            break;
        default:
            // if the coord is greater in magnitude than 90 it has to be a long
            result = Math.abs(adjustTerms(comps, 1)[0]) > 90 ? new Long() : new Coord();
        }
        result._components = comps;
        return result;
    }

    var parsers = [{
        regex:  /^(-?\d{0,3}(\.\d*)?)[^\d\.nsew]*([nsew]?)$/i,
        comps: [1], dir: 3 // what match group to use for each component
    }, {
        regex: /^(-?\d{1,3})[^\d\.]+(\d{0,2}(\.\d*)?)[^\d\.nsew]*([nsew]?)$/i,
        comps: [1, 2], dir: 4
    }, {
        regex: /^(-?\d{1,3})[^\d\.]+(\d{1,2})[^\d\.]+(\d{0,2}(\.\d*)?)[^\d\.nsew]*([nsew]?)$/i,
        comps: [1, 2, 3], dir: 5
    }];

    function parse(str) {
        var parser, match, comps, dir, result;

        for(var i = 0; i < parsers.length; i++) {
            parser = parsers[i];
            match = parser.regex.exec(str);
            if (match !== null) {
                dir = match[parser.dir].toLowerCase();
                comps = _(_.initial(parser.comps)).map(
                    function(j) { return parseInt(match[j], 10); }
                );
                comps.push(parseFloat(match[_.last(parser.comps)]));
                result = makeLatLong(comps, dir);
                if (result) return result; // We got one!
            }
        }
        return null; // No parser succeeded.
    }

module.exports =  { Coord: Coord, Lat: Lat, Long: Long, parse: Coord.parse };

