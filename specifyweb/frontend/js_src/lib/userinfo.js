"use strict";

import _ from 'underscore';
import * as initialContext from './initialcontext';
import $ from 'jquery';

    var userInfo = {};
    initialContext.load('user.json', function(data) {
        if(data.agent == null){
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

export default userInfo;
