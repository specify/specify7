import 'jquery-ui';

import $ from 'jquery';

import type Backbone from './backbone';
import { openDialogs } from './components/modaldialog';
import { getCurrentUrl, push } from './navigation';
import { f } from './wbplanviewhelper';

// @ts-expect-error Exposing jQuery as a global variable
global.jQuery = $;

/**
 * Gets rid of any backbone view currently showing
 * and replaces it with the rendered view given
 * also manages other niceties involved in changing views
 */
let currentView: Backbone.View | undefined;
let isFirstRender = true;

export function setCurrentView(view: Backbone.View): void {
  // Remove old view or overlay
  currentView?.remove();
  currentOverlay?.remove();
  currentOverlay = undefined;
  if (typeof overlayUrl === 'string' && typeof previousUrl === 'string') {
    if (getCurrentUrl() === overlayUrl) push(previousUrl);
    overlayUrl = undefined;
    previousUrl = undefined;
  }

  /*
   * Close any open dialogs, unless rendering for the first time
   * (e.g, UserTools dialog can be opened by the user before first render)
   */
  if (!isFirstRender) Array.from(openDialogs, f.call);
  isFirstRender = false;

  currentView = view;
  currentView.render();
  const main = $('main');
  main.empty();
  main[0].append(currentView.el);
  main[0].focus();
}

let currentOverlay: Backbone.View | undefined;
let previousUrl: string | undefined;
let overlayUrl: string | undefined;

export function setCurrentOverlay(view: Backbone.View, url: string): void {
  previousUrl = getCurrentUrl();
  overlayUrl = url;
  push(url);
  currentOverlay?.remove();
  view.render();
  currentOverlay = view;
}
