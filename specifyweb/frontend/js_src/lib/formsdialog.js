"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';
import Q from 'q';


import ajax from './ajax';
import {getModel} from './schema';
import {getIcon} from './icons';
import specifyform from './specifyform';
import commonText from './localization/common';
import formsText from './localization/forms';


// I don't think the non-sidebar items are ever used in Sp6.
    let views, isFulfilled = false;

    const getFormsPromise = ajax('/context/app.resource?name=DataEntryTaskInit',
    {headers: {Accept: 'application/xml'}})
      .then(
        ({data}) => {
            views = _.map($('view', data), $).filter(view => view.attr('sidebar') === 'true');
            return Q.all(views.map(
                view => specifyform.getView(view.attr('view')).pipe(form => form))
            );
        }
    );

export default Backbone.View.extend({
        __name__: "FormsDialog",
        tagName: 'nav',
        className: "forms-dialog",
        events: {'click a': 'handleClick'},
        render: function() {
            let loadingDialog = undefined;
            if(!isFulfilled){
                loadingDialog = $(
                    '<div><div class="progress-bar"></div></div>'
                ).dialog({
                    title: commonText('loading'),
                    modal: true,
                    dialogClass: 'ui-dialog-no-close',
                });
                $('.progress-bar', loadingDialog).progressbar({value: false});
            }
            getFormsPromise.then(fetchedForms=>{
                isFulfilled=true;
                loadingDialog?.dialog('destroy');
                this._render(fetchedForms);
            });
            return this;
        },
        _render: function(forms) {
            $('<ul>')
                .css('padding',0)
                .append(views.map((view,index)=>this.dialogEntry(forms, view, index)))
            .appendTo(this.el);
            this.$el.dialog({
                title: formsText('formsDialogTitle'),
                maxHeight: 400,
                modal: true,
                close: this.options.onClose,
                buttons: [{
                  text: commonText('cancel'),
                  click: function() { $(this).dialog('close'); }
                }]
            });
        },
        dialogEntry: function(forms, view,index) {
            const form = forms[index];
            const modelName = form['class'].split('.').pop();
            const model = getModel(modelName);
            return $('<li>').append(
                $('<a>')
                    .addClass(
                        `link ${
                            typeof this.options.onSelected === 'undefined'
                                ? 'intercept-navigation'
                                : ''
                        }`
                    )
                    .attr('href', new model.Resource().viewUrl())
                    .css({fontSize: '0.8rem'})
                    .attr('data-model-name', modelName)
                    .append(
                        $(
                            '<img>',
                            {
                                alt: view.attr('iconname'),
                                src: getIcon(view.attr('iconname')),
                                class: 'w-table-icon',
                                'aria-hidden': true,
                            }
                        ),
                        view.attr('title')
                    )
            )[0];
        },
        handleClick(event){
            if(typeof this.options.onSelected === 'undefined')
                return;
            event.preventDefault();
            const modelName = event.target.getAttribute('data-model-name');
            const model = getModel(modelName);
            this.options.onSelected(model);
        },
    });

