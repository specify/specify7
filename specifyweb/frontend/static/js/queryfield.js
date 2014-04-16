define([
    'jquery', 'underscore', 'backbone', 'templates', 'schema', 'domain', 'queryfieldspec', 'queryfieldinput'
], function($, _, Backbone, templates, schema, domain, queryfieldspec, QueryFieldInputUI) {
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
            'change .field-show': 'fieldShowChanged',
            'change .field-select': 'fieldSelected',
            'change .op-type': 'opSelected',
            'change input.op-negate': 'opNegateChanged',
            'change .datepart-select': 'datePartSelected',
            'click .field-move-up': 'moveUpClicked',
            'click .field-move-down': 'moveDownClicked',
            'click .field-delete': 'deleteClicked',
            'click .field-expand': 'expandToggle',
            'click .field-sort': 'fieldSortClicked',
            'click .field-operation': 'backUpToOperation',
            'click .field-label-field': 'backUpToField',
            'click .field-label-datepart': 'backUpToDatePart',
            'click .field-label-treerank': 'backUpToTreeRank'
        },
        initialize: function(options) {
            this.spqueryfield = options.spqueryfield;
            if (this.spqueryfield.isNew()) {
                this.fieldSpec = queryfieldspec.forNewField(this.model);
                this.formattedRecord = false;
            } else {
                this.fieldSpec = queryfieldspec.fromStringId(this.spqueryfield.get('stringid'));
                this.operation = this.spqueryfield.get('operstart');
                this.value = this.spqueryfield.get('startvalue');
                this.formattedRecord = this.spqueryfield.get('isrelfld');
                if (this.operation == 1 && this.value === "") {
                    this.operation = 'anything';
                }
            }
            this.options.parentView.on('positionschanged', this.positionChange, this);
        },
        getField: function() {
            return _.last(this.fieldSpec.joinPath);
        },
        getTypeForOp: function() {
            if (this.fieldSpec.datePart) return 'numbers';
            if (this.fieldSpec.treeRank) return 'strings';
            var field = _.last(this.fieldSpec.joinPath);
            if (field.model.name === 'CollectionObject' &&
                field.name === 'catalogNumber') return 'numbers';

            for (var type in types) {
                if (_(types[type]).contains(field.type)) return type;
            }
            return null;
        },
        render: function() {
            this.$el.append(templates.queryfield({cid: this.cid}));
            this.$('#' + this.cid + '-show').prop('checked', this.spqueryfield.get('isdisplay')).button();
            this.$('#' + this.cid + '-negate').prop('checked', this.spqueryfield.get('isnot')).button();

            _.each({
                '.field-sort': "ui-icon-bullet",
                '.field-delete': "ui-icon-trash",
                '.field-expand': "ui-icon-check",
                '.field-move-up': "ui-icon-arrowthick-1-n",
                '.field-move-down': "ui-icon-arrowthick-1-s"
            }, function(icon, selector) {
                this.$(selector).button({
                    icons: { primary: icon  },
                    text: false
                });
            }, this);

            this.spqueryfield.on('change:sorttype', this.sortTypeChanged, this);
            this.sortTypeChanged();

            this.update();
            this.inputUI && this.inputUI.setValue(this.value);
            return this;
        },
        moveUpClicked: function() {
            this.options.parentView.moveUp(this);
        },
        moveDownClicked: function() {
            this.options.parentView.moveDown(this);
        },
        positionChange: function() {
            var position = this.$el.parent().find('li').index(this.el);
            this.spqueryfield.set('position', position);
        },
        fieldShowChanged: function() {
            var val = this.$('.field-show').prop('checked');
            this.spqueryfield.set('isdisplay', val);
            return true;
        },
        deleteClicked: function() {
            this.trigger('remove', this, this.spqueryfield);
            this.remove();
            return;
        },
        fieldSortClicked: function() {
            var val = (this.spqueryfield.get('sorttype') + 1) % SORT_ICONS.length;
            this.spqueryfield.set('sorttype', val);
        },
        sortTypeChanged: function() {
            this.$('.field-sort').button('option', 'icons', {
                primary: SORT_ICONS[this.spqueryfield.get('sorttype')]
            });
        },
        setupFieldSelect: function() {
            this.$('.op-select, .datepart-select, label.op-negate').hide();
            this.$('.field-input').empty();

            this.$('.field-select-grp img').attr('src', this.fieldSpec.table.getIcon());
            var fieldSelect = this.$('.field-select').empty().append('<option>Select Field...</option>');
            if (this.fieldSpec.joinPath.length > 0) {
                fieldSelect.append('<option value="format record">(' + this.formatOrAggregate() + ')</option>');
            }

            _.chain(this.fieldSpec.table.getAllFields())
                .reject(function(field) { return field.isHidden(); })
                .sortBy(function(field) { return field.getLocalizedName(); })
                .each(function(field) {
                    $('<option>', {value: field.name})
                        .text((field.isRelationship ? '➔ ' : '') + field.getLocalizedName())
                        .appendTo(fieldSelect);
                });

            var getTreeDef = domain.getTreeDef(this.fieldSpec.table.name);
            if (getTreeDef) {
                this.addTreeLevelsToFieldSelect(getTreeDef);
            } else {
                this.$('.field-select-grp').show();
            }
        },
        formatOrAggregate: function() {
            return  (_.last(this.fieldSpec.joinPath).type === 'one-to-many') ? 'aggregated' : 'formatted';
        },
        addTreeLevelsToFieldSelect: function(getTreeDef) {
            var show = function() { this.$('.field-select-grp').show(); }.bind(this);
            var optGroup = $('<optgroup label="Tree Ranks">').appendTo( this.$('.field-select') );

            getTreeDef.pipe(function(treeDef) {
                return treeDef.rget('treedefitems').pipe(function (treeDefItems) {
                    return treeDefItems.fetch({limit: 0}).pipe(function() { return treeDefItems; });
                });
            }).done(function(treeDefItems) {
                treeDefItems.each(function(item) {
                    $('<option>', {value: 'treerank-' + item.get('name')})
                        .text(item.get('name'))
                        .appendTo(optGroup);
                });
                show();
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
        updateLabel: function() {
            var fieldLabel = this.$('.field-label').empty();
            _.each(this.fieldSpec.joinPath, function(field) {
                $('<a class="field-label-field">')
                    .text(field.getLocalizedName())
                    .prepend($('<img>', { src: field.model.getIcon() }))
                    .appendTo(fieldLabel);
            });
            if (this.formattedRecord) {
                $('<a class="field-label-field field-label-virtual">').text('(' + this.formatOrAggregate() + ')').appendTo(fieldLabel);
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
        update: function() {
            var field = _.last(this.fieldSpec.joinPath);
            this.updateLabel();

            this.$el.addClass('field-incomplete');

            if (this.formattedRecord) {
                this.fieldComplete();
                return;
            }

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
        contract: function() {
            this.$('.field-label-field:not(.field-label-virtual):not(:last)').hide(500);
        },
        expand: function() {
            this.$('.field-label-field').show(500);
        },
        expandToggle: function() {
            this.$('.field-label-field:not(.field-label-virtual):not(:last)').toggle(500);
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
            if (this.spqueryfield.isNew() || this.alreadyCompletedOnce) {
                this.updateSpQueryField();
            }
            if (!this.alreadyCompletedOnce) {
                this.alreadyCompletedOnce = true;
                this.trigger('completed', this);
            }
        },
        opSelected: function() {
            this.operation = this.$('.op-type').val();
            if (this.operation == 'anything') {
                this.valueChanged(null, "");
            }
            this.update();
        },
        opNegateChanged: function() {
            this.spqueryfield.set('isnot', this.$('input.op-negate').prop('checked'));
        },
        datePartSelected: function() {
            this.fieldSpec.datePart = this.$('.datepart-select').val();
            this.fieldSpec.datePart === 'Full Date' && (this.fieldSpec.datePart = null);
            this.update();
        },
        backUpToField: function(evt) {
            var index = this.$('.field-label-field').index(evt.currentTarget);
            this.fieldSpec.joinPath = _(this.fieldSpec.joinPath).first(index);
            this.value = this.operation = this.fieldSpec.datePart = this.fieldSpec.treeRank = undefined;
            this.formattedRecord = false;
            this.update();
        },
        backUpToDatePart: function() {
            this.value = this.operation = this.fieldSpec.datePart = undefined;
            this.update();
        },
        backUpToTreeRank: function() {
            this.value = this.operation = this.fieldSpec.treeRank = undefined;
            this.update();
        },
        backUpToOperation: function() {
            this.value = this.operation = this.negate = undefined;
            this.update();
        },
        valueChanged: function(inputUI, value) {
            this.value = value;
            this.spqueryfield.set('startvalue', value);
        },
        updateSpQueryField: function() {
            var attrs = queryfieldspec.toSpQueryAttrs(this.fieldSpec, this.formattedRecord);
            _.extend(attrs, {
                operstart: this.operation == 'anything' ? 1 : parseInt(this.operation),
                isdisplay: true,
                isnot: !!this.negate
            });
            this.spqueryfield.set(attrs);
        }
    });
});
