"use strict";

import $ from 'jquery';
import Backbone from './backbone';

import schema, {getModelById} from './schema';
import FormsDialog from './components/formsdialog';
import EditResourceDialog from './components/editresourcedialog';
import * as navigation from './navigation';
import formsText from './localization/forms';
import commonText from './localization/common';
import {userInformation} from './userinfo';
import {QueryToolbarView} from './components/toolbar/query';
import {formatNumber} from "./components/internationalization";
import {legacyNonJsxIcons} from "./components/icons";
import {makeResourceViewUrl} from "./specifyapi";
import {showDialog} from "./components/modaldialog";
import {filterArray} from "./types";


export default Backbone.View.extend({
        __name__: "RecordSetsDialog",
        tagName: 'nav',
        events: {
            'click button.edit': 'edit'
        },
        render: function() {
            Promise.resolve(this.options.recordSets).then(recordSets=> {
                this.options.recordSets = recordSets;
                this.makeTable();
                this.dialog?.remove();
                this.dialog = showDialog({
                    header: formsText('recordSetsDialogTitle')(
                        this.options.recordSets._totalCount
                    ),
                    content: this.el,
                    onClose: () => {
                        this.dialog.remove();
                        this.options.onClose?.();
                    },
                    buttons: filterArray([
                        commonText('close'),
                        this.options.readOnly
                          ? undefined
                          : {
                            text: commonText('new'),
                            style: 'Blue',
                            onClick: this.openFormsDialog.bind(this)
                          },
                    ]),
                });
            });
            return this;
        },
        makeTable: function() {
            const table = $(`<table
                class="grid-table grid-cols-[1fr_min-content_min-content] gap-2"
            >
                <thead>
                    <tr>
                        <th scope="col">
                            <span class="sr-only">
                                ${commonText('recordSet')}
                            </span>
                        </th>
                        <th scope="col">
                            <span class="sr-only">
                                ${commonText('size')}
                            </span>
                        </th>
                        <td></td>
                    </tr>
                </thead>
                <tbody>
                    
                </tbody>
            </table>`);
            const tbody = table.find('tbody');
            var makeEntry = this.dialogEntry.bind(this);
            this.options.recordSets.each(function(recordSet) {
                tbody.append(makeEntry(recordSet));
            });
            this.options.recordSets.isComplete() ||
                tbody.append(`<tr>
                    <td>${commonText('listTruncated')}</td>
                </tr>`);
            this.$el.html(table);
        },
        dialogEntry: function(recordSet) {
            const model = getModelById(recordSet.get('dbtableid'));
            const entry = $(`<tr>
                <td>
                    <a
                        href="/specify/recordset/${recordSet.id}/"
                        class="link ${
                            this.options.readOnly
                                ? 'rs-select'
                                : 'intercept-navigation'
                        }"
                        title="${recordSet.get('remarks') ?? ''}"
                    >
                        <img
                            src="${model.getIcon()}"
                            alt="${model.getLocalizedName()}"
                            class="w-table-icon"
                        >
                        ${recordSet.get('name')} 
                    </a>
                </td>
                <td class="item-count invisible"></td>
                <td>
                    ${this.options.readOnly
                        ? ''
                        : `<button
                              type="button"
                              class="edit icon"
                              title="${commonText('edit')}"
                              aria-label="${commonText('edit')}"
                          >${legacyNonJsxIcons.pencil}</button>`
                    }
                </td>
            </tr>`);

            recordSet.getRelatedObjectCount('recordsetitems').done((count)=>
                $('.item-count', entry)
                    .text(`(${formatNumber(count)})`)
                    .attr('title',commonText('recordCount'))
                    .attr('aria-label',count)
                    .removeClass('invisible')
            );


            return entry;
        },
        openFormsDialog: function() {
            const dialog = new FormsDialog({
                onSelected: (model)=>{
                    dialog.remove();
                    const recordset = new schema.models.RecordSet.Resource();
                    recordset.set('dbtableid', model.tableId);
                    recordset.set('type', 0);
                    const view = new EditResourceDialog({
                      resource: recordset,
                      onSaved: ()=>{
                        view.remove();
                        this.gotoForm(model, recordset)
                      },
                    }).render();
                },
                onClose: () => dialog.remove(),
            }).render();
        },
        gotoForm: function(model, recordset) {
            navigation.go(makeResourceViewUrl(model.name, recordset.id));
        },
        getIndex: function(evt, selector) {
            evt.preventDefault();
            return this.$(selector).index(evt.currentTarget);
        },
        edit: function(evt) {
            const index = this.getIndex(evt, "button.edit");
            const recordSet = this.options.recordSets.at(index);
            this.dialog.remove();
            const queryEventListener = () => {
                editView.remove();
                const view = new QueryToolbarView({
                    onClose: () => {
                        view.remove();
                        this.options.onClose?.();
                    },
                    getQuerySelectUrl: (query) =>
                         `/specify/query/${query.id}/?recordsetid=${recordSet.id}`,
                    spQueryFilter: {
                        specifyuser: userInformation.id,
                        contexttableid: recordSet.get("dbTableId"),
                    },
                    newQueryButtonGenerator: ({ type }) =>
                        () => {
                              view.remove();
                              navigation.go(
                                    `/specify/query/new/${getModelById(recordSet.get("dbTableId"))
                                  .name.toLowerCase()}/?recordsetid=${recordSet.id}`
                              );
                          }
                });
                view.render();
            };
            const editView = new EditResourceDialog({
                resource: recordSet,
                deleteWarning: formsText("recordSetDeletionWarning")(recordSet.get("name")),
                extraButton: {
                  label: commonText("query"),
                  onClick: queryEventListener,
                },
                onClose: (event) => {
                    window.removeEventListener("click", queryEventListener);
                    if(typeof event?.originalEvent !== "undefined")
                        this.options.onClose?.();
                },
            }).render();
        }
    });

