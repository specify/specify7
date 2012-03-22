define(['underscore'], function (_) {
    var decDegRegex = /^(-?\d{0,3}(\.\d*)?)[^\d\.nsew]*([nsew]?)$/i;
    var degDecMinRegex = /^(-?\d{1,3})[^\d\.]+(\d{0,2}(\.\d*)?)[^\d\.nsew]*([nsew]?)$/i;
    var degMinDecSecRegex = /^(-?\d{1,3})[^\d\.]+(\d{1,2})[^\d\.]+(\d{0,2}(\.\d*)?)[^\d\.nsew]*([nsew]?)$/i;

    function Coord(flt) {
        flt = flt || 0.0;
        this._components = [flt];
    }
    Coord.prototype.isValid = function() {
        for(var i = 0; i < this._components.length; i++) {
            var x = this._components[i];
            if (i === 0 && Math.abs(x) > 180) return false;
            if (i > 0 && Math.abs(x) >= 60) return false;
        }
        return true;
    };
    Coord.prototype.format = function() {
        return format(this._components);
    };
    Coord.prototype._adjustTerms = function(n) {
        var result = Object.create(this);
        result._components = adjustTerms(this._components, n);
        return result;
    };
    _(['toDegs', 'toDegsMins', 'toDegsMinsSecs']).each(function(f, i) {
        Coord.prototype[f] = function () { return this._adjustTerms(i+1); };
    });
    Coord.parse = function(str) {
        var result = parse(str);
        return result && result.isValid() ? result : null;
    };

    function Lat(flt) { Coord.call(this, flt); }
    Lat.prototype = new Coord();
    Lat.prototype.isValid = function() {
        if (Math.abs(this._components[0]) > 90) return false;
        return Coord.prototype.isValid.call(this);
    }
    Lat.prototype.format = function() {
        var comps = _.clone(this._components);
        var dir = comps[0] < 0 ? 'S' : 'N';
        comps[0] = Math.abs(comps[0]);
        return [format(comps), dir].join(' ');
    };
    Lat.parse = function(str) {
        var result = parse(str);
        if (_.isNull(result) || result instanceof Long) return null;
        var comps = result._components;
        result = new Lat();
        result._components = comps;
        return result.isValid() ? result : null;
    };

    function Long(flt) { Coord.call(this, flt); }
    Long.prototype = new Coord();
    Long.prototype.format = function () {
        var comps = _.clone(this._components);
        var dir = comps[0] < 0 ? 'W' : 'E';
        comps[0] = Math.abs(comps[0]);
        return [format(comps), dir].join(' ');
    };
    Long.parse = function(str) {
        var result = parse(str);
        if (_.isNull(result) || result instanceof Lat) return null;
        var comps = result._components;
        result = new Long();
        result._components = comps;
        return result.isValid() ? result : null;
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
            result = Math.abs(comps[0]) > 90 ? new Long() : new Coord();
        }
        result._components = comps;
        return result;
    }

    function parse(str) {
        var match, deg, min, dir, sec;

        match = decDegRegex.exec(str);
        if (match !== null) {
            deg = parseFloat(match[1]);
            if (!_(deg).isNaN()) {
                dir = match[3].toLowerCase();
                return makeLatLong([deg], dir);
            }
        }

        match = degDecMinRegex.exec(str);
        if (match !== null) {
            deg = parseInt(match[1], 10);
            min = parseFloat(match[2]);
            if (!_.any([deg, min], _.isNaN)) {
                dir = match[4].toLowerCase();
                return makeLatLong([deg, min], dir);
            }
        }

        match = degMinDecSecRegex.exec(str);
        if (match !== null) {
            deg = parseInt(match[1], 10);
            min = parseInt(match[2], 10);
            sec = parseFloat(match[3]);
            if (!_.any([deg, min, sec], _.isNaN)) {
                dir = match[5].toLowerCase();
                return makeLatLong([deg, min, sec], dir);
            }
        }

        return null;
    };

    return { Coord: Coord, Lat: Lat, Long: Long, parse: Coord.parse };
});