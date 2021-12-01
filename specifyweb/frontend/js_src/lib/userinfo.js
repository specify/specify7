"use strict";

var _              = require('underscore');
var initialContext = require('./initialcontext.js');
const commonText = require('./localization/common').default;
const $ = require('jquery');

    var userInfo = {};
    initialContext.load('user.json', function(data) {
        if(typeof data.agent === 'undefined'){
            const dialog = $(`<div>
                ${commonText('noAgentDialogHeader')}
                <p>${commonText('noAgentDialogMessage')}</p>
            </div>`).dialog({
                modal: true,
                dialogClass: 'ui-dialog-persistent',
                title: commonText('noAgentDialogTitle'),
                close: ()=>{
                    window.location.href = '/accounts/logout/';
                },
                buttons: [
                    {
                        text: commonText('logOut'),
                        click: ()=>dialog.dialog('close'),
                    }
                ]
            });
            dialog[0].classList.add('ui-dialog-persistent');
        }
        _.extend(userInfo, data, {
            isReadOnly: !_(['Manager', 'FullAccess']).contains(data.usertype)
        });
    });

module.exports = userInfo;
