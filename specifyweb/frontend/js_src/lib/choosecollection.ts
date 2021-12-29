"use strict";
import '../css/base.css';
import '../css/login.css';
import '../css/choosecollection.css';

import $ from 'jquery';

$(function() {
    if ($('input[name="collection"]:checked').val()) {
        $(':submit').focus();
    }
});
