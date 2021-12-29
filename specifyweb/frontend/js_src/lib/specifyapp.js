"use strict";

import $ from 'jquery';
import 'jquery-contextmenu';
import 'jquery-ui';

import userInfo from './userinfo';
import populateForm from './populateform';
import {ErrorView} from './components/errorview';
import NotFoundView from './notfoundview';
import * as navigation from './navigation';
import ResourceView from './resourceview';
import router from './router';
import systemInfo from './systeminfo';
import reports from './reports';
import commonText from './localization/common';

global.jQuery = $;

var currentView;
    var versionMismatchWarned = false;


    // setup basic routes.
    router
        .route('*whatever', 'notFound', function() {
            setCurrentView(new NotFoundView());
        })
        .route('test_error/', 'testError', function() {
            $.get('/api/test_error/');
        });

    $.ui.dialog.prototype._focusTabbable = function(){
        let previousFocusedElement = document.activeElement;
        this.uiDialog.focus();
        // Return focus to the previous focused element on dialog close
        this.uiDialog.on('dialogbeforeclose',()=>
            previousFocusedElement?.focus()
        );

        /*
         * Make title non-bold by adding 'ui-dialog-with-header' className to
         * non-React dialogs that have headers (React dialogs do the same in
         * modaldialog.tsx)
         * */
        if(!this.options.dialogClass.split(' ').includes('ui-dialog-react'))
            this.uiDialog.on(
                'dialogopen',
                () =>
                    this.uiDialog[0].getElementsByTagName('h2').length &&
                    this.uiDialog[0].classList.add('ui-dialog-with-header')
            );

        // Set proper aria attributes
        this.uiDialog[0].setAttribute('role','dialog');
        if(this.options.modal)
            this.uiDialog[0].setAttribute('aria-modal','true');
        this.uiDialog.find('.ui-dialog-titlebar')[0]?.setAttribute('role','header');
        this.uiDialog.find('.ui-dialog-buttonpane')[0]?.setAttribute('role','menu');
    };

    /**
     * Gets rid of any backbone view currently showing
     * and replaces it with the rendered view given
     * also manages other niceties involved in changing views
     */
    let isFirstRender = true;
    export function setCurrentView(view) {
        // Remove old view
        currentView && currentView.remove();
        const main = $('main');
        main.empty();

        /*
         * Close any open dialogs, unless rendering for the first time
         * (e.g, UserTools dialog can be opened by the user before first render)
         * */
        if(!isFirstRender)
            $('.ui-dialog:not(.ui-dialog-no-close)')
                .find('.ui-dialog-content:not(.ui-dialog-persistent)')
                .dialog('close');
        isFirstRender = false;

        currentView = view;
        currentView.render();
        main.append(currentView.el);
        main[0].focus();

        if (typeof currentView.title === 'string')
            setTitle(currentView.title);
        else if (typeof currentView.title === 'function')
            setTitle(currentView.title(currentView));

        Array.from(
          document.getElementById('site-nav').getElementsByTagName('a'),
          (link)=>{
              const path = link.getAttribute('data-path');
              if(window.location.pathname.startsWith(path))
                  link.setAttribute('aria-current','page');
              else
                  link.removeAttribute('aria-current');
          }
       );

        if (systemInfo.specify6_version !== systemInfo.database_version && !versionMismatchWarned) {
            $(`<div role="alert">
                ${commonText('versionMismatchDialogHeader')}
                <p>
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
        setCurrentView(new ErrorView({
            header: jqxhr.status,
            message: jqxhr.statusText
        }));
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
                }).then(view=>view.render());
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
                    <p>${commonText('resourceDeletedDialogMessage')}</p>
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
