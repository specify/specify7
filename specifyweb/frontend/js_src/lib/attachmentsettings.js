"use strict";

const initialContext = require('./initialcontext.js');

const settings = {};
initialContext.load('attachment_settings.json', data => Object.assign(settings, data));

module.exports = settings;
