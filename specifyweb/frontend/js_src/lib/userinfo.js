"use strict";

var _              = require('underscore');
var initialContext = require('./initialcontext.js');
const commonText = require('./localization/common').default;
const $ = require('jquery');

    var userInfo = {};
    initialContext.load('user.json', function(data) {
        _.extend(userInfo, data, {
            isReadOnly: !_(['Manager', 'FullAccess']).contains(data.usertype)
        });
    }, (error)=>{
        if(error.status === 400){
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
        else throw new Error(error);
    });

module.exports = userInfo;
