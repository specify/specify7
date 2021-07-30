"use strict";

import $ from 'jquery';

global.jQuery = $;
import 'jquery-contextmenu';
import 'jquery-ui';

import userInfo from './userinfo';
import populateForm from './populateform';
import { ErrorView } from './errorview';
import NotFoundView from './notfoundview';
import * as navigation from './navigation';
import ResourceView from './resourceview';
import router from './router';
import systemInfo from './systeminfo';
import reports from './reports';
import commonText from './localization/common';

    var currentView;
    var versionMismatchWarned = false;

    // setup basic routes.
    router
        .route('*whatever', 'notFound', function() {
            setCurrentView(new NotFoundView());
            setTitle(commonText('pageNotFound'));
        })
        .route('test_error/', 'testError', function() {
            $.get('/api/test_error/');
        });

    $.ui.dialog.prototype._focusTabbable = function(){
        let previousFocusedElement = document.activeElement;
        this.uiDialog.focus();
        // Return focus to the previous focused element
        this.uiDialog.on('dialogbeforeclose',()=>
            previousFocusedElement?.focus()
        );

        if(!this.options.dialogClass.split(' ').includes('ui-dialog-react'))
            this.uiDialog.on(
                'dialogopen',
                () =>
                    this.uiDialog[0].getElementsByTagName('h2').length &&
                    this.uiDialog[0].classList.add('ui-dialog-with-header')
            );
    };

    // gets rid of any backbone view currently showing
    // and replaces it with the rendered view given
    // also manages other niceties involved in changing views
    export function setCurrentView(view) {
        currentView && currentView.remove(); // remove old view
        $('#content').empty();
        $('.ui-autocomplete').remove(); // these are getting left behind sometimes
        $('.ui-dialog-content:not(.ui-dialog-persistent)').dialog('close'); // close any open dialogs
        currentView = view;
        currentView.render();
        $('#content').append(currentView.el);

        if (systemInfo.specify6_version !== systemInfo.database_version && !versionMismatchWarned) {
            $(`<div title="Version Mismatch">
                ${commonText('versionMismatchDialogHeader')}
                <p>
                    <span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 50px 0;"></span>
                    ${commonText('versionMismatchDialogMessage')(
                        systemInfo.specify6_version,
                        systemInfo.database_version
                    )}
                </p>
                <p>${commonText('versionMismatchSecondDialogMessage')}</p>
            </div>`).dialog({
                title: commonText('versionMismatchDialogTitle'),
                modal: true,
            });
            versionMismatchWarned = true;
        }
    }

    export function handleError(jqxhr) {
        setCurrentView(new ErrorView({ request: jqxhr }));
        jqxhr.errorHandled = true;
    }

function viewSaved(resource, recordSet, options) {
    if (options.addAnother) {
        showResource(options.newResource, recordSet);
    } else if (options.wasNew) {
        navigation.go(resource.viewUrl());
    } else {
        const reloadResource = new resource.constructor({ id: resource.id });
        reloadResource.recordsetid = resource.recordsetid;
        reloadResource.fetch().done(() => showResource(reloadResource, recordSet));
    }
}

    // build and display view for resource
export function showResource(resource, recordSet, pushUrl) {
        var viewMode = userInfo.isReadOnly ? 'view' : 'edit';
        var view = new ResourceView({
            className: "specify-root-form content-shadow",
            populateForm: populateForm,
            model: resource,
            recordSet: recordSet,
            mode: viewMode
        });

        view.on('saved', function(resource, options) {
            if (this.reporterOnSave && this.reporterOnSave.prop('checked')) {
                console.log('generating label or invoice');
                reports( {
                    tblId: resource.specifyModel.tableId,
                    recordToPrintId: resource.id,
                    autoSelectSingle: true,
                    done: viewSaved.bind(this, resource, recordSet, options)
                });
            } else {
                viewSaved(resource, recordSet, options);
            }
        }).on('deleted', function() {
            if (view.next) {
                navigation.go(view.next.viewUrl());
            } else if (view.prev) {
                navigation.go(view.prev.viewUrl());
            } else {
                view.$el.empty();
                const dialog = $(`<div>
                    ${commonText('resourceDeletedDialogHeader')}
                    ${commonText('resourceDeletedDialogMessage')}
                </div>`).dialog({
                    title: commonText('resourceDeletedDialogTitle'),
                    buttons: [
                        {
                            text: commonText('close'),
                            click: ()=>{
                                navigation.go('/');
                                dialog.dialog('destroy');
                            }
                        }
                    ]
                });
            }
        }).on('changetitle', function(_resource, title) {
            setTitle(title);
        });
    pushUrl && navigation.push(resource.viewUrl());
    setCurrentView(view);
    }

    //set title of browser tab
    export function setTitle(title) {
        window.document.title = commonText('appTitle')(title);
    }

    // the exported interface
    export function getCurrentView() { return currentView; }  // a reference to the current view

