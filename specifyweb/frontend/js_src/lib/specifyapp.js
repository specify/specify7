"use strict";

import $ from 'jquery';
import 'jquery-contextmenu';
import 'jquery-ui';
import {ErrorView} from './errorview';
import {setTitle} from "./components/hooks";

global.jQuery = $;


    $.ui.dialog.prototype._focusTabbable = function(){
        let previousFocusedElement = document.activeElement;
        this.uiDialog.focus();
        // Return focus to the previous focused element on dialog close
        this.uiDialog.on('dialogbeforeclose',()=>
            previousFocusedElement?.focus()
        );

        // Make title non-bold if dialog has header
        this.uiDialog.on(
            'dialogopen',
            () =>{
                if (
                    this.uiDialog[0].getElementsByTagName('h2').length ||
                    this.uiDialog[0].classList.contains('ui-dialog-with-header')
                )
                    this.uiDialog
                       .find('.ui-dialog-title')[0]
                       .classList.add('font-normal');
            }
        );

        // Set proper aria attributes
        if(this.uiDialog[0].classList.contains('ui-dialog-no-close'))
            this.uiDialog.find('.ui-dialog-titlebar-close')[0].classList.add('hidden');
        this.uiDialog[0].setAttribute('role','dialog');
        if(this.options.modal)
            this.uiDialog[0].setAttribute('aria-modal','true');
        this.uiDialog.find('.ui-dialog-titlebar')[0]?.setAttribute('role','header');
        this.uiDialog.find('.ui-dialog-titlebar')[0]?.classList.add('flex');
        this.uiDialog.find('.ui-dialog-buttonpane')[0]?.setAttribute('role','menu');
    };

    /**
     * Gets rid of any backbone view currently showing
     * and replaces it with the rendered view given
     * also manages other niceties involved in changing views
     */
    let currentView;
    let isFirstRender = true;
    export function setCurrentView(view) {
        // Remove old view
        currentView && currentView.remove();
        const main = $('main');
        main.empty();

        currentOverlay?.remove();
        currentOverlay = undefined;

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

    }

    let currentOverlay;
    export function setCurrentOverlay(view){
        currentOverlay?.remove();
        view.render();
        currentOverlay=view;
    }

    export function handleError(jqxhr) {
        setCurrentView(new ErrorView({
            header: jqxhr.status,
            message: jqxhr.statusText
        }));
        jqxhr.errorHandled = true;
    }
