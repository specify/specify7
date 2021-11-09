"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');
var Q        = require('q');


var schema         = require('./schema.js');
var icons          = require('./icons.js');
var specifyform    = require('./specifyform.js');
var initialContext = require('./initialcontext.js');
const commonText = require('./localization/common').default;
const formsText = require('./localization/forms').default;


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

module.exports = Backbone.View.extend({
        __name__: "FormsDialog",
        tagName: 'nav',
        className: "forms-dialog",
        events: {'click a': 'handleClick'},
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
        _render: function(forms) {
            this.forms = forms;
            $('<ul>')
                .css('padding',0)
                .append(views.map((view,index)=>this.dialogEntry(view, index)))
            .appendTo(this.el);
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
        dialogEntry: function(view,index) {
            const form = this.forms[index];
            const modelName = form['class'].split('.').pop();
            const model = schema.getModel(modelName);
            return $('<li>').append(
                $('<a>')
                    .addClass("fake-link intercept-navigation")
                    .attr('href', new model.Resource().viewUrl())
                    .css({fontSize: '0.8rem'})
                    .attr('data-model-name', modelName)
                    .append(
                        $(
                            '<img>',
                            {
                                alt: view.attr('iconname'),
                                src: icons.getIcon(view.attr('iconname')),
                                width: 'var(--table-icon-size)',
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
            const model = schema.getModel(modelName);
            this.options.onSelected(model);
        },
    });

