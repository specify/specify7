"use strict";

import $ from 'jquery';
import 'jquery-ui';
import {ErrorView} from './components/errorboundary';
import {setTitle} from './components/hooks';
import {openDialogs} from './components/modaldialog';
import {getCurrentUrl, push} from './navigation';

global.jQuery = $;

    /**
     * Gets rid of any backbone view currently showing
     * and replaces it with the rendered view given
     * also manages other niceties involved in changing views
     */
    let currentView;
    let isFirstRender = true;
    export function setCurrentView(view) {
        // Remove old view or overlay
        currentView?.remove();
        currentOverlay?.remove();
        currentOverlay = undefined;
        if(typeof overlayUrl === 'string' && typeof previousUrl === 'string'){
            if(getCurrentUrl() === overlayUrl)
                push(previousUrl);
            overlayUrl = undefined;
            previousUrl = undefined;
        }

        /*
         * Close any open dialogs, unless rendering for the first time
         * (e.g, UserTools dialog can be opened by the user before first render)
         * */
        if(!isFirstRender)
            Array.from(openDialogs, close=>close());
        isFirstRender = false;

        currentView = view;
        currentView.render();
        const main = $('main');
        main.empty();
        main[0].append(currentView.el);
        main[0].focus();

        if (typeof currentView.title === 'string')
            setTitle(currentView.title);
        else if (typeof currentView.title === 'function')
            setTitle(currentView.title(currentView));

    }

    let currentOverlay;
    let previousUrl;
    let overlayUrl;
    export function setCurrentOverlay(view, url){
        previousUrl = getCurrentUrl();
        overlayUrl = url;
        navigation.push(url);
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
