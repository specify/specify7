define(['underscore'], function (_) {
    var decDegRegex = /^(-?\d{0,3}(\.\d*)?)[^\d\.nsew]*([nsew]?)$/i;
    var degDecMinRegex = /^(-?\d{1,3})[^\d\.]+(\d{0,2}(\.\d*)?)[^\d\.nsew]*([nsew]?)$/i;
    var degMinDecSecRegex = /^(-?\d{1,3})[^\d\.]+(\d{1,2})[^\d\.]+(\d{0,2}(\.\d*)?)[^\d\.nsew]*([nsew]?)$/i;

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
        return x;
    }

    return {
        parse: function(str) {
            var match, deg, min, dir, sec;

            var fixSign = function() {
                if (dir === 's' || dir === 'w') deg *= -1;
            };

            match = decDegRegex.exec(str);
            if (match !== null) {
                deg = parseFloat(match[1]);
                if (deg !== NaN) {
                    dir = match[3].toLowerCase();
                    fixSign();
                    return [deg];
                }
            }

            match = degDecMinRegex.exec(str);
            if (match !== null) {
                deg = parseInt(match[1], 10);
                min = parseFloat(match[2]);
                if (deg !== NaN && min !== NaN) {
                    dir = match[4].toLowerCase();
                    fixSign();
                    return [deg, min];
                }
            }

            match = degMinDecSecRegex.exec(str);
            if (match !== null) {
                deg = parseInt(match[1], 10);
                min = parseInt(match[2], 10);
                sec = parseFloat(match[3]);
                if (deg !== NaN && min !== NaN && sec !== NaN) {
                    dir = match[5].toLowerCase();
                    fixSign();
                    return [deg, min, sec];
                }
            }

            return null;
        },

        toDegs: function(x) { return adjustTerms(x, 1); },
        toDegsMins: function(x) { return adjustTerms(x, 2); },
        toDegsMinsSecs: function(x) { return adjustTerms(x, 3); }
    };
});