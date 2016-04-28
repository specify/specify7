"use strict";
require('../css/base.css');
require('../css/login.css');
require('../css/choosecollection.css');

const $ = require('jquery');

$(function() {
    if ($('input[name="collection"]:checked').val()) {
        $(':submit').focus();
    }
});
