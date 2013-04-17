define(['jquery', 'underscore', 'backbone', 'schema', 'cs!domain'], function($, _, Backbone, schema, domain) {
    "use strict";

    var STRINGID_RE = /^([^\.]*)\.([^\.]*)\.(.*)$/;
    var SORT_ICONS = ["ui-icon-bullet", "ui-icon-carat-1-n", "ui-icon-carat-1-s"];

    function stringIdToFieldSpec(stringId) {
        var match = STRINGID_RE.exec(stringId);
        var path = match[1].split(',');
        var tableName = match[2];
        var fieldName = match[3];
        var rootTable = schema.getModelById(parseInt(path.shift(), 10));

        var joinPath = [];
        var node = rootTable;
        _.each(path, function(elem) {
            var tableId_fieldName = elem.split('-');
            var table = schema.getModelById(parseInt(tableId_fieldName[0], 10));
            var fieldName = tableId_fieldName[1];
            var field = _.isUndefined(fieldName) ? node.getField(table.name) : node.getField(fieldName);
            joinPath.push(field);
            node = table;
        });

        return _.extend({joinPath: joinPath, table: node}, extractDatePart(fieldName));
    }

    var DATE_PART_RE = /(.*)((NumericDay)|(NumericMonth)|(NumericYear))$/;

    function extractDatePart(fieldName) {
        var match = DATE_PART_RE.exec(fieldName);
        return match ? {
            fieldName: match[1],
            datePart: match[2].replace('Numeric', '')
        } : {
            fieldName: fieldName,
            datePart: null
        };
    }

    var FieldInputUI = Backbone.View.extend({
        events: {
            'change input': 'changed'
        },
        opName: 'NA',
        input: '<input type="text">',
        getValue: function() {
            return this.$('input').val();
        },
        setValue: function(value) {
            this.$('input').val(value);
        },
        render: function() {
            var text = (this.options.negate ? 'Not ' : '') + this.opName;
            $('<a class="field-operation">').text(text).appendTo(this.el);
            this.input && $(this.input).appendTo(this.el);
            return this;
        },
        changed: function() {
            this.trigger('changed', this, this.getValue());
        }
    });

    var types = {
        strings: ['text', 'java.lang.String'],
        numbers: ['java.lang.Integer', 'java.lang.Long', 'java.lang.Byte',
                  'java.lang.Short', 'java.lang.Float', 'java.lang.Double', 'java.math.BigDecimal'],
        dates: ['java.util.Calendar', 'java.util.Date', 'java.sql.Timestamp'],
        bools: ['java.lang.Boolean']
    };

    var opInfo = [
        {opName: 'Like', types: ['strings']},
        {opName: '=', types: ['strings', 'numbers', 'dates']},
        {opName: '>', types: ['numbers', 'dates']},
        {opName: '<', types: ['numbers', 'dates']},
        {opName: '>=', types: ['numbers']},
        {opName: '<=', types: ['numbers']},
        {opName: 'True', types: ['bools'], input: null},
        {opName: 'False', types: ['bools'], input: null},
        {opName: 'Does not matter', types: ['bools'], input: null},

        {opName: 'Between', types: ['strings', 'dates', 'numbers'],
         input: '<input type="text"> and <input type="text">',
         getValue: function() {
             return _.map(this.$('input'), function(input) { return $(input).val(); }).join(',');
         },
         setValue: function(value) {
             var values = value.split(',');
             _.each(this.$('input'), function(input, i) { $(input).val(values[i]); });
         }
        },

        {opName: 'In', types: ['strings', 'numbers']},
        {opName: 'Contains', types: ['strings']},
        {opName: 'Empty', types: ['strings', 'bools', 'dates', 'numbers'], input: null},
        {opName: 'True or Null', types: ['bools'], input: null},
        {opName: 'False or Null', types: ['bools'], input: null}
    ];

    var FieldInputUIByOp = _.map(opInfo, function(extras) { return FieldInputUI.extend(extras); });

    return Backbone.View.extend({
        events: {
            'change .field-show': 'fieldShowChanged',
            'change .field-select': 'fieldSelected',
            'change .op-select.op-type': 'opSelected',
            'change .op-select.op-negate': 'opNegateSelected',
            'change .datepart-select': 'datePartSelected',
            'click .field-sort': 'fieldSortClicked',
            'click .field-operation': 'backUpToOperation',
            'click .field-label-field': 'backUpToField',
            'click .field-label-datepart': 'backUpToDatePart',
            'click .field-label-treerank': 'backUpToTreeRank'
        },
        initialize: function(options) {
            this.spqueryfield = options.spqueryfield;
            if (this.spqueryfield.isNew()) {
                this.joinPath = [];
                this.table = this.model;
            } else {
                var fs = stringIdToFieldSpec(this.spqueryfield.get('stringid'));
                this.table = fs.table;
                var field = this.table.getField(fs.fieldName);
                field || (this.treeRank = fs.fieldName);
                this.joinPath = field ? fs.joinPath.concat(field) : fs.joinPath;
                this.datePart = fs.datePart;
                this.operation = this.spqueryfield.get('operstart');
                this.value = this.spqueryfield.get('startvalue');
                this.negate = this.spqueryfield.get('isnot');
            }
            this.options.parentView.on('positionschanged', this.positionChange, this);
        },
        getField: function() {
            return _.last(this.joinPath);
        },
        getTypeForOp: function() {
            if (this.datePart) return 'numbers';
            if (this.treeRank) return 'strings';
            var field = _.last(this.joinPath);
            if (field.model.name === 'CollectionObject' &&
                field.name === 'catalogNumber') return 'numbers';

            for (var type in types) {
                if (_(types[type]).contains(field.type)) return type;
            }
            return null;
        },
        render: function() {
            this.$el.append(
                '<input type="checkbox" class="field-show" id="' + this.cid + '-show">',
                '<label title="Show in results." for="' + this.cid + '-show" class="ui-icon ui-icon-lightbulb"></label>',
                '<button class="field-sort" title="Sort.">Sort</button>',
                '<span class="field-label">',
                '<select class="field-select">',
                '<select class="op-select op-negate">',
                '<select class="op-select op-type">',
                '<select class="datepart-select">'
            );
            this.$('#' + this.cid + '-show').prop('checked', this.spqueryfield.get('isdisplay')).button();

            this.$('button.field-trash').button({
                icons: { primary: "ui-icon-trash" },
                text: false
            });
            this.$('.op-negate').append('<option value="undefined">Negate?</option>',
                                        '<option value="no">No</option>',
                                        '<option value="yes">Yes</option>');

            this.$('.field-sort').button({
                icons: { primary: "ui-icon-bullet" },
                text: false
            });

            this.spqueryfield.on('change:sorttype', this.sortTypeChanged, this);
            this.sortTypeChanged();

            this.update();
            this.inputUI && this.inputUI.setValue(this.value);
            return this;
        },
        positionChange: function() {
            if (this.$el.parent().is('.spqueryfield-delete')) {
                this.trigger('remove', this, this.spqueryfield);
                this.remove();
                return;
            }

            var position = this.$el.parent().find('li').index(this.el);
            this.spqueryfield.set('position', position);
        },
        fieldShowChanged: function() {
            var val = this.$('.field-show').prop('checked');
            this.spqueryfield.set('isdisplay', val);
            return true;
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
            this.$('.op-select, .datepart-select').hide();
            this.$('.field-input').remove();
            var fieldSelect = this.$('.field-select').empty().append('<option>Select Field...</option>');

            _.chain(this.table.getAllFields())
                .reject(function(field) { return field.isHidden(); })
                .sortBy(function(field) { return field.getLocalizedName(); })
                .each(function(field) {
                    $('<option>', {value: field.name})
                        .text(field.getLocalizedName())
                        .appendTo(fieldSelect);
                });

            var getTreeDef = domain.getTreeDef(this.table.name);
            if (getTreeDef) {
                this.addTreeLevelsToFieldSelect(getTreeDef);
            } else {
                fieldSelect.show();
            }
        },
        addTreeLevelsToFieldSelect: function(getTreeDef) {
            var fieldSelect = this.$('.field-select');
            var optGroup = $('<optgroup label="Tree Ranks">').appendTo(fieldSelect);

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
                fieldSelect.show();
            });
        },
        setupOpSelect: function() {
            this.$('.field-select, .datepart-select').hide();
            this.$('.field-input').remove();
            this.$('.op-select').show();
            this.$('.op-negate').val('undefined');
            var opSelect = this.$('.op-type').empty().append('<option>Select Op...</option>');
            var type = this.getTypeForOp();
            _.each(opInfo, function(info, i) {
                if (_(info.types).contains(type)) {
                    $('<option>', {value: i}).text(info.opName).appendTo(opSelect);
                }
            }, this);
        },
        setupDatePartSelect: function() {
            this.$('.field-select, .op-select').hide();
            this.$('.field-input').remove();
            var select = this.$('.datepart-select').empty().show();
            var options = _(['Extract...', 'None', 'Year', 'Month', 'Day']).each(function(datepart) {
                $('<option>', {value: datepart}).text(datepart).appendTo(select);
            });
        },
        updateLabel: function() {
            var fieldLabel = this.$('.field-label').empty();
            _.chain(this.joinPath)
                .invoke('getLocalizedName')
                .each(function(fieldName) { $('<a class="field-label-field">').text(fieldName).appendTo(fieldLabel); });
            this.treeRank && $('<a class="field-label-treerank">').text(this.treeRank).appendTo(fieldLabel);
            this.datePart && $('<a class="field-label-datepart">').text('(' + this.datePart + ')').appendTo(fieldLabel);
        },
        fieldSelected: function() {
            var fieldName = this.$('.field-select').val();
            var treeRankMatch = /^treerank-(.*)/.exec(fieldName);
            if (treeRankMatch) {
                this.treeRank = treeRankMatch[1];
            } else {
                var field = this.table.getField(fieldName);
                this.joinPath.push(field);
            }
            this.update();
        },
        update: function() {
            var field = _.last(this.joinPath);
            this.updateLabel();
            if (!field) {
                this.table = this.model;
                this.setupFieldSelect();
                return;
            }
            if (!this.treeRank) {

                if (field.isRelationship) {
                    this.table = field.getRelatedModel();
                    this.setupFieldSelect();
                    return;
                }
                if (_.isUndefined(this.datePart) &&
                    _(['java.util.Date', 'java.util.Calendar']).contains(field.type)) {
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
        fieldComplete: function() {
            this.$('.field-select, .datepart-select, .op-select').hide();
            this.inputUI = new (FieldInputUIByOp[this.operation])({
                el: $('<span class="field-input">'),
                negate: this.negate
            });
            this.inputUI.render().$el.appendTo(this.el);
            this.inputUI.on('changed', this.valueChanged, this);
            if (this.spqueryfield.isNew() || this.alreadyCompletedOnce) {
                this.updateSpQueryField();
            }
            this.alreadyCompletedOnce = true;
            this.trigger('completed', this);
        },
        opSelected: function() {
            this.operation = this.$('.op-type').val();
            _(this.negate).isUndefined() || this.update();
        },
        opNegateSelected: function() {
            this.negate = this.$('.op-negate').val() === 'yes';
            _(this.operation).isUndefined() || this.update();
        },
        datePartSelected: function() {
            this.datePart = this.$('.datepart-select').val();
            this.datePart === 'None' && (this.datePart = null);
            this.update();
        },
        backUpToField: function(evt) {
            var index = this.$('.field-label-field').index(evt.currentTarget);
            this.joinPath = _(this.joinPath).first(index);
            this.value = this.operation = this.datePart = this.treeRank = undefined;
            this.update();
        },
        backUpToDatePart: function() {
            this.value = this.operation = this.datePart = undefined;
            this.update();
        },
        backUpToTreeRank: function() {
            this.value = this.operation = this.treeRank = undefined;
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
        makeTableList: function() {
            var first = [this.model.tableId];
            var rest =  _.chain(this.joinPath).initial(this.treeRank ? 0 : 1).map(function(field) {
                var relatedModel = field.getRelatedModel();
                return relatedModel.name.toLowerCase() === field.name.toLowerCase() ?
                    relatedModel.tableId : (relatedModel.tableId + '-' + field.name.toLowerCase());
            }).value();
            return first.concat(rest).join(',');
        },
        makeStringId: function(tableList) {
            var fieldName = this.treeRank || _.last(this.joinPath).name;
            if (this.datePart) {
                fieldName += 'Numeric' + this.datePart;
            }
            return [tableList, this.table.name.toLowerCase(), fieldName];
        },
        updateSpQueryField: function() {
            var tableList = this.makeTableList();
            var stringId = this.makeStringId(tableList);
            var attrs = {
                operstart: this.operation,
                tablelist: tableList,
                stringid: stringId.join('.'),
                fieldname: _.last(stringId),
                isdisplay: true,
                isnot: this.negate
            };
            this.spqueryfield.set(attrs);
        }
    });
});