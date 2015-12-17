"use strict";

var wbimport         = require('./templates/wbimport.html');
var wbtemplateeditor = require('./templates/wbtemplateeditor.html');
var othercollection  = require('./templates/othercollectiontemplate.html');
var othercollections = require('./templates/othercollectionstemplate.html');
var recordsetheader  = require('./templates/recordsetheader.html');
var recordsetform    = require('./templates/recordsetform.html');
var form             = require('./templates/formtemplate.html');
var formtable        = require('./templates/formtabletemplate.html');
var formdef          = require('./templates/formdeftemplate.html');
var viewwrapper      = require('./templates/viewwrappertemplate.html');
var confirmdelete    = require('./templates/confirmdelete.html');
var gmapplugin       = require('./templates/gmapplugin.html');
var latlonui         = require('./templates/latlonui.html');
var partialdateui    = require('./templates/partialdateui.html');
var querycbx         = require('./templates/querycbx.html');
var subviewheader    = require('./templates/subviewheader.html');
var fourohfour       = require('./templates/404.html');
var saveblocked      = require('./templates/saveblocked.html');
var welcome          = require('./templates/welcome.html');
var viewheader       = require('./templates/viewheader.html');
var recordsetchooser = require('./templates/recordsetchooser.html');
var querybuilder     = require('./templates/querybuilder.html');
var queryresults     = require('./templates/queryresults.html');
var queryfield       = require('./templates/queryfield.html');
var attachmentview   = require('./templates/attachmentview.html');
var aboutspecify     = require('./templates/aboutspecify.html');
var conflict         = require('./templates/conflict.html');
var passwordchange   = require('./templates/passwordchange.html');

module.exports = {
    wbimport: wbimport,
    wbtemplateeditor: wbtemplateeditor,
    othercollection: othercollection,
    othercollections: othercollections,
    recordsetheader: recordsetheader,
    recordsetform: recordsetform,
    form: form,
    formtable: formtable,
    formdef: formdef,
    viewwrapper: viewwrapper,
    confirmdelete: confirmdelete,
    gmapplugin: gmapplugin,
    latlonui: latlonui,
    partialdateui: partialdateui,
    querycbx: querycbx,
    subviewheader: subviewheader,
    fourohfour: fourohfour,
    saveblocked: saveblocked,
    welcome: welcome,
    viewheader: viewheader,
    recordsetchooser: recordsetchooser,
    querybuilder: querybuilder,
    queryresults: queryresults,
    queryfield: queryfield,
    attachmentview: attachmentview,
    aboutspecify: aboutspecify,
    conflict: conflict,
    passwordchange: passwordchange
};
