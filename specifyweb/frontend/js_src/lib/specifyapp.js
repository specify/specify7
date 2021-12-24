"use strict";

var $ = require('jquery');

global.jQuery = $;
require('jquery-contextmenu');
require('jquery-ui');

var userInfo     = require('./userinfo').default;
var populateForm = require('./populateform.js');
var errorview    = require('./errorview.js');
var NotFoundView = require('./notfoundview.js');
var navigation   = require('./navigation.js');
var ResourceView = require('./resourceview.js');
var router       = require('./router.js');
var systemInfo   = require('./systeminfo.ts');
var reports      = require('./reports.js');
const commonText = require('./localization/common').default;

    var currentView;
    var versionMismatchWarned = false;


    // setup basic routes.
    router
        .route('*whatever', 'notFound', function() {
            app.setCurrentView(new NotFoundView());
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

        this.uiDialog[0].setAttribute('role','dialog');
        if(this.options.modal)
            this.uiDialog[0].setAttribute('aria-modal','true');
        this.uiDialog.find('.ui-dialog-titlebar')[0]?.setAttribute('role','header');
        this.uiDialog.find('.ui-dialog-buttonpane')[0]?.setAttribute('role','menu');
    };

    // gets rid of any backbone view currently showing
    // and replaces it with the rendered view given
    // also manages other niceties involved in changing views
    function setCurrentView(view) {
        currentView && currentView.remove(); // remove old view
        const main = $('main');
        main.empty();
        $('.ui-autocomplete').remove(); // these are getting left behind sometimes
        $('.ui-dialog:not(.ui-dialog-no-close)')
            .find('.ui-dialog-content:not(.ui-dialog-persistent)')
            .dialog('close'); // close any open dialogs
        currentView = view;
        currentView.render();
        main.append(currentView.el);
        main[0].focus();

        if (typeof currentView.title === 'string')
            app.setTitle(currentView.title);
        else if (typeof currentView.title === 'function')
            app.setTitle(currentView.title(currentView));

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

    function handleError(jqxhr) {
        setCurrentView(new errorview.ErrorView({ request: jqxhr }));
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
function showResource(resource, recordSet, pushUrl) {
        var viewMode = userInfo.isReadOnly ? 'view' : 'edit';
        var view = new ResourceView({
            className: "specify-root-form content-shadow",
            populateForm: populateForm,
            model: resource,
            recordSet: recordSet,
            mode: viewMode
        });

        view.on('saved', function(resource, options) {
            var todoNext;
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
        }).on('changetitle', function(resource, title) {
            setTitle(title);
        });
    pushUrl && navigation.push(resource.viewUrl());
    setCurrentView(view);
    }

    //set title of browser tab
    function setTitle(title) {
        window.document.title = commonText('appTitle')(title);
    }

    // the exported interface
    var app = {
        handleError: handleError,
        setCurrentView: setCurrentView,
        showResource: showResource,
        setTitle: setTitle,
        getCurrentView: function() { return currentView; }  // a reference to the current view
    };

module.exports =  app;

