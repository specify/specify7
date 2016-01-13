var _ = require('underscore');
var utils = require('loader-utils');

module.exports = function(source) {
    this.cacheable && this.cacheable();
    var options = utils.parseQuery(this.query);
    var t = _.template(source, options);
    return "var _ = require('underscore'); module.exports = " + t.source + ';';
};
