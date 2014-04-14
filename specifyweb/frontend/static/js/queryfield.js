define([
    'jquery', 'underscore', 'backbone', 'schema', 'domain', 'fieldformat'
], function($, _, Backbone, schema, domain, fieldformat) {
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

        var result = _.extend({joinPath: joinPath, table: node}, extractDatePart(fieldName));
        console.log("parsed", stringId, result);
        return result;
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
        __name__: "FieldInputUI",
        events: {
            'change input': 'changed'
        },
        opName: 'NA',
        format: false,
        input: '<input type="text">',
        initialize: function(options) {
            this.inputFormatter = options.field.getUIFormatter();
            this.outputFormatter = function(value) { return fieldformat(options.field, value); };
        },
        getValue: function() {
            return this.$('input').val();
        },
        setValue: function(value) {
            this.format && (value = this.outputFormatter(value));
            this.$('input').val(value);
        },
        render: function() {
            this.$el.empty();
            $('<a class="field-operation">').text(this.opName).appendTo(this.el);
            this.input && $(this.input).appendTo(this.el);
            return this;
        },
        changed: function() {
            var value = this.getValue();
            if (this.format && this.inputFormatter) {
                var formatterValues = this.inputFormatter.parse(value); // TODO: don't accept autonumber patterns maybe...
                formatterValues && (value = this.inputFormatter.canonicalize(formatterValues));
                // TODO: make a warning for badly formatted input values?
            }
            this.trigger('changed', this, value);
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
        {opName: 'Like', negation: 'Not Like', types: ['strings']},
        {opName: '=', negation: '≠', types: ['strings', 'numbers', 'dates'], format: true},
        {opName: '>', negation: '≯', types: ['numbers', 'dates'], format: true},
        {opName: '<', negation: '≮', types: ['numbers', 'dates'], format: true},
        {opName: '≥', negation: '≱', types: ['numbers'], format: true},
        {opName: '≤', negation: '≰', types: ['numbers'], format: true},
        {opName: 'True', negation: 'Not True', types: ['bools'], input: null},
        {opName: 'False', negation: 'Not False', types: ['bools'], input: null},
        {opName: 'Does not matter', types: ['bools'], input: null},

        {opName: 'Between', negation: 'Not Between', types: ['strings', 'dates', 'numbers'],
         input: '<input type="text"> and <input type="text">',
         getValue: function() {
             return _.map(this.$('input'), function(input) { return $(input).val(); }).join(',');
         },
         setValue: function(value) {
             var values = value.split(',');
             _.each(this.$('input'), function(input, i) { $(input).val(values[i]); });
         }
        },

        {opName: 'In', negation: 'Not In', types: ['strings', 'numbers']},
        {opName: 'Contains', negation: "Doesn't Contain", types: ['strings']},
        {opName: 'Empty', negation: 'Not Empty', types: ['strings', 'bools', 'dates', 'numbers'], input: null},
        {opName: 'True or Null', negation: 'False', types: ['bools'], input: null},
        {opName: 'False or Null', negation: 'True', types: ['bools'], input: null}
    ];

    var FieldInputUIByOp = _.map(opInfo, function(extras) {
        var options = _.extend({ __name__: "OpFieldInputUI" }, extras);
        return FieldInputUI.extend(options);
    });

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
            'click .field-complete': 'expandToggle',
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
                this.formattedRecord = false;
            } else {
                var fs = stringIdToFieldSpec(this.spqueryfield.get('stringid'));
                this.table = fs.table;
                var field = this.table.getField(fs.fieldName);
                if (!field) {
                    this.treeRank = fs.fieldName;
                    console.log("using fieldname as treerank", this.treeRank);
                }
                this.joinPath = field ? fs.joinPath.concat(field) : fs.joinPath;
                this.datePart = fs.datePart;
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
                '<button class="field-complete" title="Field is valid and will be saved. Click to expand.">Expand.</button>',
                '<button class="field-delete" title="Remove.">Remove</button>',
                '<span class="field-label">',
                '<span class="field-select-grp"><img><select class="field-select"></span>',
                '<input type="checkbox" class="op-negate" id="' + this.cid + '-negate">',
                '<label title="Negate." for="' + this.cid + '-negate" class="op-negate ui-icon ui-icon-cancel"></label>',
                '<select class="op-select op-type">',
                '<select class="datepart-select">',
                '<span class="field-input">',
                $('<span class="field-controls">').append(
                    '<input type="checkbox" class="field-show" id="' + this.cid + '-show">',
                    '<label title="Show in results." for="' + this.cid + '-show" class="ui-icon ui-icon-lightbulb"></label>',
                    '<button class="field-sort" title="Sort.">Sort</button>',
                    '<button class="field-move-up" title="Move up.">Move up</button>',
                    '<button class="field-move-down" title="Move down.">Move down</button>')
            );
            this.$('#' + this.cid + '-show').prop('checked', this.spqueryfield.get('isdisplay')).button();
            this.$('#' + this.cid + '-negate').prop('checked', this.spqueryfield.get('isnot')).button();

            _.each({
                '.field-sort': "ui-icon-bullet",
                '.field-delete': "ui-icon-trash",
                '.field-complete': "ui-icon-check",
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

            this.$('.field-select-grp img').attr('src', this.table.getIcon());
            var fieldSelect = this.$('.field-select').empty().append('<option>Select Field...</option>');
            if (this.joinPath.length > 0) {
                fieldSelect.append('<option value="format record">(' + this.formatOrAggregate() + ')</option>');
            }

            _.chain(this.table.getAllFields())
                .reject(function(field) { return field.isHidden(); })
                .sortBy(function(field) { return field.getLocalizedName(); })
                .each(function(field) {
                    $('<option>', {value: field.name})
                        .text((field.isRelationship ? '➔ ' : '') + field.getLocalizedName())
                        .appendTo(fieldSelect);
                });

            var getTreeDef = domain.getTreeDef(this.table.name);
            if (getTreeDef) {
                this.addTreeLevelsToFieldSelect(getTreeDef);
            } else {
                this.$('.field-select-grp').show();
            }
        },
        formatOrAggregate: function() {
            return  (_.last(this.joinPath).type === 'one-to-many') ? 'aggregated' : 'formatted';
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
            _.each(opInfo, function(info, i) {
                if (_(info.types).contains(type)) {
                    $('<option>', {value: i}).text(info.opName).appendTo(opSelect);
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
            _.each(this.joinPath, function(field) {
                $('<a class="field-label-field">')
                    .text(field.getLocalizedName())
                    .prepend($('<img>', { src: field.model.getIcon() }))
                    .appendTo(fieldLabel);
            });
            if (this.formattedRecord) {
                $('<a class="field-label-field field-label-virtual">').text('(' + this.formatOrAggregate() + ')').appendTo(fieldLabel);
                this.$('label.op-negate').hide();
            } else {
                this.treeRank && $('<a class="field-label-treerank">').text(this.treeRank).appendTo(fieldLabel);
                this.datePart && $('<a class="field-label-datepart">').text('(' + this.datePart + ')').appendTo(fieldLabel);
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
                    this.treeRank = treeRankMatch[1];
                } else {
                    var field = this.table.getField(fieldName);
                    this.joinPath.push(field);
                    if (field.isRelationship) {
                        this.formattedRecord = true;
                        this.operation = 'anything';
                    } else {
                        this.operation = 'anything';
                        this.datePart = field.isTemporal() ? 'Full Date' : undefined;
                    }
                }
            }
            this.update();
        },
        update: function() {
            var field = _.last(this.joinPath);
            this.updateLabel();

            this.$('.field-complete').hide();
            this.$('.field-controls').addClass('hidden'); // jquery.hide() doesn't work.
            // for some reason it causes display: block to be set when show is called.

            if (this.formattedRecord) {
                this.fieldComplete();
                return;
            }

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
                if (_.isUndefined(this.datePart) && field.isTemporal()) {
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
            this.$('.field-complete').show();
            this.$('.field-select-grp, .datepart-select, .op-select').hide();
            this.$('.field-controls').removeClass('hidden');
            if (!this.formattedRecord && this.operation != 'anything') {
                this.inputUI = new (FieldInputUIByOp[this.operation])({
                    field: _.last(this.joinPath),
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
            this.datePart = this.$('.datepart-select').val();
            this.datePart === 'Full Date' && (this.datePart = null);
            this.update();
        },
        backUpToField: function(evt) {
            var index = this.$('.field-label-field').index(evt.currentTarget);
            this.joinPath = _(this.joinPath).first(index);
            this.value = this.operation = this.datePart = this.treeRank = undefined;
            this.formattedRecord = false;
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
            var path = (this.treeRank || this.formattedRecord) ?
                    this.joinPath : _.initial(this.joinPath);

            var first = [this.model.tableId];
            var rest = _.map(path, function(field) {
                var relatedModel = field.getRelatedModel();
                return relatedModel.name.toLowerCase() === field.name.toLowerCase() ?
                    relatedModel.tableId : (relatedModel.tableId + '-' + field.name.toLowerCase());
            });
            return first.concat(rest).join(',');
        },
        makeStringId: function(tableList) {
            var fieldName = this.treeRank || _.last(this.joinPath).name;
            if (this.datePart && this.datePart !== 'Full Date') {
                fieldName += 'Numeric' + this.datePart;
            }
            return [tableList, this.table.name.toLowerCase(), fieldName];
        },
        updateSpQueryField: function() {
            var tableList = this.makeTableList();
            var stringId = this.makeStringId(tableList);
            var attrs = {
                operstart: this.operation == 'anything' ? 1 : this.operation,
                tablelist: tableList,
                stringid: stringId.join('.'),
                fieldname: _.last(stringId),
                isdisplay: true,
                isnot: this.negate,
                isrelfld: this.formattedRecord
            };
            this.spqueryfield.set(attrs);
        }
    });
});
