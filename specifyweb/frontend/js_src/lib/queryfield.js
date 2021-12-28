"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';

import template from './templates/queryfield.html';
import {getTreeDef} from './domain';
import QueryFieldSpec from './queryfieldspec';
import QueryFieldInputUI from './queryfieldinput';
import queryText from './localization/query';
import commonText from './localization/common';

var SORT_ICONS = ["ui-icon-bullet", "ui-icon-carat-1-n", "ui-icon-carat-1-s"];

    var types = {
        strings: ['text', 'java.lang.String'],
        numbers: ['java.lang.Integer', 'java.lang.Long', 'java.lang.Byte',
                  'java.lang.Short', 'java.lang.Float', 'java.lang.Double', 'java.math.BigDecimal'],
        dates: ['java.util.Calendar', 'java.util.Date', 'java.sql.Timestamp'],
        bools: ['java.lang.Boolean'],
        catnos: []
    };

export default Backbone.View.extend({
        __name__: "QueryField",
        events: {
            'click .field-expand': 'expandToggle',
            'click .field-delete': 'deleteClicked',
            'change input.op-negate': 'opNegateChanged',
            'change .field-show': 'fieldShowChanged',
            'click .field-sort': 'fieldSortClicked',
            'click .field-move-up, .field-move-down': 'changePosition',

            'change .field-select': 'fieldSelected',
            'change .op-type': 'opSelected',
            'change .datepart-select': 'datePartSelected',
            'click .field-operation, .field-label-field, .field-label-datepart, .field-label-treerank': 'goBack'
        },
        initialize: function(options) {
            var attrs = options.spqueryfield.toJSON();

            _(this).extend({
                spqueryfield: options.spqueryfield,
                inputUI: undefined,
                forReport: options.forReport || false
            });
            if (attrs.stringid == null) { // the field spec is undefined
                _(this).extend({
                    fieldSpec       : new QueryFieldSpec(this.model),
                    formattedRecord : false,
                    value           : '',
                    operation       : undefined,
                    renderExisting  : false
                });
            } else {
                var fieldSpec = QueryFieldSpec.fromStringId(attrs.stringid, attrs.isrelfld);
                _(this).extend({
                    fieldSpec       : fieldSpec,
                    formattedRecord : fieldSpec.isRelationship(),
                    value           : attrs.startvalue,
                    operation       : attrs.operstart,
                    renderExisting  : true  // so that we know not to update the model when rendering is complete
                });
            }

            (this.operation === 1 && this.value === "") && (this.operation = 'anything');
        },
        render: function() {
            this.$el.append(template({commonText, queryText, cid: this.cid}));
            this.$('#' + this.cid + '-show').prop('checked', this.spqueryfield.get('isdisplay')).button();
            this.$('#' + this.cid + '-negate').prop('checked', this.spqueryfield.get('isnot')).button();

            _(this.$('button')).each(function(button) {
                button = $(button);
                button.button({icons: { primary: 'ui-icon-' + button.data('icon') }, text: false});
            });

            this.spqueryfield.on('change:sorttype', this.sortTypeChanged, this);
            this.sortTypeChanged();

            this.update();
            this.inputUI && this.inputUI.setValue(this.value);

            if (this.forReport) {
                this.$('.field-controls, .field-expand, .field-delete').remove();
            }

            return this;
        },

        // Simple UI event handlers.

        changePosition: function(evt) {
            var dir = /field-move-((up)|(down))/.exec($(evt.currentTarget).attr('class'))[1];
            this.options.parentView.moveField(this, dir);
        },
        fieldShowChanged: function() {
            var val = this.$('.field-show').prop('checked');
            this.spqueryfield.set('isdisplay', val);
        },
        fieldSortClicked: function() {
            var val = (this.spqueryfield.get('sorttype') + 1) % SORT_ICONS.length;
            this.spqueryfield.set('sorttype', val);
        },
        opNegateChanged: function() {
            this.spqueryfield.set('isnot', this.$('input.op-negate').prop('checked'));
        },
        deleteClicked: function() {
            this.remove();
            this.options.parentView.removeFieldUI(this, this.spqueryfield);
        },
        expandToggle: function(state) {
            _(['hide', 'show']).contains(state) || (state = 'toggle'); // querybuilder calls with 'show' or 'hide'
            this.$('.field-label-field:not(.field-label-virtual):not(:last)')[state](500);
        },

        // This works like an implicit state machine controlled by the values
        // formattedRecord, joinPath, treeRank, datePart and operation.

        // This method determines the current state.

        whatState: function() {
            var field = this.getField();
            if (this.formattedRecord) return 'Complete';

            if (this.fieldSpec.treeRank == null) {

                if (field == null || field.isRelationship) return 'Field';

                if (field.isTemporal() && this.fieldSpec.datePart == null) return 'DatePart';
            }

            if (this.operation == null) return 'Operation';

            return 'Complete';
        },

        update: function() {
            this.updateLabel();
            this.$el.addClass('field-incomplete');
            var state = this.whatState();
            var $$ = this.$.bind(this);
            _.each(['hide', 'show'], function(action) { $$('.' + state.toLowerCase() + '-state-' + action)[action](); });
            this.$('.field-input').empty();
            this['setup' + state + 'State']();
        },
        updateLabel: function() {
            
            var fieldLabel = this.$('.field-label').empty();
            _.each(this.fieldSpec.joinPath, function(field) {
                $('<button class="field-label-field fake-link">')
                    .text(field.getLocalizedName() || field.name)
                    .prepend($(
                        '<img>',
                        {
                            src: field.model.getIcon(),
                            alt: field.model.getLocalizedName(),
                        }
                    ))
                    .appendTo(fieldLabel);
            });
            if (this.formattedRecord) {
                var formatOrAggregate = (this.getField().type === 'one-to-many') ? 'aggregated' : 'formatted';
                $('<a class="field-label-field field-label-virtual">').text('(' + formatOrAggregate + ')').appendTo(fieldLabel);
                this.$('.op-negate').hide();
            } else {
                if(this.fieldSpec.treeRank)
                    this.getTreeRanks(this.fieldSpec.table.name)
                        .then(treeRanks=>
                            treeRanks.find(item=>
                                item.get('name')===this.fieldSpec.treeRank
                            )
                        )
                        .then(treeRank=>treeRank.get('title') ?? treeRank.get('name'))
                        .then(title=>
                            $('<a class="field-label-treerank">')
                                .text(title)
                                .appendTo(fieldLabel)
                        )
                        .catch(console.error)
                if (_(['Month', 'Year', 'Day']).contains(this.fieldSpec.datePart)) {
                    const localized = {
                        year: commonText('year'),
                        month: commonText('month'),
                        day: commonText('day'),
                    }[this.fieldSpec.datePart];
                    $('<a class="field-label-datepart">')
                        .text(`(${localized})`)
                        .appendTo(fieldLabel);
                }
                if (this.operation == 'anything') {
                    $('<button class="field-operation fake-link">').text(queryText('anyInline')).appendTo(fieldLabel);
                    this.$('.op-negate').hide();
                }
            }
        },

        // These methods are involved with setting up the UI when entering different states.

        setupFieldState: function() {
            var field = this.getField();
            if (field == null) {
                this.fieldSpec.table = this.model;
            } else if (this.fieldSpec.treeRank == null && field.isRelationship) {
                this.fieldSpec.table = field.getRelatedModel();
            }

            this.$('.field-select-grp img').attr('src', this.fieldSpec.table.getIcon()).attr('alt',this.fieldSpec.table.getLocalizedName());
            var fieldSelect = this.$('.field-select').empty().append(
                `<option>${queryText('selectFields')}</option>`
            );

            if (this.fieldSpec.joinPath.length > 0) {
                var formatOrAggregate = (this.getField().type === 'one-to-many') ? 'aggregated' : 'formatted';
                fieldSelect.append('<option value="format record">(' + formatOrAggregate + ')</option>');
            }

            _.chain(this.fieldSpec.table.getAllFields())
                .reject(function(field) { return field.isHidden(); })
                .sortBy(function(field) { return field.getLocalizedName(); })
                .each(function(field) {
                    $('<option>', {value: field.name})
                        .text((field.isRelationship ? '➔ ' : '') + (field.getLocalizedName() || field.name))
                        .appendTo(fieldSelect);
                });

            this.getTreeRanks(this.fieldSpec.table.name)
                .then(treeRanks=>this.addTreeLevelsToFieldSelect(treeRanks))
                .catch(()=>{ /* Not a tree table */ })
                .finally(()=>this.$('.field-select-grp').show())
        },
        async getTreeRanks(tableName){
            const treeDef = await getTreeDef(tableName);
            const treeDefItems = await treeDef.rget('treedefitems');
            await treeDefItems.fetch({limit: 0});
            return treeDefItems.models ?? [];
        },
        addTreeLevelsToFieldSelect: function(tableRanks) {
            const optGroup = $(`<optgroup label="${queryText('treeRanks')}">`).appendTo( this.$('.field-select') );

            tableRanks.map((item)=>{
                $('<option>', {value: 'treerank-' + item.get('name')})
                    .text(item.get('title') ?? item.get('name'))
                    .appendTo(optGroup);
                if (item.specifyModel.name === 'TaxonTreeDefItem') {
                    $('<option>', {value: 'treerank-' + item.get('name') + ' Author'})
                        .text(queryText('treeRankAuthor')(item.get('title') ?? item.get('name')))
                        .appendTo(optGroup);
                }
            });
        },
        setupOperationState: function() {
            var opSelect = this.$('.op-type').empty()
                    .append(`<option>${queryText('selectOp')}</option>`)
                    .append(`<option value="anything">${queryText('any')}</option>`);
            var type = this.getTypeForOp();
            _.chain(QueryFieldInputUI)
                .filter(function(ui) { return _(ui.prototype.types).contains(type); })
                .each(function(ui) {
                    $('<option>', {value: ui.prototype.index})
                        .text(ui.prototype.opName)
                        .appendTo(opSelect);
                });
        },
        setupDatePartState: function() {
            this.$('.datepart-select')[0].innerHTML = Object.entries({
                extract: queryText('extract'),
                fullDate: commonText('fullDate'),
                year: commonText('year'),
                month: commonText('month'),
                day: commonText('day'),
            }).map(([value, label])=>`
                <option value="${value}">${label}</option>
            `).join('');
        },
        setupCompleteState: function() {
            this.$el.removeClass('field-incomplete');
            if (!this.formattedRecord && this.operation != 'anything') {
                var field = this.getField();
                this.inputUI = new (QueryFieldInputUI[this.operation])({
                    field: field,
                    el: this.$('.field-input'),
                    isTreeField: !!this.fieldSpec.treeRank,
                    datePart: field && field.isTemporal()
                        ? this.fieldSpec.datePart
                        : undefined
                });
                this.inputUI.render();
                this.inputUI.on('changed', this.valueChanged, this);
            }
            if (!this.renderExisting) {
                // Don't want to change existing model if we are rendering it for the first time.
                this.updateSpQueryField();
            }
            this.renderExisting = false; // Done rendering existing field.
        },

        // These methods respond to events which change the state.

        fieldSelected: function() {
            var fieldName = this.$('.field-select').val();
            if (fieldName === 'format record') {
                this.formattedRecord = true;
                this.operation = 'anything'; // Doesn't matter, but can't be left undefined.
            } else {
                var treeRankMatch = /^treerank-(.*)/.exec(fieldName);
                if (treeRankMatch) {
                    this.fieldSpec.treeRank = treeRankMatch[1];
                } else {
                    var field = this.fieldSpec.table.getField(fieldName);
                    this.fieldSpec.joinPath.push(field);
                }
            }
            this.update();
        },
        opSelected: function() {
            this.operation = this.$('.op-type').val();
            if (this.operation == 'anything') {
                this.$('input.op-negate').prop('checked', false);
                this.$('input.op-negate').button('refresh');                
                this.opNegateChanged();
                this.valueChanged(null, "");
            }
            this.update();
        },
        datePartSelected: function() {
            this.fieldSpec.datePart = this.$('.datepart-select').val();
            this.update();
        },
        goBack: function(evt) {
            var element = /field-(label-)?([a-z]+)/.exec($(evt.currentTarget).attr('class')).pop();
            console.log('back up to', element);
            if (this.forReport && element != "operation") {
                console.log('not backing up because query is for report');
                return;
            }
            var toClear = {
                field     : ['value', 'operation', 'datePart', 'treeRank'],
                datepart  : ['value', 'operation', 'datePart'],
                treerank  : ['value', 'operation', 'treeRank'],
                operation : ['value', 'operation', 'datePart']
            }[element];

            _.each(toClear, function(field) {
                if (field == 'value') {
                    this.valueChanged(null, "");
                } else {
                    var target = _.has(this.fieldSpec, field) ? this.fieldSpec : this;
                    target[field] = undefined;
                }
            }, this);

            if (element === 'field') {
                var index = this.$('.field-label-field').index(evt.currentTarget);
                this.fieldSpec.joinPath = _(this.fieldSpec.joinPath).first(index);
                this.formattedRecord = false;
            }
            this.update();
        },

        // External event handlers.

        valueChanged: function(_inputUI, value) {
            const nonNullValue = value ?? '';
            this.value = nonNullValue;
            this.spqueryfield.set('startvalue', nonNullValue);
            console.log('updating value to', nonNullValue);
        },
        positionChanged: function() {
            var position = this.$el.parent().find('li').index(this.el);
            this.spqueryfield.set('position', position);
            console.log('set position to', position);
        },
        sortTypeChanged: function() {
            this.$('.field-sort').button('option', 'icons', {
                primary: SORT_ICONS[this.spqueryfield.get('sorttype')]
            });
        },
        deleteIfIncomplete: function() {
            this.isIncomplete() && this.deleteClicked();
        },

        // Utility methods.

    isIncomplete() {
        return this.$el.hasClass('field-incomplete');
    },
        updateSpQueryField: function() {
            var attrs = this.fieldSpec.toSpQueryAttrs();
            attrs.operstart = (this.operation == 'anything') ? 1 : parseInt(this.operation);
            console.log('updating spqueryfield with', attrs);
            this.spqueryfield.set(attrs);
        },
        getField: function() {
            return this.fieldSpec.getField();
        },
        getTypeForOp: function() {
            if (_(['month', 'year', 'day']).contains(this.fieldSpec.datePart)) return 'numbers';
            if (this.fieldSpec.treeRank) return 'strings';
            var field = this.getField();
            if (field.model.name === 'CollectionObject' &&
                field.name === 'catalogNumber') return 'catnos';

            for (var type in types) {
                if (_(types[type]).contains(field.type)) return type;
            }
            return null;
        }
    });

