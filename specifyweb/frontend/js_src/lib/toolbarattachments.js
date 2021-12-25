"use strict";

var attachments = require('./attachments.js');
const {AttachmentsView} = require("./attachmentstask");

const commonText = require('./localization/common').default;

module.exports =  {
        task: 'attachments',
        title: commonText('attachments'),
        icon: '/static/img/attachment_icon.png',
        path: '/specify/attachments',
        enabled: attachments.systemAvailable,
        view: () => new AttachmentsView(),
    };

