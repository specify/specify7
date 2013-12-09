define(['underscore'], function(_) {
    return _(['Organization', 'Person', 'Other', 'Group']).map(function(type, i) {
        return {
            value: i,
            title: type
        };
    });
});
