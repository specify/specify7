"use strict";


import _ from 'underscore';

export function Coord(flt) {
    // construct a coordinate from a single floating point number.
    flt = flt || 0.0;
    this._sign = Math.sign(flt);
    this._components = [Math.abs(flt)];
}
_.extend(Coord.prototype, {
    isValid() {
        for(let i = 0; i < this._components.length; i++) {
            const x = this._components[i];
            if (x < 0) return false;
            if (i === 0 && Math.abs(x) > 180) return false;
            if (i > 0 && Math.abs(x) >= 60) return false;
        }
        const decDegs = this.toDegs();
        if (Math.abs(decDegs._components[0]) > 180) return false;
        return true;
    },
    format() {
        return (this._sign < 0 ? "-" : "") + format(this._components);
    },
    _adjustTerms(n) {
        const result = Object.create(this);
        result._components = adjustTerms(this._components, n);
        return result;
    },
    asLat() {
        const result = _.extend(new Lat(), {_sign: this._sign, _components: _.clone(this._components)});
        return result.isValid() ? result : null;
    },
    asLong() {
        const result = _.extend(new Long(), {_sign: this._sign, _components: _.clone(this._components)});
        return result.isValid() ? result : null;
    },
    asFloat() {
        return this.toDegs()._components[0] * this._sign;
    },
    soCalledUnit() {
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

_(['toDegs', 'toDegsMins', 'toDegsMinsSecs']).each((f, i) => {
    Coord.prototype[f] = function () { return this._adjustTerms(i+1); };
});

Coord.parse = function(str) {
    const result = parse(str);
    return result && result.isValid() ? result : null;
};

export default Coord.parse;

export function Lat(flt) {
    Coord.call(this, flt);
}

Lat.prototype = _.extend(new Coord(), {
    isValid() {
        const decDegs = this.toDegs();
        if (Math.abs(decDegs._components[0]) > 90) return false;
        return Coord.prototype.isValid.call(this);
    },
    format() {
        const dir = this._sign < 0 ? 'S' : 'N';
        return [format(this._components), dir].join(' ');
    },
    asLong() { return null; }
});

Lat.parse = function(str) {
    const result = Coord.parse(str);
    return result && result.asLat();
};


export function Long(flt) {
    Coord.call(this, flt);
}

Long.prototype = _.extend(new Coord(), {
    format() {
        const dir = this._sign < 0 ? 'W' : 'E';
        return [format(this._components), dir].join(' ');
    },
    asLat() { return null; }
});

Long.parse = function(str) {
    const result = Coord.parse(str);
    return result && result.asLong();
};

function adjustTerms(x, n) {
    if (n < 1) throw new RangeError();
    x = _.clone(x); // leave source unchanged
    let t; // temp
    while (x.length < n) {
        t = x.pop();
        x.push(Math.floor(t));
        x.push(60 * (t - Math.floor(t)));
    }
    while (x.length > n)
        x[x.length - 2] += x.pop() / 60;
    // try and truncate some rounding errors
    x.push(Math.round(x.pop() * 1e9)/1e9);
    return x;
}

function format(ll) {
    const signs = _(['° ', "' ", '" ']).first(ll.length);
    return _(ll).chain().zip(signs).flatten().value().join('').trim();
}

function makeLatLong(sign, comps, dir) {
    if (_.any(comps, _.isNaN)) return null;
    var result;
    switch (dir.toLowerCase()) {
    case 's':
        sign *= -1;
    case 'n':
        result = new Lat();
        break;
    case 'w':
        sign *= -1;
    case 'e':
        result = new Long();
        break;
    default:
        // if the coord is greater in magnitude than 90 it has to be a long
        result = Math.abs(adjustTerms(comps, 1)[0]) > 90 ? new Long() : new Coord();
    }
    result._sign = sign;
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
    let parser, match, comps, sign, dir, result;

    for(let i = 0; i < parsers.length; i++) {
        parser = parsers[i];
        match = parser.regex.exec(str);
        if (match !== null) {
            sign = match[parser.comps[0]].startsWith("-") ? -1 : 1;
            dir = match[parser.dir].toLowerCase();
            comps = _(_.initial(parser.comps)).map(
                function(j) { return Math.abs(parseInt(match[j], 10)); }
            );
            comps.push(Math.abs(parseFloat(match[_.last(parser.comps)])));
            result = makeLatLong(sign, comps, dir);
            if (result) return result; // We got one!
        }
    }
    return null; // No parser succeeded.
}

