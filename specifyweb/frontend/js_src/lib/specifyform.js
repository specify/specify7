"use strict";

import $ from 'jquery';
import _ from 'underscore';

import specifyformcells from './specifyformcells';
import {parseSpecifyProperties} from './parsespecifyproperties';
import {processColumnDefinition} from './processcolumndef';

import {className} from './components/basic';
import {SpecifyModel} from './specifymodel';

var formCounter = 0;

    function getModelFromViewdef(viewdef) {
        return SpecifyModel.parseClassName(viewdef.attr('class'));
    }

    function getColumnDef(viewdef) {
        return viewdef.find('columnDef[os="lnx"]').first().text() || viewdef.find('columnDef').first().text();
    }

    function buildFormTable(formNumber, formViewdef, processCell) {
        var formTableCells = formViewdef.find('cell[type="field"], cell[type="subview"]');
        const table = $(`<table className="specify-formtable text-center">
            <thead>
            <tr>
                <!-- labels go here -->
            </tr>
            </thead>
            <tbody className="specify-view-content-container">
            <tr className="specify-view-content"
                id="specify-view-${formNumber}">
                <!-- cells go here -->
            </tr>
            </tbody>
        </table>`);
        var headerRow = table.find('thead tr');
        var bodyRow = table.find('tbody tr');

        _(formTableCells).each(function (cell) {
            var label = $('<label>', {'for': 'specify-field-' + formNumber + '-' + $(cell).attr('id')});
            headerRow.append($('<th>').append(label));
            bodyRow.append(processCell(cell));
        });

        return table;
    }

    function buildForm(formNumber, viewdef, processCell, isSubView) {
        var rows = viewdef.children('rows').children('row');
        var cellsIn = function(row) { return $(row).children('cell'); };
        var table = processColumnDefinition(getColumnDef(viewdef));

        _(rows).each(function (row) {
            var tr = $('<tr>').appendTo(table);
            var appendToTr = function(cell) { tr.append(cell); };
            _(cellsIn(row)).chain().map(processCell).each(appendToTr);
        });

        const tagName = isSubView ? 'div' : 'form';
        return $(`<div class="specify-view-content-container">
          <${tagName} class="specify-view-content ${className.notSubmittedForm}" id="specify-view-${formNumber}">
          </${tagName}>
        </div>`).find('.specify-view-content').append(table).end();
    }

    function buildView(view, defaultType, mode, isSubView) {
        defaultType || (defaultType = 'form');
        mode || (mode = 'edit');
        console.log("buildView", view, "defaultType:", defaultType, 'mode:', mode);
        var altviews = _.filter(view.altviews, function(av) { return av.mode == mode; });
        altviews.length > 0 || (altviews = view.altviews);

        var viewdefs = {};
        _.each(view.viewdefs, function(xml, name) {
            viewdefs[name] = $($.parseXML(xml)).find('viewdef');
        });

        var viewdef;
        var altview = _.find(altviews, function(av) {
            viewdef = viewdefs[av.viewdef];
            return viewdef.attr('type') === defaultType;
        });

        if (!altview) {
            console.log("no altview for defaultType:", defaultType);
            altview = _.first(altviews);
            viewdef = viewdefs[altview.viewdef];
        }
        console.log("using altview:", altview);

        var definition = viewdef.find('definition').text();
        definition && console.log("viewdef is defined by", definition);
        var actual_viewdef = definition ? viewdefs[definition] : viewdef;
        console.log("using viewdef:", actual_viewdef);

        var formNumber = formCounter++;
        var doingFormTable = viewdef.attr('type') === 'formtable';
        var processCell = _.bind(specifyformcells, null, formNumber, doingFormTable,
                                 mode === 'search' ? 'search' : altview.mode);

        const wrapper = $(`<div data-specify-model="${getModelFromViewdef(actual_viewdef)}">
          <h2 class="${className.formHeader}"></h2>
          <!-- view goes here -->
        </div>`);

        (doingFormTable ? buildFormTable : buildForm)(formNumber, actual_viewdef, processCell, isSubView).appendTo(wrapper);
        wrapper.addClass(`flex flex-col gap-y-2 specify-form-type-${viewdef.attr('type')}`);
        wrapper.attr('data-specify-altview-mode', altview.mode);
        wrapper.attr('data-specify-form-mode', mode === 'view' ? 'view' : altview.mode);
        return wrapper;
    }

    function getView(name) {
        return $.getJSON('/context/view.json', {name: name});
    }

    var specifyform = {
        parseSpecifyProperties: parseSpecifyProperties,
        getView: getView,

        buildViewByName: function (viewName, defaultType, mode, isSubView=false) {
            if (viewName === "ObjectAttachment")
                return $.when($(`<div data-specify-model="ObjectAttachmentIFace">
                  <h2 class="${className.formHeader}"></h2>
                  <button
                    type="button"
                    class="button specify-uiplugin specify-field"
                    data-specify-initialize="name=AttachmentPlugin;"
                  >
                    plugin
                  </button>
                </div>`));
            else
                return getView(viewName).pipe(function(view) { return buildView(view, defaultType, mode, isSubView); });
        },

        buildSubView: function (node, mode) {
            var defaultType = specifyform.getSubViewType(node);
            mode = mode === 'view' || specifyform.subViewMode(node) === 'view' ? 'view' : 'edit';
            var viewName = node.data('specify-viewname');
            var buildView = specifyform.buildViewByName(viewName, defaultType, mode, true);

            return buildView.pipe(function(form) {
                form.find('.specify-form-header:first, .specify-form-footer button').remove();
                return form;
            }).fail(jqxhr => {
                if (jqxhr.status === 404) {
                    jqxhr.errorHandled = true;
                    console.error('form not found for subview:', viewName, defaultType, mode);
                }
            });
        },

        getSubViewType: function (node) {
            // This the form type desired by the superform. May or may not be respected
            // when the form is actually built.
            return node.data('specify-viewtype') === 'table' ? 'formtable' : 'form';
        },

        isSubViewButton: function (node) {
            return node.is('.specify-subview-button');
        },

        subViewMode: function (node) {
            return node.data('specify-viewmode');
        },

        getFormMode: function (node) {
            return node.data('specify-form-mode');
        }
    };

export default specifyform;

