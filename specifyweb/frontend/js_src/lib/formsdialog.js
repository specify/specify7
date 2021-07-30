"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';
import Q from 'q';


import schema from './schema';
import { getIcon } from './icons';
import specifyform from './specifyform';
import * as initialContext from './initialcontext';
import commonText from './localization/common';
import formsText from './localization/forms';


    // I don't think the non-sidebar items are ever used in Sp6.
    let views;
    let forms;
    let getFormsPromise;
    initialContext.load(
        'app.resource?name=DataEntryTaskInit',
        data => {
            views = _.map($('view', data), $).filter(view => view.attr('sidebar') === 'true');
            getFormsPromise = Q.all(views.map(
                view => specifyform.getView(view.attr('view')).pipe(form => form))
            );
        }
    );

export default Backbone.View.extend({
        __name__: "FormsDialog",
        className: "forms-dialog table-list-dialog",
        events: {'click a': 'selected'},
        render: function() {
            var render = this._render.bind(this);
            if(getFormsPromise.isFulfilled()) {
                this._render();
            } else {
              const loadingDialog = $(
                  '<div><div class="progress-bar"></div></div>'
              ).dialog({
                  title: commonText('loading'),
                  modal: true,
                  dialogClass: 'ui-dialog-no-close',
              });
              $('.progress-bar', loadingDialog).progressbar({ value: false });
              getFormsPromise.done(fetchedForms=>{
                loadingDialog.dialog('destroy');
                this._render();
              });
            }
            return this;
        },
        _render: function() {
            var entries = _.map(views, this.dialogEntry, this);
            $('<table>').append(entries).appendTo(this.el);
            this.$el.dialog({
                title: formsText('formsDialogTitle'),
                maxHeight: 400,
                modal: true,
                close: function() { $(this).remove(); },
                buttons: [{
                  text: commonText('cancel'),
                  click: function() { $(this).dialog('close'); }
                }]
            });
            return this;
        },
        dialogEntry: function(view) {
            var img = $('<img>', { src: getIcon(view.attr('iconname')) });
            var link = $('<a>').addClass("intercept-navigation").text(view.attr('title'));
            return $('<tr>').append($('<td>').append(img), $('<td>').append(link))[0];
        },
        selected: function(evt) {
            var index = this.$('a').index(evt.currentTarget);
            this.$el.dialog('close');
            getFormsPromise.done(forms => {
                var form = forms[index];
                var model = schema.getModel(form['class'].split('.').pop());
                this.trigger('selected', model);
            });
        }
    });

