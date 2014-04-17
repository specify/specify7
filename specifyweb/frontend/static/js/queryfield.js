define([
    'jquery', 'underscore', 'backbone', 'templates', 'schema', 'domain', 'queryfieldspec', 'queryfieldinput'
], function($, _, Backbone, templates, schema, domain, QueryFieldSpec, QueryFieldInputUI) {
    "use strict";

    var SORT_ICONS = ["ui-icon-bullet", "ui-icon-carat-1-n", "ui-icon-carat-1-s"];

    var types = {
        strings: ['text', 'java.lang.String'],
        numbers: ['java.lang.Integer', 'java.lang.Long', 'java.lang.Byte',
                  'java.lang.Short', 'java.lang.Float', 'java.lang.Double', 'java.math.BigDecimal'],
        dates: ['java.util.Calendar', 'java.util.Date', 'java.sql.Timestamp'],
        bools: ['java.lang.Boolean']
    };

    return Backbone.View.extend({
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

            _(this).extend(
                {
                    spqueryfield: options.spqueryfield,
                    inputUI: undefined
                },
                options.spqueryfield.isNew() ? {
                    fieldSpec       : new QueryFieldSpec(this.model),
                    formattedRecord : false,
                    value           : '',
                    operation       : undefined,
                    renderExisting  : false
                } : {
                    fieldSpec       : QueryFieldSpec.fromStringId(attrs.stringid),
                    formattedRecord : attrs.isrelfld,
                    value           : attrs.startvalue,
                    operation       : attrs.operstart,
                    renderExisting  : true  // so that we know not to update the model when rendering is complete
                });

            (this.operation === 1 && this.value === "") && (this.operation = 'anything');

            this.options.parentView.on('positionschanged', this.positionChanged, this);
        },
        render: function() {
            this.$el.append(templates.queryfield({cid: this.cid}));
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
            this.trigger('remove', this, this.spqueryfield);
            this.remove();
        },
        expandToggle: function(state) {
            _(['hide', 'show']).contains(state) || (state = 'toggle'); // querybuilder calls with 'show' or 'hide'
            this.$('.field-label-field:not(.field-label-virtual):not(:last)')[state](500);
        },

        // This works like an implicit state machine controlled by the values
        // formattedRecord, joinPath, treeRank, datePart and operation.

        // This method determines the current state.

        update: function() {
            this.updateLabel();

            this.$el.addClass('field-incomplete');

            if (this.formattedRecord) {
                this.fieldComplete();
                return;
            }

            var field = this.getField();
            if (!field) {
                this.fieldSpec.table = this.model;
                this.setupFieldSelect();
                return;
            }

            if (!this.fieldSpec.treeRank) {

                if (field.isRelationship) {
                    this.fieldSpec.table = field.getRelatedModel();
                    this.setupFieldSelect();
                    return;
                }
                if (_.isUndefined(this.fieldSpec.datePart) && field.isTemporal()) {
                    this.setupDatePartSelect();
                    return;
                }
            }

            if (_.isUndefined(this.operation)) {
                this.setupOpSelect();
                return;
            }
            this.fieldComplete();
        },
        updateLabel: function() {
            var fieldLabel = this.$('.field-label').empty();
            _.each(this.fieldSpec.joinPath, function(field) {
                $('<a class="field-label-field">')
                    .text(field.getLocalizedName())
                    .prepend($('<img>', { src: field.model.getIcon() }))
                    .appendTo(fieldLabel);
            });
            if (this.formattedRecord) {
                var formatOrAggregate = (this.getField().type === 'one-to-many') ? 'aggregated' : 'formatted';
                $('<a class="field-label-field field-label-virtual">').text('(' + formatOrAggregate + ')').appendTo(fieldLabel);
                this.$('label.op-negate').hide();
            } else {
                this.fieldSpec.treeRank && $('<a class="field-label-treerank">').text(this.fieldSpec.treeRank).appendTo(fieldLabel);
                this.fieldSpec.datePart && $('<a class="field-label-datepart">').text('(' + this.fieldSpec.datePart + ')').appendTo(fieldLabel);
                if (this.operation == 'anything') {
                    $('<a class="field-operation">').text('(any)').appendTo(fieldLabel);
                    this.$('label.op-negate').hide();
                }
            }
        },

        // These methods are involved with setting up the UI when entering different states.

        setupFieldSelect: function() {
            this.$('.op-select, .datepart-select, label.op-negate').hide();
            this.$('.field-input').empty();

            this.$('.field-select-grp img').attr('src', this.fieldSpec.table.getIcon());
            var fieldSelect = this.$('.field-select').empty().append('<option>Select Field...</option>');

            if (this.fieldSpec.joinPath.length > 0) {
                var formatOrAggregate = (this.getField().type === 'one-to-many') ? 'aggregated' : 'formatted';
                fieldSelect.append('<option value="format record">(' + formatOrAggregate + ')</option>');
            }

            _.chain(this.fieldSpec.table.getAllFields())
                .reject(function(field) { return field.isHidden(); })
                .sortBy(function(field) { return field.getLocalizedName(); })
                .each(function(field) {
                    $('<option>', {value: field.name})
                        .text((field.isRelationship ? '➔ ' : '') + field.getLocalizedName())
                        .appendTo(fieldSelect);
                });

            var fieldGrp = this.$('.field-select-grp');
            var getTreeDef = domain.getTreeDef(this.fieldSpec.table.name);
            $.when( getTreeDef && this.addTreeLevelsToFieldSelect(getTreeDef) ).done(function() {
                fieldGrp.show();
            });
        },
        addTreeLevelsToFieldSelect: function(getTreeDef) {
            var optGroup = $('<optgroup label="Tree Ranks">').appendTo( this.$('.field-select') );

            getTreeDef.pipe(function(treeDef) {
                return treeDef.rget('treedefitems');
            }).pipe(function (treeDefItems) {
                return treeDefItems.fetch({limit: 0}).pipe(function() { return treeDefItems; });
            }).done(function(treeDefItems) {
                treeDefItems.each(function(item) {
                    $('<option>', {value: 'treerank-' + item.get('name')})
                        .text(item.get('name'))
                        .appendTo(optGroup);
                });
            });
        },
        setupOpSelect: function() {
            this.$('.field-select-grp, .datepart-select').hide();
            this.$('.field-input').empty();
            this.$('.op-select, label.op-negate').show();
            var opSelect = this.$('.op-type').empty()
                    .append('<option>Select Op...</option>')
                    .append('<option value="anything">(any)</option>');
            var type = this.getTypeForOp();
            _.each(QueryFieldInputUI, function(ui, i) {
                if (_(ui.prototype.types).contains(type)) {
                    $('<option>', {value: i}).text(ui.prototype.opName).appendTo(opSelect);
                }
            }, this);
        },
        setupDatePartSelect: function() {
            this.$('.field-select-grp, .op-select').hide();
            this.$('.field-input').empty();
            var select = this.$('.datepart-select').empty().show();
            var options = _(['Extract...', 'Full Date', 'Year', 'Month', 'Day']).each(function(datepart) {
                $('<option>', {value: datepart}).text(datepart).appendTo(select);
            });
        },
        fieldComplete: function() {
            this.$el.removeClass('field-incomplete');
            this.$('.field-select-grp, .datepart-select, .op-select').hide();
            if (!this.formattedRecord && this.operation != 'anything') {
                this.inputUI = new (QueryFieldInputUI[this.operation])({
                    field: _.last(this.fieldSpec.joinPath),
                    el: this.$('.field-input')
                });
                this.inputUI.render();
                this.inputUI.on('changed', this.valueChanged, this);
            }
            if (!this.renderExisting) {
                // Don't want to change existing model if we are rendering it for the first time.
                this.updateSpQueryField();
                this.trigger('completed', this);
            }
            this.renderExisting = false; // Done rendering existing field.
        },

        // These methods respond to events which change the state.
        
        fieldSelected: function() {
            var fieldName = this.$('.field-select').val();
            if (fieldName === 'format record') {
                this.formattedRecord = true;
                this.operation = 0; // Doesn't matter, but can't be left undefined.
            } else {
                var treeRankMatch = /^treerank-(.*)/.exec(fieldName);
                if (treeRankMatch) {
                    this.fieldSpec.treeRank = treeRankMatch[1];
                } else {
                    var field = this.fieldSpec.table.getField(fieldName);
                    this.fieldSpec.joinPath.push(field);
                    if (field.isRelationship) {
                        this.formattedRecord = true;
                        this.operation = 'anything';
                    } else {
                        this.operation = 'anything';
                        this.fieldSpec.datePart = field.isTemporal() ? 'Full Date' : undefined;
                    }
                }
            }
            this.update();
        },
        opSelected: function() {
            this.operation = this.$('.op-type').val();
            if (this.operation == 'anything') {
                this.valueChanged(null, "");
            }
            this.update();
        },
        datePartSelected: function() {
            this.fieldSpec.datePart = this.$('.datepart-select').val();
            this.fieldSpec.datePart === 'Full Date' && (this.fieldSpec.datePart = null);
            this.update();
        },
        goBack: function(evt) {
            var state = /field-(label-)?([a-z]+)/.exec($(evt.currentTarget).attr('class')).pop();
            console.log('backing up to', state);

            var toClear = {
                field     : ['value', 'operation', 'datePart', 'treeRank'],
                datepart  : ['value', 'operation', 'datePart'],
                treerank  : ['value', 'operation', 'treeRank'],
                operation : ['value', 'operation', 'negate']
            }[state];

            _.each(toClear, function(field) {
                var target = _.has(this.fieldSpec, field) ? this.fieldSpec : this;
                target[field] = undefined;
            }, this);

            if (state === 'field') {
                var index = this.$('.field-label-field').index(evt.currentTarget);
                this.fieldSpec.joinPath = _(this.fieldSpec.joinPath).first(index);
                this.formattedRecord = false;
            }
            this.update();
        },

        // External event handlers.

        valueChanged: function(inputUI, value) {
            this.value = value;
            this.spqueryfield.set('startvalue', value);
        },
        positionChanged: function() {
            var position = this.$el.parent().find('li').index(this.el);
            this.spqueryfield.set('position', position);
        },
        sortTypeChanged: function() {
            this.$('.field-sort').button('option', 'icons', {
                primary: SORT_ICONS[this.spqueryfield.get('sorttype')]
            });
        },

        // Utility methods.

        updateSpQueryField: function() {
            var attrs = this.fieldSpec.toSpQueryAttrs(this.formattedRecord);
            attrs.operstart = (this.operation == 'anything') ? 1 : parseInt(this.operation);
            this.spqueryfield.set(attrs);
        },
        getField: function() {
            return _.last(this.fieldSpec.joinPath);
        },
        getTypeForOp: function() {
            if (this.fieldSpec.datePart) return 'numbers';
            if (this.fieldSpec.treeRank) return 'strings';
            var field = this.getField();
            if (field.model.name === 'CollectionObject' &&
                field.name === 'catalogNumber') return 'numbers';

            for (var type in types) {
                if (_(types[type]).contains(field.type)) return type;
            }
            return null;
        }
    });
});
